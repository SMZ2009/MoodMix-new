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

import { BaseComposer } from './BaseComposer';
import { filterActivities } from '../../data/activityKnowledgeBase';

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

    // 获取可选辅助素材（可选，仅作为灵感，不强制LLM使用）
    const inspiration = filterActivities(conditions);

    try {
      // 尝试调用LLM生成三条活动
      const systemPrompt = this.buildActivitySystemPrompt(patternAnalysis, conditions);
      const userPrompt = this.buildActivityUserPrompt(inspiration, moodData, patternAnalysis);

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
    const wuxingTone = this.getWuxingTone(patternAnalysis?.wuxing);
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
- 🌿 环境气味(scent): 闻某种香味，如檀香、咖啡、柑橘
- 🍵 进食补给(food): 吃/喝某种食物，如热茶、甜食、温汤
- 🧭 空间方位(direction): 面朝某个方向，如朝东站立、面向窗户
- 🪴 供物仪式(offering): 摆放某物，如鲜花、绿植、水晶、蜡烛
- ⏰ 时机选择(timing): 在特定时间做某事，如午后散步、日落前
- ✨ 速效动作(quickFix): 立刻可做的小动作，如深呼吸、整理桌面、伸懒腰
- 🚫 行为禁忌(taboo): 今日不宜做的事，如避免争吵、少刷手机、暂缓决策

## 当前用户状态与调节方向
- 五行属性: ${wuxing} (${wuxingTone.emotion})
- 极性: ${polarity}
- 五行调节方向: ${wuxingTheory[wuxing] || ''}

## 三条仪式要求
1. 必须来自不同类型，严禁重复。
2. 内容要具体、可执行、能立刻完成，充满生活的仪式感。
3. reason要用五行理论解释，像算命先生的口吻，体现"为何这个动作能调节当前磁场"。

## 每条仪式必须包含
1. icon: （仅内部记录用）
2. typeName: 类型中文名（气味/进食/方位/供物/时机/速效/禁忌）
3. title: 仪式名称（简洁有力，不超过6字，如"东方寻木"、"一盏温热"）
4. content: 具体做法（不超过15字）
5. reason: 简短说明（不超过15字，不要包含“土·稳定”、“五行”、“磁场”、“气场”等玄学或术语字样，直接写心理或感官的慰藉，如“让思绪慢下来”或“缓解肌肉紧张”）

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
  buildActivityUserPrompt(inspiration, moodData, patternAnalysis) {
    const emotionState = moodData?.emotion?.physical?.state || '平静';
    const diagnosis = patternAnalysis?.diagnosis || '';

    let prompt = `用户当前情绪状态: ${emotionState}。辨证分析结果: ${diagnosis}。\n\n`;

    if (inspiration && inspiration.length > 0) {
      prompt += `备选素材灵感（仅供参考，请根据调节方向自由创作更具仪式感的内容）: ${inspiration.map(i => i.name).join(', ')}。\n\n`;
    }

    prompt += `请根据五行调节方向生成三条不同类型的仪式。`;
    return prompt;
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

    // 从知识库中动态筛选 3 个活动作为降级
    const candidates = filterActivities(conditions);

    // 为不同五行分配更自然的理由
    const reasonMap = {
      wood: '舒缓紧绷的情绪，让能量顺畅流动',
      fire: '平复焦躁的内心，寻找片刻宁静',
      earth: '沉淀繁杂的思绪，建立内在的安全感',
      metal: '温存每一个瞬间，允许感性流淌',
      water: '接纳起伏的状态，顺应内心的直觉'
    };

    const rituals = candidates.map(c => ({
      icon: c.icon || '✨',
      typeName: c.category || '行为',
      title: c.name,
      content: c.desc || '',
      reason: c.reason || reasonMap[wuxing] || '温和调节此刻状态'
    }));

    // 如果筛选不足3个，补齐
    while (rituals.length < 3) {
      rituals.push({
        icon: '✨',
        typeName: '速效',
        title: '深呼吸',
        content: '感受气息流动',
        reason: '以静制动，平衡呼吸'
      });
    }

    const result = {
      rituals: rituals,
      wuxing: wuxing,
      tone: this.determineTone(patternAnalysis),
      isAI: false,
      _fallback: true,
      timestamp: new Date().toISOString()
    };

    context.setIntermediate('activityRecommendation', result);
    return result;
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
