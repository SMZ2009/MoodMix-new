/**
 * ActivityComposer - 小仪式推荐生成器
 * 
 * 职责：根据情绪状态推荐三条小仪式，覆盖身/空间/行为三类
 * 模型：Qwen3-8B（结构化短句）
 * 
 * 输入：五行属性 + 极性 + 情绪强度 + 躯体张力 + 认知负荷 + 社交倾向
 * 输出：{ rituals: [{icon, typeName, title, content, reason}, ...], wuxingNote }
 * 
 * 仪式类型（7种）:
 * - 身体类: 气味(scent), 进食(food)
 * - 空间类: 方位(direction), 供物(offering)
 * - 行为类: 时机(timing), 速效(quickFix), 禁忌(taboo)
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
      // 支持新格式 rituals 和旧格式 activities
      const rawRituals = parsed?.rituals || parsed?.activities;
      if (rawRituals && rawRituals.length > 0) {
        const rituals = rawRituals.slice(0, 3).map((r, index) => ({
          icon: r.icon || this.inferIcon(r),
          typeName: r.typeName || this.inferTypeName(r),
          title: r.title || r.name || `仪式${index + 1}`,
          content: r.content || r.how || r.how_steps || '',
          reason: r.reason || r.why_reason || ''
        }));
        
        this.log('SUCCESS', `LLM生成${rituals.length}条小仪式`);
        
        const result = {
          rituals: rituals,
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
   * 构建小仪式生成的系统提示词
   */
  buildActivitySystemPrompt(patternAnalysis, conditions) {
    const wuxing = conditions.wuxing;
    const wuxingTone = WUXING_TONE_MAP[wuxing] || WUXING_TONE_MAP['earth'];
    const polarity = conditions.polarity;
    
    // 五行对冲理论
    const wuxingTheory = {
      wood: '木气郁结，需要向外疏泄，或借金克木来收敛',
      fire: '火气过旺，需要水来济之，或土来泄之',
      earth: '土主思虑，需要木来疏之，或金来泄之',
      metal: '金气内收，需要火来克之，或木能疏之',
      water: '水主恐，需要土来克之，或火来温之'
    };
    
    return `你是一位运势指导师。根据用户的五行状态推荐三条"小仪式"，像开运指南一样给出具体可执行的行动。

## 仪式类型（必须从以下7种中选择3种不同类型）
- 身体类:
  - 气味(scent): 闻某种香味，如檀香、咖啡、柑橘 → icon: 🌿
  - 进食(food): 吃/喝某种食物，如热茶、甜食、温汤 → icon: 🍵
- 空间类:
  - 方位(direction): 面朝某个方向，如朝东站立、面向窗户 → icon: 🧭
  - 供物(offering): 摆放某物，如鲜花、绿植、水晶 → icon: 🪴
- 行为类:
  - 时机(timing): 在特定时间做某事，如午后散步、日落前 → icon: ⏰
  - 速效(quickFix): 立刻可做的小动作，如深呼吸、整理桌面 → icon: ✨
  - 禁忌(taboo): 今日不宜做的事，如避免争吵、少刷手机 → icon: 🚫

## 当前用户状态
- 五行属性: ${wuxing} (${wuxingTone.emotion})
- 极性: ${polarity}
- 五行理论: ${wuxingTheory[wuxing] || ''}

## 三条仪式要求
1. 三条仪式必须来自不同类型（如一条进食+一条方位+一条速效）
2. 内容要具体、可执行、有仪式感
3. reason要用五行理论解释，像算命先生的口吻

## 每条仪式必须包含
1. icon: 对应类型的emoji（🌿/🍵/🧭/🪴/⏰/✨/🚫）
2. typeName: 类型中文名（气味/进食/方位/供物/时机/速效/禁忌）
3. title: 仪式名称（如"喝一杯温热的东西"）
4. content: 具体做法（如"热茶、热粥、热汤，慢慢享用"，不超过20字）
5. reason: 五行依据（如"土主运化，温热能给予包裹感"，不超过20字）

## 输出json格式（严格遵守）
{
  "rituals": [
    { "icon": "🍵", "typeName": "进食", "title": "仪式名称", "content": "具体做法", "reason": "五行依据" },
    { "icon": "🧭", "typeName": "方位", "title": "仪式名称", "content": "具体做法", "reason": "五行依据" },
    { "icon": "✨", "typeName": "速效", "title": "仪式名称", "content": "具体做法", "reason": "五行依据" }
  ]
}`;
  }

  /**
   * 构建用户提示词
   */
  buildActivityUserPrompt(candidates, moodData) {
    const emotionState = moodData?.emotion?.physical?.state || '平静';
    
    return `用户当前情绪: ${emotionState}

请根据五行理论生成三条小仪式，必须从7种类型中选择3种不同类型。
每条必须包含: icon, typeName, title, content, reason。`;
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
   * 本地降级：基于规则生成三条小仪式
   */
  async localFallback(context) {
    const patternAnalysis = context.getIntermediate('patternAnalysis');
    const moodData = context.getIntermediate('moodData');
    
    const conditions = this.extractConditions(patternAnalysis, moodData);
    const wuxing = conditions.wuxing;
    const tone = this.determineTone(patternAnalysis);
    
    // 生成三条小仪式
    const rituals = this.generateThreeRituals(wuxing, tone);
    
    const result = {
      rituals: rituals,
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
   * 生成三条小仪式（本地模板）
   */
  generateThreeRituals(wuxing, tone) {
    // 五行对应的三条仪式模板（每个五行对应不同类型组合）
    const ritualTemplates = {
      wood: [
        {
          icon: '🌿',
          typeName: '气味',
          title: '闻一闻柑橘的香气',
          content: '柠檬、橙子、柚子，清新的味道',
          reason: '木气郁结，柑橘之香能疏肝理气'
        },
        {
          icon: '🧭',
          typeName: '方位',
          title: '面朝东方站立片刻',
          content: '朝向日出的方向，感受生发之气',
          reason: '木主东方，面东能接引生机'
        },
        {
          icon: '✨',
          typeName: '速效',
          title: '伸个大大的懒腰',
          content: '双手向上，尽力舒展全身',
          reason: '木主筋，舒展能疏通气血'
        }
      ],
      fire: [
        {
          icon: '🍵',
          typeName: '进食',
          title: '喝一杯温凉的水',
          content: '常温或微凉，小口慢饮',
          reason: '水克火，凉水能帮助平心静气'
        },
        {
          icon: '🪴',
          typeName: '供物',
          title: '在桌上摆一杯清水',
          content: '透明玻璃杯，清澈的水',
          reason: '水能济火，清水带来澄净之感'
        },
        {
          icon: '🚫',
          typeName: '禁忌',
          title: '今日少争论',
          content: '遇事缓一缓，不急于表态',
          reason: '火旺易冲动，静默是最好的灭火'
        }
      ],
      earth: [
        {
          icon: '🍵',
          typeName: '进食',
          title: '喝一杯温热的东西',
          content: '热茶、热粥、热汤，慢慢享用',
          reason: '土主运化，温热能给予包裹感'
        },
        {
          icon: '🧭',
          typeName: '方位',
          title: '坐在房间的中央位置',
          content: '找到空间的中心点，安坐片刻',
          reason: '土居中央，中位能带来稳定感'
        },
        {
          icon: '✨',
          typeName: '速效',
          title: '整理一下明天的计划',
          content: '写下三件事，不需要完美',
          reason: '土主稳定，计划能带来确定感'
        }
      ],
      metal: [
        {
          icon: '🌿',
          typeName: '气味',
          title: '闻一闻薄荷或桉树香',
          content: '清凉通透的味道，深吸几口',
          reason: '金主收敛，清香能宣通肺气'
        },
        {
          icon: '⏰',
          typeName: '时机',
          title: '傍晚时分出门走走',
          content: '日落前后，感受金气最盛的时刻',
          reason: '金主西方，傍晚是金气归藏之时'
        },
        {
          icon: '✨',
          typeName: '速效',
          title: '整理一个小区域',
          content: '抽屉、桌角，只整理一处',
          reason: '金主收敛，整理是顺势而为'
        }
      ],
      water: [
        {
          icon: '🍵',
          typeName: '进食',
          title: '喝一杯热的黑色饮品',
          content: '黑咖啡、普洱茶、黑芝麻糊',
          reason: '水主黑色，温热能驱散寒意'
        },
        {
          icon: '🪴',
          typeName: '供物',
          title: '点一支蜡烛',
          content: '小小的火光，安静地燃烧',
          reason: '火能温水，烛光带来温暖安定'
        },
        {
          icon: '🚫',
          typeName: '禁忌',
          title: '今日少独处太久',
          content: '适当找人说说话，哪怕只是闲聊',
          reason: '水主藏，过度独处易生寒意'
        }
      ]
    };
    
    // 默认使用土的模板
    return ritualTemplates[wuxing] || ritualTemplates.earth;
  }

  /**
   * 推断仪式图标（当LLM没返回时）
   */
  inferIcon(ritual) {
    const text = (ritual.title || '') + (ritual.content || ritual.how || '');
    if (/闻|香|气味|精油|檀|薰/.test(text)) return '🌿';
    if (/吃|喝|茶|咖啡|水|热|温|粥|汤|食/.test(text)) return '🍵';
    if (/方位|方向|朝|东|南|西|北|面向/.test(text)) return '🧭';
    if (/摆|放|供|物|花|植|绿|蜡烛/.test(text)) return '🪴';
    if (/时|点|早|晚|午|傍晚/.test(text)) return '⏰';
    if (/不要|避免|忌|少|别/.test(text)) return '🚫';
    return '✨';
  }

  /**
   * 推断仪式类型名（当LLM没返回时）
   */
  inferTypeName(ritual) {
    const text = (ritual.title || '') + (ritual.content || ritual.how || '');
    if (/闻|香|气味|精油|檀|薰/.test(text)) return '气味';
    if (/吃|喝|茶|咖啡|水|热|温|粥|汤|食/.test(text)) return '进食';
    if (/方位|方向|朝|东|南|西|北|面向/.test(text)) return '方位';
    if (/摆|放|供|物|花|植|绿|蜡烛/.test(text)) return '供物';
    if (/时|点|早|晚|午|傍晚/.test(text)) return '时机';
    if (/不要|避免|忌|少|别/.test(text)) return '禁忌';
    return '速效';
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
    // 支持新格式 rituals 和旧格式 activities
    const items = result?.rituals || result?.activities;
    if (!result || !items || items.length === 0) {
      return { valid: false, reason: 'Missing rituals array' };
    }
    
    return { valid: true };
  }
}

export default ActivityComposer;
