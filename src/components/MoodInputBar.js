import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowUp, Loader2, Keyboard, Mic } from 'lucide-react';

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
  const [inputMode, setInputMode] = useState('voice'); // 'voice' | 'text'
  const [isRecording, setIsRecording] = useState(false);
  const [interimText, setInterimText] = useState('');
  
  // Speech Recognition refs
  const recognitionRef = useRef(null);
  const isRecordingRef = useRef(false);
  const onChangeRef = useRef(onChange);
  const valueRef = useRef(value);

  // Keep refs in sync
  useEffect(() => {
    onChangeRef.current = onChange;
    valueRef.current = value;
  }, [onChange, value]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'zh-CN'; // Chinese language
      
      recognition.onresult = (event) => {
        let interim = '';
        let final = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcript;
          } else {
            interim += transcript;
          }
        }
        
        if (final) {
          // Append final result to existing value using ref for latest value
          const currentValue = valueRef.current || '';
          onChangeRef.current(currentValue + final);
          setInterimText('');
        } else {
          setInterimText(interim);
        }
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          alert('请允许麦克风访问权限以使用语音输入功能');
        }
        setIsRecording(false);
        isRecordingRef.current = false;
        setInterimText('');
      };
      
      recognition.onend = () => {
        // Only restart if we're still supposed to be recording
        if (isRecordingRef.current) {
          try {
            recognition.start();
          } catch (e) {
            console.log('Recognition restart prevented:', e);
          }
        } else {
          setIsRecording(false);
          setInterimText('');
        }
      };
      
      recognitionRef.current = recognition;
    }
    
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore
        }
      }
    };
  }, []); // Empty deps - only run once

  // Start recording
  const startRecording = useCallback(() => {
    if (!recognitionRef.current) {
      alert('您的浏览器不支持语音识别功能，请使用 Chrome 或 Edge 浏览器');
      return;
    }
    
    try {
      isRecordingRef.current = true;
      setIsRecording(true);
      recognitionRef.current.start();
    } catch (e) {
      console.error('Failed to start recognition:', e);
    }
  }, []);

  // Stop recording
  const stopRecording = useCallback(() => {
    isRecordingRef.current = false;
    setIsRecording(false);
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore
      }
    }
    
    // Append any remaining interim text as final
    if (interimText) {
      const currentValue = valueRef.current || '';
      onChangeRef.current(currentValue + interimText);
      setInterimText('');
    }
  }, [interimText]);

  // Handle press start (mouse/touch)
  const handlePressStart = useCallback((e) => {
    e.preventDefault();
    startRecording();
  }, [startRecording]);

  // Handle press end (mouse/touch)
  const handlePressEnd = useCallback((e) => {
    e.preventDefault();
    stopRecording();
  }, [stopRecording]);

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
          className="flex items-center h-14 bg-white/95 backdrop-blur-2xl 
                     rounded-full border border-gray-200/70 shadow-xl px-5
                     focus-within:border-amber-400/60 focus-within:shadow-amber-100/60 transition-all duration-300"
          style={{
            boxShadow: '0 6px 24px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
            borderRadius: '32px'
          }}
        >
          {/* 左侧切换按钮 */}
          <button
            onClick={() => setInputMode(inputMode === 'voice' ? 'text' : 'voice')}
            className="w-10 h-10 flex items-center justify-center rounded-full mr-3 flex-shrink-0
                       hover:bg-gray-100 active:scale-95 transition-all duration-200"
            aria-label={inputMode === 'voice' ? '切换到键盘输入' : '切换到语音输入'}
            style={{ 
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
              backgroundColor: 'rgba(255, 255, 255, 0.8)'
            }}
          >
            {inputMode === 'voice' ? (
              <Keyboard size={18} className="text-gray-500" />
            ) : (
              <Mic size={18} className="text-gray-500" />
            )}
          </button>

          {/* 输入区域 */}
          {inputMode === 'text' ? (
            /* 文字输入模式 */
            <>
              <div className="flex-1 relative">
                {!value && (
                  <span
                    className="absolute inset-y-0 left-0 flex items-center text-gray-400 text-sm pointer-events-none transition-opacity duration-200"
                    style={{ fontFamily: '"Songti SC", "STKaiti", "KaiTi", serif' }}
                  >
                    {MOOD_INPUT_PLACEHOLDERS[placeholderIndex]}
                  </span>
                )}
                <input
                  className="bg-transparent border-none focus:outline-none focus:ring-0 
                             w-full text-sm text-gray-800 h-full px-2"
                  style={{ 
                    fontFamily: '"Songti SC", "STKaiti", "KaiTi", serif',
                    letterSpacing: '0.05em'
                  }}
                  placeholder=""
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading || disabled}
                  autoFocus
                />
              </div>

              {/* 发送按钮 */}
              <button 
                onClick={handleSubmit}
                disabled={isLoading || disabled || (!value?.trim() && !selectedTag)}
                className={`w-10 h-10 flex items-center justify-center rounded-full ml-3
                           transition-all duration-300 flex-shrink-0
                           ${(value?.trim() || selectedTag) && !isLoading && !disabled
                             ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95' 
                             : 'bg-gray-100 cursor-not-allowed'}`}
                style={{ 
                  boxShadow: (value?.trim() || selectedTag) && !isLoading && !disabled 
                    ? '0 4px 12px rgba(245, 158, 11, 0.3)' 
                    : '0 2px 6px rgba(0, 0, 0, 0.05)'
                }}
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
            </>
          ) : (
            /* 语音输入模式 - 按住说话 */
            <>
              <div 
                className={`flex-1 flex items-center justify-center cursor-pointer select-none
                           transition-all duration-200 rounded-full mx-1 px-6 py-2
                           ${isRecording ? 'bg-red-50 scale-105' : 'hover:bg-gray-50 active:bg-gray-100 active:scale-98'}`}
                onMouseDown={handlePressStart}
                onMouseUp={handlePressEnd}
                onMouseLeave={isRecording ? handlePressEnd : undefined}
                onTouchStart={handlePressStart}
                onTouchEnd={handlePressEnd}
                onTouchCancel={handlePressEnd}
                onTouchMove={(e) => e.preventDefault()}
                style={{ 
                  touchAction: 'none',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  boxShadow: isRecording ? '0 4px 12px rgba(239, 68, 68, 0.2)' : '0 2px 8px rgba(0, 0, 0, 0.06)',
                  backgroundColor: isRecording ? 'rgba(254, 242, 242, 0.8)' : 'rgba(255, 255, 255, 0.8)'
                }}
              >
                <span 
                  className={`text-sm transition-colors duration-150
                             ${isRecording ? 'text-red-500 font-medium' : 'text-gray-800'}`}
                  style={{ fontFamily: '"Songti SC", "STKaiti", "KaiTi", serif' }}
                >
                  {isRecording 
                    ? (interimText || '正在聆听...') 
                    : (value ? '继续按住说话' : '按住 说话')}
                </span>
              </div>
              
              {/* 显示已识别文字时的发送按钮 */}
              {(value?.trim() || selectedTag) && (
                <button 
                  onClick={handleSubmit}
                  disabled={isLoading || disabled}
                  className={`w-10 h-10 flex items-center justify-center rounded-full ml-3
                             transition-all duration-300 flex-shrink-0
                             ${!isLoading && !disabled
                               ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95' 
                               : 'bg-gray-100 cursor-not-allowed'}`}
                  style={{ 
                    boxShadow: !isLoading && !disabled 
                      ? '0 4px 12px rgba(245, 158, 11, 0.3)' 
                      : '0 2px 6px rgba(0, 0, 0, 0.05)'
                  }}
                  aria-label="发送"
                >
                  {isLoading ? (
                    <Loader2 size={16} className="animate-spin text-gray-400" />
                  ) : (
                    <ArrowUp size={16} className="text-white" />
                  )}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MoodInputBar;
