/**
 * BaseComposer - 所有Composer Agent的基类
 * 
 * Composer是专门负责"生成/创作"类任务的Agent子类
 * 继承自BaseAgent，增加了：
 * 1. 五行语气映射
 * 2. 统一的LLM调用模式
 * 3. 本地降级策略
 */

import { BaseAgent } from '../core/BaseAgent';

// 五行语气映射表 - 所有Composer共享
export const WUXING_TONE_MAP = {
  'wood': { 
    tone: '疏导、舒展、释放',
    style: '像春风轻轻推开窗户',
    prefix: '试着把能量',
    emotion: '怒'
  },
  'fire': { 
    tone: '收敛、安定、沉淀',
    style: '像傍晚的微风带走燥热',
    prefix: '先让自己慢下来',
    emotion: '躁'
  },
  'earth': { 
    tone: '踏实、稳固、安心',
    style: '像大地承托着一切',
    prefix: '允许自己',
    emotion: '忧'
  },
  'metal': { 
    tone: '接纳、温柔、允许',
    style: '像秋叶静静落下',
    prefix: '可以让自己',
    emotion: '悲'
  },
  'water': { 
    tone: '流动、顺应、包容',
    style: '像溪水找到自己的路',
    prefix: '顺着感觉',
    emotion: '恐'
  }
};

// 极性调整规则
export const POLARITY_ADJUSTMENT = {
  positive: {
    intensity: 'high',
    approach: '增强、共鸣、放大',
    verbStyle: '推进型' // 给用户行动推力
  },
  negative: {
    intensity: 'low',
    approach: '接纳、允许、陪伴',
    verbStyle: '许可型' // 给用户休息许可
  },
  mixed: {
    intensity: 'medium',
    approach: '平衡、调和、稳定',
    verbStyle: '陪伴型' // 不判断，只陪伴
  }
};

export class BaseComposer extends BaseAgent {
  constructor(config = {}) {
    super({
      timeout: config.modelSize === '30B' ? 15000 : 8000,
      ...config
    });
    
    this.modelSize = config.modelSize || '8B';
    this.maxTokens = config.modelSize === '30B' ? 150 : 80;
    this.apiEndpoint = config.apiEndpoint || '/api/compose';
  }

  /**
   * 获取五行对应的语气风格
   */
  getWuxingTone(wuxing) {
    const wuxingType = typeof wuxing === 'string' ? wuxing : wuxing?.user;
    return WUXING_TONE_MAP[wuxingType] || WUXING_TONE_MAP['earth'];
  }

  /**
   * 获取极性对应的表达方式
   */
  getPolarityStyle(polarity) {
    const polarityType = typeof polarity === 'string' ? polarity : polarity?.type;
    return POLARITY_ADJUSTMENT[polarityType] || POLARITY_ADJUSTMENT['mixed'];
  }

  /**
   * 构建系统提示词的公共部分
   */
  buildBaseSystemPrompt(patternAnalysis) {
    const wuxing = this.getWuxingTone(patternAnalysis?.wuxing);
    const polarity = this.getPolarityStyle(patternAnalysis?.polarity);
    
    return `
## 语气风格规则
当前用户情绪五行属性: ${wuxing.emotion}
语气要求: ${wuxing.tone}
表达风格: ${wuxing.style}
句式开头倾向: "${wuxing.prefix}..."

极性调整:
- 当前极性: ${polarity.intensity}
- 表达方式: ${polarity.approach}
- 动词风格: ${polarity.verbStyle}

## 输出要求
- 不使用感叹号
- 不堆砌emoji
- 语言温和但不空洞
- 具体但不啰嗦
`.trim();
  }

  /**
   * 通用的LLM调用方法
   */
  async callLLM(systemPrompt, userPrompt, options = {}) {
    const endpoint = options.endpoint || this.apiEndpoint;
    const maxTokens = options.maxTokens || this.maxTokens;
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_prompt: systemPrompt,
          user_prompt: userPrompt,
          max_tokens: maxTokens,
          model_size: this.modelSize
        })
      });

      if (!response.ok) {
        throw new Error(`LLM服务返回错误: ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'LLM调用失败');
      }

      return result.data;
    } catch (error) {
      this.log('WARNING', `LLM调用失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 解析JSON输出（带容错）
   */
  parseJSONOutput(text) {
    try {
      // 尝试直接解析
      return JSON.parse(text);
    } catch {
      // 尝试提取JSON块
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch {
          return null;
        }
      }
      return null;
    }
  }

  /**
   * 子类必须实现的本地降级方法
   */
  async localFallback(context) {
    throw new Error(`${this.name} must implement localFallback() method`);
  }

  /**
   * 统一的错误处理：尝试本地降级
   */
  async handleError(error, context) {
    this.log('WARNING', `尝试本地降级: ${error.message}`);
    
    try {
      const fallbackResult = await this.localFallback(context);
      if (fallbackResult) {
        fallbackResult._fallback = true;
        fallbackResult._fallbackReason = error.message;
        return fallbackResult;
      }
    } catch (fallbackError) {
      this.log('ERROR', `本地降级也失败: ${fallbackError.message}`);
    }
    
    return null;
  }
}

export default BaseComposer;
