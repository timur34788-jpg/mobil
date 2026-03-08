import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, Cpu, Globe, Zap, Activity, Terminal, Shield, RefreshCw } from 'lucide-react';
import { NatureBotMascot } from './NatureBotMascot';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

export const RobotHouse = ({ theme }: { theme: any }) => {
  const [status, setStatus] = useState({ cpu: 12, mem: 45, network: 1.2, temp: 38 });
  const [activeTab, setActiveTab] = useState('status');
  const [history, setHistory] = useState<any[]>(Array.from({ length: 20 }, (_, i) => ({ value: 10 + Math.random() * 20 })));

  useEffect(() => {
    const i = setInterval(() => {
      const newCpu = Math.floor(Math.random()*20)+5;
      setStatus({ 
        cpu: newCpu, 
        mem: Math.floor(Math.random()*10)+40,
        network: parseFloat((Math.random() * 5).toFixed(1)),
        temp: Math.floor(Math.random() * 5) + 35
      });
      setHistory(prev => [...prev.slice(1), { value: newCpu }]);
    }, 3000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="flex-1 flex flex-col bg-[#0B0E11] overflow-hidden">
      <header className="h-14 border-b border-white/5 flex items-center px-6 justify-between bg-black/20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <Bot size={18} className="text-emerald-500" />
          </div>
          <h3 className="font-bold text-white uppercase tracking-[0.2em] text-[11px]">NatureBot Lab</h3>
        </div>
        <div className="flex gap-2">
          {['status', 'terminal', 'logs'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-emerald-500 text-white shadow-2xl shadow-emerald-500/40' : 'text-white/30 hover:text-white hover:bg-white/5'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center p-12 overflow-y-auto custom-scrollbar">
        <div className="w-full max-w-6xl grid grid-cols-12 gap-8">
          {/* Mascot Section */}
          <div className="col-span-12 lg:col-span-5 flex flex-col items-center justify-center p-12 bg-white/5 border border-white/10 rounded-[48px] backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-blue-500/10 opacity-50" />
            <div className="relative z-10">
              <div className="absolute inset-0 bg-emerald-500/20 blur-[100px] rounded-full animate-pulse" />
              <NatureBotMascot size={240} isFloating={true} />
            </div>
            <div className="mt-8 text-center relative z-10">
              <h4 className="text-2xl font-black text-white mb-2">NatureBot v2.4</h4>
              <div className="flex items-center gap-2 justify-center">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Sistem Aktif</span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="col-span-12 lg:col-span-7 grid grid-cols-2 gap-6">
            {[
              { label: 'CPU Kullanımı', value: `${status.cpu}%`, icon: Cpu, color: '#10b981', history: history },
              { label: 'Bellek Yükü', value: `${status.mem}%`, icon: Activity, color: '#8b5cf6', history: history.map(h => ({ value: h.value + 20 })) },
              { label: 'Ağ Trafiği', value: `${status.network} MB/s`, icon: Globe, color: '#3b82f6', history: history.map(h => ({ value: h.value / 5 })) },
              { label: 'Sistem Isısı', value: `${status.temp}°C`, icon: Zap, color: '#f59e0b', history: history.map(h => ({ value: h.value + 10 })) },
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="p-8 bg-white/5 rounded-[40px] border border-white/10 backdrop-blur-xl relative overflow-hidden group hover:border-white/20 transition-all"
              >
                <div className="flex items-start justify-between mb-8 relative z-10">
                  <div className={`p-3 rounded-2xl bg-white/5 flex items-center justify-center`} style={{ color: stat.color }}>
                    <stat.icon size={20} />
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">{stat.label}</div>
                    <div className="text-3xl font-black text-white">{stat.value}</div>
                  </div>
                </div>
                
                <div className="h-20 -mx-8 -mb-8 opacity-50 group-hover:opacity-100 transition-opacity">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stat.history}>
                      <defs>
                        <linearGradient id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={stat.color} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={stat.color} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke={stat.color} 
                        fillOpacity={1} 
                        fill={`url(#grad-${i})`} 
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Terminal Section */}
          <div className="col-span-12 p-10 bg-black/40 border border-white/5 rounded-[48px] backdrop-blur-md relative overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <Terminal size={18} className="text-emerald-500" />
                </div>
                <span className="text-xs font-black text-white uppercase tracking-[0.3em]">Sistem Çekirdek Günlüğü</span>
              </div>
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/20" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/20" />
              </div>
            </div>
            
            <div className="space-y-4 font-mono text-[12px] leading-relaxed">
              <div className="flex gap-6 text-emerald-500/40">
                <span className="w-24">[14:20:01]</span>
                <span className="text-emerald-500 font-bold">INFO</span>
                <span className="text-white/60">NatureBot çekirdek modülleri optimize edildi. <span className="text-emerald-500/40">#core-01</span></span>
              </div>
              <div className="flex gap-6 text-blue-500/40">
                <span className="w-24">[14:21:45]</span>
                <span className="text-blue-500 font-bold">SYNC</span>
                <span className="text-white/60">Ekosistem verileri bulut sunucusu ile senkronize edildi.</span>
              </div>
              <div className="flex gap-6 text-purple-500/40">
                <span className="w-24">[14:23:12]</span>
                <span className="text-purple-500 font-bold">LEARN</span>
                <span className="text-white/60">Yeni kullanıcı etkileşim kalıpları analiz ediliyor...</span>
              </div>
              <div className="flex gap-6 text-emerald-500/40 animate-pulse">
                <span className="w-24">[14:25:00]</span>
                <span className="text-emerald-500 font-bold">LIVE</span>
                <span className="text-white/60">Sistem durumu stabil, ekosistem dengede. <span className="text-emerald-500/40">0 errors found.</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
