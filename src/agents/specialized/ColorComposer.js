/**
 * ColorComposer - 今日色生成器
 * 
 * 职责：根据情绪状态生成今日疗愈色彩
 * 模型：Qwen3-8B（规则约束强）
 * 
 * 输入：五行属性 + 极性 + 情绪强度 + 躯体张力
 * 输出：{ hex, name, desc, reason }
 */

import { BaseComposer, WUXING_TONE_MAP } from './BaseComposer';

// 五行-色彩对应规则
const WUXING_COLOR_PALETTE = {
  'wood': {
    colors: [
      { hex: '#A8D5BA', name: '青翠', desc: '生发舒展' },
      { hex: '#B5C99A', name: '嫩芽', desc: '春意盎然' },
      { hex: '#97C1A9', name: '竹青', desc: '清新通透' },
      { hex: '#C9E4CA', name: '浅翠', desc: '轻盈明朗' },
    ],
    description: '青绿系，舒展生发',
    emotion: '怒'
  },
  'fire': {
    colors: [
      { hex: '#B8C9D9', name: '雾蓝', desc: '静而不沉' },
      { hex: '#A7C4D4', name: '天青', desc: '清凉收敛' },
      { hex: '#C4D4E0', name: '银蓝', desc: '淡然安定' },
      { hex: '#D1D8E0', name: '云灰', desc: '从容不迫' },
    ],
    description: '淡蓝灰系，清凉收敛',
    emotion: '躁'
  },
  'earth': {
    colors: [
      { hex: '#E8D5B7', name: '暖沙', desc: '温柔踏实' },
      { hex: '#D4C4A8', name: '驼色', desc: '稳重厚实' },
      { hex: '#E5DDD0', name: '米白', desc: '纯净安心' },
      { hex: '#D9CFC1', name: '燕麦', desc: '自然舒适' },
    ],
    description: '暖沙大地系，踏实厚重',
    emotion: '忧'
  },
  'metal': {
    colors: [
      { hex: '#F5E6CC', name: '暖白', desc: '柔和包容' },
      { hex: '#F0E5D8', name: '米黄', desc: '温暖接纳' },
      { hex: '#FFEAA7', name: '淡金', desc: '明朗温煦' },
      { hex: '#D5C4E0', name: '淡紫', desc: '优雅内敛' },
    ],
    description: '暖白淡金系，柔和包容',
    emotion: '悲'
  },
  'water': {
    colors: [
      { hex: '#4A6572', name: '深蓝', desc: '沉稳深邃' },
      { hex: '#5D7B93', name: '靛青', desc: '安定包容' },
      { hex: '#6B8E99', name: '灰蓝', desc: '静谧深沉' },
      { hex: '#7B9EA8', name: '海雾', desc: '辽阔宁静' },
    ],
    description: '深蓝靛青系，沉稳安定',
    emotion: '恐'
  }
};

// 极性色彩调整
const POLARITY_ADJUSTMENT = {
  'positive': {
    saturationBoost: 0.1,    // 饱和度略提高
    brightnessBoost: 0.05,   // 亮度略提高
    description: '色彩更明亮、饱和度略高'
  },
  'negative': {
    saturationBoost: -0.1,   // 饱和度略降低
    brightnessBoost: 0,      // 亮度不变
    description: '色彩更内敛、饱和度偏低'
  },
  'mixed': {
    saturationBoost: 0,
    brightnessBoost: 0,
    description: '保持中性平衡'
  }
};

export class ColorComposer extends BaseComposer {
  constructor(config = {}) {
    super({
      name: 'ColorComposer',
      modelSize: '8B',
      apiEndpoint: '/api/compose_color',
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
   * 核心处理：生成今日色
   */
  async process(context) {
    const patternAnalysis = context.getIntermediate('patternAnalysis');
    const moodData = context.getIntermediate('moodData');
    
    try {
      // 尝试调用LLM生成更个性化的颜色
      const systemPrompt = this.buildColorSystemPrompt(patternAnalysis);
      const userPrompt = this.buildColorUserPrompt(patternAnalysis, moodData);
      
      const llmResult = await this.callLLM(systemPrompt, userPrompt, {
        endpoint: '/api/compose_color',
        maxTokens: 100
      });
      
      const parsed = this.parseJSONOutput(llmResult);
      if (parsed && parsed.hex && parsed.name) {
        this.log('SUCCESS', 'LLM生成今日色成功');
        
        const result = {
          ...parsed,
          isAI: true,
          timestamp: new Date().toISOString()
        };
        
        context.setIntermediate('todayColor', result);
        return result;
      }
      
      throw new Error('LLM返回格式不正确');
      
    } catch (error) {
      this.log('WARNING', `LLM生成失败，使用本地规则: ${error.message}`);
      return this.localFallback(context);
    }
  }

  /**
   * 构建颜色生成的系统提示词
   */
  buildColorSystemPrompt(patternAnalysis) {
    const wuxing = patternAnalysis?.wuxing?.user || 'earth';
    const palette = WUXING_COLOR_PALETTE[wuxing];
    const polarity = patternAnalysis?.polarity?.type || 'mixed';
    const polarityAdj = POLARITY_ADJUSTMENT[polarity];
    
    return `你是一位色彩治愈师。根据情绪状态输出一个疗愈色彩。

## 五行-色彩对应规则（护栏）
当前五行: ${wuxing} (${palette.emotion})
色彩方向: ${palette.description}
参考色板: ${palette.colors.map(c => `${c.name}(${c.hex})`).join(', ')}

## 极性调整
当前极性: ${polarity}
调整方向: ${polarityAdj.description}

## 输出要求
1. 颜色必须是有效的HEX格式
2. 名称用2个汉字，要有诗意
3. 描述用4个汉字，表达意境
4. 在参考色板的基础上可以微调，但不要偏离太远

## 输出JSON格式（严格遵守）
{"hex": "#XXXXXX", "name": "X色", "desc": "四字意境", "reason": "选择原因"}`;
  }

  /**
   * 构建用户提示词
   */
  buildColorUserPrompt(patternAnalysis, moodData) {
    const emotionState = moodData?.emotion?.physical?.state || '平静';
    const somaticState = moodData?.somatic?.physical?.state || '正常';
    const diagnosis = patternAnalysis?.diagnosis?.summary || '状态正常';
    
    return `用户当前状态:
- 情绪: ${emotionState}
- 身体: ${somaticState}
- 诊断: ${diagnosis}

请为这个状态选择一个疗愈色彩。`;
  }

  /**
   * 本地降级：基于规则选择颜色
   */
  async localFallback(context) {
    const patternAnalysis = context.getIntermediate('patternAnalysis');
    const wuxing = patternAnalysis?.wuxing?.user || 'earth';
    const polarity = patternAnalysis?.polarity?.type || 'mixed';
    
    // 获取五行对应的色板
    const palette = WUXING_COLOR_PALETTE[wuxing] || WUXING_COLOR_PALETTE['earth'];
    
    // 随机选择一个颜色
    const selectedColor = palette.colors[Math.floor(Math.random() * palette.colors.length)];
    
    const result = {
      ...selectedColor,
      reason: `基于${WUXING_TONE_MAP[wuxing]?.emotion || '土'}气特征，选用${palette.description}`,
      isAI: false,
      _fallback: true,
      timestamp: new Date().toISOString()
    };
    
    context.setIntermediate('todayColor', result);
    return result;
  }

  /**
   * 输出验证
   */
  validateOutput(result) {
    if (!result || !result.hex) {
      return { valid: false, reason: 'Missing hex color' };
    }
    
    // 验证hex格式
    if (!/^#[0-9A-Fa-f]{6}$/.test(result.hex)) {
      return { valid: false, reason: 'Invalid hex color format' };
    }
    
    if (!result.name || !result.desc) {
      return { valid: false, reason: 'Missing name or description' };
    }
    
    return { valid: true };
  }
}

export default ColorComposer;
