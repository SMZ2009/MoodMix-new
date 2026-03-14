/**
 * MusicComposer - 环境音氛围推荐生成器
 * 
 * 职责：根据情绪状态推荐环境音场景（非具体歌曲）
 * 模型：Qwen3-8B（结构化关键词）
 * 
 * 输入：五行属性 + 极性 + 情绪强度
 * 输出：{ keywords, vibe_desc, freesound_query, scene_name }
 * 
 * 注意：Freesound 适合雨声、白噪音、自然音，不适合推荐歌曲
 *       改用「环境声音场景」替代「音乐歌单」
 */

import { BaseComposer, WUXING_TONE_MAP } from './BaseComposer';
import { 
  AMBIENT_SCENES, 
  WUXING_AMBIENT_MAPPING, 
  getAmbientRecommendation,
  generateFreesoundQuery,
  getRandomSceneDescription 
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
   * 核心处理：生成环境音推荐
   */
  async process(context) {
    const patternAnalysis = context.getIntermediate('patternAnalysis');
    const moodData = context.getIntermediate('moodData');
    
    // 提取条件
    const wuxing = patternAnalysis?.wuxing?.user || 'earth';
    const polarity = patternAnalysis?.polarity?.type || 'mixed';
    const emotionIntensity = this.extractIntensity(moodData?.emotion);
    
    // 先用本地规则获取基础推荐
    const baseRecommendation = getAmbientRecommendation({
      wuxing,
      polarity,
      emotionIntensity
    });
    
    try {
      // 尝试调用LLM生成更个性化的描述
      const systemPrompt = this.buildAmbientSystemPrompt(patternAnalysis, baseRecommendation);
      const userPrompt = this.buildAmbientUserPrompt(moodData, baseRecommendation);
      
      const llmResult = await this.callLLM(systemPrompt, userPrompt, {
        endpoint: '/api/compose_music',
        maxTokens: 150
      });
      
      const parsed = this.parseJSONOutput(llmResult);
      if (parsed && parsed.freesound_query) {
        this.log('SUCCESS', `LLM生成环境音推荐: ${parsed.scene_name || '成功'}`);
        
        const result = {
          sceneType: baseRecommendation.sceneType,
          scene_name: parsed.scene_name || baseRecommendation.sceneName,
          keywords: parsed.display_keywords || baseRecommendation.keywords,
          vibe_desc: parsed.vibe_desc || baseRecommendation.vibe,
          freesound_query: parsed.freesound_query,
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
   * 构建环境音生成的系统提示词
   */
  buildAmbientSystemPrompt(patternAnalysis, baseRecommendation) {
    const wuxing = patternAnalysis?.wuxing?.user || 'earth';
    const wuxingTone = WUXING_TONE_MAP[wuxing] || WUXING_TONE_MAP['earth'];
    const ambientMapping = WUXING_AMBIENT_MAPPING[wuxing];
    
    return `你是一位东方哲学环境音场景策展人。根据情绪状态推荐环境声音场景（非音乐歌曲）。

## 核心理念
不推荐具体歌曲，而是推荐「环境声音场景」，如：
- 雨夜咖啡厅
- 竹林风声
- 海浪低鸣
- 山间溪流
- 寺庙钟声
这更契合东方哲学调性，也适合 Freesound 环境音库。

## 规则（护栏）
1. **场景导向**：推荐一个具体的环境场景，而非音乐风格
2. **Freesound友好**：输出的搜索词要适合 Freesound（英文，环境音关键词）
3. **东方意境**：中文描述要有东方哲学美感
4. **简洁有力**：场景名 ≤ 8 字，描述 ≤ 30 字

## 当前用户状态
- 五行属性: ${wuxing} (${wuxingTone.emotion})
- 推荐场景类型: ${baseRecommendation.sceneType} - ${baseRecommendation.sceneName}
- 五行建议: ${ambientMapping?.preference || '稳定、接地的环境音'}

## 五行环境音规则
- 金（悲）→ 空灵、悠远的声音（风、钟声）允许悲伤存在
- 木（怒）→ 流动、疏通的声音（溪流、风穿林）帮助疏导
- 火（躁）→ 清凉、沉静的声音（雨声、水波）帮助收敛
- 水（恐）→ 厚重、稳定的声音（海浪、低频环境）给予安全感
- 土（忧）→ 温暖、踏实的声音（壁炉、咖啡厅）提供陪伴

## 输出JSON格式（严格遵守）
{
  "scene_name": "场景名（≤8字，如：雨夜书房）",
  "freesound_query": "英文搜索词（如：rain cafe ambient loop）",
  "display_keywords": ["中文关键词1", "中文关键词2", "中文关键词3"],
  "vibe_desc": "一句话描述这个声音场景带来的感觉（≤30字）"
}`;
  }

  /**
   * 构建用户提示词
   */
  buildAmbientUserPrompt(moodData, baseRecommendation) {
    const emotionState = moodData?.emotion?.physical?.state || '平静';
    
    return `用户当前情绪: ${emotionState}
推荐的环境场景: ${baseRecommendation.sceneName} (${baseRecommendation.vibe})
参考关键词: ${baseRecommendation.keywords.join(', ')}

请生成个性化的环境音场景推荐，输出 Freesound 搜索词。`;
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
    
    const baseRecommendation = getAmbientRecommendation({
      wuxing,
      polarity,
      emotionIntensity
    });
    
    // 生成 Freesound 搜索词
    const freesoundQuery = generateFreesoundQuery(baseRecommendation);
    
    // 获取氛围描述
    const vibeDesc = getRandomSceneDescription(baseRecommendation.sceneType);
    
    const result = {
      sceneType: baseRecommendation.sceneType,
      scene_name: baseRecommendation.sceneName,
      keywords: baseRecommendation.keywords,
      vibe_desc: vibeDesc,
      freesound_query: freesoundQuery,
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
    if (!result || !result.freesound_query) {
      return { valid: false, reason: 'Missing freesound_query' };
    }
    
    if (!result.vibe_desc) {
      return { valid: false, reason: 'Missing vibe description' };
    }
    
    return { valid: true };
  }
}

export default MusicComposer;
