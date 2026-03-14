/**
 * SentenceComposer - 每日心理锚点句生成器
 * 
 * 职责：生成今天专属的"心理锚点"——不是鸡汤，不是总结，
 *       是根据情绪状态给出的行动许可或推进方向
 * 模型：Qwen3-30B（用户面向内容，需要更高质量）
 * 
 * 规则：
 * - 情绪强度高 → 许可型："今天允许自己什么都不做"
 * - 情绪平稳 → 推进型："今天只做一件事就算赢"
 * - 五行叠加：金（悲）→ 接纳语气，木（怒）→ 疏导语气
 * 
 * 输入：五行属性 + 极性 + 情绪强度 + 调理策略
 * 输出：一句话（15-25字）
 */

import { BaseComposer, WUXING_TONE_MAP, POLARITY_ADJUSTMENT } from './BaseComposer';

// 句式模板库 - 按类型分类
const SENTENCE_TEMPLATES = {
  // 许可型：高情绪强度时使用
  permission: {
    wood: [
      '今天允许自己把情绪释放出来',
      '可以让自己狠狠地发泄一次',
      '今天不必压抑，让它流动',
      '允许自己把这股能量表达出来',
      '今天可以不温柔，那也是真实的你'
    ],
    fire: [
      '今天允许自己什么都不做',
      '可以让自己安静地待一会儿',
      '今天的任务就是放空',
      '允许自己不再用力',
      '今天只需要呼吸就够了'
    ],
    earth: [
      '今天允许自己感到不安',
      '可以承认自己需要支撑',
      '今天不用假装没事',
      '允许自己依赖一些确定的东西',
      '今天可以慢一点'
    ],
    metal: [
      '今天允许自己难过',
      '可以让眼泪流下来',
      '今天不用强颜欢笑',
      '允许这份悲伤存在',
      '今天可以不坚强'
    ],
    water: [
      '今天允许自己害怕',
      '可以承认自己的不安',
      '今天不用假装勇敢',
      '允许自己躲一躲',
      '今天可以不面对'
    ]
  },
  
  // 推进型：情绪平稳时使用
  propulsion: {
    wood: [
      '今天只做一件让自己畅快的事',
      '试着把积蓄的能量用在一件事上',
      '今天的小目标：动起来',
      '选一件能让你舒展的事去做',
      '今天让身体替你说话'
    ],
    fire: [
      '今天只做一件事就算赢',
      '选一件小事，专注完成它',
      '今天的成就感只需要一件事来撑',
      '做完一件事就可以休息了',
      '今天的目标就是做完这一件'
    ],
    earth: [
      '今天给自己一个小小的确定',
      '完成一件让自己安心的事',
      '今天只需要一个着陆点',
      '做一件让你觉得踏实的事',
      '今天的任务是站稳这一步'
    ],
    metal: [
      '今天试着接受一件事的离开',
      '放下一件你一直在抓着的事',
      '今天的功课是学会告别',
      '让一件事从你手里温柔地走',
      '今天允许自己说再见'
    ],
    water: [
      '今天顺着感觉走一步',
      '不用想太远，先走这一步',
      '今天的方向就是脚下',
      '跟着直觉做一个小决定',
      '今天只需要往前挪一点点'
    ]
  },
  
  // 陪伴型：混合情绪时使用
  companion: {
    wood: [
      '不管怎样，今天你已经在这里了',
      '这股能量是你的，它会找到出口',
      '今天的你比你以为的更有力量'
    ],
    fire: [
      '今天就这样也可以',
      '不需要有什么进展，存在就够了',
      '今天的你已经很努力了'
    ],
    earth: [
      '今天的不确定不会永远持续',
      '脚下的地面一直在支撑你',
      '今天你不是一个人'
    ],
    metal: [
      '失去的东西让你更懂珍惜',
      '今天的你在学习一种温柔',
      '有些痛是成长的形状'
    ],
    water: [
      '恐惧有时候是在保护你',
      '今天的你在学习与未知相处',
      '不确定里也藏着可能性'
    ]
  }
};

// 情绪强度阈值
const INTENSITY_THRESHOLDS = {
  high: 0.7,    // 高强度 → 许可型
  medium: 0.4,  // 中强度 → 陪伴型
  low: 0        // 低强度 → 推进型
};

export class SentenceComposer extends BaseComposer {
  constructor(config = {}) {
    super({
      name: 'SentenceComposer',
      modelSize: '30B',  // 用户面向内容，使用更大模型
      apiEndpoint: '/api/compose_sentence',
      timeout: 15000,    // 30B模型需要更长超时
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
   * 核心处理：生成每日心理锚点句
   */
  async process(context) {
    const patternAnalysis = context.getIntermediate('patternAnalysis');
    const moodData = context.getIntermediate('moodData');
    
    // 提取关键参数
    const wuxing = patternAnalysis?.wuxing?.user || 'earth';
    const polarity = patternAnalysis?.polarity?.type || 'mixed';
    const emotionIntensity = this.extractIntensity(moodData?.emotion);
    const interventionType = patternAnalysis?.intervention || 'balance';
    
    // 确定句式类型
    const sentenceType = this.determineSentenceType(emotionIntensity, polarity);
    
    try {
      // 尝试调用LLM生成个性化句子
      const systemPrompt = this.buildSentenceSystemPrompt(patternAnalysis, sentenceType);
      const userPrompt = this.buildSentenceUserPrompt(moodData, wuxing, sentenceType);
      
      const llmResult = await this.callLLM(systemPrompt, userPrompt, {
        endpoint: '/api/compose_sentence',
        maxTokens: 60  // 只需要一句话
      });
      
      // 尝试解析结果
      const sentence = this.extractSentence(llmResult);
      
      if (sentence && sentence.length >= 10 && sentence.length <= 30) {
        this.log('SUCCESS', `LLM生成锚点句: ${sentence}`);
        
        const result = {
          sentence,
          sentenceType,
          wuxing,
          polarity,
          emotionIntensity,
          isAI: true,
          timestamp: new Date().toISOString()
        };
        
        context.setIntermediate('dailySentence', result);
        return result;
      }
      
      throw new Error('LLM返回的句子不符合长度要求');
      
    } catch (error) {
      this.log('WARNING', `LLM生成失败，使用本地规则: ${error.message}`);
      return this.localFallback(context);
    }
  }

  /**
   * 确定句式类型
   */
  determineSentenceType(emotionIntensity, polarity) {
    // 高强度情绪 → 许可型（允许用户休息、释放）
    if (emotionIntensity >= INTENSITY_THRESHOLDS.high) {
      return 'permission';
    }
    
    // 低强度情绪 → 推进型（给用户行动推力）
    if (emotionIntensity < INTENSITY_THRESHOLDS.medium) {
      return 'propulsion';
    }
    
    // 中等强度 + 混合极性 → 陪伴型
    if (polarity === 'mixed') {
      return 'companion';
    }
    
    // 中等强度 + 负面情绪 → 许可型
    if (polarity === 'negative') {
      return 'permission';
    }
    
    // 中等强度 + 正面情绪 → 推进型
    return 'propulsion';
  }

  /**
   * 提取情绪强度
   */
  extractIntensity(emotionDimension) {
    if (!emotionDimension) return 0.5;
    
    // 尝试从多个可能的字段提取
    if (typeof emotionDimension.intensity === 'number') {
      return emotionDimension.intensity;
    }
    if (emotionDimension.physical?.intensity) {
      return emotionDimension.physical.intensity;
    }
    if (emotionDimension.vector?.intensity) {
      return emotionDimension.vector.intensity;
    }
    
    // 从文本描述推断
    const state = emotionDimension.physical?.state || '';
    if (/强烈|非常|极度|很|特别|崩溃|爆发/.test(state)) return 0.85;
    if (/比较|有些|挺|蛮/.test(state)) return 0.6;
    if (/有点|稍微|略微/.test(state)) return 0.35;
    if (/平静|平和|淡定/.test(state)) return 0.2;
    
    return 0.5;
  }

  /**
   * 构建系统提示词
   */
  buildSentenceSystemPrompt(patternAnalysis, sentenceType) {
    const wuxing = patternAnalysis?.wuxing?.user || 'earth';
    const wuxingTone = WUXING_TONE_MAP[wuxing] || WUXING_TONE_MAP['earth'];
    const polarityStyle = POLARITY_ADJUSTMENT[patternAnalysis?.polarity?.type] || POLARITY_ADJUSTMENT['mixed'];
    
    const typeGuidelines = {
      permission: `许可型句式：给用户休息、释放、不行动的许可。
示例：「今天允许自己什么都不做」「可以让眼泪流下来」`,
      propulsion: `推进型句式：给用户温和的行动推力，不施压。
示例：「今天只做一件事就算赢」「试着完成一个小目标」`,
      companion: `陪伴型句式：不判断、不指导，只是陪伴的表达。
示例：「今天就这样也可以」「不管怎样你已经在这里了」`
    };

    return `你是一位情绪陪伴专家，负责生成每日心理锚点句。

## 核心原则
这不是鸡汤，不是总结，而是今天专属的"心理锚点"——
根据用户的情绪状态，给出一个行动许可或温和的推进方向。

## 当前任务
${typeGuidelines[sentenceType]}

## 五行语气要求
用户五行属性: ${wuxing} (${wuxingTone.emotion})
语气基调: ${wuxingTone.tone}
表达风格: ${wuxingTone.style}
句式开头倾向: "${wuxingTone.prefix}..."

## 极性调整
- 表达方式: ${polarityStyle.approach}
- 动词风格: ${polarityStyle.verbStyle}

## 输出规则
1. 只输出一句话，15-25个中文字符
2. 不使用感叹号
3. 不使用emoji
4. 不说教、不判断、不给建议
5. 温和但不空洞
6. 具体但不啰嗦

## 禁止内容
- "加油"、"努力"、"坚持"等鸡汤词汇
- "你很棒"、"你已经很好了"等空洞肯定
- 任何带有评价性质的表达

直接输出句子本身，不要加引号或其他格式。`;
  }

  /**
   * 构建用户提示词
   */
  buildSentenceUserPrompt(moodData, wuxing, sentenceType) {
    const emotionState = moodData?.emotion?.physical?.state || '平静';
    const context = moodData?.context?.physical?.situation || '';
    
    const typeHint = {
      permission: '生成一句许可型的心理锚点',
      propulsion: '生成一句温和推进型的心理锚点',
      companion: '生成一句陪伴型的心理锚点'
    };
    
    return `用户当前情绪状态: ${emotionState}
${context ? `情境: ${context}` : ''}
五行属性: ${wuxing}

${typeHint[sentenceType]}，15-25字。`;
  }

  /**
   * 从LLM返回中提取句子
   */
  extractSentence(text) {
    if (!text) return null;
    
    // 清理文本
    let sentence = text.trim();
    
    // 移除可能的引号
    sentence = sentence.replace(/^["「『]|["」』]$/g, '');
    
    // 移除可能的前缀
    sentence = sentence.replace(/^(句子|锚点句|今日锚点|心理锚点)[：:]\s*/i, '');
    
    // 如果包含换行，只取第一行
    if (sentence.includes('\n')) {
      sentence = sentence.split('\n')[0].trim();
    }
    
    // 移除末尾标点（除了句号）
    sentence = sentence.replace(/[！!？?]+$/, '');
    
    return sentence;
  }

  /**
   * 本地降级：从模板库选取
   */
  async localFallback(context) {
    const patternAnalysis = context.getIntermediate('patternAnalysis');
    const moodData = context.getIntermediate('moodData');
    
    const wuxing = patternAnalysis?.wuxing?.user || 'earth';
    const polarity = patternAnalysis?.polarity?.type || 'mixed';
    const emotionIntensity = this.extractIntensity(moodData?.emotion);
    
    // 确定句式类型
    const sentenceType = this.determineSentenceType(emotionIntensity, polarity);
    
    // 从对应模板库中随机选取
    const templates = SENTENCE_TEMPLATES[sentenceType]?.[wuxing] || 
                     SENTENCE_TEMPLATES['companion']['earth'];
    
    const sentence = templates[Math.floor(Math.random() * templates.length)];
    
    const result = {
      sentence,
      sentenceType,
      wuxing,
      polarity,
      emotionIntensity,
      isAI: false,
      _fallback: true,
      timestamp: new Date().toISOString()
    };
    
    context.setIntermediate('dailySentence', result);
    this.log('INFO', `本地降级生成锚点句: ${sentence} (${sentenceType}型)`);
    
    return result;
  }

  /**
   * 输出验证
   */
  validateOutput(result) {
    if (!result || !result.sentence) {
      return { valid: false, reason: 'Missing sentence' };
    }
    
    const len = result.sentence.length;
    if (len < 8 || len > 35) {
      return { valid: false, reason: `Sentence length ${len} out of range (8-35)` };
    }
    
    // 检查是否包含禁止词汇
    const forbiddenWords = ['加油', '努力', '坚持', '你很棒', '相信自己'];
    for (const word of forbiddenWords) {
      if (result.sentence.includes(word)) {
        return { valid: false, reason: `Contains forbidden word: ${word}` };
      }
    }
    
    return { valid: true };
  }
}

export default SentenceComposer;
