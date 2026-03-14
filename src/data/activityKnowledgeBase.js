/**
 * 活动知识库 - ActivityComposer 的数据源
 * 
 * 活动按类型分类，每个活动包含：
 * - id: 唯一标识
 * - name: 活动名称
 * - duration: 建议时长
 * - intensity: 强度 (low/medium/high)
 * - desc: 简短描述
 * - icon: 展示图标
 * - conditions: 适用条件
 */

// 活动分类
export const ACTIVITY_CATEGORIES = {
  // 躯体释放型 - 适合躯体张力高、需要动起来
  bodyRelease: {
    name: '躯体释放',
    description: '通过身体动作释放压力',
    matchConditions: {
      somaticTension: { min: 0.6 }, // 躯体张力高时优先
      demandDirection: ['vent', 'release'] // 诉求是发泄/释放
    },
    activities: [
      { 
        id: 'walk', 
        name: '散步', 
        duration: '15-30分钟', 
        intensity: 'low',
        desc: '不带目的地走走', 
        icon: '🚶',
        keywords: ['走路', '散心', '透气']
      },
      { 
        id: 'stretch', 
        name: '拉伸', 
        duration: '10分钟', 
        intensity: 'low',
        desc: '简单的身体舒展', 
        icon: '🧘',
        keywords: ['伸展', '放松', '肌肉']
      },
      { 
        id: 'dance', 
        name: '随便动动', 
        duration: '5-10分钟', 
        intensity: 'medium',
        desc: '跟着音乐摇摆', 
        icon: '💃',
        keywords: ['跳舞', '摇摆', '节奏']
      },
      { 
        id: 'clean', 
        name: '收拾一小块地方', 
        duration: '10-15分钟', 
        intensity: 'low',
        desc: '整理书桌或一个抽屉', 
        icon: '🧹',
        keywords: ['整理', '收拾', '清洁']
      },
    ]
  },

  // 感官沉浸型 - 适合认知负荷高、需要放空
  sensoryImmersion: {
    name: '感官沉浸',
    description: '通过感官体验让大脑休息',
    matchConditions: {
      cognitiveLoad: { min: 0.6 }, // 认知负荷高时优先
      demandDirection: ['escape', 'rest'] // 诉求是逃离/休息
    },
    activities: [
      { 
        id: 'bath', 
        name: '泡澡/泡脚', 
        duration: '20-30分钟', 
        intensity: 'low',
        desc: '温水包裹全身', 
        icon: '🛁',
        keywords: ['洗澡', '热水', '放松']
      },
      { 
        id: 'aromatherapy', 
        name: '闻香', 
        duration: '5分钟', 
        intensity: 'low',
        desc: '点一支喜欢的香', 
        icon: '🕯️',
        keywords: ['香薰', '精油', '气味']
      },
      { 
        id: 'sunbath', 
        name: '晒太阳', 
        duration: '15分钟', 
        intensity: 'low',
        desc: '让阳光洒在身上', 
        icon: '☀️',
        keywords: ['阳光', '户外', '温暖']
      },
      { 
        id: 'tea', 
        name: '泡一杯茶', 
        duration: '10分钟', 
        intensity: 'low',
        desc: '慢慢地泡，慢慢地喝', 
        icon: '🍵',
        keywords: ['喝茶', '饮品', '温暖']
      },
    ]
  },

  // 创造表达型 - 适合情绪需要出口
  creativeExpression: {
    name: '创造表达',
    description: '通过创作输出情绪',
    matchConditions: {
      emotionIntensity: { min: 0.5 }, // 情绪有一定强度
      demandDirection: ['express', 'vent'] // 诉求是表达/发泄
    },
    activities: [
      { 
        id: 'journal', 
        name: '随手写', 
        duration: '10分钟', 
        intensity: 'low',
        desc: '写下此刻的想法', 
        icon: '📝',
        keywords: ['日记', '写作', '记录']
      },
      { 
        id: 'doodle', 
        name: '涂鸦', 
        duration: '15分钟', 
        intensity: 'low',
        desc: '画画圈圈线条', 
        icon: '🎨',
        keywords: ['画画', '涂色', '创作']
      },
      { 
        id: 'voice', 
        name: '录一段话', 
        duration: '5分钟', 
        intensity: 'low',
        desc: '对着手机说说', 
        icon: '🎤',
        keywords: ['说话', '倾诉', '录音']
      },
      { 
        id: 'playlist', 
        name: '做一个歌单', 
        duration: '15分钟', 
        intensity: 'low',
        desc: '收集此刻想听的歌', 
        icon: '🎵',
        keywords: ['音乐', '歌单', '收藏']
      },
    ]
  },

  // 人际连接型 - 适合社交倾向外向
  socialConnection: {
    name: '人际连接',
    description: '通过人际互动获得支持',
    matchConditions: {
      socialTendency: { min: 0.5 }, // 社交倾向偏外向
      demandDirection: ['connect', 'share'] // 诉求是连接/分享
    },
    activities: [
      { 
        id: 'call', 
        name: '打个电话', 
        duration: '10-20分钟', 
        intensity: 'medium',
        desc: '联系一个想念的人', 
        icon: '📞',
        keywords: ['电话', '聊天', '联系']
      },
      { 
        id: 'message', 
        name: '发条消息', 
        duration: '2分钟', 
        intensity: 'low',
        desc: '告诉某人你想ta了', 
        icon: '💬',
        keywords: ['微信', '消息', '问候']
      },
      { 
        id: 'hug', 
        name: '抱一抱', 
        duration: '1分钟', 
        intensity: 'low',
        desc: '和身边的人/宠物', 
        icon: '🤗',
        keywords: ['拥抱', '接触', '温暖']
      },
      { 
        id: 'share', 
        name: '分享此刻', 
        duration: '5分钟', 
        intensity: 'low',
        desc: '发一条朋友圈/状态', 
        icon: '📱',
        keywords: ['分享', '朋友圈', '记录']
      },
    ]
  },

  // 静默内观型 - 适合需要安定
  quietReflection: {
    name: '静默内观',
    description: '通过静默让内心沉淀',
    matchConditions: {
      emotionIntensity: { max: 0.7 }, // 情绪强度不能太高
      demandDirection: ['calm', 'rest', 'quiet'] // 诉求是平静/休息/安静
    },
    activities: [
      { 
        id: 'breathe', 
        name: '深呼吸', 
        duration: '3分钟', 
        intensity: 'low',
        desc: '4-7-8呼吸法', 
        icon: '🌬️',
        keywords: ['呼吸', '冥想', '放松']
      },
      { 
        id: 'window', 
        name: '发呆看窗外', 
        duration: '10分钟', 
        intensity: 'low',
        desc: '什么都不用想', 
        icon: '🪟',
        keywords: ['发呆', '放空', '休息']
      },
      { 
        id: 'sleep', 
        name: '小睡', 
        duration: '20分钟', 
        intensity: 'low',
        desc: '允许自己休息', 
        icon: '😴',
        keywords: ['睡觉', '休息', '躺']
      },
      { 
        id: 'nature', 
        name: '听自然声音', 
        duration: '10分钟', 
        intensity: 'low',
        desc: '雨声、海浪、鸟鸣', 
        icon: '🌿',
        keywords: ['白噪音', '自然', '声音']
      },
    ]
  },
};

// 五行-活动类型优先级映射
export const WUXING_ACTIVITY_PRIORITY = {
  'wood': ['bodyRelease', 'creativeExpression', 'socialConnection'], // 木-怒：疏导释放
  'fire': ['sensoryImmersion', 'quietReflection', 'creativeExpression'], // 火-躁：收敛安定
  'earth': ['quietReflection', 'sensoryImmersion', 'socialConnection'], // 土-忧：踏实安心
  'metal': ['quietReflection', 'sensoryImmersion', 'creativeExpression'], // 金-悲：接纳允许
  'water': ['sensoryImmersion', 'quietReflection', 'bodyRelease'], // 水-恐：流动顺应
};

// 获取所有活动的扁平列表
export function getAllActivities() {
  const activities = [];
  Object.values(ACTIVITY_CATEGORIES).forEach(category => {
    category.activities.forEach(activity => {
      activities.push({
        ...activity,
        category: category.name
      });
    });
  });
  return activities;
}

// 根据条件筛选活动
export function filterActivities(conditions) {
  const { wuxing, polarity, emotionIntensity, cognitiveLoad, somaticTension, socialTendency, demandDirection } = conditions;
  
  // 获取五行优先的活动类型
  const priorityCategories = WUXING_ACTIVITY_PRIORITY[wuxing] || ['quietReflection', 'sensoryImmersion'];
  
  const candidates = [];
  
  priorityCategories.forEach((categoryKey, priority) => {
    const category = ACTIVITY_CATEGORIES[categoryKey];
    if (!category) return;
    
    category.activities.forEach(activity => {
      let score = 10 - priority * 2; // 基础分：越靠前优先级越高
      
      // 根据条件调整分数
      if (categoryKey === 'bodyRelease' && somaticTension > 0.6) score += 3;
      if (categoryKey === 'sensoryImmersion' && cognitiveLoad > 0.6) score += 3;
      if (categoryKey === 'socialConnection' && socialTendency > 0.5) score += 2;
      if (categoryKey === 'quietReflection' && emotionIntensity > 0.7) score += 2;
      
      // 极性调整
      if (polarity === 'negative' && activity.intensity === 'low') score += 1;
      if (polarity === 'positive' && activity.intensity === 'medium') score += 1;
      
      candidates.push({
        ...activity,
        category: category.name,
        score
      });
    });
  });
  
  // 按分数排序，返回前3个
  return candidates.sort((a, b) => b.score - a.score).slice(0, 3);
}

export default {
  ACTIVITY_CATEGORIES,
  WUXING_ACTIVITY_PRIORITY,
  getAllActivities,
  filterActivities
};
