import React from 'react';
import { motion } from 'motion/react';
import { 
  Home, Layout, Users, Gamepad2, MessageSquare, Tv, Bot, Plus, Search, Shield, UserCheck, Settings
} from 'lucide-react';
import { CompanyLogo } from './CompanyLogo';

interface SidebarProps {
  view: string;
  setView: (view: any) => void;
  theme: any;
  siteSettings: any;
  setActiveDmUserId: (id: string | null) => void;
  onShowSettings?: () => void;
  onShowPrivacy?: () => void;
  isAdmin?: boolean;
}

export const Sidebar = ({ view, setView, theme, siteSettings, setActiveDmUserId, onShowSettings, onShowPrivacy, isAdmin }: SidebarProps) => {
  return (
    <nav 
      className={`w-[68px] flex flex-col items-center py-4 space-y-4 border-r border-white/5 z-20 transition-all duration-500 ${theme.glass ? 'backdrop-blur-xl' : ''}`}
      style={{ backgroundColor: theme.sidebar }}
    >
      <motion.div 
        whileHover={{ scale: 1.1, rotate: 5 }}
        onClick={() => { setView('chat'); setActiveDmUserId(null); }}
        className="w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer transition-all"
      >
        <CompanyLogo size={32} color={view === 'chat' ? theme.accent : "#4CAF50"} siteName={siteSettings.site_name} />
      </motion.div>
      
      <div 
        onClick={() => setView('chat')}
        className={`w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all border ${view === 'chat' ? 'text-white border-white/20' : 'text-white/40 border-transparent hover:text-white'}`}
        style={{ backgroundColor: view === 'chat' ? theme.accentLight : 'transparent' }}
        title="Anasayfa"
      >
        <Home size={20} />
      </div>
      <div 
        onClick={() => setView('forum')}
        className={`w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all border ${view === 'forum' ? 'text-white border-white/20' : 'text-white/40 border-transparent hover:text-white'}`}
        style={{ backgroundColor: view === 'forum' ? theme.accentLight : 'transparent' }}
        title="Form"
      >
        <Layout size={20} />
      </div>
      <div 
        onClick={() => setView('dm')}
        className={`w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all border ${view === 'dm' ? 'text-white border-white/20' : 'text-white/40 border-transparent hover:text-white'}`}
        style={{ backgroundColor: view === 'dm' ? theme.accentLight : 'transparent' }}
        title="Arkadaşlar"
      >
        <Users size={20} />
      </div>
      <div 
        onClick={() => setView('games')}
        className={`w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all border ${view === 'games' ? 'text-white border-white/20' : 'text-white/40 border-transparent hover:text-white'}`}
        style={{ backgroundColor: view === 'games' ? theme.accentLight : 'transparent' }}
        title="Oyunlar"
      >
        <Gamepad2 size={20} />
      </div>
      <div 
        onClick={() => setView('live-chat')}
        className={`w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all border ${view === 'live-chat' ? 'text-white border-white/20' : 'text-white/40 border-transparent hover:text-white'}`}
        style={{ backgroundColor: view === 'live-chat' ? theme.accentLight : 'transparent' }}
        title="Canlı Sohbet Odası"
      >
        <MessageSquare size={20} />
      </div>
      <div 
        onClick={() => setView('live-tv')}
        className={`w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all border ${view === 'live-tv' ? 'text-white border-white/20' : 'text-white/40 border-transparent hover:text-white'}`}
        style={{ backgroundColor: view === 'live-tv' ? theme.accentLight : 'transparent' }}
        title="Canlı TV"
      >
        <Tv size={20} />
      </div>
      <div 
        onClick={() => setView('robot-house')}
        className={`w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all border ${view === 'robot-house' ? 'text-white border-white/20' : 'text-white/40 border-transparent hover:text-white'}`}
        style={{ backgroundColor: view === 'robot-house' ? theme.accentLight : 'transparent' }}
        title="Robot Evi"
      >
        <Bot size={20} />
      </div>
      <div 
        onClick={() => setView('create-server')}
        className={`w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all border ${view === 'create-server' ? 'text-white border-white/20' : 'text-white/40 border-transparent hover:text-white'}`}
        style={{ backgroundColor: view === 'create-server' ? theme.accentLight : 'transparent' }}
        title="Sunucu Oluştur"
      >
        <Plus size={20} />
      </div>
      <div 
        onClick={() => setView('search')}
        className={`w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all border ${view === 'search' ? 'text-white border-white/20' : 'text-white/40 border-transparent hover:text-white'}`}
        style={{ backgroundColor: view === 'search' ? theme.accentLight : 'transparent' }}
        title="Global Ara"
      >
        <Search size={20} />
      </div>

      <div
        onClick={() => setView('guilds')}
        className={`w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all border text-lg ${view === 'guilds' ? 'border-white/20 bg-white/10' : 'border-transparent text-white/60 hover:text-white'}`}
        title="Sunucular"
      >
        🏰
      </div>

      <div
        onClick={() => setView('friends')}
        className={`w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all border ${view === 'friends' ? 'text-white border-white/20' : 'text-white/40 border-transparent hover:text-white'}`}
        style={{ backgroundColor: view === 'friends' ? theme.accentLight : 'transparent' }}
        title="Arkadaşlar"
      >
        <UserCheck size={20} />
      </div>
      
      <div className="flex-1" />


      {isAdmin && (
        <motion.div 
          whileHover={{ rotate: 90 }}
          className={`w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all ${view === 'admin' ? 'text-white border-white/20' : 'text-white/40 border-transparent hover:text-white'}`}
          style={{ backgroundColor: view === 'admin' ? theme.accentLight : 'transparent' }}
          onClick={() => setView('admin')}
          title="Yönetici Paneli"
        >
          <Shield size={20} />
        </motion.div>
      )}

      {onShowSettings && (
        <div onClick={onShowSettings}
          className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer text-white/40 border border-transparent hover:text-white hover:bg-white/5 transition-all"
          title="Ayarlar">
          <Settings size={20} />
        </div>
      )}

      <div 
        onClick={() => setView('profile')}
        className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer border-2 transition-all ${view === 'profile' ? 'scale-110 shadow-lg' : 'opacity-80 hover:opacity-100'}`} 
        style={{ 
          backgroundColor: 'rgb(245, 158, 11)',
          borderColor: view === 'profile' ? theme.accent : 'transparent',
          color: 'black'
        }}
        title="Profil"
      >
        GE
      </div>
    </nav>
  );
};
