/**
 * 音乐知识库 - MusicComposer 的数据源
 * 
 * 不推荐具体歌曲（版权+个人口味）
 * 而是推荐「氛围关键词」，用户可以拿去搜索
 */

// 音乐氛围类型
export const MUSIC_MOODS = {
  soothe: {
    name: '舒缓',
    description: '适合需要放松、减压的状态',
    keywords: ['ambient', 'lo-fi', 'piano', 'acoustic', '轻音乐', '白噪音', '纯音乐'],
    bpm: '60-80',
    vibe: '舒缓、流动、不打扰',
    searchTips: '搜索 "lo-fi study" 或 "ambient relax"'
  },
  
  vent: {
    name: '释放',
    description: '适合需要宣泄、释放压力的状态',
    keywords: ['rock', 'metal', 'punk', 'electronic', '摇滚', '电子', '重金属'],
    bpm: '120-160',
    vibe: '释放、爆发、宣泄',
    searchTips: '搜索 "workout rock" 或 "energy electronic"'
  },
  
  focus: {
    name: '专注',
    description: '适合需要集中注意力的状态',
    keywords: ['instrumental', 'classical', 'jazz', '器乐', '古典', '爵士'],
    bpm: '90-110',
    vibe: '专注、稳定、不分心',
    searchTips: '搜索 "focus playlist" 或 "study classical"'
  },
  
  uplifting: {
    name: '明朗',
    description: '适合想要积极、振奋的状态',
    keywords: ['indie', 'pop', 'folk', '民谣', '独立', '流行'],
    bpm: '100-130',
    vibe: '轻快、明亮、有希望',
    searchTips: '搜索 "feel good playlist" 或 "indie folk"'
  },
  
  melancholic: {
    name: '陪伴',
    description: '适合想要被理解、陪伴的状态',
    keywords: ['blues', 'ballad', 'sad piano', '慢歌', '抒情', '伤感'],
    bpm: '50-70',
    vibe: '陪伴、共鸣、不假装',
    searchTips: '搜索 "sad songs" 或 "emotional ballad"'
  },
  
  calm: {
    name: '平静',
    description: '适合需要内心平静的状态',
    keywords: ['meditation', 'nature sounds', 'spa', '冥想', '自然', '水声'],
    bpm: '40-60',
    vibe: '平静、空灵、沉淀',
    searchTips: '搜索 "meditation music" 或 "nature ambient"'
  },
  
  cozy: {
    name: '温馨',
    description: '适合想要温暖、舒适的状态',
    keywords: ['cafe', 'bossa nova', 'jazz vocal', '咖啡厅', '爵士人声', '慵懒'],
    bpm: '70-90',
    vibe: '温暖、惬意、慵懒',
    searchTips: '搜索 "coffee shop jazz" 或 "cozy playlist"'
  },
  
  nostalgic: {
    name: '怀旧',
    description: '适合想要回忆、怀念的状态',
    keywords: ['80s', '90s', 'oldies', '经典老歌', '怀旧', '复古'],
    bpm: '80-110',
    vibe: '怀旧、温情、回忆',
    searchTips: '搜索 "80s hits" 或 "nostalgic songs"'
  }
};

// 五行-音乐类型映射
export const WUXING_MUSIC_MAPPING = {
  'wood': {
    primary: ['vent', 'uplifting'],    // 木-怒：疏导释放
    avoid: ['melancholic'],             // 避免加重情绪
    preference: '节奏感强，有疏导力的音乐'
  },
  'fire': {
    primary: ['soothe', 'calm'],        // 火-躁：收敛安定
    avoid: ['vent'],                     // 避免更加躁动
    preference: '舒缓清凉，帮助收敛的音乐'
  },
  'earth': {
    primary: ['cozy', 'focus'],         // 土-忧：踏实安心
    avoid: ['melancholic'],             // 避免加重忧虑
    preference: '温暖踏实，稳定心神的音乐'
  },
  'metal': {
    primary: ['melancholic', 'calm'],   // 金-悲：允许悲伤
    avoid: ['uplifting'],               // 不强行积极
    preference: '允许悲伤存在，陪伴而非驱赶'
  },
  'water': {
    primary: ['calm', 'soothe'],        // 水-恐：稳定安心
    avoid: ['vent'],                     // 避免增加不安
    preference: '深沉稳定，如海一般包容的音乐'
  }
};

// 极性-音乐调整
export const POLARITY_MUSIC_ADJUSTMENT = {
  'positive': {
    prefer: ['uplifting', 'cozy'],
    description: '可以选择更明快、增强愉悦感的音乐'
  },
  'negative': {
    prefer: ['soothe', 'melancholic', 'calm'],
    description: '选择陪伴型音乐，不强行改变情绪'
  },
  'mixed': {
    prefer: ['focus', 'cozy'],
    description: '选择中性稳定的音乐，帮助理清思绪'
  }
};

// 情绪强度-BPM调整
export const INTENSITY_BPM_ADJUSTMENT = {
  high: { preferBpm: '50-80', reason: '情绪强烈时，慢节奏帮助沉淀' },
  medium: { preferBpm: '70-100', reason: '情绪适中，节奏可以灵活' },
  low: { preferBpm: '90-130', reason: '情绪平稳，可以选择更有活力的节奏' }
};

// 获取音乐推荐
export function getMusicRecommendation(conditions) {
  const { wuxing, polarity, emotionIntensity } = conditions;
  
  // 获取五行对应的音乐类型
  const wuxingMapping = WUXING_MUSIC_MAPPING[wuxing] || WUXING_MUSIC_MAPPING['earth'];
  const polarityAdjust = POLARITY_MUSIC_ADJUSTMENT[polarity] || POLARITY_MUSIC_ADJUSTMENT['mixed'];
  
  // 合并优先类型
  const preferTypes = [...new Set([...wuxingMapping.primary, ...polarityAdjust.prefer])];
  
  // 过滤掉需要避免的
  const filteredTypes = preferTypes.filter(type => !wuxingMapping.avoid.includes(type));
  
  // 选择第一个可用的类型
  const selectedType = filteredTypes[0] || 'soothe';
  const musicMood = MUSIC_MOODS[selectedType];
  
  // 根据情绪强度调整BPM建议
  let intensityLevel = 'medium';
  if (emotionIntensity > 0.7) intensityLevel = 'high';
  else if (emotionIntensity < 0.4) intensityLevel = 'low';
  
  const bpmAdjust = INTENSITY_BPM_ADJUSTMENT[intensityLevel];
  
  return {
    moodType: selectedType,
    ...musicMood,
    adjustedBpm: bpmAdjust.preferBpm,
    bpmReason: bpmAdjust.reason,
    wuxingNote: wuxingMapping.preference,
    polarityNote: polarityAdjust.description
  };
}

// 生成搜索关键词组合
export function generateSearchKeywords(musicMood, count = 4) {
  const allKeywords = [...musicMood.keywords];
  
  // 随机打乱并取前N个
  const shuffled = allKeywords.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// 生成氛围描述
export const VIBE_DESCRIPTIONS = {
  soothe: [
    '像雨天窗边的咖啡香',
    '如轻风拂过水面',
    '像午后阳光洒在床单上',
    '如远山的薄雾',
  ],
  vent: [
    '让心跳和节奏同频',
    '像暴风雨前的闪电',
    '如引擎全速启动',
    '让能量找到出口',
  ],
  focus: [
    '思绪如流水般清澈',
    '像图书馆里的宁静',
    '如深夜书桌前的灯光',
    '专注的力量在聚集',
  ],
  uplifting: [
    '像第一缕晨光',
    '如春天的第一朵花',
    '像孩子的笑声',
    '希望在心里发芽',
  ],
  melancholic: [
    '不假装开心也可以',
    '悲伤有时也是一种休息',
    '像旧照片里的光影',
    '让眼泪流一会儿',
  ],
  calm: [
    '如山中的寺庙',
    '像清晨的第一口呼吸',
    '如星空下的湖面',
    '内心的湖面渐渐平静',
  ],
  cozy: [
    '像壁炉前的毛毯',
    '如熟悉的味道',
    '像老朋友的拥抱',
    '温暖从心底升起',
  ],
  nostalgic: [
    '像翻开旧相册',
    '如熟悉的旋律',
    '像回到那个夏天',
    '记忆里的温度',
  ],
};

// 随机获取一个氛围描述
export function getRandomVibeDescription(moodType) {
  const descriptions = VIBE_DESCRIPTIONS[moodType] || VIBE_DESCRIPTIONS['soothe'];
  return descriptions[Math.floor(Math.random() * descriptions.length)];
}

export default {
  MUSIC_MOODS,
  WUXING_MUSIC_MAPPING,
  POLARITY_MUSIC_ADJUSTMENT,
  INTENSITY_BPM_ADJUSTMENT,
  getMusicRecommendation,
  generateSearchKeywords,
  getRandomVibeDescription,
};
