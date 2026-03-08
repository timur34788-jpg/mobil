import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ChevronDown, 
  Cpu, 
  Plus, 
  Filter, 
  Hash,
  Tv,
  Radio,
  Users,
  Eye,
  Video,
  Mic,
  Monitor
} from 'lucide-react';
import { NatureBotMascot } from './NatureBotMascot';
import { Channel } from '../types';
import { estimateCO2 } from '../services/securityService';
import { db } from '../firebase';
import { ref, onValue, set as fbSet } from 'firebase/database';

// Varsayılan kanallar (Firebase boşsa kullanılır)
export const DEFAULT_TV_CHANNELS = [
  { id: 'trt1',        name: 'TRT 1',        emoji: '📺', desc: "Türkiye'nin ana kanalı",    youtubeChannelId: 'UCwHT8qSom5HF9OqMEGHbLEg', color: '#e11d48' },
  { id: 'trt2',        name: 'TRT 2',        emoji: '🎭', desc: 'Kültür & sanat',            youtubeChannelId: 'UC8JLeB4RNFwm7GQ5wDEWGsQ', color: '#7c3aed' },
  { id: 'trthaber',    name: 'TRT Haber',    emoji: '📰', desc: 'Canlı haber yayını',        youtubeChannelId: 'UCLGoFOSxuOPSuVXQdoJjDDg', color: '#0284c7' },
  { id: 'trtspor',     name: 'TRT Spor',     emoji: '⚽', desc: 'Spor yayınları',            youtubeChannelId: 'UCZ5JFpVdSgGMpbzHAGVH6SA', color: '#16a34a' },
  { id: 'trtmuzik',    name: 'TRT Müzik',    emoji: '🎵', desc: 'Müzik & eğlence',          youtubeChannelId: 'UCl0S7h7xLdKFDMHxTVlUiyQ', color: '#db2777' },
  { id: 'trtbelgesel', name: 'TRT Belgesel', emoji: '🌿', desc: 'Belgesel & doğa',          youtubeChannelId: 'UCWHgOvkJEMHLJOSgJj4H5oA', color: '#10b981' },
  { id: 'trtcocuk',    name: 'TRT Çocuk',    emoji: '🧒', desc: 'Çocuk programları',         youtubeChannelId: 'UCsVvhNgxAHQfhW4bCqP7WYA', color: '#f59e0b' },
  { id: 'trtworld',    name: 'TRT World',    emoji: '🌍', desc: 'İngilizce dünya haberleri', youtubeChannelId: 'UCe_HHnvyHJLJGJKpP-swNMg', color: '#06b6d4' },
];

// TV kanallarını Firebase'den oku (global hook)
export const useTvChannels = () => {
  const [channels, setChannels] = useState<any[]>(DEFAULT_TV_CHANNELS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const r = ref(db, 'tv_channels');
    const unsub = onValue(r, snap => {
      const d = snap.val();
      if (d && Object.keys(d).length > 0) {
        // Firebase'de veri var — onu kullan (ASLA üzerine yazma)
        const list = Object.entries(d)
          .map(([id, v]: any) => ({ id, ...v }))
          .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
        setChannels(list);
      } else if (!loaded) {
        // İlk yüklemede Firebase boşsa UI'da default göster (Firebase'e YAZMA)
        setChannels(DEFAULT_TV_CHANNELS);
      }
      setLoaded(true);
    }, (error) => {
      // Okuma hatası — sadece UI'da default göster, Firebase'e dokunma
      console.warn('tv_channels okuma hatası:', error.message);
      setChannels(DEFAULT_TV_CHANNELS);
      setLoaded(true);
    });
    return () => unsub();
  }, []);

  return channels;
};

// Geriye dönük uyumluluk için
export const TV_CHANNELS = DEFAULT_TV_CHANNELS;

interface ChannelSidebarProps {
  theme: any;
  siteSettings: any;
  view: string;
  setView: (view: any) => void;
  activeChannel: string;
  setActiveChannel: (name: string) => void;
  channels: Channel[];
  currentChannelId: string;
  setCurrentChannelId: (id: string) => void;
  onlineUsers: string[];
  allUsers: any[];
  userId: string | null;
  setActiveDmUserId: (id: string) => void;
  activeDmUserId: string | null;
  setIsCreateChannelModalOpen: (open: boolean) => void;
  tvChannel?: string;
  setTvChannel?: (ch: string) => void;
  isVerified?: boolean;
  unreadChannels?: Record<string, number>;
  unreadDms?: Record<string, number>;
}

export const ChannelSidebar = ({ 
  theme, 
  siteSettings, 
  view, 
  setView, 
  activeChannel, 
  setActiveChannel, 
  channels, 
  currentChannelId, 
  setCurrentChannelId, 
  onlineUsers,
  allUsers,
  userId, 
  setActiveDmUserId, 
  activeDmUserId,
  setIsCreateChannelModalOpen,
  tvChannel,
  setTvChannel,
  isVerified,
  unreadChannels = {},
  unreadDms = {},
}: ChannelSidebarProps) => {
  const [sessionStart] = useState(Date.now());
  const [co2, setCo2] = useState(0);
  const [msgCount, setMsgCount] = useState(0);
  const [liveStreams, setLiveStreams] = useState<any[]>([]);
  const tvChannels = useTvChannels();

  useEffect(() => {
    const interval = setInterval(() => {
      const minutes = (Date.now() - sessionStart) / 60000;
      setCo2(estimateCO2(msgCount, minutes));
    }, 30000);
    return () => clearInterval(interval);
  }, [sessionStart, msgCount]);

  // Canlı yayınları dinle
  useEffect(() => {
    if (view !== 'live-chat') return;
    const streamsRef = ref(db, 'live_streams');
    const unsub = onValue(streamsRef, snap => {
      const data = snap.val();
      if (!data) { setLiveStreams([]); return; }
      const list = Object.entries(data)
        .map(([id, v]: any) => ({ id, ...v }))
        .filter(s => s.status === 'live')
        .sort((a: any, b: any) => (b.viewers || 0) - (a.viewers || 0));
      setLiveStreams(list);
    });
    return () => unsub();
  }, [view]);

  return (
    <aside 
      className={`w-64 flex flex-col border-r border-white/5 z-10 transition-all duration-500 ${theme.glass ? 'backdrop-blur-lg' : ''}`}
      style={{ backgroundColor: theme.channelSidebar }}
    >
      {/* Header */}
      <div className="p-4 flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-sm text-white tracking-tight">{siteSettings.site_name}</h1>
            <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">{siteSettings.site_description}</p>
          </div>
          <div className="flex items-center gap-2">
            <div 
              className="px-2 py-1 text-[10px] font-bold rounded-full border flex items-center gap-1 transition-all"
              style={{ backgroundColor: theme.accentLight, color: theme.accent, borderColor: theme.accentBorder }}
            >
              <Cpu size={10} /> {co2.toFixed(2)}g CO₂
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            className="flex-1 bg-transparent border py-1.5 rounded-md text-xs font-bold flex items-center justify-center gap-2 transition-all hover:brightness-125"
            style={{ borderColor: theme.accentBorder, color: theme.accent, backgroundColor: theme.accentLight }}
          >
            <Plus size={14} /> Yeni Tohum
          </button>
          <button className="p-1.5 bg-white/5 rounded-md text-white/40 hover:text-white">
            <Filter size={14} />
          </button>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-6 custom-scrollbar">
        {view === 'chat' && (
          <>
            {/* NatureBot */}
            <div>
              <div className="flex items-center gap-1 px-2 mb-2">
                <ChevronDown size={12} className="text-white/20" />
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Guardian AI</span>
              </div>
              <div 
                onClick={() => { setActiveChannel('NatureBot'); setView('chat'); }}
                className={`flex items-center gap-3 px-2 py-2 rounded-md cursor-pointer group transition-all ${activeChannel === 'NatureBot' ? 'bg-white/5' : 'hover:bg-white/5'}`}
              >
                <div className="relative">
                  <motion.div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-500 shadow-lg overflow-hidden"
                    style={{ backgroundColor: theme.accentLight, color: theme.accent, boxShadow: activeChannel === 'NatureBot' ? `0 0 10px ${theme.accentLight}` : 'none' }}
                  >
                    <NatureBotMascot size={32} />
                  </motion.div>
                  <div 
                    className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border-2 rounded-full"
                    style={{ backgroundColor: theme.accent, borderColor: '#111418' }}
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold transition-colors duration-500" style={{ color: activeChannel === 'NatureBot' ? theme.accent : 'inherit' }}>NatureBot</p>
                  <p className="text-[10px] text-white/20">Aktif • Dünyanın En Gelişmiş AI</p>
                </div>
              </div>
            </div>

            {/* Bilgi Kanalları */}
            <div>
              <div className="flex items-center justify-between px-2 mb-2">
                <div className="flex items-center gap-1">
                  <ChevronDown size={12} className="text-white/20" />
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Bilgi</span>
                </div>
              </div>
              {channels.filter(c => ['duyurular', 'yardim'].includes(c.id)).map(channel => (
                <div 
                  key={channel.id}
                  onClick={() => { setCurrentChannelId(channel.id); setActiveChannel(channel.name); setView('chat'); }}
                  className={`flex items-center gap-3 px-3 py-1.5 rounded-md cursor-pointer transition-all ${currentChannelId === channel.id && view === 'chat' ? 'bg-white/5 border-l-2' : 'hover:bg-white/5 text-white/50 hover:text-white'}`}
                  style={{ borderColor: currentChannelId === channel.id ? theme.accent : 'transparent' }}
                >
                  <Hash size={16} className="opacity-50" />
                  <span className="text-sm font-medium flex-1">{channel.name}</span>
                  {unreadChannels[channel.id] > 0 && (
                    <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {unreadChannels[channel.id] > 99 ? '99+' : unreadChannels[channel.id]}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Sohbet Kanalları */}
            <div>
              <div className="flex items-center justify-between px-2 mb-2">
                <div className="flex items-center gap-1">
                  <ChevronDown size={12} className="text-white/20" />
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Sohbet (Gruplar)</span>
                </div>
                <Plus 
                  size={14} 
                  className="text-white/20 hover:text-white cursor-pointer" 
                  onClick={() => setIsCreateChannelModalOpen(true)}
                />
              </div>
              {channels.filter(c => !['duyurular', 'yardim'].includes(c.id)).map(channel => (
                <div 
                  key={channel.id}
                  onClick={() => { setCurrentChannelId(channel.id); setActiveChannel(channel.name); setView('chat'); }}
                  className={`flex items-center gap-3 px-3 py-1.5 rounded-md cursor-pointer transition-all ${currentChannelId === channel.id && view === 'chat' ? 'bg-white/5 border-l-2' : 'hover:bg-white/5 text-white/50 hover:text-white'}`}
                  style={{ borderColor: currentChannelId === channel.id ? theme.accent : 'transparent' }}
                >
                  <Hash size={16} className="opacity-50" />
                  <span className="text-sm font-medium flex-1">{channel.name}</span>
                  {unreadChannels[channel.id] > 0 && (
                    <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {unreadChannels[channel.id] > 99 ? '99+' : unreadChannels[channel.id]}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Bağlantılar (DM) Section */}
            <div>
              <div className="flex items-center justify-between px-2 mb-2">
                <div className="flex items-center gap-1">
                  <ChevronDown size={12} className="text-white/20" />
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Bağlantılar (DM)</span>
                </div>
              </div>
              <div className="space-y-1">
                {allUsers.filter(u => u.id !== userId).length === 0 ? (
                  <p className="px-2 text-[10px] text-white/20 italic">Henüz kullanıcı yok...</p>
                ) : (
                  allUsers.filter(u => u.id !== userId).map(user => {
                    const isOnline = onlineUsers.includes(user.id);
                    const dmUnread = unreadDms[user.id] || 0;
                    return (
                      <div 
                        key={user.id}
                        onClick={() => { setActiveDmUserId(user.id); setView('dm'); }}
                        className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-all ${activeDmUserId === user.id ? 'bg-white/5' : 'hover:bg-white/5'}`}
                      >
                        <div className="relative">
                          <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-xs font-bold text-white/40 border border-white/10">
                            {(user.username || user.id).substring(0, 2).toUpperCase()}
                          </div>
                          <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border-2 border-[#111418] rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-gray-500'}`} />
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className={`text-sm font-medium truncate ${dmUnread > 0 ? 'text-white' : 'text-white/80'}`}>{user.username || user.id}</p>
                          <p className="text-[10px] text-white/20 truncate">{isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}</p>
                        </div>
                        {dmUnread > 0 && (
                          <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                            {dmUnread > 99 ? '99+' : dmUnread}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}

        {view === 'dm' && (
          <div>
            <div className="flex items-center justify-between px-2 mb-2">
              <div className="flex items-center gap-1">
                <ChevronDown size={12} className="text-white/20" />
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Direkt Mesajlar</span>
              </div>
            </div>
            {allUsers.filter(u => u.id !== userId).map(user => {
              const isOnline = onlineUsers.includes(user.id);
              return (
                <div
                  key={user.id}
                  onClick={() => { setActiveDmUserId(user.id); }}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-all ${activeDmUserId === user.id ? 'bg-white/10' : 'hover:bg-white/5'}`}
                >
                  <div className="relative">
                    <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-xs font-bold text-white/40 border border-white/10">
                      {(user.username || user.id).substring(0, 2).toUpperCase()}
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border-2 border-[#111418] rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-gray-500'}`} />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-medium text-white/80 truncate">{user.username || user.id}</p>
                    <p className="text-[10px] text-white/20 truncate">{isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── TV KANALLARI ── */}
        {view === 'live-tv' && (
          <div className="space-y-1">
            <div className="px-3 py-2 flex items-center gap-2">
              <Tv size={12} className="text-white/30" />
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Kanallar</span>
            </div>
            {tvChannels.map(ch => (
              <div
                key={ch.id}
                onClick={() => setTvChannel && setTvChannel(ch.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all mx-1 ${
                  tvChannel === ch.id ? 'bg-white/10' : 'hover:bg-white/5'
                }`}
                style={tvChannel === ch.id ? { borderLeft: `2px solid ${ch.color}` } : {}}
              >
                <span className="text-xl">{ch.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{ch.name}</p>
                  <p className="text-[10px] text-white/30 truncate">{ch.desc}</p>
                </div>
                {tvChannel === ch.id && (
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[9px] text-red-400 font-bold">CANLI</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── CANLI YAYINLAR ── */}
        {view === 'live-chat' && (
          <div className="space-y-1">
            <div className="px-3 py-2 flex items-center gap-2">
              <Radio size={12} className="text-red-400" />
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Yayınlar</span>
              {liveStreams.length > 0 && (
                <span className="ml-auto text-[9px] font-black text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded-full">
                  {liveStreams.length}
                </span>
              )}
            </div>
            {liveStreams.length === 0 && (
              <div className="px-3 py-4 text-center">
                <p className="text-[11px] text-white/20">Şu an aktif yayın yok</p>
                {isVerified && (
                  <p className="text-[10px] text-emerald-400/50 mt-1">İlk yayını sen başlat!</p>
                )}
              </div>
            )}
            {liveStreams.map(stream => (
              <div
                key={stream.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-white/5 transition-all mx-1"
              >
                <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-xs font-bold text-white/40 border border-white/10 relative flex-shrink-0">
                  {(stream.username || '?').substring(0, 2).toUpperCase()}
                  <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-black animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">{stream.username}</p>
                  <p className="text-[10px] text-white/30 truncate">{stream.title || 'Canlı Yayın'}</p>
                </div>
                <div className="flex items-center gap-1 text-white/30">
                  <Eye size={10} />
                  <span className="text-[10px]">{stream.viewers || 0}</span>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </aside>
  );
};
