import { useState, useEffect, useRef, FormEvent, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Home, MessageSquare, Tv, Users, Menu, X } from 'lucide-react';

import { Sidebar } from './components/Sidebar';
import { ChannelSidebar } from './components/ChannelSidebar';
import { ChatArea } from './components/ChatArea';
import { AdminPanel } from './components/AdminPanel';
import { NatureBotMascot } from './components/NatureBotMascot';
import { Forum } from './components/Forum';
import { DirectMessages } from './components/DirectMessages';
import { Games } from './components/Games';
import { LiveSection } from './components/LiveSection';
import { RobotHouse } from './components/RobotHouse';
import { ProfilePage } from './components/ProfilePage';
import { GuildSystem } from './components/GuildSystem';
import { GlobalSearch } from './components/GlobalSearch';
import { AuthPage } from './components/AuthPage';
import { NotificationCenter } from './components/NotificationCenter';
import { CallWindow, IncomingCallNotification, useCallManager } from './components/CallWindow';
import { FriendSystem } from './components/FriendSystem';
import { UserSettings } from './components/UserSettings';
import { PrivacyPolicy } from './components/PrivacyPolicy';

import { themes, ThemeKey } from './constants/themes';
import { Channel, Message, SiteSettings } from './types';
import { NatureBotService } from './services/aiService';
import { checkRateLimit } from './services/securityService';
import { playMessageSound, startRingtone, stopRingtone, playCallConnected, playCallEnded } from './services/soundService';
import {
  listenChannels, listenMessages, listenOnlineUsers, listenSettings, listenUsers,
  sendMessage as fbSendMessage, createChannel as fbCreateChannel,
  setUserOnline, setUserOffline, addReaction, pinMessage, editMessage, deleteMessage,
  listenPolls, votePoll as fbVotePoll, uploadFile, createPoll as fbCreatePoll
} from './services/firebaseService';

export default function App() {
  const [authReady, setAuthReady] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [view, setView] = useState<'chat'|'forum'|'dm'|'games'|'live-chat'|'live-tv'|'robot-house'|'admin'|'profile'|'guilds'|'search'|'friends'>('chat');
  const [themeKey, setThemeKey] = useState<ThemeKey>('harmony');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [activeChannel, setActiveChannel] = useState('genel');
  const [currentChannelId, setCurrentChannelId] = useState('genel');
  const [tvChannel, setTvChannel] = useState('trt1');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeDmUserId, setActiveDmUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isCreateChannelModalOpen, setIsCreateChannelModalOpen] = useState(false);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [polls, setPolls] = useState<any[]>([]);
  const [unreadChannels, setUnreadChannels] = useState<Record<string, number>>({});
  const [unreadDms, setUnreadDms] = useState<Record<string, number>>({});
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    site_name: 'Nature.co', maintenance_mode: 'false',
    maintenance_message: 'Sistem bakımdadır.', allow_registration: 'true'
  });

  const theme = themes[themeKey];
  const chatEndRef = useRef<HTMLDivElement>(null);
  const botService = useMemo(() => new NatureBotService(''), []);

  // Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
      setAuthReady(true);
    });
    return unsub;
  }, []);

  const userId = currentUser?.uid || '';
  const displayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || userId;

  // Mevcut kullanıcının admin yetkisini allUsers'dan al
  const currentUserData = allUsers.find(u => u.id === userId);
  const isAdmin = currentUserData?.is_admin === true;
  const isVerified = currentUserData?.is_verified === true;

  // Call manager
  const { activeCall, incomingCall, startCall, acceptCall, rejectCall, endCall } = useCallManager(userId, displayName);

  // Gelen arama zil sesi
  useEffect(() => {
    if (incomingCall) {
      startRingtone();
    } else {
      stopRingtone();
    }
    return () => stopRingtone();
  }, [incomingCall]);

  // Arama bağlandı / bitti sesi
  const prevActiveCallRef = useRef<any>(null);
  useEffect(() => {
    if (activeCall && !prevActiveCallRef.current) {
      playCallConnected();
    } else if (!activeCall && prevActiveCallRef.current) {
      playCallEnded();
    }
    prevActiveCallRef.current = activeCall;
  }, [activeCall]);

  // Firebase listeners
  useEffect(() => {
    if (!currentUser) return;
    setUserOnline(userId, displayName);
    const unsubs = [
      listenChannels(setChannels),
      listenOnlineUsers(setOnlineUsers),
      listenUsers(setAllUsers),
      listenSettings(s => setSiteSettings(prev => ({ ...prev, ...s }))),
    ];
    return () => {
      unsubs.forEach(u => u());
      setUserOffline(userId);
    };
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    return listenMessages(currentChannelId, setMessages as any);
  }, [currentChannelId, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    return listenPolls(currentChannelId, setPolls);
  }, [currentChannelId, currentUser]);

  // Yeni mesaj bildirimi sesi + okunmamış sayacı
  const prevMsgCountRef = useRef(0);
  useEffect(() => {
    if (messages.length > prevMsgCountRef.current && prevMsgCountRef.current > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.sender_id !== userId) {
        if (!isMuted) {
          try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            ctx.resume().then(() => { playMessageSound(); setTimeout(() => ctx.close(), 1000); }).catch(() => playMessageSound());
          } catch (_) { playMessageSound(); }
        }
        if (document.hidden || currentChannelId !== activeChannel) {
          setUnreadChannels(prev => ({ ...prev, [currentChannelId]: (prev[currentChannelId] || 0) + 1 }));
        }
      }
    }
    prevMsgCountRef.current = messages.length;
  }, [messages, userId, isMuted, currentChannelId, activeChannel]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !currentUser) return;
    if (!checkRateLimit(`msg_${userId}`, 20)) return; // max 20 msg/min
    const userMessage = input.trim();
    setInput('');

    if (activeChannel === 'NatureBot') {
      setIsLoading(true);
      const newMsg: any = {
        id: Date.now().toString(), sender_id: userId, sender_name: displayName,
        content: userMessage, timestamp: new Date().toISOString(), type: 'text'
      };
      setMessages(prev => [...prev, newMsg]);
      try {
        const aiData = await botService.chat(userMessage);
        const botMsg: any = {
          id: (Date.now()+1).toString(), sender_id: 'NatureBot', sender_name: 'NatureBot',
          content: aiData.content, timestamp: new Date().toISOString(), type: 'text'
        };
        setMessages(prev => [...prev, botMsg]);
        if (!isMuted) botService.speak(aiData.content);
      } catch {} finally { setIsLoading(false); }
    } else {
      const mentions: string[] = [];
      const mentionRegex = /@(\w+)/g;
      let match;
      while ((match = mentionRegex.exec(userMessage)) !== null) {
        const u = allUsers.find(u => u.username.toLowerCase() === match[1].toLowerCase());
        if (u) mentions.push(u.id);
      }
      await fbSendMessage(currentChannelId, userId, displayName, userMessage, {
        mentions, senderAvatar: currentUser.photoURL || ''
      });
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const { url, name, type } = await uploadFile(file, userId);
      await fbSendMessage(currentChannelId, userId, displayName, name, {
        fileUrl: url, fileName: name, fileType: type, senderAvatar: currentUser.photoURL || ''
      });
    } finally { setIsLoading(false); }
  };

  const filteredMessages = useMemo(() => {
    if (!searchQuery) return messages;
    return messages.filter((m: any) => m.content?.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [messages, searchQuery]);

  if (!authReady) return (
    <div className="w-screen bg-[#0B0E11] flex items-center justify-center" style={{ height: '100dvh' }}>
      <div className="text-white/40 text-sm animate-pulse">Yükleniyor...</div>
    </div>
  );

  if (!currentUser) return <AuthPage onAuth={() => {}} />;

  return (
    <div className="flex font-sans overflow-hidden select-none transition-all duration-700 relative"
      style={{ height: '100dvh', background: theme.bg, color: theme.text }}>

      {/* ── Desktop Sidebar (md+) ─────────────────────────────────────── */}
      <div className="hidden md:flex">
        <Sidebar view={view} setView={v => { setView(v); setMobileSidebarOpen(false); }} theme={theme} siteSettings={siteSettings} setActiveDmUserId={setActiveDmUserId} onShowSettings={() => setShowSettings(true)} onShowPrivacy={() => setShowPrivacy(true)} isAdmin={isAdmin} />
      </div>

      {/* ── Mobile Sidebar Overlay ────────────────────────────────────── */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 md:hidden"
              onClick={() => setMobileSidebarOpen(false)} />
            <motion.div initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed left-0 top-0 bottom-0 z-50 md:hidden flex"
              style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
              <Sidebar view={view} setView={v => { setView(v); setMobileSidebarOpen(false); }} theme={theme} siteSettings={siteSettings} setActiveDmUserId={setActiveDmUserId} onShowSettings={() => { setShowSettings(true); setMobileSidebarOpen(false); }} onShowPrivacy={() => { setShowPrivacy(true); setMobileSidebarOpen(false); }} isAdmin={isAdmin} />
              <ChannelSidebar
                theme={theme} siteSettings={siteSettings} view={view} setView={v => { setView(v); setMobileSidebarOpen(false); }}
                activeChannel={activeChannel} setActiveChannel={setActiveChannel}
                channels={channels} currentChannelId={currentChannelId}
                setCurrentChannelId={id => { setCurrentChannelId(id); setUnreadChannels(p => ({ ...p, [id]: 0 })); }} onlineUsers={onlineUsers}
                allUsers={allUsers} userId={userId} setActiveDmUserId={id => { setActiveDmUserId(id); setMobileSidebarOpen(false); setUnreadDms(p => ({ ...p, [id || '']: 0 })); }}
                activeDmUserId={activeDmUserId} setIsCreateChannelModalOpen={setIsCreateChannelModalOpen}
                tvChannel={tvChannel} setTvChannel={setTvChannel} isVerified={isVerified}
                unreadChannels={unreadChannels} unreadDms={unreadDms}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Desktop Channel Sidebar (md+) ────────────────────────────── */}
      <div className="hidden md:flex">
        <ChannelSidebar
          theme={theme} siteSettings={siteSettings} view={view} setView={setView}
          activeChannel={activeChannel} setActiveChannel={setActiveChannel}
          channels={channels} currentChannelId={currentChannelId}
          setCurrentChannelId={id => { setCurrentChannelId(id); setUnreadChannels(p => ({ ...p, [id]: 0 })); }} onlineUsers={onlineUsers}
          allUsers={allUsers} userId={userId} setActiveDmUserId={id => { setActiveDmUserId(id); setUnreadDms(p => ({ ...p, [id || '']: 0 })); }}
          activeDmUserId={activeDmUserId} setIsCreateChannelModalOpen={setIsCreateChannelModalOpen}
          tvChannel={tvChannel} setTvChannel={setTvChannel} isVerified={isVerified}
          unreadChannels={unreadChannels} unreadDms={unreadDms}
        />
      </div>

      {/* Create channel modal */}
      <AnimatePresence>
        {isCreateChannelModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-[#111418] border border-white/10 rounded-2xl p-6 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-4">Yeni Kanal</h3>
              <form onSubmit={async e => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const name = fd.get('name') as string;
                if (!name) return;
                await fbCreateChannel(name);
                setIsCreateChannelModalOpen(false);
              }}>
                <input name="name" placeholder="kanal-adı" autoFocus
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 mb-4" />
                <div className="flex gap-3">
                  <button type="button" onClick={() => setIsCreateChannelModalOpen(false)}
                    className="flex-1 px-4 py-2 bg-white/5 text-white/60 rounded-xl text-sm">İptal</button>
                  <button type="submit"
                    className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-bold">Oluştur</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col relative z-0 min-w-0"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex-1 flex flex-col min-h-0 md:mb-0 mb-[56px]">
        {view === 'chat' && (
          <ChatArea
            theme={theme} activeChannel={activeChannel} searchQuery={searchQuery}
            setSearchQuery={setSearchQuery} isMuted={isMuted} setIsMuted={setIsMuted}
            polls={polls} votePoll={(pollId, idx) => fbVotePoll(currentChannelId, pollId, userId, idx)}
            filteredMessages={filteredMessages} userId={userId} currentUser={currentUser}
            input={input} setInput={setInput} handleSendMessage={handleSendMessage}
            isLoading={isLoading} chatEndRef={chatEndRef}
            onFileUpload={handleFileUpload} onImageUpload={() => {}} onVoiceRecord={() => {}}
            onStartDM={(id) => { setActiveDmUserId(id); setView('dm'); }}
            allUsers={allUsers}
            onReact={(msgId, emoji) => addReaction(currentChannelId, msgId, emoji, userId)}
            onPin={(msgId, pinned) => pinMessage(currentChannelId, msgId, pinned)}
            onEdit={(msgId, content) => editMessage(currentChannelId, msgId, content)}
            onDelete={(msgId) => deleteMessage(currentChannelId, msgId)}
            onCreatePoll={(q, opts) => fbCreatePoll(currentChannelId, userId, q, opts)}
            isCompact={isCompact} fontSize={fontSize}
          />
        )}
        {view === 'admin' && isAdmin && <AdminPanel theme={theme} siteSettings={siteSettings} updateSiteSettings={() => {}} />}
        {view === 'admin' && !isAdmin && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">🚫</div>
              <p className="text-white/50 text-lg font-bold">Erişim Reddedildi</p>
              <p className="text-white/30 text-sm mt-2">Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
            </div>
          </div>
        )}
        {view === 'forum' && <Forum theme={theme} />}
        {view === 'dm' && (
          <DirectMessages theme={theme} userId={userId} activeDmUserId={activeDmUserId}
            currentUserName={displayName}
            onStartCall={(targetId, targetName, mode) => startCall(targetId, targetName, mode)}
          />
        )}
        {view === 'games' && <Games theme={theme} />}
        {view === 'live-tv' && <LiveSection theme={theme} type="tv" tvChannel={tvChannel} userId={userId} username={displayName} />}
        {view === 'live-chat' && <LiveSection theme={theme} type="chat" userId={userId} username={displayName} isVerified={isVerified} />}
        {view === 'robot-house' && <RobotHouse theme={theme} />}
        {view === 'profile' && <ProfilePage theme={theme} userId={userId} />}
        {view === 'guilds' && <GuildSystem theme={theme} userId={userId} username={displayName} />}
        {view === 'friends' && (
          <FriendSystem theme={theme} userId={userId} allUsers={allUsers}
            onStartDM={(id) => { setActiveDmUserId(id); setView('dm'); }} />
        )}
        {view === 'search' && (
          <GlobalSearch theme={theme} onNavigate={(type, id) => {
            if (type === 'channel') { setCurrentChannelId(id); setActiveChannel(id); setView('chat'); }
            else if (type === 'user') { setActiveDmUserId(id); setView('dm'); }
          }} />
        )}
        </div>

        {/* ── Mobile Bottom Navigation (md altı) ──────────────────────── */}
        <nav className="fixed bottom-0 left-0 right-0 z-30 flex md:hidden border-t border-white/10"
          style={{
            backgroundColor: theme.sidebar,
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}>
          {[
            { icon: Home,          label: 'Sohbet',  v: 'chat' },
            { icon: MessageSquare, label: 'Canlı',   v: 'live-chat' },
            { icon: Tv,            label: 'TV',      v: 'live-tv' },
            { icon: Users,         label: 'Arkadaş', v: 'dm' },
            { icon: Menu,          label: 'Menü',    v: '__menu__' },
          ].map(({ icon: Icon, label, v }) => (
            <button key={v} onClick={() => v === '__menu__' ? setMobileSidebarOpen(true) : setView(v)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] transition-all
                ${view === v ? 'text-emerald-400' : 'text-white/40'}`}>
              <Icon size={20} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </main>

      {/* Gelen çağrı bildirimi */}
      <AnimatePresence>
        {incomingCall && (
          <IncomingCallNotification call={incomingCall} onAccept={acceptCall} onReject={rejectCall} />
        )}
      </AnimatePresence>

      {/* Aktif arama */}
      <AnimatePresence>
        {activeCall && (
          <CallWindow
            userId={userId} username={displayName}
            targetUserId={activeCall.targetUserId} targetUsername={activeCall.targetUsername}
            mode={activeCall.mode} isIncoming={activeCall.isIncoming}
            onEnd={endCall}
          />
        )}
      </AnimatePresence>

      {/* User Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <UserSettings
            userId={userId}
            currentTheme={themeKey}
            onThemeChange={(t) => setThemeKey(t as ThemeKey)}
            onClose={() => setShowSettings(false)}
            onCompactChange={setIsCompact}
            onFontSizeChange={setFontSize}
            isCompact={isCompact}
            fontSize={fontSize}
          />
        )}
      </AnimatePresence>

      {/* Privacy Policy Modal */}
      <AnimatePresence>
        {showPrivacy && <PrivacyPolicy onClose={() => setShowPrivacy(false)} />}
      </AnimatePresence>
    </div>
  );
}
