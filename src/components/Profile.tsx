import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User as UserIcon, LogOut, Settings, Shield, Bell, Lock, Globe, Edit3, Check, Camera, Mail, UserCircle
} from 'lucide-react';

interface ProfileProps {
  theme: any;
  userId: string;
}

export const Profile = ({ theme, userId }: ProfileProps) => {
  const [activeTab, setActiveTab] = useState('general');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0B0E11]">
      {/* Profile Header */}
      <header className="h-14 border-b border-white/5 flex items-center px-6 justify-between bg-black/20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <UserIcon size={20} className="text-blue-500" />
          <h3 className="font-bold text-white uppercase tracking-widest text-sm">Kullanıcı Profili</h3>
        </div>
        <button className="flex items-center gap-2 text-red-500 hover:text-red-400 text-xs font-bold transition-all">
          <LogOut size={16} /> Çıkış Yap
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Profile Sidebar */}
        <aside className="w-64 border-r border-white/5 bg-black/10 p-6 space-y-2">
          {[
            { id: 'general', label: 'Genel Ayarlar', icon: Settings },
            { id: 'privacy', label: 'Gizlilik & Güvenlik', icon: Shield },
            { id: 'notifications', label: 'Bildirimler', icon: Bell },
            { id: 'account', label: 'Hesap Yönetimi', icon: Lock },
            { id: 'language', label: 'Dil & Bölge', icon: Globe },
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                activeTab === tab.id ? 'bg-white/5 text-white border border-white/10 shadow-xl' : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </aside>

        {/* Profile Content */}
        <main className="flex-1 p-12 overflow-y-auto custom-scrollbar bg-[#0B0E11]">
          <div className="max-w-3xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-10 mb-16"
            >
              <div className="relative group">
                <div className="w-40 h-40 rounded-[48px] bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 flex items-center justify-center text-white text-5xl font-black shadow-2xl shadow-blue-500/20 relative overflow-hidden">
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                  {userId.substr(0, 2).toUpperCase()}
                </div>
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="absolute -bottom-2 -right-2 p-4 bg-white text-black rounded-2xl shadow-2xl z-10 hover:bg-blue-50 transition-colors"
                >
                  <Camera size={20} />
                </motion.button>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-2">
                  <h2 className="text-4xl font-black text-white tracking-tight">{userId}</h2>
                  <div className="px-3 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-black rounded-full uppercase tracking-widest border border-blue-500/20">
                    Doğrulanmış
                  </div>
                </div>
                <p className="text-white/40 text-sm font-medium">Ekosistem Üyesi • 12 Mart 2024'ten beri</p>
                <div className="flex gap-3 mt-6">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-1">İtibar</span>
                    <span className="text-lg font-black text-emerald-500">2,450</span>
                  </div>
                  <div className="w-px h-10 bg-white/5 mx-4" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-1">Tohumlar</span>
                    <span className="text-lg font-black text-blue-500">124</span>
                  </div>
                  <div className="w-px h-10 bg-white/5 mx-4" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-1">Seviye</span>
                    <span className="text-lg font-black text-purple-500">12</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <AnimatePresence mode="wait">
              {activeTab === 'general' && (
                <motion.div
                  key="general"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="p-10 bg-white/5 border border-white/10 rounded-[40px] backdrop-blur-xl shadow-2xl">
                    <div className="flex items-center gap-3 mb-10">
                      <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500">
                        <UserCircle size={20} />
                      </div>
                      <h4 className="text-lg font-bold text-white">Profil Bilgileri</h4>
                    </div>
                    
                    <div className="space-y-8">
                      <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest block ml-1">Görünen Ad</label>
                          <div className="relative">
                            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                            <input 
                              type="text" 
                              defaultValue={userId}
                              className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest block ml-1">E-posta Adresi</label>
                          <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                            <input 
                              type="email" 
                              defaultValue="tohum@nature.co"
                              className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest block ml-1">Hakkımda</label>
                        <textarea 
                          defaultValue="Doğayı ve teknolojiyi seviyorum. Ekosistemin bir parçası olmaktan mutluyum."
                          className="w-full bg-black/40 border border-white/10 rounded-3xl px-6 py-5 text-sm text-white focus:outline-none focus:border-blue-500/50 h-40 resize-none leading-relaxed"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-10 bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-[40px] backdrop-blur-xl">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-500">
                        <Shield size={32} />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-white">Hesap Güvenliği</h4>
                        <p className="text-sm text-white/40 mt-1">İki faktörlü doğrulama aktif. Hesabınız güvende.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-500 bg-emerald-500/10 px-6 py-3 rounded-2xl border border-emerald-500/20 font-black text-xs uppercase tracking-widest">
                      <Check size={18} />
                      Güvenli
                    </div>
                  </div>

                  <div className="flex gap-6">
                    <motion.button 
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSave}
                      className="flex-1 py-5 bg-blue-600 text-white rounded-3xl font-black text-sm shadow-2xl shadow-blue-600/20 transition-all flex items-center justify-center gap-3"
                    >
                      {isSaved ? <><Check size={20} /> DEĞİŞİKLİKLER KAYDEDİLDİ</> : 'AYARLARI KAYDET'}
                    </motion.button>
                    <motion.button 
                      whileHover={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                      className="px-12 py-5 bg-white/5 text-white/60 rounded-3xl font-black text-sm transition-all border border-white/10"
                    >
                      İPTAL
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
};
