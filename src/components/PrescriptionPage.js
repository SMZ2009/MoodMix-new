import React, { useState, useRef, useEffect } from 'react';
import { X, Flame, Music, Wine, Sparkles, ChevronRight, Check, Play, Pause, Loader } from 'lucide-react';
import { generatePhilosophyTags } from '../engine/philosophyTags';

// 占位今日色数据
const DEFAULT_TODAY_COLOR = {
  hex: '#B8C9D9',
  name: '雾蓝',
  desc: '静而不沉'
};

const PrescriptionPage = ({
  isOpen,
  onClose,
  todayColor = DEFAULT_TODAY_COLOR,
  quoteContent = null,
  sentenceContent = null,  // 每日心理锚点句
  drinkRecommendation = null,
  moodContext = null,  // 情绪上下文 { moodData, patternAnalysis }
  activityRecommendation = null,
  musicRecommendation = null,
  isHistoryView = false,
  onSave,
  onDrinkClick,  // 点击饮品卡跳转详情页
}) => {
  const handleSave = () => {
    if (onSave) {
      onSave();
    } else {
      alert('功能开发中，敬请期待');
    }
  };

  // 计算文字颜色（根据背景色亮度）
  const getContrastColor = (hexColor) => {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? 'dark' : 'light';
  };

  const textTheme = getContrastColor(todayColor.hex);
  const textColor = textTheme === 'dark' ? 'text-gray-800' : 'text-white';
  const textColorMuted = textTheme === 'dark' ? 'text-gray-600' : 'text-white/70';
  const iconColor = textTheme === 'dark' ? 'text-gray-600' : 'text-white/80';

  // 今日色的浅色版本（用于卡片背景）
  const hexToRgba = (hex, alpha) => {
    const h = hex.replace('#', '');
    const r = parseInt(h.substr(0, 2), 16);
    const g = parseInt(h.substr(2, 2), 16);
    const b = parseInt(h.substr(4, 2), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // 计算颜色亮度，返回0-1
  const getLuminance = (hex) => {
    const h = hex.replace('#', '');
    const r = parseInt(h.substr(0, 2), 16);
    const g = parseInt(h.substr(2, 2), 16);
    const b = parseInt(h.substr(4, 2), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  };

  // 加深颜色，用于浅色背景上的文字
  const darkenColor = (hex, factor = 0.4) => {
    const h = hex.replace('#', '');
    const r = Math.round(parseInt(h.substr(0, 2), 16) * factor);
    const g = Math.round(parseInt(h.substr(2, 2), 16) * factor);
    const b = Math.round(parseInt(h.substr(4, 2), 16) * factor);
    return `rgb(${r}, ${g}, ${b})`;
  };

  const cardBgColor = hexToRgba(todayColor.hex, 0.15);  // 15% 透明度背景
  const cardBorderColor = hexToRgba(todayColor.hex, 0.3); // 30% 透明度边框
  const accentColor = todayColor.hex; // 实色用于按钮

  // 卡片内文字颜色：如果今日色太浅，使用加深版本以保证可读性
  const colorLuminance = getLuminance(todayColor.hex);
  const cardTextColor = colorLuminance > 0.55 ? darkenColor(todayColor.hex, 0.45) : todayColor.hex;

  if (!isOpen) return null;

  // 一句话内容
  const quoteText = sentenceContent || quoteContent;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-white"
      style={{ animation: 'slideUpFadeIn 0.4s ease-out' }}
    >
      {/* ========== 全屏固定容器 ========== */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* ========== 今日色区域（内容自适应 + 一句话）========== */}
        <div
          className="flex flex-col items-center px-6 relative flex-shrink-0"
          style={{ backgroundColor: todayColor.hex, paddingTop: '16px', paddingBottom: '12px' }}
        >
          {/* 关闭按钮 */}
          <button
            onClick={onClose}
            className={`absolute top-4 left-4 p-2 
                       rounded-full hover:bg-black/10 transition-colors ${iconColor}`}
            aria-label="关闭"
          >
            <X size={18} />
          </button>

          {/* 颜色名称（24px，宋体，居中） */}
          <h1
            className={`text-xl tracking-[0.15em] ${textColor}`}
            style={{ fontFamily: '"Songti SC", "STKaiti", "KaiTi", serif', fontWeight: 600 }}
          >
            {todayColor.name}
          </h1>

          {/* 颜色描述（14px，副标题，居中） */}
          <span className={`text-xs mt-1 tracking-wider ${textColorMuted}`}>
            {todayColor.desc}
          </span>

          {/* 一句话（如果有） */}
          {quoteText && (
            <>
              {/* 细分隔线 */}
              <div
                className="w-6 mt-2 mb-2"
                style={{
                  height: '1px',
                  backgroundColor: textTheme === 'dark' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.2)'
                }}
              />
              {/* 一句话文本 */}
              <p
                className={`text-[13px] text-center leading-relaxed max-w-[240px] ${textColor}`}
                style={{
                  fontFamily: '"Songti SC", "STKaiti", "KaiTi", serif',
                  opacity: 0.85
                }}
              >
                "{quoteText}"
              </p>
            </>
          )}
        </div>

        {/* ========== 处方卡区域 ========== */}
        <div className="px-4 py-1.5 flex-1 overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.98)' }}>
          <div className="flex flex-col gap-2 h-full justify-between">
            {/* 活动卡 */}
            <ActivityCard
              data={activityRecommendation}
              cardBgColor={cardBgColor}
              cardBorderColor={cardBorderColor}
              accentColor={accentColor}
              cardTextColor={cardTextColor}
            />

            {/* 音乐卡 */}
            <MusicCard
              data={musicRecommendation}
              cardBgColor={cardBgColor}
              cardBorderColor={cardBorderColor}
              accentColor={accentColor}
              cardTextColor={cardTextColor}
            />

            {/* 饮品卡 */}
            <DrinkCard
              data={drinkRecommendation}
              moodContext={moodContext}
              cardBgColor={cardBgColor}
              cardBorderColor={cardBorderColor}
              accentColor={accentColor}
              cardTextColor={cardTextColor}
              onClick={() => onDrinkClick && drinkRecommendation && onDrinkClick(drinkRecommendation)}
            />
          </div>
        </div>
      </div>

      {/* ========== 底部按钮 ========== */}
      <div className="bg-white flex-shrink-0 px-6 py-4 border-t border-gray-100">
        <button
          onClick={handleSave}
          className="w-full h-12 rounded-full text-white font-medium shadow-lg active:scale-[0.98] transition-transform
                     flex items-center justify-center gap-2"
          style={{
            fontFamily: '"Songti SC", "STKaiti", "KaiTi", serif',
            backgroundColor: accentColor
          }}
        >
          <span>💾</span>
          <span>{isHistoryView ? '返回' : '保存今日处方'}</span>
        </button>
      </div>

      {/* 动画样式 */}
      <style>{`
        @keyframes slideUpFadeIn {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

// ========== 小仪式卡（3条仪式，纵向排列）==========
const ActivityCard = ({ data, cardBgColor, cardBorderColor, accentColor, cardTextColor }) => {
  // 根据内容推断仪式类型和图标
  const inferRitualType = (ritual) => {
    const text = (ritual.name || ritual.title || '') + (ritual.how || ritual.content || '');

    // 身体类
    if (/吃|喝|茶|咖啡|水|热|温|粥|汤|食/.test(text)) {
      return { icon: '🍵', typeName: '进食' };
    }
    if (/闻|香|气味|精油|檀|薰|熏/.test(text)) {
      return { icon: '🌿', typeName: '气味' };
    }

    // 空间类
    if (/方位|方向|朝|东|南|西|北|面向/.test(text)) {
      return { icon: '🧭', typeName: '方位' };
    }
    if (/摆|放|供|物|花|植|绿/.test(text)) {
      return { icon: '🪴', typeName: '供物' };
    }

    // 行为类
    if (/时|点|早|晚|午|分钟|小时/.test(text)) {
      return { icon: '⏰', typeName: '时机' };
    }
    if (/不要|避免|忌|少|别/.test(text)) {
      return { icon: '🚫', typeName: '禁忌' };
    }
    if (/整理|计划|写|记|想|呼吸|冥想|静|摸|触/.test(text)) {
      return { icon: '✨', typeName: '速效' };
    }

    // 默认
    return { icon: '🔮', typeName: '仪式' };
  };

  // 没数据时显示占位
  if (!data) {
    return (
      <div
        className="w-full rounded-2xl p-4 shadow-sm flex items-center justify-center"
        style={{
          backgroundColor: cardBgColor,
          borderWidth: '1px',
          borderColor: cardBorderColor,
          minHeight: '100px'
        }}
      >
        <div className="flex items-center gap-2">
          <Sparkles size={16} style={{ color: accentColor }} />
          <span className="text-gray-400 text-xs">小仪式生成中...</span>
        </div>
      </div>
    );
  }

  // 兼容数据结构：rituals数组 或 activities数组
  const rituals = data.rituals || data.activities || (data.name ? [data] : []);

  return (
    <div
      className="w-full rounded-2xl p-3.5 shadow-sm"
      style={{
        backgroundColor: cardBgColor,
        borderWidth: '1px',
        borderColor: cardBorderColor
      }}
    >
      {/* 头部：标题 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold" style={{ color: cardTextColor }}>今日小仪式</span>
        </div>
      </div>

      {/* 三条小仪式 */}
      <div className="flex flex-col gap-2">
        {rituals.map((ritual, index) => {
          const title = ritual.title || ritual.name || '仪式';
          const content = ritual.content || ritual.how || ritual.how_steps || '';
          const reason = ritual.reason || ritual.why_reason || ritual.why || '';

          return (
            <div
              key={index}
              className="rounded-lg p-2.5 flex flex-col"
              style={{ backgroundColor: 'rgba(255,255,255,0.45)' }}
            >
              <h4
                className="font-bold text-sm leading-tight text-gray-800"
                style={{ fontFamily: '"Songti SC", "STKaiti", "KaiTi", serif' }}
              >
                {title}
              </h4>
              {content && (
                <p className="text-[11px] mt-0.5 leading-snug text-gray-600">
                  {content}
                </p>
              )}
              {reason && (
                <p className="text-[10px] mt-1 leading-snug italic text-gray-400">
                  {reason}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ========== 音乐卡（环境音播放 + 网易云备用）==========
const MusicCard = ({ data, cardBgColor, cardBorderColor, accentColor, cardTextColor }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSound, setCurrentSound] = useState(null);
  const [error, setError] = useState(null);
  const audioRef = useRef(null);

  // 清理音频
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // 搜索并播放环境音
  const searchAndPlay = async () => {
    const query = data?.freesound_query || data?.search_term || 'rain ambient';

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/sounds/search?query=${encodeURIComponent(query)}&duration_min=30&duration_max=300`);
      const result = await res.json();

      if (!result.success || !result.results?.length) {
        throw new Error('未找到匹配的环境音');
      }

      const sound = result.results[0];
      if (!sound.previewUrl) {
        throw new Error('音频链接不可用');
      }

      setCurrentSound(sound);

      // 创建或复用 Audio 对象
      if (!audioRef.current) {
        audioRef.current = new Audio();
        audioRef.current.loop = true;
        audioRef.current.volume = 0.7;
      }

      audioRef.current.src = sound.previewUrl;
      await audioRef.current.play();
      setIsPlaying(true);

    } catch (err) {
      console.error('播放失败:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 切换播放/暂停
  const togglePlay = async () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else if (audioRef.current?.src) {
      await audioRef.current.play();
      setIsPlaying(true);
    } else {
      await searchAndPlay();
    }
  };

  // 加载中状态
  if (!data) {
    return (
      <div
        className="w-full rounded-2xl p-4 shadow-sm flex items-center justify-center"
        style={{
          backgroundColor: cardBgColor,
          borderWidth: '1px',
          borderColor: cardBorderColor,
          minHeight: '100px'
        }}
      >
        <div className="flex items-center gap-2">
          <Sparkles size={16} style={{ color: accentColor }} />
          <span className="text-gray-400">环境音推荐生成中...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full rounded-2xl p-4 shadow-sm"
      style={{
        backgroundColor: cardBgColor,
        borderWidth: '1px',
        borderColor: cardBorderColor
      }}
    >
      {/* 头部 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: cardBorderColor }}
          >
            <Music size={16} style={{ color: cardTextColor }} />
          </div>
          <span className="text-sm font-medium" style={{ color: cardTextColor }}>
            {data.scene_name || '环境音'}
          </span>
        </div>

        {/* 播放按钮 */}
        <button
          onClick={togglePlay}
          disabled={isLoading}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95"
          style={{
            backgroundColor: isPlaying ? accentColor : cardBorderColor,
            color: isPlaying ? '#fff' : accentColor
          }}
        >
          {isLoading ? (
            <Loader size={18} className="animate-spin" />
          ) : isPlaying ? (
            <Pause size={18} />
          ) : (
            <Play size={18} style={{ marginLeft: '2px' }} />
          )}
        </button>
      </div>

      {/* 氛围描述 */}
      {data.vibe_desc && (
        <p
          className="text-gray-700 text-sm leading-relaxed mb-3"
          style={{ fontFamily: '"Songti SC", "STKaiti", "KaiTi", serif' }}
        >
          {data.vibe_desc}
        </p>
      )}

      {/* 关键词标签 */}
      {data.keywords && data.keywords.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {data.keywords.slice(0, 4).map((keyword, i) => (
            <span
              key={i}
              className="text-xs px-2.5 py-1 rounded-full"
              style={{ backgroundColor: cardBorderColor, color: accentColor }}
            >
              {keyword}
            </span>
          ))}
        </div>
      )}

      {/* 当前播放信息 */}
      {currentSound && (
        <div className="text-xs text-gray-400 mb-2">
          正在播放: {currentSound.name} ({currentSound.duration}s)
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="text-xs text-red-400 mb-2">
          {error}
        </div>
      )}


    </div>
  );
};

// ========== 饮品卡（可点击跳转详情）==========
const DrinkCard = ({ data, moodContext, cardBgColor, cardBorderColor, accentColor, cardTextColor, onClick }) => {
  if (!data) {
    return (
      <div
        className="w-full rounded-2xl p-4 shadow-sm flex items-center justify-center"
        style={{
          backgroundColor: cardBgColor,
          borderWidth: '1px',
          borderColor: cardBorderColor,
          minHeight: '100px'
        }}
      >
        <div className="flex items-center gap-2">
          <Sparkles size={16} style={{ color: accentColor }} />
          <span className="text-gray-400">饮品推荐生成中...</span>
        </div>
      </div>
    );
  }

  const imageUrl = data.image || data.strDrinkThumb;
  const drinkName = data.name_cn || data.strDrink || data.name;

  // 生成饮品推荐语：优先用 matchReason，其次用 philosophy.quote（带上下文）
  const philosophy = data.dimensions ? generatePhilosophyTags(data.dimensions, moodContext, drinkName) : null;
  const recommendText = data.matchReason || data.reason || (philosophy?.quote) || '';

  return (
    <div
      className="w-full rounded-2xl shadow-sm overflow-hidden cursor-pointer transition-transform active:scale-[0.98] flex"
      style={{
        backgroundColor: cardBgColor,
        borderWidth: '1px',
        borderColor: cardBorderColor
      }}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      {/* 左侧饮品图片 */}
      {imageUrl && (
        <div
          className="w-28 flex-shrink-0 bg-cover bg-center rounded-l-2xl"
          style={{ backgroundImage: `url(${imageUrl})` }}
        />
      )}

      {/* 右侧饮品信息 */}
      <div className="flex-1 p-3 flex flex-col justify-center min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: cardBorderColor }}
          >
            <Wine size={12} style={{ color: cardTextColor }} />
          </div>
          <span className="text-xs font-medium" style={{ color: cardTextColor }}>今日饮品</span>
          <ChevronRight size={14} className="text-gray-400 ml-auto flex-shrink-0" />
        </div>

        <h3
          className="font-bold text-gray-800 text-base leading-tight truncate"
          style={{ fontFamily: '"Songti SC", "STKaiti", "KaiTi", serif' }}
        >
          {drinkName}
        </h3>

        {/* 饮品推荐语 */}
        {recommendText && (
          <p
            className="text-xs text-gray-500 mt-1 leading-snug line-clamp-2"
            style={{ fontFamily: '"Songti SC", "STKaiti", "KaiTi", serif' }}
          >
            {recommendText}
          </p>
        )}

        {/* 哲学标签 */}
        {(data.philosophy_tags || philosophy?.tags) && (
          <div className="mt-2 flex flex-wrap gap-1">
            {(data.philosophy_tags || philosophy?.tags || []).slice(0, 2).map((tag, i) => (
              <span
                key={i}
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ backgroundColor: cardBorderColor, color: accentColor }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PrescriptionPage;
