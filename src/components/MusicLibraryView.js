/**
 * MusicLibraryView - 音乐库/环境音浏览页
 * 
 * 功能：
 * 1. 浏览环境音场景分类
 * 2. 搜索 Freesound 环境音
 * 3. 播放控制
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  ArrowLeft, Search, Play, Pause, Loader, 
  CloudRain, Trees, Waves, Coffee, Moon, 
  Flame, Wind, CloudLightning, Heart, X, SkipForward
} from 'lucide-react';
import { AMBIENT_SCENES } from '../data/musicKnowledgeBase';

// 场景图标映射
const SCENE_ICONS = {
  rain: CloudRain,
  nature: Trees,
  ocean: Waves,
  cafe: Coffee,
  night: Moon,
  meditation: Heart,
  fire: Flame,
  wind: Wind,
  thunder: CloudLightning,
  urban: Coffee
};

// 场景渐变色映射
const SCENE_COLORS = {
  rain: 'from-blue-400 to-slate-500',
  nature: 'from-emerald-400 to-green-600',
  ocean: 'from-cyan-400 to-blue-500',
  cafe: 'from-amber-400 to-orange-500',
  night: 'from-indigo-500 to-purple-600',
  meditation: 'from-violet-400 to-purple-500',
  fire: 'from-orange-400 to-red-500',
  wind: 'from-teal-300 to-cyan-400',
  thunder: 'from-slate-500 to-gray-700',
  urban: 'from-gray-400 to-slate-500'
};

const MusicLibraryView = ({ onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  // 音乐平台选择
  const [currentPlatform, setCurrentPlatform] = useState('freesound'); // freesound, qqmusic, netease, yyfang
  
  // 播放状态
  const [playingScene, setPlayingScene] = useState(null);
  const [playingSound, setPlayingSound] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sceneSounds, setSceneSounds] = useState([]); // 当前场景的可用音频列表
  const audioRef = useRef(null);
  
  // 最近播放（从 localStorage 读取）
  const [recentlyPlayed, setRecentlyPlayed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('moodmix_recent_sounds') || '[]');
    } catch {
      return [];
    }
  });

  // 清理音频
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // 搜索音乐
  const searchMusic = useCallback(async (query) => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    setShowSearchResults(true);
    
    try {
      let res;
      if (currentPlatform === 'freesound') {
        res = await fetch(`/api/sounds/search?query=${encodeURIComponent(query)}&page_size=10`);
      } else {
        res = await fetch(`/api/music/search?platform=${currentPlatform}&query=${encodeURIComponent(query)}&page_size=10`);
      }
      const data = await res.json();
      
      if (data.success) {
        setSearchResults(data.results || []);
      }
    } catch (error) {
      console.error('搜索失败:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [currentPlatform]);

  // 播放场景
  const playScene = useCallback(async (sceneKey, forceRefresh = false) => {
    const scene = AMBIENT_SCENES[sceneKey];
    if (!scene) return;
    
    // 如果正在播放同一场景且不是强制刷新，暂停
    if (playingScene === sceneKey && audioRef.current && !audioRef.current.paused && !forceRefresh) {
      audioRef.current.pause();
      setPlayingScene(null);
      return;
    }
    
    setIsLoading(true);
    setPlayingScene(sceneKey);
    
    try {
      // 用场景的 searchTips 搜索
      const query = scene.searchTips || scene.freesoundTags.slice(0, 2).join(' ');
      let res;
      if (currentPlatform === 'freesound') {
        res = await fetch(`/api/sounds/search?query=${encodeURIComponent(query)}&duration_min=60&page_size=10`);
      } else {
        res = await fetch(`/api/music/search?platform=${currentPlatform}&query=${encodeURIComponent(query)}&page_size=10`);
      }
      const data = await res.json();
      
      if (data.success && data.results.length > 0) {
        // 保存场景的所有音频
        setSceneSounds(data.results);
        
        // 随机选择一个
        const sound = data.results[Math.floor(Math.random() * data.results.length)];
        
        if (!audioRef.current) {
          audioRef.current = new Audio();
          audioRef.current.loop = true;
          audioRef.current.volume = 0.6;
        }
        
        audioRef.current.src = sound.previewUrl;
        await audioRef.current.play();
        
        setPlayingSound(sound);
        
        // 添加到最近播放
        addToRecentlyPlayed({
          sceneKey,
          sceneName: scene.sceneName,
          soundName: sound.name,
          previewUrl: sound.previewUrl
        });
      }
    } catch (error) {
      console.error('播放失败:', error);
      setPlayingScene(null);
    } finally {
      setIsLoading(false);
    }
  }, [playingScene, currentPlatform]);

  // 切换同场景下的不同音频
  const playNextInScene = useCallback(async () => {
    if (!playingScene || sceneSounds.length <= 1) {
      // 如果只有一个或没有缓存，重新搜索
      if (playingScene && playingScene !== 'search') {
        playScene(playingScene, true);
      }
      return;
    }
    
    setIsLoading(true);
    
    try {
      // 从列表中选择一个不同的音频
      const otherSounds = sceneSounds.filter(s => s.id !== playingSound?.id);
      if (otherSounds.length === 0) return;
      
      const nextSound = otherSounds[Math.floor(Math.random() * otherSounds.length)];
      
      if (!audioRef.current) {
        audioRef.current = new Audio();
        audioRef.current.loop = true;
        audioRef.current.volume = 0.6;
      }
      
      audioRef.current.src = nextSound.previewUrl;
      await audioRef.current.play();
      
      setPlayingSound(nextSound);
      
      // 添加到最近播放
      const scene = AMBIENT_SCENES[playingScene];
      if (scene) {
        addToRecentlyPlayed({
          sceneKey: playingScene,
          sceneName: scene.sceneName,
          soundName: nextSound.name,
          previewUrl: nextSound.previewUrl
        });
      }
    } catch (error) {
      console.error('切换失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, [playingScene, sceneSounds, playingSound, playScene]);

  // 播放搜索结果中的声音
  const playSearchResult = useCallback(async (sound) => {
    if (playingSound?.id === sound.id && audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setPlayingSound(null);
      setPlayingScene(null);
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio();
        audioRef.current.loop = true;
        audioRef.current.volume = 0.6;
      }
      
      audioRef.current.src = sound.previewUrl;
      await audioRef.current.play();
      
      setPlayingSound(sound);
      setPlayingScene('search');
      
      // 添加到最近播放
      addToRecentlyPlayed({
        sceneKey: 'search',
        sceneName: '搜索结果',
        soundName: sound.name,
        previewUrl: sound.previewUrl
      });
    } catch (error) {
      console.error('播放失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, [playingSound]);

  // 添加到最近播放
  const addToRecentlyPlayed = useCallback((item) => {
    setRecentlyPlayed(prev => {
      const filtered = prev.filter(p => p.previewUrl !== item.previewUrl);
      const newList = [{ ...item, timestamp: Date.now() }, ...filtered].slice(0, 10);
      localStorage.setItem('moodmix_recent_sounds', JSON.stringify(newList));
      return newList;
    });
  }, []);

  // 停止播放
  const stopPlaying = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setPlayingScene(null);
    setPlayingSound(null);
  }, []);

  const serifFont = { fontFamily: '"Songti SC", "STKaiti", "KaiTi", serif' };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-lg border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-3 pt-[calc(env(safe-area-inset-top,0px)+12px)]">
          <button 
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={22} className="text-gray-600" />
          </button>
          <h1 className="text-lg font-bold text-gray-800" style={serifFont}>
            环境音库
          </h1>
          <div className="w-10" /> {/* 占位 */}
        </div>
        
        {/* 音乐平台选择 */}
        <div className="px-4 pb-2">
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPlatform('freesound')}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all
                         ${currentPlatform === 'freesound' 
                           ? 'bg-amber-100 text-amber-700'
                           : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              环境音
            </button>
            <button
              onClick={() => setCurrentPlatform('qqmusic')}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all
                         ${currentPlatform === 'qqmusic' 
                           ? 'bg-green-100 text-green-700'
                           : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              QQ音乐
            </button>
            <button
              onClick={() => setCurrentPlatform('netease')}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all
                         ${currentPlatform === 'netease' 
                           ? 'bg-red-100 text-red-700'
                           : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              网易云
            </button>
            <button
              onClick={() => setCurrentPlatform('yyfang')}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all
                         ${currentPlatform === 'yyfang' 
                           ? 'bg-purple-100 text-purple-700'
                           : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              YY音源
            </button>
          </div>
        </div>
        
        {/* 搜索栏 */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchMusic(searchQuery)}
              placeholder={`搜索${currentPlatform === 'freesound' ? '环境音' : currentPlatform === 'yyfang' ? 'YY音源' : '音乐'}...`}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-100 text-sm 
                         focus:outline-none focus:ring-2 focus:ring-amber-300 transition-all"
              style={serifFont}
            />
            {searchQuery && (
              <button 
                onClick={() => { setSearchQuery(''); setShowSearchResults(false); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 py-4 pb-32">
        {/* 搜索结果 */}
        {showSearchResults && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-gray-500" style={serifFont}>搜索结果</h2>
              <button 
                onClick={() => setShowSearchResults(false)}
                className="text-xs text-amber-600"
              >
                关闭
              </button>
            </div>
            
            {isSearching ? (
              <div className="flex items-center justify-center py-8">
                <Loader size={24} className="animate-spin text-amber-500" />
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-2">
                {searchResults.map(sound => (
                  <div 
                    key={sound.id}
                    className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm border border-gray-100"
                  >
                    <button
                      onClick={() => playSearchResult(sound)}
                      disabled={isLoading}
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                                  ${playingSound?.id === sound.id 
                                    ? 'bg-amber-500 text-white' 
                                    : 'bg-gray-100 text-gray-600 hover:bg-amber-100'}`}
                    >
                      {isLoading && playingSound?.id === sound.id ? (
                        <Loader size={18} className="animate-spin" />
                      ) : playingSound?.id === sound.id ? (
                        <Pause size={18} />
                      ) : (
                        <Play size={18} className="ml-0.5" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate" style={serifFont}>
                        {sound.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {currentPlatform === 'freesound' 
                          ? `${sound.duration}s · ${sound.author}`
                          : currentPlatform === 'yyfang'
                            ? `${sound.artist} · ${sound.album}`
                            : `${sound.artist} · ${sound.album}`
                        }
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-gray-400 py-8" style={serifFont}>
                未找到相关{currentPlatform === 'freesound' ? '环境音' : currentPlatform === 'yyfang' ? 'YY音源' : '音乐'}
              </p>
            )}
          </div>
        )}

        {/* 最近播放 */}
        {recentlyPlayed.length > 0 && !showSearchResults && (
          <div className="mb-6">
            <h2 className="text-sm font-medium text-gray-500 mb-3" style={serifFont}>最近播放</h2>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
              {recentlyPlayed.slice(0, 5).map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (item.sceneKey !== 'search') {
                      playScene(item.sceneKey);
                    }
                  }}
                  className="flex-shrink-0 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-100
                             text-sm text-gray-600 hover:bg-amber-50 transition-colors"
                  style={serifFont}
                >
                  {item.sceneName}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 场景分类 */}
        <h2 className="text-sm font-medium text-gray-500 mb-3" style={serifFont}>环境场景</h2>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(AMBIENT_SCENES).map(([key, scene]) => {
            const Icon = SCENE_ICONS[key] || Heart;
            const colors = SCENE_COLORS[key] || 'from-gray-400 to-gray-500';
            const isPlaying = playingScene === key;
            
            return (
              <button
                key={key}
                onClick={() => playScene(key)}
                disabled={isLoading && playingScene === key}
                className={`relative overflow-hidden rounded-2xl p-4 text-left transition-all
                            ${isPlaying ? 'ring-2 ring-amber-400 ring-offset-2' : 'hover:scale-[1.02]'}`}
              >
                {/* 渐变背景 */}
                <div className={`absolute inset-0 bg-gradient-to-br ${colors} opacity-90`} />
                
                {/* 内容 */}
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                      <Icon size={20} className="text-white" />
                    </div>
                    {isPlaying ? (
                      isLoading ? (
                        <Loader size={20} className="text-white animate-spin" />
                      ) : (
                        <Pause size={20} className="text-white" />
                      )
                    ) : (
                      <Play size={18} className="text-white/70" />
                    )}
                  </div>
                  <h3 className="text-white font-bold text-base mb-0.5" style={serifFont}>
                    {scene.sceneName}
                  </h3>
                  <p className="text-white/70 text-xs" style={serifFont}>
                    {scene.vibe}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 底部播放控制条 */}
      {playingSound && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-200 
                        px-4 py-3 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={stopPlaying}
              className="w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center
                         shadow-lg shadow-amber-200 active:scale-95 transition-transform"
            >
              <Pause size={22} />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate" style={serifFont}>
                {playingSound.name}
              </p>
              <p className="text-xs text-gray-400">
                正在播放 · 循环中
              </p>
            </div>
            {/* 换一首按钮 */}
            {playingScene && playingScene !== 'search' && (
              <button
                onClick={playNextInScene}
                disabled={isLoading}
                className="p-2.5 rounded-full bg-gray-100 text-gray-600 hover:bg-amber-100 
                           hover:text-amber-600 active:scale-95 transition-all"
                title="换一首"
              >
                {isLoading ? (
                  <Loader size={20} className="animate-spin" />
                ) : (
                  <SkipForward size={20} />
                )}
              </button>
            )}
            <button
              onClick={stopPlaying}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MusicLibraryView;
