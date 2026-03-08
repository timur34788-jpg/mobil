import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gamepad2, Trophy, Target, Play, RefreshCw, Star, Zap, Timer, Sparkles } from 'lucide-react';

export const Games = ({ theme }: { theme: any }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [seeds, setSeeds] = useState<{ id: number, x: number, y: number, type: 'normal' | 'gold' }[]>([]);
  const [combo, setCombo] = useState(0);
  const [lastCollectTime, setLastCollectTime] = useState(0);

  const spawnSeed = useCallback(() => {
    const id = Date.now();
    const x = Math.random() * 80 + 10;
    const y = Math.random() * 60 + 20;
    const type = Math.random() > 0.9 ? 'gold' : 'normal';
    setSeeds(prev => [...prev, { id, x, y, type }]);
    
    const duration = type === 'gold' ? 1200 : 2000;
    setTimeout(() => {
      setSeeds(prev => prev.filter(s => s.id !== id));
    }, duration);
  }, []);

  useEffect(() => {
    let timer: any;
    let spawner: any;
    
    if (isPlaying && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      
      spawner = setInterval(() => {
        if (Math.random() > 0.3) spawnSeed();
      }, 600);
    } else if (timeLeft === 0) {
      setIsPlaying(false);
      if (score > highScore) setHighScore(score);
    }
    
    return () => {
      clearInterval(timer);
      clearInterval(spawner);
    };
  }, [isPlaying, timeLeft, spawnSeed, score, highScore]);

  const collectSeed = (id: number, type: 'normal' | 'gold') => {
    const now = Date.now();
    const isCombo = now - lastCollectTime < 1000;
    const newCombo = isCombo ? combo + 1 : 1;
    
    setCombo(newCombo);
    setLastCollectTime(now);
    
    const basePoints = type === 'gold' ? 50 : 10;
    setScore(prev => prev + (basePoints * newCombo));
    setSeeds(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0B0E11] overflow-hidden relative">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full animate-pulse delay-1000" />
      </div>

      <header className="h-16 border-b border-white/5 flex items-center px-8 justify-between bg-black/40 backdrop-blur-xl z-20">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-purple-500/20 rounded-2xl border border-purple-500/20">
            <Gamepad2 size={20} className="text-purple-400" />
          </div>
          <h3 className="font-black text-white uppercase tracking-[0.3em] text-[11px]">Tohum Toplayıcı</h3>
        </div>
        
        <div className="flex items-center gap-12">
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">En Yüksek Skor</span>
            <div className="flex items-center gap-2">
              <Trophy size={14} className="text-amber-500" />
              <span className="text-xl font-black text-white">{highScore}</span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Mevcut Skor</span>
            <div className="flex items-center gap-2">
              <Target size={14} className="text-emerald-500" />
              <span className="text-xl font-black text-white">{score}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {!isPlaying ? (
            <motion.div 
              key="start"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="absolute inset-0 flex flex-col items-center justify-center text-center p-12 z-10"
            >
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="w-40 h-40 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-[56px] flex items-center justify-center mb-10 border border-white/20 shadow-2xl shadow-purple-500/20 relative"
              >
                <div className="absolute inset-0 bg-white/10 blur-2xl rounded-full animate-pulse" />
                <Gamepad2 size={80} className="text-white relative z-10" />
              </motion.div>
              
              <h2 className="text-6xl font-black text-white mb-6 tracking-tighter">
                {timeLeft === 0 ? 'Oyun Bitti!' : 'Hazır mısın?'}
              </h2>
              
              {timeLeft === 0 && (
                <div className="mb-8 p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-md">
                  <div className="text-sm font-bold text-white/40 uppercase tracking-widest mb-2">Son Skorun</div>
                  <div className="text-5xl font-black text-emerald-500">{score}</div>
                </div>
              )}
              
              <p className="text-white/40 mb-10 max-w-sm mx-auto text-lg font-medium leading-relaxed">
                30 saniye içinde tohumları topla. <span className="text-amber-500 font-bold">Altın tohumlar</span> 5x puan verir!
              </p>
              
              <motion.button 
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setScore(0);
                  setTimeLeft(30);
                  setIsPlaying(true);
                  setSeeds([]);
                  setCombo(0);
                }}
                className="px-16 py-5 bg-white text-black rounded-[32px] font-black text-xl shadow-2xl hover:bg-purple-50 transition-all flex items-center gap-4"
              >
                {timeLeft === 0 ? 'TEKRAR DENE' : 'OYUNU BAŞLAT'}
                <Play size={24} fill="currentColor" />
              </motion.button>
            </motion.div>
          ) : (
            <>
              {/* HUD */}
              <div className="absolute top-12 left-1/2 -translate-x-1/2 text-center z-20">
                <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-8 py-4 rounded-[32px] border border-white/10">
                  <Timer size={24} className={timeLeft <= 5 ? 'text-red-500' : 'text-white/40'} />
                  <div className={`text-5xl font-black tabular-nums transition-colors ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                    {timeLeft}s
                  </div>
                </div>
              </div>

              {/* Combo Indicator */}
              <AnimatePresence>
                {combo > 1 && (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="absolute top-12 left-12 z-20"
                  >
                    <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-3 rounded-2xl shadow-2xl border border-white/20">
                      <div className="text-[10px] font-black text-white/60 uppercase tracking-widest">Kombo</div>
                      <div className="text-3xl font-black text-white">x{combo}</div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Game Field */}
              <div className="absolute inset-0">
                <AnimatePresence>
                  {seeds.map(s => (
                    <motion.button
                      key={s.id}
                      initial={{ scale: 0, rotate: -90, y: 20 }}
                      animate={{ scale: 1, rotate: 0, y: 0 }}
                      exit={{ scale: 0, opacity: 0, filter: 'blur(10px)' }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.8 }}
                      onClick={() => collectSeed(s.id, s.type)}
                      className={`absolute w-20 h-20 rounded-[28px] shadow-2xl flex items-center justify-center border-4 cursor-pointer z-10 ${
                        s.type === 'gold' 
                          ? 'bg-gradient-to-br from-amber-400 to-orange-500 border-amber-300/50 shadow-amber-500/40' 
                          : 'bg-gradient-to-br from-emerald-400 to-teal-600 border-emerald-300/50 shadow-emerald-500/40'
                      }`}
                      style={{ left: `${s.x}%`, top: `${s.y}%` }}
                    >
                      {s.type === 'gold' ? <Sparkles size={32} className="text-white" /> : <Star size={32} className="text-white fill-white" />}
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
