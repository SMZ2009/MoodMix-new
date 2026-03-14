/**
 * 环境音知识库 - MusicComposer 的数据源
 * 
 * 核心变化：不再推荐音乐歌曲，而是推荐「环境声音场景」
 * 适配 Freesound API（环境音/音效库）
 * 
 * 场景类型：雨声、自然、城市、室内、冥想等
 */

// ═══════════════════════════════════════════
// 环境音场景类型
// ═══════════════════════════════════════════
export const AMBIENT_SCENES = {
  rain: {
    name: '雨声',
    sceneName: '雨夜窗边',
    description: '各种雨声场景，从细雨到暴雨',
    keywords: ['雨声', '雨夜', '窗外', '滴答'],
    freesoundTags: ['rain', 'rainfall', 'storm', 'thunder'],
    vibe: '洗涤心灵的雨声',
    searchTips: 'rain ambient, rainfall loop'
  },
  
  nature: {
    name: '自然',
    sceneName: '山林溪涧',
    description: '森林、溪流、鸟鸣等自然声',
    keywords: ['溪流', '鸟鸣', '森林', '山风'],
    freesoundTags: ['forest', 'stream', 'birds', 'nature', 'creek'],
    vibe: '回归自然的宁静',
    searchTips: 'forest stream, nature ambience'
  },
  
  ocean: {
    name: '海洋',
    sceneName: '海浪低鸣',
    description: '海浪、沙滩、海风声',
    keywords: ['海浪', '沙滩', '海风', '潮汐'],
    freesoundTags: ['ocean', 'waves', 'beach', 'sea'],
    vibe: '如海般包容的深沉',
    searchTips: 'ocean waves, beach ambient'
  },
  
  cafe: {
    name: '咖啡厅',
    sceneName: '静谧咖啡角',
    description: '咖啡厅背景音、轻柔人声',
    keywords: ['咖啡厅', '低语', '杯碟', '温馨'],
    freesoundTags: ['cafe', 'coffee shop', 'restaurant', 'crowd'],
    vibe: '城市中的温暖角落',
    searchTips: 'coffee shop ambient, cafe atmosphere'
  },
  
  night: {
    name: '夜晚',
    sceneName: '深夜虫鸣',
    description: '夜晚环境音、蟋蟀、蛙鸣',
    keywords: ['夜晚', '蟋蟀', '星空', '寂静'],
    freesoundTags: ['night', 'crickets', 'evening', 'insects'],
    vibe: '夜的宁静与深邃',
    searchTips: 'night ambient, crickets loop'
  },
  
  meditation: {
    name: '冥想',
    sceneName: '禅境空灵',
    description: '钟声、颂钵、空灵音效',
    keywords: ['钟声', '颂钵', '禅意', '空灵'],
    freesoundTags: ['meditation', 'singing bowl', 'bells', 'zen'],
    vibe: '内心的平静湖面',
    searchTips: 'meditation bells, singing bowl'
  },
  
  fire: {
    name: '火焰',
    sceneName: '壁炉暖意',
    description: '壁炉声、篝火、木柴燃烧',
    keywords: ['壁炉', '篝火', '温暖', '木柴'],
    freesoundTags: ['fireplace', 'campfire', 'fire', 'crackling'],
    vibe: '炉火旁的温暖陪伴',
    searchTips: 'fireplace crackling, campfire loop'
  },
  
  wind: {
    name: '风声',
    sceneName: '竹林风语',
    description: '风声、竹林、树叶沙沙',
    keywords: ['风声', '竹林', '树叶', '微风'],
    freesoundTags: ['wind', 'bamboo', 'leaves', 'breeze'],
    vibe: '风过无痕的自在',
    searchTips: 'wind through trees, bamboo wind'
  },
  
  thunder: {
    name: '雷雨',
    sceneName: '雷霆洗礼',
    description: '雷声、暴风雨、大雨',
    keywords: ['雷声', '暴雨', '风暴', '闪电'],
    freesoundTags: ['thunder', 'thunderstorm', 'storm', 'heavy rain'],
    vibe: '雷雨后的清新',
    searchTips: 'thunderstorm, thunder rain'
  },
  
  urban: {
    name: '城市',
    sceneName: '城市脉动',
    description: '城市白噪音、交通声、都市环境',
    keywords: ['城市', '街道', '车流', '脉动'],
    freesoundTags: ['city', 'traffic', 'urban', 'street'],
    vibe: '城市的低频心跳',
    searchTips: 'city ambience, urban soundscape'
  }
};

// ═══════════════════════════════════════════
// 五行-环境音类型映射
// ═══════════════════════════════════════════
export const WUXING_AMBIENT_MAPPING = {
  'wood': {
    primary: ['nature', 'wind'],       // 木-怒：流动疏通
    secondary: ['thunder'],            // 强烈情绪可用雷雨
    avoid: [],
    preference: '流动、疏通的自然声，帮助气机通畅'
  },
  'fire': {
    primary: ['rain', 'ocean'],        // 火-躁：清凉沉静
    secondary: ['meditation'],
    avoid: ['fire', 'thunder'],        // 避免更加燥热
    preference: '清凉、沉静的水声，帮助收敛心火'
  },
  'earth': {
    primary: ['cafe', 'fire'],         // 土-忧：温暖踏实
    secondary: ['night'],
    avoid: [],
    preference: '温暖、踏实的环境音，提供安心陪伴'
  },
  'metal': {
    primary: ['wind', 'meditation'],   // 金-悲：空灵悠远
    secondary: ['night'],
    avoid: [],
    preference: '空灵、悠远的声音，允许悲伤存在'
  },
  'water': {
    primary: ['ocean', 'rain'],        // 水-恐：深沉稳定
    secondary: ['fire'],               // 壁炉提供安全感
    avoid: ['thunder'],                // 避免增加不安
    preference: '深沉、包容的声音，如海一般给予安全感'
  }
};

// ═══════════════════════════════════════════
// 极性-场景调整
// ═══════════════════════════════════════════
export const POLARITY_AMBIENT_ADJUSTMENT = {
  'positive': {
    prefer: ['nature', 'cafe'],
    description: '可以选择更明快、轻盈的环境音'
  },
  'negative': {
    prefer: ['rain', 'ocean', 'meditation'],
    description: '选择陪伴型环境音，不强行改变情绪'
  },
  'mixed': {
    prefer: ['night', 'fire'],
    description: '选择中性稳定的环境音，帮助沉淀思绪'
  }
};

// ═══════════════════════════════════════════
// 获取环境音推荐
// ═══════════════════════════════════════════
export function getAmbientRecommendation(conditions) {
  const { wuxing, polarity, emotionIntensity } = conditions;
  
  // 获取五行对应的场景类型
  const wuxingMapping = WUXING_AMBIENT_MAPPING[wuxing] || WUXING_AMBIENT_MAPPING['earth'];
  const polarityAdjust = POLARITY_AMBIENT_ADJUSTMENT[polarity] || POLARITY_AMBIENT_ADJUSTMENT['mixed'];
  
  // 合并优先类型
  const preferTypes = [...new Set([...wuxingMapping.primary, ...polarityAdjust.prefer])];
  
  // 过滤掉需要避免的
  const filteredTypes = preferTypes.filter(type => !wuxingMapping.avoid?.includes(type));
  
  // 高强度情绪时，考虑使用secondary选项
  let selectedType;
  if (emotionIntensity > 0.7 && wuxingMapping.secondary?.length > 0) {
    selectedType = wuxingMapping.secondary[0];
  } else {
    selectedType = filteredTypes[0] || 'rain';
  }
  
  const scene = AMBIENT_SCENES[selectedType];
  
  return {
    sceneType: selectedType,
    sceneName: scene.sceneName,
    ...scene,
    wuxingNote: wuxingMapping.preference,
    polarityNote: polarityAdjust.description
  };
}

// ═══════════════════════════════════════════
// 生成 Freesound 搜索词
// ═══════════════════════════════════════════
export function generateFreesoundQuery(recommendation) {
  const scene = AMBIENT_SCENES[recommendation.sceneType];
  if (!scene) return 'ambient nature loop';
  
  // 从 freesoundTags 中随机选择2-3个组合
  const tags = scene.freesoundTags;
  const shuffled = [...tags].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, 2);
  
  // 添加 ambient/loop 后缀提高质量
  return `${selected.join(' ')} ambient loop`;
}

// ═══════════════════════════════════════════
// 场景描述库
// ═══════════════════════════════════════════
export const SCENE_DESCRIPTIONS = {
  rain: [
    '雨滴敲打窗棂的温柔',
    '被雨声包裹的安全感',
    '雨夜里最好的陪伴',
    '洗涤一切的雨声',
  ],
  nature: [
    '山林间的清新呼吸',
    '溪水流过心田',
    '鸟鸣唤醒的宁静',
    '回归自然的片刻',
  ],
  ocean: [
    '海浪拍岸的节奏',
    '如海般深沉的包容',
    '潮起潮落间的永恒',
    '海风带走所有杂念',
  ],
  cafe: [
    '咖啡香里的温暖',
    '城市中的避风港',
    '杯碟轻响的惬意',
    '熟悉的温馨角落',
  ],
  night: [
    '夜的寂静与深邃',
    '星空下的独处时光',
    '虫鸣陪伴的夜晚',
    '黑夜给予的宁静',
  ],
  meditation: [
    '钟声唤醒内在宁静',
    '颂钵的余韵绵长',
    '心如止水的片刻',
    '内观的宁静时分',
  ],
  fire: [
    '炉火旁的温暖时光',
    '木柴燃烧的噼啪声',
    '被火光温柔包围',
    '最原始的温暖陪伴',
  ],
  wind: [
    '风穿过竹林的声音',
    '树叶沙沙的低语',
    '风过无痕的自在',
    '随风而去的烦恼',
  ],
  thunder: [
    '雷雨后的清新空气',
    '大自然的力量洗礼',
    '暴风雨中的宣泄',
    '电闪雷鸣的震撼',
  ],
  urban: [
    '城市的低频心跳',
    '都市脉动中的片刻',
    '熟悉的街道声音',
    '城市人的白噪音',
  ],
};

// 随机获取一个场景描述
export function getRandomSceneDescription(sceneType) {
  const descriptions = SCENE_DESCRIPTIONS[sceneType] || SCENE_DESCRIPTIONS['rain'];
  return descriptions[Math.floor(Math.random() * descriptions.length)];
}

// ═══════════════════════════════════════════
// 兼容旧 API（保持向后兼容）
// ═══════════════════════════════════════════
export const MUSIC_MOODS = AMBIENT_SCENES;
export const WUXING_MUSIC_MAPPING = WUXING_AMBIENT_MAPPING;
export const getMusicRecommendation = getAmbientRecommendation;
export const generateSearchKeywords = (rec, count = 4) => {
  return (rec.keywords || []).slice(0, count);
};
export const getRandomVibeDescription = getRandomSceneDescription;

export default {
  AMBIENT_SCENES,
  WUXING_AMBIENT_MAPPING,
  POLARITY_AMBIENT_ADJUSTMENT,
  getAmbientRecommendation,
  generateFreesoundQuery,
  getRandomSceneDescription,
  // 兼容旧 API
  MUSIC_MOODS,
  WUXING_MUSIC_MAPPING,
  getMusicRecommendation,
  generateSearchKeywords,
  getRandomVibeDescription,
};
