import React, { useState, useEffect } from 'react';
import { ArrowUp, Loader2 } from 'lucide-react';

const MOOD_INPUT_PLACEHOLDERS = [
  '比如，心里有点空，又说不清为什么…',
  '比如，平静，但隐隐有些期待…',
  '比如，莫名烦躁，什么都不想做…',
  '比如，老板又给我加薪了...'
];

const MoodInputBar = ({ 
  value, 
  onChange, 
  onSubmit, 
  quickTags = [
    { label: '放松', value: '#放松' },
    { label: '浪漫', value: '#浪漫' },
    { label: '难受', value: '#难受' }
  ],
  selectedTag,
  onTagSelect,
  isLoading = false,
  disabled = false
}) => {
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  // 轮播占位符文本
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setPlaceholderIndex((current) => (current + 1) % MOOD_INPUT_PLACEHOLDERS.length);
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const handleSubmit = () => {
    if (!isLoading && !disabled && (value?.trim() || selectedTag)) {
      onSubmit();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-white/95 via-white/90 to-transparent pt-6">
      {/* 快捷标签行 */}
      <div className="flex gap-2 px-4 pb-3 justify-center">
        {quickTags.map((tag) => {
          const isSelected = selectedTag === tag.value;
          return (
            <button
              key={tag.value}
              type="button"
              onClick={() => onTagSelect(isSelected ? null : tag.value)}
              className={`mood-ink-tag ${isSelected ? 'is-selected' : ''}`}
              aria-pressed={isSelected}
              style={{
                '--mood-ink-color': isSelected ? 'rgba(224, 197, 110, 0.24)' : 'rgba(104, 114, 120, 0.2)',
                '--mood-ink-accent': isSelected ? 'rgba(204, 172, 74, 0.82)' : 'rgba(72, 82, 89, 0.5)'
              }}
            >
              <span className={`mood-ink-tag__label ${isSelected ? 'is-selected' : ''}`}>
                {tag.label}
              </span>
            </button>
          );
        })}
      </div>
      
      {/* 胶囊输入框 */}
      <div className="px-4 pb-[calc(env(safe-area-inset-bottom,0px)+16px)]">
        <div 
          className="flex items-center h-12 bg-white/90 backdrop-blur-xl 
                     rounded-full border border-gray-200/60 shadow-lg px-4
                     focus-within:border-amber-300/60 focus-within:shadow-amber-100/50 transition-all"
          style={{
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
          }}
        >
          {/* 输入框 */}
          <div className="flex-1 relative">
            {!value && (
              <span
                className="absolute inset-y-0 left-0 flex items-center text-gray-400 text-sm pointer-events-none"
                style={{ fontFamily: '"Songti SC", "STKaiti", "KaiTi", serif' }}
              >
                {MOOD_INPUT_PLACEHOLDERS[placeholderIndex]}
              </span>
            )}
            <input
              className="bg-transparent border-none focus:outline-none focus:ring-0 
                         w-full text-sm text-gray-800 h-full"
              style={{ fontFamily: '"Songti SC", "STKaiti", "KaiTi", serif' }}
              placeholder=""
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading || disabled}
            />
          </div>

          {/* 发送按钮 */}
          <button 
            onClick={handleSubmit}
            disabled={isLoading || disabled || (!value?.trim() && !selectedTag)}
            className={`w-9 h-9 flex items-center justify-center rounded-full ml-2
                       transition-all duration-200 flex-shrink-0
                       ${(value?.trim() || selectedTag) && !isLoading && !disabled
                         ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-md hover:shadow-lg hover:scale-105 active:scale-95' 
                         : 'bg-gray-100 cursor-not-allowed'}`}
            aria-label="发送"
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin text-gray-400" />
            ) : (
              <ArrowUp 
                size={16} 
                className={`${(value?.trim() || selectedTag) ? 'text-white' : 'text-gray-400'}`}
              />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MoodInputBar;
