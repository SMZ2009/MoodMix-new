import React from 'react';
import cupRippleImage from '../assets/cup-ripple.jpg';

const HomePage = ({ isMixing = false }) => {
  return (
    <div className="flex-1 flex flex-col items-center px-6 pt-[calc(env(safe-area-inset-top,0px)+4rem)] pb-48 bg-dreamy-gradient w-full min-h-[100svh] relative overflow-x-hidden overflow-y-auto">
      {/* 背景装饰性光晕 */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-200/40 rounded-full blur-[120px] pointer-events-none mix-blend-multiply" />
      <div className="absolute top-1/4 right-0 w-80 h-80 bg-blue-200/40 rounded-full blur-[100px] pointer-events-none mix-blend-multiply" />
      <div className="absolute bottom-1/3 left-0 w-72 h-72 bg-pink-200/40 rounded-full blur-[100px] pointer-events-none mix-blend-multiply" />
      
      {/* 标题区域 */}
      <div className="text-center mb-6 sm:mb-8 z-10 mt-4">
        <h1 
          className="text-3xl sm:text-4xl font-extrabold text-gray-800 mb-3 tracking-wide"
          style={{ fontFamily: '"Songti SC", "STKaiti", "KaiTi", serif' }}
        >
          此刻，心境如何？
        </h1>
        <p
          className="text-gray-500 text-sm sm:text-base font-light tracking-wider italic"
          style={{ fontFamily: '"FZYouSong", "方正悠宋", serif' }}
        >
          万般心绪，皆可入杯
        </p>
      </div>

      {/* 水墨杯图 - 居中展示 */}
      <div className="relative flex-1 w-full flex flex-col items-center justify-center">
        <div 
          className={`relative z-20 w-[320px] sm:w-[420px] max-w-[92vw] transition-all duration-500
                     ${isMixing ? 'scale-[1.02] opacity-95' : 'scale-100 opacity-100'}`}
        >
          <img
            src={cupRippleImage}
            alt="杯子和水波"
            className="w-full h-auto object-contain select-none pointer-events-none"
          />
          
          {/* 加载状态下的水波纹动画 */}
          {isMixing && (
            <div 
              className="absolute inset-0 flex items-center justify-center"
              style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
            >
              <div className="w-32 h-32 rounded-full bg-amber-200/20 animate-ping" />
            </div>
          )}
        </div>

        {/* 品牌副文案 */}
        <p 
          className="mt-8 text-center text-gray-400 text-sm tracking-widest z-10"
          style={{ fontFamily: '"Songti SC", "STKaiti", "KaiTi", serif' }}
        >
          情绪处方 · 为心情调一杯
        </p>
      </div>
    </div>
  );
};

export default HomePage;
