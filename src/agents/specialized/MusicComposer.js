/**
 * MusicComposer - 音乐氛围推荐生成器
 * 
 * 职责：根据情绪状态推荐音乐氛围关键词（非具体歌曲）
 * 模型：Qwen3-8B（结构化关键词）
 * 
 * 输入：五行属性 + 极性 + 情绪强度
 * 输出：{ keywords, bpm, vibe_desc, platform_hint, search_term }
 */

import { BaseComposer, WUXING_TONE_MAP } from './BaseComposer';
import { 
  MUSIC_MOODS, 
  WUXING_MUSIC_MAPPING, 
  getMusicRecommendation,
  generateSearchKeywords,
  getRandomVibeDescription 
} from '../../data/musicKnowledgeBase';

export class MusicComposer extends BaseComposer {
  constructor(config = {}) {
    super({
      name: 'MusicComposer',
      modelSize: '8B',
      apiEndpoint: '/api/compose_music',
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
   * 核心处理：生成音乐推荐
   */
  async process(context) {
    const patternAnalysis = context.getIntermediate('patternAnalysis');
    const moodData = context.getIntermediate('moodData');
    
    // 提取条件
    const wuxing = patternAnalysis?.wuxing?.user || 'earth';
    const polarity = patternAnalysis?.polarity?.type || 'mixed';
    const emotionIntensity = this.extractIntensity(moodData?.emotion);
    
    // 先用本地规则获取基础推荐
    const baseRecommendation = getMusicRecommendation({
      wuxing,
      polarity,
      emotionIntensity
    });
    
    try {
      // 尝试调用LLM生成更个性化的描述
      const systemPrompt = this.buildMusicSystemPrompt(patternAnalysis, baseRecommendation);
      const userPrompt = this.buildMusicUserPrompt(moodData, baseRecommendation);
      
      const llmResult = await this.callLLM(systemPrompt, userPrompt, {
        endpoint: '/api/compose_music',
        maxTokens: 100
      });
      
      const parsed = this.parseJSONOutput(llmResult);
      if (parsed && parsed.keywords && parsed.keywords.length > 0) {
        this.log('SUCCESS', `LLM生成音乐推荐: ${parsed.vibe_desc || '成功'}`);
        
        // 生成搜索词（用于网易云跳转）
        const searchTerm = parsed.search_term || this.generateSearchTerm(parsed.keywords, baseRecommendation);
        
        const result = {
          moodType: baseRecommendation.moodType,
          keywords: parsed.keywords,
          bpm: parsed.bpm || baseRecommendation.adjustedBpm,
          vibe_desc: parsed.vibe_desc || baseRecommendation.vibe,
          platform_hint: parsed.platform_hint || baseRecommendation.searchTips,
          search_term: searchTerm,
          wuxingNote: baseRecommendation.wuxingNote,
          isAI: true,
          timestamp: new Date().toISOString()
        };
        
        context.setIntermediate('musicRecommendation', result);
        return result;
      }
      
      throw new Error('LLM返回格式不正确');
      
    } catch (error) {
      this.log('WARNING', `LLM生成失败，使用本地规则: ${error.message}`);
      return this.localFallback(context);
    }
  }

  /**
   * 提取强度值
   */
  extractIntensity(dimension) {
    if (!dimension) return 0.5;
    
    if (typeof dimension.intensity === 'number') return dimension.intensity;
    if (dimension.physical?.intensity) return dimension.physical.intensity;
    if (dimension.vector?.intensity) return dimension.vector.intensity;
    
    const state = dimension.physical?.state || '';
    if (/强烈|非常|极度|很|特别/.test(state)) return 0.8;
    if (/有点|稍微|略微/.test(state)) return 0.4;
    
    return 0.5;
  }

  /**
   * 构建音乐生成的系统提示词
   */
  buildMusicSystemPrompt(patternAnalysis, baseRecommendation) {
    const wuxing = patternAnalysis?.wuxing?.user || 'earth';
    const wuxingTone = WUXING_TONE_MAP[wuxing] || WUXING_TONE_MAP['earth'];
    const musicMapping = WUXING_MUSIC_MAPPING[wuxing];
    
    return `你是一位音乐氛围策展人。根据情绪状态推荐音乐氛围关键词。

## 规则（护栏）
1. 不推荐具体歌曲名/歌手名
2. 输出3-5个搜索关键词
3. 给出BPM建议范围
4. 用一句话描述这种音乐应该带来的感觉

## 当前用户状态
- 五行属性: ${wuxing} (${wuxingTone.emotion})
- 音乐偏好: ${musicMapping?.preference || '温和稳定的音乐'}
- 避免类型: ${musicMapping?.avoid?.join(', ') || '无'}
- 推荐氛围: ${baseRecommendation.moodType} - ${baseRecommendation.vibe}

## 五行音乐规则
- 金（悲）→ 允许悲伤的音乐陪伴，不强行积极
- 木（怒）→ 可以用节奏感强的音乐疏导
- 火（躁）→ 用舒缓音乐帮助收敛
- 水（恐）→ 用稳定、深沉的音乐安定
- 土（忧）→ 用温暖、踏实的音乐支撑

## 参考关键词
${baseRecommendation.keywords.join(', ')}

## 输出JSON格式（严格遵守）
{
  "keywords": ["关键词1", "关键词2", "关键词3", "关键词4"],
  "bpm": "XX-XX",
  "vibe_desc": "像XXX一样的感觉",
  "platform_hint": "网易云/Spotify搜索建议",
  "search_term": "网易云搜索词（如 coffee shop jazz / 治愈系轻音乐）"
}`;
  }

  /**
   * 构建用户提示词
   */
  buildMusicUserPrompt(moodData, baseRecommendation) {
    const emotionState = moodData?.emotion?.physical?.state || '平静';
    
    return `用户当前情绪: ${emotionState}
推荐的音乐氛围: ${baseRecommendation.moodType} (${baseRecommendation.vibe})

请生成个性化的音乐搜索关键词和氛围描述。`;
  }

  /**
   * 生成搜索词（用于网易云跳转）
   */
  generateSearchTerm(keywords, baseRecommendation) {
    // 优先用前两个关键词拼接
    if (keywords && keywords.length >= 2) {
      return `${keywords[0]} ${keywords[1]}`;
    }
    if (keywords && keywords.length === 1) {
      return keywords[0];
    }
    // 回退到基础推荐的关键词
    if (baseRecommendation.keywords && baseRecommendation.keywords.length > 0) {
      return baseRecommendation.keywords.slice(0, 2).join(' ');
    }
    return '治愈音乐';
  }

  /**
   * 本地降级：基于规则生成推荐
   */
  async localFallback(context) {
    const patternAnalysis = context.getIntermediate('patternAnalysis');
    const moodData = context.getIntermediate('moodData');
    
    const wuxing = patternAnalysis?.wuxing?.user || 'earth';
    const polarity = patternAnalysis?.polarity?.type || 'mixed';
    const emotionIntensity = this.extractIntensity(moodData?.emotion);
    
    const baseRecommendation = getMusicRecommendation({
      wuxing,
      polarity,
      emotionIntensity
    });
    
    // 生成搜索关键词
    const keywords = generateSearchKeywords(baseRecommendation, 4);
    
    // 获取氛围描述
    const vibeDesc = getRandomVibeDescription(baseRecommendation.moodType);
    
    // 生成搜索词
    const searchTerm = this.generateSearchTerm(keywords, baseRecommendation);
    
    const result = {
      moodType: baseRecommendation.moodType,
      keywords: keywords,
      bpm: baseRecommendation.adjustedBpm,
      vibe_desc: vibeDesc,
      platform_hint: baseRecommendation.searchTips,
      search_term: searchTerm,
      wuxingNote: baseRecommendation.wuxingNote,
      isAI: false,
      _fallback: true,
      timestamp: new Date().toISOString()
    };
    
    context.setIntermediate('musicRecommendation', result);
    return result;
  }

  /**
   * 输出验证
   */
  validateOutput(result) {
    if (!result || !result.keywords || result.keywords.length === 0) {
      return { valid: false, reason: 'Missing keywords' };
    }
    
    if (!result.vibe_desc) {
      return { valid: false, reason: 'Missing vibe description' };
    }
    
    return { valid: true };
  }
}

export default MusicComposer;
