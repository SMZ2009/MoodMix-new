/**
 * ActivityComposer - 活动推荐生成器
 * 
 * 职责：根据情绪状态推荐三条活动，按难度/强度递进
 * 模型：Qwen3-8B（结构化短句）
 * 
 * 输入：五行属性 + 极性 + 情绪强度 + 躯体张力 + 认知负荷 + 社交倾向
 * 输出：{ activities: [{title, reason, how}, ...], wuxingNote }
 */

import { BaseComposer, WUXING_TONE_MAP } from './BaseComposer';
import { ACTIVITY_CATEGORIES, WUXING_ACTIVITY_PRIORITY, filterActivities } from '../../data/activityKnowledgeBase';

export class ActivityComposer extends BaseComposer {
  constructor(config = {}) {
    super({
      name: 'ActivityComposer',
      modelSize: '8B',
      apiEndpoint: '/api/compose_activity',
      timeout: 8000,
      ...config
    });
  }

  /**
   * 输入验证
   */
  validateInput(context) {
    const patternAnalysis = context.getIntermediate('patternAnalysis');
    
    if (!patternAnalysis) {
      return { valid: false, reason: 'Missing patternAnalysis from previous agent' };
    }
    
    return { valid: true };
  }

  /**
   * 核心处理：生成三条活动推荐
   */
  async process(context) {
    const patternAnalysis = context.getIntermediate('patternAnalysis');
    const moodData = context.getIntermediate('moodData');
    
    // 提取条件参数
    const conditions = this.extractConditions(patternAnalysis, moodData);
    
    // 先用本地规则筛选候选活动
    const candidates = filterActivities(conditions);
    
    if (candidates.length === 0) {
      return this.localFallback(context);
    }
    
    try {
      // 尝试调用LLM生成三条活动
      const systemPrompt = this.buildActivitySystemPrompt(patternAnalysis, conditions);
      const userPrompt = this.buildActivityUserPrompt(candidates, moodData);
      
      const llmResult = await this.callLLM(systemPrompt, userPrompt, {
        endpoint: '/api/compose_activity',
        maxTokens: 400
      });
      
      const parsed = this.parseJSONOutput(llmResult);
      if (parsed && parsed.activities && parsed.activities.length > 0) {
        const activities = parsed.activities.slice(0, 3).map((act, index) => ({
          title: act.title || act.name || `活动${index + 1}`,
          reason: act.reason || act.why_reason || '',
          how: act.how || act.how_steps || ''
        }));
        
        this.log('SUCCESS', `LLM生成${activities.length}条活动`);
        
        const result = {
          activities: activities,
          wuxingNote: this.getWuxingNote(conditions.wuxing),
          wuxing: conditions.wuxing,
          tone: this.determineTone(patternAnalysis),
          isAI: true,
          timestamp: new Date().toISOString()
        };
        
        context.setIntermediate('activityRecommendation', result);
        return result;
      }
      
      throw new Error('LLM返回格式不正确');
      
    } catch (error) {
      this.log('WARNING', `LLM生成失败，使用本地规则: ${error.message}`);
      return this.localFallback(context);
    }
  }

  /**
   * 从分析结果提取条件参数
   */
  extractConditions(patternAnalysis, moodData) {
    return {
      wuxing: patternAnalysis?.wuxing?.user || 'earth',
      polarity: patternAnalysis?.polarity?.type || 'mixed',
      emotionIntensity: this.extractIntensity(moodData?.emotion),
      cognitiveLoad: this.extractIntensity(moodData?.cognitive),
      somaticTension: this.extractIntensity(moodData?.somatic),
      socialTendency: this.extractIntensity(moodData?.social),
      demandDirection: patternAnalysis?.strategy?.type || 'balance'
    };
  }

  /**
   * 提取强度值
   */
  extractIntensity(dimension) {
    if (!dimension) return 0.5;
    
    // 尝试从不同结构中提取强度
    if (typeof dimension.intensity === 'number') return dimension.intensity;
    if (dimension.physical?.intensity) return dimension.physical.intensity;
    if (dimension.vector?.intensity) return dimension.vector.intensity;
    
    // 根据状态关键词估算
    const state = dimension.physical?.state || '';
    if (/强烈|非常|极度|很|特别/.test(state)) return 0.8;
    if (/有点|稍微|略微/.test(state)) return 0.4;
    
    return 0.5;
  }

  /**
   * 构建活动生成的系统提示词
   */
  buildActivitySystemPrompt(patternAnalysis, conditions) {
    const wuxing = conditions.wuxing;
    const wuxingTone = WUXING_TONE_MAP[wuxing] || WUXING_TONE_MAP['earth'];
    const polarity = conditions.polarity;
    
    // 获取五行优先的活动类型
    const priorityTypes = WUXING_ACTIVITY_PRIORITY[wuxing] || ['quietReflection'];
    const priorityCategories = priorityTypes.map(type => ACTIVITY_CATEGORIES[type]?.name).filter(Boolean);
    
    // 五行对冲理论
    const wuxingTheory = {
      wood: '木气郁结，需要向外疏泄，或借金克木来收敛',
      fire: '火气过旺，需要水来济之，或土来泄之',
      earth: '土主思虑，需要木来疏之，或金来泄之',
      metal: '金气内收，需要火来克之，或木能疏之',
      water: '水主恐，需要土来克之，或火来温之'
    };
    
    return `你是一位生活方式教练。根据用户的情绪状态推荐三条活动，按难度/强度递进排列。

## 匹配规则（护栏）
1. 躯体张力 > 0.7 → 优先躯体释放型活动
2. 认知负荷 > 0.7 → 优先感官沉浸型活动
3. 情绪强度 > 0.8 且 极性=阴 → 优先静默内观型
4. 社交倾向 > 0.6 → 可推荐人际连接型
5. 诉求方向=宣泄 → 优先创造表达型

## 当前用户状态
- 五行属性: ${wuxing} (${wuxingTone.emotion})
- 极性: ${polarity}
- 五行理论: ${wuxingTheory[wuxing] || ''}
- 优先活动类型: ${priorityCategories.join(', ')}

## 三条活动要求
1. 第一条：最简单的，即刻能做（如走动、呼吸）
2. 第二条：中等强度，需要一点准备（如整理、写字）
3. 第三条：稍微突破舒适区（如联系人、外出）

## 每条活动必须包含
1. title: 活动名称（如"去楼下走二十分钟"）
2. reason: 五行依据（如"金气内收，木能疏之，脚踩地面有接地效果"，不超过20字）
3. how: 具体怎么做（如"不带耳机，感受脚步节奏"，不超过20字）

## 输出要求
- reason要有趣，不是"建议你运动"，而是"金气内收，木能疏之"这种有解释框架的表达
- 语气自然，像朋友聊天而非专家建议

## 输出json格式（严格遵守）
{
  "activities": [
    { "title": "活动名称", "reason": "五行依据", "how": "具体怎么做" },
    { "title": "活动名称", "reason": "五行依据", "how": "具体怎么做" },
    { "title": "活动名称", "reason": "五行依据", "how": "具体怎么做" }
  ]
}`;
  }

  /**
   * 构建用户提示词
   */
  buildActivityUserPrompt(candidates, moodData) {
    const emotionState = moodData?.emotion?.physical?.state || '平静';
    
    const candidateList = candidates.slice(0, 8).map(a => 
      `- ${a.name} (${a.category})`
    ).join('\n');
    
    return `用户当前情绪: ${emotionState}

可参考的活动类型:
${candidateList}

请根据五行理论生成三条活动推荐，每条包含 title、reason、how。`;
  }

  /**
   * 确定语气类型
   */
  determineTone(patternAnalysis) {
    const polarity = patternAnalysis?.polarity?.type;
    const strategy = patternAnalysis?.strategy?.type;
    
    if (polarity === 'negative' || strategy === 'harmonize') {
      return '许可型'; // 负面情绪给予许可
    } else if (polarity === 'positive' || strategy === 'resonate') {
      return '推进型'; // 正面情绪可以推进
    }
    return '陪伴型';
  }

  /**
   * 本地降级：基于规则生成三条活动
   */
  async localFallback(context) {
    const patternAnalysis = context.getIntermediate('patternAnalysis');
    const moodData = context.getIntermediate('moodData');
    
    const conditions = this.extractConditions(patternAnalysis, moodData);
    const candidates = filterActivities(conditions);
    const wuxing = conditions.wuxing;
    const tone = this.determineTone(patternAnalysis);
    
    // 生成三条活动，按难度递进
    const activities = this.generateThreeActivities(wuxing, candidates, tone);
    
    const result = {
      activities: activities,
      wuxingNote: this.getWuxingNote(wuxing),
      wuxing: wuxing,
      tone: tone,
      isAI: false,
      _fallback: true,
      timestamp: new Date().toISOString()
    };
    
    context.setIntermediate('activityRecommendation', result);
    return result;
  }

  /**
   * 生成三条活动（本地模板）
   */
  generateThreeActivities(wuxing, candidates, tone) {
    // 五行对应的三条活动模板
    const activityTemplates = {
      wood: [
        {
          title: '去楼下走二十分钟',
          reason: '木气郁结，需要向外疏泄',
          how: '不带耳机，感受脚步节奏'
        },
        {
          title: '整理一个抽屉或桌面',
          reason: '木主生发，整理是疑椝气的方式',
          how: '只整理一个区域，不要贪多'
        },
        {
          title: '给一个久未联系的人发一条消息',
          reason: '木主亲，连接是疏泄木气的出口',
          how: '一句话就够，不用解释为什么突然联系'
        }
      ],
      fire: [
        {
          title: '做三轮深呼吸',
          reason: '火气过旺，需要向内收敛',
          how: '4秒吸气—7秒屏息—8秒呼出'
        },
        {
          title: '用冷水洗把脸',
          reason: '水克火，冷水能帮助降火',
          how: '感受冷水在脸上的触感，停甙9秒'
        },
        {
          title: '到空旷的地方站一会儿',
          reason: '火需要空间燃烧，扩散能释放',
          how: '屋顶、阳台、空旷地，站甹5分钟'
        }
      ],
      earth: [
        {
          title: '吃一样温热的东西',
          reason: '土主辐化，温热能给予包裹感',
          how: '一杯热水、热籼、热汤，慢慢吃'
        },
        {
          title: '摸摸柔软的东西',
          reason: '土主持载，触感能帮助落地',
          how: '抱枕、毛毯、宠物，感受柔软'
        },
        {
          title: '整理一下明天的计划',
          reason: '土主稳定，计划能带来确定感',
          how: '写下三件事，不需要完美'
        }
      ],
      metal: [
        {
          title: '去楼下走二十分钟',
          reason: '金气内收，木能疏之，脚踩地面有接地效果',
          how: '不带耳机，感受脚步节奏'
        },
        {
          title: '整理一个抽屉或桌面',
          reason: '金主收敛，整理是顺势而为的出口',
          how: '只整理一个区域，不要贪多'
        },
        {
          title: '给一个久未联系的人发一条消息',
          reason: '悲郁易使人退缩，主动连接是反向破局',
          how: '一句话就够，不用解释为什么突然联系'
        }
      ],
      water: [
        {
          title: '找个温暖的角落缩一会儿',
          reason: '水主恐，温暖能带来安全感',
          how: '裹上毯子，让自己小小的'
        },
        {
          title: '泡个脚或泡个澡',
          reason: '水性亲水，泡澡能帮助安定',
          how: '水温稍热，15-20分钟'
        },
        {
          title: '写下此刻心里的东西',
          reason: '水主蔘，书写能帮助释放',
          how: '打开备忘录，写完可以删掉'
        }
      ]
    };
    
    // 默认使用土的模板
    return activityTemplates[wuxing] || activityTemplates.earth;
  }

  /**
   * 获取五行注释
   */
  getWuxingNote(wuxing) {
    const notes = {
      wood: '木·疏泄',
      fire: '火·收敛',
      earth: '土·稳定',
      metal: '金·对冲',
      water: '水·安定'
    };
    return notes[wuxing] || '土·稳定';
  }

  /**
   * 输出验证
   */
  validateOutput(result) {
    if (!result || !result.activities || result.activities.length === 0) {
      return { valid: false, reason: 'Missing activities array' };
    }
    
    return { valid: true };
  }
}

export default ActivityComposer;
