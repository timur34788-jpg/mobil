import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../firebase';
import { ref, onValue, update, remove, get, push, set, off } from 'firebase/database';
import { sendPasswordResetEmail } from 'firebase/auth';
import { DEFAULT_TV_CHANNELS } from './ChannelSidebar';
import {
  Shield, Users, MessageSquare, Settings, Ban, UserX, UserCheck,
  Trash2, RefreshCw, Activity, Save, Bell, Lock, Unlock, Eye,
  Edit3, Search, Download, Plus, VolumeX, Volume2, Hash,
  BarChart2, Palette, FileText, LogOut, ChevronRight, X, Check,
  AlertTriangle, Database, Zap, Filter, Send, BadgeCheck, Tv
} from 'lucide-react';

const TABS = [
  { id: 'overview',    label: 'Genel Bakış',    icon: BarChart2 },
  { id: 'users',       label: 'Kullanıcılar',   icon: Users },
  { id: 'verify',      label: 'Rozet Talepleri',icon: BadgeCheck },
  { id: 'tv_channels', label: 'TV Kanalları',   icon: Tv },
  { id: 'messages',    label: 'Mesajlar',        icon: MessageSquare },
  { id: 'channels',    label: 'Odalar',          icon: Hash },
  { id: 'forum',       label: 'Forum',           icon: FileText },
  { id: 'announce',    label: 'Duyurular',       icon: Bell },
  { id: 'design',      label: 'Tasarım',         icon: Palette },
  { id: 'settings',    label: 'Ayarlar',         icon: Settings },
  { id: 'security',    label: 'Güvenlik',        icon: Shield },
  { id: 'logs',        label: 'Loglar',          icon: Activity },
];

function addLog(action: string, detail: string) {
  push(ref(db, 'logs'), {
    action, detail, timestamp: new Date().toISOString(), admin: auth.currentUser?.displayName || 'admin'
  });
}

const VerifyRequestCard = ({ req, onApprove, onReject }: { req: any; onApprove: () => void; onReject: (note: string) => void }) => {
  const [rejectNote, setRejectNote] = useState('');
  const [showReject, setShowReject] = useState(false);

  const statusColor = req.status === 'approved' ? 'text-emerald-400' : req.status === 'rejected' ? 'text-red-400' : 'text-yellow-400';
  const statusLabel = req.status === 'approved' ? '✓ Onaylandı' : req.status === 'rejected' ? '✗ Reddedildi' : '⏳ Bekliyor';

  return (
    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">{req.username}</span>
            <span className={`text-xs font-bold ${statusColor}`}>{statusLabel}</span>
          </div>
          <p className="text-xs text-white/40">{req.email} • {req.requestedAt ? new Date(req.requestedAt).toLocaleString('tr-TR') : ''}</p>
        </div>
        <BadgeCheck size={20} className="text-blue-400 flex-shrink-0" />
      </div>
      <p className="text-sm text-white/70 bg-white/5 rounded-xl px-3 py-2 mb-3">"{req.note}"</p>
      {req.status === 'pending' && (
        <div>
          {!showReject ? (
            <div className="flex gap-2">
              <button
                onClick={onApprove}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl text-sm font-bold hover:bg-emerald-500/30 transition-all"
              >
                <Check size={14} /> Onayla
              </button>
              <button
                onClick={() => setShowReject(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-bold hover:bg-red-500/20 transition-all"
              >
                <X size={14} /> Reddet
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <input
                value={rejectNote}
                onChange={e => setRejectNote(e.target.value)}
                placeholder="Red gerekçesi (opsiyonel)..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-red-500/50"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { onReject(rejectNote); setShowReject(false); }}
                  className="px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl text-sm font-bold hover:bg-red-500/30 transition-all"
                >
                  Reddi Gönder
                </button>
                <button onClick={() => setShowReject(false)} className="px-4 py-2 text-white/40 hover:text-white text-sm transition-all">İptal</button>
              </div>
            </div>
          )}
        </div>
      )}
      {req.status === 'rejected' && req.adminNote && (
        <p className="text-xs text-red-400/70">Gerekçe: {req.adminNote}</p>
      )}
    </div>
  );
};

export const AdminPanel = ({ theme, siteSettings, updateSiteSettings }: {
  theme: any; siteSettings: any; updateSiteSettings: (s: any) => void;
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [allMessages, setAllMessages] = useState<Record<string, any[]>>({});
  const [forumPosts, setForumPosts] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [searchUser, setSearchUser] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [muteMinutes, setMuteMinutes] = useState(10);
  const [announceText, setAnnounceText] = useState('');
  const [announceChannel, setAnnounceChannel] = useState('all');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');
  const [isAdminVerified, setIsAdminVerified] = useState<boolean | null>(null);
  const [verifyRequests, setVerifyRequests] = useState<any[]>([]);
  const [tvChannels, setTvChannels] = useState<any[]>([]);
  const [tvForm, setTvForm] = useState({ id: '', name: '', emoji: '📺', desc: '', youtubeChannelId: '', color: '#10b981', order: 0 });
  const [tvEditId, setTvEditId] = useState<string | null>(null);
  const [tvFormOpen, setTvFormOpen] = useState(false);
  const [settings, setSettings] = useState({
    site_name: siteSettings.site_name || 'Nature.co',
    welcome_message: siteSettings.welcome_message || '',
    allow_registration: siteSettings.allow_registration !== 'false',
    maintenance_mode: siteSettings.maintenance_mode === 'true',
    message_history_limit: siteSettings.message_history_limit || 100,
    max_users: siteSettings.max_users || 1000,
    min_username_length: siteSettings.min_username_length || 3,
    banned_words: siteSettings.banned_words || '',
    invite_code: siteSettings.invite_code || '',
    ai_api_key: siteSettings.ai_api_key || '',
  });
  const [designSettings, setDesignSettings] = useState({
    primary_color: '#10b981',
    bg_color: '#0B0E11',
    font_size: '14',
    border_radius: '8',
    bg_style: 'dark',
  });
  const [logFilter, setLogFilter] = useState('');

  // ─── ADMIN DOĞRULAMA (3. katman güvenlik) ───────────────────────────────────
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) { setIsAdminVerified(false); return; }
    get(ref(db, `users/${uid}/is_admin`)).then(snap => {
      setIsAdminVerified(snap.val() === true);
    }).catch(() => setIsAdminVerified(false));
  }, []);

  // ─── DATA LISTENERS ──────────────────────────────────────────────────────────
  useEffect(() => {
    const refs: any[] = [];

    const uRef = ref(db, 'users');
    onValue(uRef, snap => {
      const d = snap.val() || {};
      setUsers(Object.entries(d).map(([id, v]: any) => ({
        id, username: v.username || id, email: v.email || '',
        status: v.status || 'offline', is_admin: v.is_admin || false,
        is_banned: v.is_banned || false, is_muted: v.is_muted || false,
        mute_until: v.mute_until || null,
        created_at: v.created_at || '', message_count: v.message_count || 0,
        xp: v.xp || 0, ip: v.last_ip || '-',
      })));
    });
    refs.push(uRef);

    const cRef = ref(db, 'channels');
    onValue(cRef, snap => {
      const d = snap.val() || {};
      setChannels(Object.entries(d).map(([id, v]: any) => ({
        id, name: v.name || id, type: v.type || 'text',
        is_locked: v.is_locked || false, slow_mode: v.slow_mode || 0,
        description: v.description || '', is_readonly: v.is_readonly || false,
        is_hidden: v.is_hidden || false,
      })));
    });
    refs.push(cRef);

    const mRef = ref(db, 'messages');
    onValue(mRef, snap => {
      const d = snap.val() || {};
      const byChannel: Record<string, any[]> = {};
      Object.entries(d).forEach(([ch, msgs]: any) => {
        byChannel[ch] = Object.entries(msgs || {}).map(([id, v]: any) => ({
          id, channel: ch, sender_name: v.sender_name || v.sender_id,
          content: v.content, timestamp: v.timestamp, is_pinned: v.is_pinned
        })).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      });
      setAllMessages(byChannel);
    });
    refs.push(mRef);

    const fRef = ref(db, 'forum');
    onValue(fRef, snap => {
      const d = snap.val() || {};
      setForumPosts(Object.entries(d).map(([id, v]: any) => ({
        id, title: v.title, author: v.author, content: v.content,
        likes: Object.keys(v.likes || {}).length,
        comments: Object.keys(v.comments || {}).length,
        created_at: v.created_at,
      })).sort((a, b) => (b.created_at || 0) - (a.created_at || 0)));
    });
    refs.push(fRef);

    const lRef = ref(db, 'logs');
    onValue(lRef, snap => {
      const d = snap.val() || {};
      setLogs(Object.entries(d).map(([id, v]: any) => ({ id, ...v }))
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, 200));
    });
    refs.push(lRef);

    const oRef = ref(db, 'online');
    onValue(oRef, snap => {
      const d = snap.val() || {};
      setOnlineUsers(Object.keys(d).filter(k => d[k] === true));
    });
    refs.push(oRef);

    const vRef = ref(db, 'verification_requests');
    onValue(vRef, snap => {
      const d = snap.val() || {};
      setVerifyRequests(Object.entries(d).map(([id, v]: any) => ({ id, ...v })));
    }, (err) => {
      console.warn('verification_requests root okuma başarısız, alternatif yöntem deneniyor:', err.message);
    });
    refs.push(vRef);

    const tvRef = ref(db, 'tv_channels');
    onValue(tvRef, snap => {
      const d = snap.val();
      if (d) {
        const list = Object.entries(d)
          .map(([id, v]: any) => ({ id, ...v }))
          .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
        setTvChannels(list);
      } else {
        setTvChannels([]);
      }
    });
    refs.push(tvRef);

    return () => refs.forEach(r => off(r));
  }, []);

  // ─── STATS ───────────────────────────────────────────────────────────────────
  const totalMsg = Object.values(allMessages).reduce((s, msgs) => s + msgs.length, 0);
  const bannedCount = users.filter(u => u.is_banned).length;
  const adminCount = users.filter(u => u.is_admin).length;
  const activeChannel = channels.length > 0
    ? [...channels].sort((a, b) => (allMessages[b.id]?.length || 0) - (allMessages[a.id]?.length || 0))[0]
    : null;

  // ─── USER ACTIONS ─────────────────────────────────────────────────────────────
  const banUser = async (u: any) => {
    await update(ref(db, `users/${u.id}`), { is_banned: !u.is_banned });
    addLog(u.is_banned ? 'UNBAN' : 'BAN', `${u.username}`);
  };
  const toggleAdmin = async (u: any) => {
    await update(ref(db, `users/${u.id}`), { is_admin: !u.is_admin });
    addLog(u.is_admin ? 'REMOVE_ADMIN' : 'MAKE_ADMIN', u.username);
  };
  const deleteUser = async (u: any) => {
    if (!confirm(`${u.username} silinsin mi?`)) return;
    await remove(ref(db, `users/${u.id}`));
    addLog('DELETE_USER', u.username);
  };
  const muteUser = async (u: any) => {
    const until = new Date(Date.now() + muteMinutes * 60000).toISOString();
    await update(ref(db, `users/${u.id}`), { is_muted: true, mute_until: until });
    addLog('MUTE', `${u.username} ${muteMinutes} dakika`);
  };
  const unmuteUser = async (u: any) => {
    await update(ref(db, `users/${u.id}`), { is_muted: false, mute_until: null });
    addLog('UNMUTE', u.username);
  };
  const resetPassword = async (u: any) => {
    if (!u.email) { alert('E-posta adresi yok'); return; }
    await sendPasswordResetEmail(auth, u.email);
    alert(`${u.email} adresine sıfırlama e-postası gönderildi`);
    addLog('RESET_PASSWORD', u.username);
  };
  const forceLogoutAll = async () => {
    if (!confirm('Tüm kullanıcılar çıkış yapacak!')) return;
    await update(ref(db, 'settings'), { force_logout: new Date().toISOString() });
    addLog('FORCE_LOGOUT_ALL', 'Tüm kullanıcılar');
  };
  const cleanInactive = async () => {
    const cutoff = new Date(Date.now() - 30 * 24 * 3600000).toISOString();
    let count = 0;
    for (const u of users) {
      if (!u.is_admin && u.created_at < cutoff && u.message_count === 0) {
        await remove(ref(db, `users/${u.id}`));
        count++;
      }
    }
    alert(`${count} pasif kullanıcı silindi`);
    addLog('CLEAN_INACTIVE', `${count} kullanıcı`);
  };

  // ─── MESSAGE ACTIONS ──────────────────────────────────────────────────────────
  const deleteMessage = async (channel: string, msgId: string) => {
    await remove(ref(db, `messages/${channel}/${msgId}`));
  };
  const clearChannelMessages = async (channelId: string) => {
    if (!confirm(`#${channelId} kanalının tüm mesajları silinsin mi?`)) return;
    await remove(ref(db, `messages/${channelId}`));
    addLog('CLEAR_MESSAGES', channelId);
  };

  // ─── CHANNEL ACTIONS ──────────────────────────────────────────────────────────
  const updateChannel = async (id: string, data: any) => {
    await update(ref(db, `channels/${id}`), data);
  };
  const deleteChannel = async (ch: any) => {
    if (!confirm(`#${ch.name} silinsin mi?`)) return;
    await remove(ref(db, `channels/${ch.id}`));
    await remove(ref(db, `messages/${ch.id}`));
    addLog('DELETE_CHANNEL', ch.name);
  };

  // ─── FORUM ACTIONS ────────────────────────────────────────────────────────────
  const deletePost = async (id: string) => {
    await remove(ref(db, `forum/${id}`));
    addLog('DELETE_FORUM_POST', id);
  };
  const clearForum = async () => {
    if (!confirm('Tüm forum gönderileri silinsin mi?')) return;
    await remove(ref(db, 'forum'));
    addLog('CLEAR_FORUM', 'Tümü');
  };

  // ─── ANNOUNCE ─────────────────────────────────────────────────────────────────
  const sendAnnouncement = async () => {
    if (!announceText.trim()) return;
    const msg = { sender_id: 'system', sender_name: '📢 Sistem', content: announceText, timestamp: new Date().toISOString(), type: 'system' };
    if (announceChannel === 'all') {
      for (const ch of channels) await push(ref(db, `messages/${ch.id}`), msg);
    } else {
      await push(ref(db, `messages/${announceChannel}`), msg);
    }
    setAnnounceText('');
    addLog('ANNOUNCE', `${announceChannel}: ${announceText.slice(0, 50)}`);
  };
  const sendBulkNotif = async () => {
    if (!notifTitle.trim()) return;
    for (const u of users) {
      await push(ref(db, `notifications/${u.id}`), {
        type: 'system', title: notifTitle, content: notifBody,
        read: false, timestamp: new Date().toISOString()
      });
    }
    setNotifTitle(''); setNotifBody('');
    addLog('BULK_NOTIF', notifTitle);
  };

  // ─── SETTINGS ─────────────────────────────────────────────────────────────────
  const saveSettings = async () => {
    await update(ref(db, 'settings'), {
      site_name: settings.site_name,
      welcome_message: settings.welcome_message,
      allow_registration: settings.allow_registration ? 'true' : 'false',
      maintenance_mode: settings.maintenance_mode ? 'true' : 'false',
      message_history_limit: settings.message_history_limit,
      max_users: settings.max_users,
      min_username_length: settings.min_username_length,
      banned_words: settings.banned_words,
      invite_code: settings.invite_code,
      ai_api_key: settings.ai_api_key,
    });
    addLog('SAVE_SETTINGS', 'Uygulama ayarları');
  };

  const exportData = async () => {
    const snap = await get(ref(db, '/'));
    const data = snap.val();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'nature_backup.json'; a.click();
    addLog('EXPORT_DATA', 'JSON yedek');
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────────
  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.email.toLowerCase().includes(searchUser.toLowerCase())
  );

  const Card = ({ children, className = '' }: any) => (
    <div className={`bg-white/5 border border-white/10 rounded-xl p-4 ${className}`}>{children}</div>
  );

  const StatCard = ({ icon: Icon, label, value, color = 'text-emerald-400' }: any) => (
    <Card>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 ${color}`}>
          <Icon size={20} />
        </div>
        <div>
          <p className="text-white/40 text-xs">{label}</p>
          <p className="text-white font-bold text-xl">{value}</p>
        </div>
      </div>
    </Card>
  );

  const Toggle = ({ value, onChange, label }: any) => (
    <label className="flex items-center gap-3 cursor-pointer">
      <div onClick={() => onChange(!value)}
        className={`w-10 h-5 rounded-full transition-all relative ${value ? 'bg-emerald-500' : 'bg-white/10'}`}>
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${value ? 'left-5' : 'left-0.5'}`} />
      </div>
      <span className="text-sm text-white/70">{label}</span>
    </label>
  );

  // Yükleniyor
  if (isAdminVerified === null) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-white/30 text-sm animate-pulse">Yetki doğrulanıyor...</div>
    </div>
  );

  // Admin değil — erişim engelle
  if (!isAdminVerified) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">🚫</div>
        <p className="text-white/50 text-lg font-bold">Erişim Reddedildi</p>
        <p className="text-white/30 text-sm mt-2">Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
      </div>
    </div>
  );

  return (
    <div className="flex h-full bg-[#0B0E11]">
      {/* Sidebar */}
      <div className="w-52 border-r border-white/5 flex flex-col py-4 gap-1 px-2">
        <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-2 mb-2">Admin Paneli</p>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all text-left ${activeTab === t.id ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
            <t.icon size={15} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">

        {/* ─── OVERVIEW ─── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Genel Bakış</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={Users} label="Toplam Üye" value={users.length} />
              <StatCard icon={Activity} label="Çevrimiçi" value={onlineUsers.length} color="text-green-400" />
              <StatCard icon={Ban} label="Banlı" value={bannedCount} color="text-red-400" />
              <StatCard icon={Shield} label="Admin" value={adminCount} color="text-yellow-400" />
              <StatCard icon={MessageSquare} label="Toplam Mesaj" value={totalMsg} />
              <StatCard icon={Hash} label="Kanallar" value={channels.length} />
              <StatCard icon={FileText} label="Forum Gönderisi" value={forumPosts.length} />
              <StatCard icon={Database} label="Veri" value={`~${Math.round(totalMsg * 0.5)}KB`} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <p className="text-white/50 text-xs font-bold uppercase mb-3">En Aktif Kanal</p>
                {activeChannel ? (
                  <div className="flex items-center gap-2">
                    <Hash size={16} className="text-emerald-400" />
                    <span className="text-white font-bold">{activeChannel.name}</span>
                    <span className="text-white/40 text-xs ml-auto">{allMessages[activeChannel.id]?.length || 0} mesaj</span>
                  </div>
                ) : <p className="text-white/30 text-sm">Veri yok</p>}
              </Card>
              <Card>
                <p className="text-white/50 text-xs font-bold uppercase mb-3">Son Kayıt</p>
                {users.slice().sort((a, b) => (b.created_at || 0) - (a.created_at || 0)).slice(0, 3).map(u => (
                  <div key={u.id} className="flex items-center gap-2 mb-1">
                    <div className="w-5 h-5 rounded bg-white/10 flex items-center justify-center text-[10px] text-white/50">{(u.username || '?').substring(0, 1).toUpperCase()}</div>
                    <span className="text-white/70 text-sm">{u.username || u.id}</span>
                  </div>
                ))}
              </Card>
            </div>

            <div className="flex gap-3">
              <button onClick={forceLogoutAll} className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm hover:bg-red-500/20">
                <LogOut size={14} /> Tüm Kullanıcıları Çıkart
              </button>
              <button onClick={cleanInactive} className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 rounded-lg text-sm hover:bg-yellow-500/20">
                <UserX size={14} /> Pasif Üyeleri Temizle
              </button>
              <button onClick={exportData} className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-lg text-sm hover:bg-blue-500/20">
                <Download size={14} /> JSON Yedek Al
              </button>
            </div>
          </div>
        )}

        {/* ─── ROZET TALEPLERİ ─── */}
        {activeTab === 'verify' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-bold text-white">Rozet Talepleri</h2>
              {verifyRequests.filter(r => r.status === 'pending').length > 0 && (
                <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded-full">
                  {verifyRequests.filter(r => r.status === 'pending').length} bekliyor
                </span>
              )}
            </div>
            {verifyRequests.length === 0 ? (
              <div className="text-white/30 text-sm py-8 text-center">Henüz rozet talebi yok.</div>
            ) : (
              verifyRequests
                .sort((a, b) => (a.status === 'pending' ? -1 : 1))
                .map(req => (
                <VerifyRequestCard
                  key={req.id}
                  req={req}
                  onApprove={async () => {
                    await update(ref(db, `users/${req.userId}`), { is_verified: true });
                    await update(ref(db, `verification_requests/${req.userId}`), { status: 'approved', reviewedAt: new Date().toISOString() });
                    addLog('verify_approve', `${req.username} doğrulandı`);
                  }}
                  onReject={async (adminNote: string) => {
                    await update(ref(db, `verification_requests/${req.userId}`), { status: 'rejected', adminNote, reviewedAt: new Date().toISOString() });
                    addLog('verify_reject', `${req.username} reddedildi`);
                  }}
                />
              ))
            )}
          </div>
        )}

        {/* ─── TV KANALLARI ─── */}
        {activeTab === 'tv_channels' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2"><Tv size={20} /> TV Kanalları</h2>
              <button
                onClick={() => { setTvForm({ id: '', name: '', emoji: '📺', desc: '', youtubeChannelId: '', color: '#10b981', order: tvChannels.length }); setTvEditId(null); setTvFormOpen(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl text-sm font-bold hover:bg-emerald-500/30 transition-all"
              >
                <Plus size={14} /> Kanal Ekle
              </button>
            </div>

            {/* Kanal Formu */}
            {tvFormOpen && (() => {
              // YouTube URL'inden Channel ID çıkar
              const parseYoutubeInput = (input: string): { channelId: string; videoId: string; type: 'channel' | 'video' | 'handle' | 'unknown' } => {
                const s = input.trim();
                // Direkt UC... channel ID
                if (/^UC[\w-]{22}$/.test(s)) return { channelId: s, videoId: '', type: 'channel' };
                try {
                  const url = new URL(s.startsWith('http') ? s : 'https://' + s);
                  // youtube.com/channel/UC...
                  const channelMatch = url.pathname.match(/\/channel\/(UC[\w-]{22})/);
                  if (channelMatch) return { channelId: channelMatch[1], videoId: '', type: 'channel' };
                  // youtube.com/watch?v=...  (canlı yayın video ID'si)
                  const videoId = url.searchParams.get('v') || url.pathname.match(/\/(?:embed\/|v\/|shorts\/)([\w-]{11})/)?.[1] || '';
                  if (videoId) return { channelId: '', videoId, type: 'video' };
                  // youtu.be/VIDEO_ID
                  if (url.hostname === 'youtu.be') return { channelId: '', videoId: url.pathname.slice(1), type: 'video' };
                  // youtube.com/@handle veya /c/name
                  const handle = url.pathname.match(/\/@([\w.-]+)/)?.[1] || url.pathname.match(/\/c\/([\w.-]+)/)?.[1] || url.pathname.match(/\/user\/([\w.-]+)/)?.[1];
                  if (handle) return { channelId: handle, videoId: '', type: 'handle' };
                } catch {}
                return { channelId: s, videoId: '', type: 'unknown' };
              };

              const parsed = parseYoutubeInput(tvForm.youtubeChannelId);
              const embedUrl = parsed.type === 'video'
                ? `https://www.youtube.com/embed/${parsed.videoId}?autoplay=1`
                : parsed.channelId
                  ? `https://www.youtube.com/embed/live_stream?channel=${parsed.channelId}&autoplay=1`
                  : '';
              const isValid = tvForm.youtubeChannelId.trim().length > 0;
              const statusColor = !tvForm.youtubeChannelId ? 'text-white/20' : isValid ? 'text-emerald-400' : 'text-yellow-400';
              const statusText = !tvForm.youtubeChannelId ? 'Link veya ID yapıştır' : parsed.type === 'channel' ? '✅ Channel ID algılandı' : parsed.type === 'video' ? '✅ Video ID algılandı (canlı yayın)' : parsed.type === 'handle' ? '⚠️ @kullanıcı adı — Channel ID gerekebilir' : '⚠️ Format tanınamadı, ID olarak kullanılıyor';

              return (
                <div className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                  <p className="text-sm font-bold text-white">{tvEditId ? '✏️ Kanal Düzenle' : '➕ Yeni Kanal'}</p>

                  {/* ANA: YouTube URL / ID alanı */}
                  <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-2">
                    <label className="text-xs font-bold text-emerald-400 block">🔗 YouTube Linki veya Channel ID *</label>
                    <input
                      value={tvForm.youtubeChannelId}
                      onChange={e => setTvForm(f => ({ ...f, youtubeChannelId: e.target.value.trim() }))}
                      placeholder="youtube.com/channel/UC...  veya  youtube.com/watch?v=...  veya  UC...\ direkt ID"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-emerald-500/50"
                    />
                    <p className={`text-[11px] font-bold ${statusColor}`}>{statusText}</p>
                    {embedUrl && (
                      <div className="pt-1">
                        <p className="text-[10px] text-white/25 mb-1">Embed URL:</p>
                        <p className="text-[10px] text-emerald-400/60 font-mono break-all">{embedUrl}</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-white/40 mb-1 block">Kanal Adı *</label>
                      <input value={tvForm.name} onChange={e => setTvForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="ör. TRT 1" className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50" />
                    </div>
                    <div>
                      <label className="text-xs text-white/40 mb-1 block">Emoji</label>
                      <input value={tvForm.emoji} onChange={e => setTvForm(f => ({ ...f, emoji: e.target.value }))}
                        placeholder="📺" className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50" maxLength={4} />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-white/40 mb-1 block">Açıklama</label>
                      <input value={tvForm.desc} onChange={e => setTvForm(f => ({ ...f, desc: e.target.value }))}
                        placeholder="ör. Türkiye'nin ana kanalı" className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50" />
                    </div>
                    <div>
                      <label className="text-xs text-white/40 mb-1 block">Renk</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={tvForm.color} onChange={e => setTvForm(f => ({ ...f, color: e.target.value }))}
                          className="w-10 h-9 rounded-lg cursor-pointer bg-transparent border border-white/10" />
                        <input value={tvForm.color} onChange={e => setTvForm(f => ({ ...f, color: e.target.value }))}
                          className="flex-1 bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500/50" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-white/40 mb-1 block">Sıra</label>
                      <input type="number" value={tvForm.order} onChange={e => setTvForm(f => ({ ...f, order: parseInt(e.target.value) || 0 }))}
                        className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50" />
                    </div>
                    {!tvEditId && (
                      <div className="col-span-2">
                        <label className="text-xs text-white/40 mb-1 block">Kanal ID <span className="text-white/25">(benzersiz, boşluksuz — boş bırakılırsa otomatik oluşturulur)</span></label>
                        <input value={tvForm.id} onChange={e => setTvForm(f => ({ ...f, id: e.target.value.replace(/\s/g, '').toLowerCase() }))}
                          placeholder="ör. trt1, kanal7 — boş bırak = otomatik" className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500/50" />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={async () => {
                        if (!tvForm.name || !isValid) return;
                        // Embed URL'i kaydet (video veya channel formatında)
                        const finalChannelId = parsed.type === 'video' ? parsed.videoId : (parsed.channelId || tvForm.youtubeChannelId.trim());
                        const channelKey = tvEditId || tvForm.id || tvForm.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
                        const data = {
                          name: tvForm.name, emoji: tvForm.emoji, desc: tvForm.desc,
                          youtubeChannelId: finalChannelId,
                          embedType: parsed.type === 'video' ? 'video' : 'channel',
                          embedUrl,
                          color: tvForm.color, order: tvForm.order
                        };
                        try {
                          await set(ref(db, `tv_channels/${channelKey}`), data);
                          addLog(tvEditId ? 'TV_CHANNEL_EDIT' : 'TV_CHANNEL_ADD', tvForm.name);
                          setTvFormOpen(false); setTvEditId(null);
                        } catch (err: any) {
                          alert('Kayıt hatası: ' + (err.message || 'Bilinmeyen hata'));
                        }
                      }}
                      disabled={!tvForm.name || !isValid}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl text-sm font-bold hover:bg-emerald-500/30 disabled:opacity-40 transition-all"
                    >
                      <Save size={14} /> {tvEditId ? 'Güncelle' : 'Kaydet'}
                    </button>
                    <button onClick={() => { setTvFormOpen(false); setTvEditId(null); }}
                      className="px-4 py-2 text-white/40 hover:text-white text-sm transition-all">
                      İptal
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Kanal Listesi */}
            {tvChannels.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-white/30 text-sm mb-3">Firebase'de kanal yok — varsayılan TRT kanalları gösteriliyor.</p>
                <button
                  onClick={async () => {
                    for (let i = 0; i < DEFAULT_TV_CHANNELS.length; i++) {
                      const ch = DEFAULT_TV_CHANNELS[i];
                      await set(ref(db, `tv_channels/${ch.id}`), { name: ch.name, emoji: ch.emoji, desc: ch.desc, youtubeChannelId: ch.youtubeChannelId, embedUrl: ch.embedUrl || '', embedType: ch.embedType || 'channel', color: ch.color, order: i });
                    }
                    addLog('TV_CHANNELS_INIT', 'Varsayılan TRT kanalları eklendi');
                  }}
                  className="px-4 py-2 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-xl text-sm font-bold hover:bg-blue-500/30 transition-all"
                >
                  🌱 Varsayılan Kanalları Yükle
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {tvChannels.map((ch, idx) => (
                  <div key={ch.id} className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl hover:border-white/20 transition-all group">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 border border-white/10" style={{ background: ch.color + '20' }}>
                      {ch.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-white">{ch.name}</p>
                        <div className="w-3 h-3 rounded-full border border-white/20" style={{ background: ch.color }} />
                        <span className="text-[10px] text-white/30">#{idx + 1}</span>
                      </div>
                      <p className="text-xs text-white/40 truncate">{ch.desc}</p>
                      <p className="text-[10px] text-white/25 font-mono truncate">ID: {ch.youtubeChannelId}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={() => { setTvForm({ id: ch.id, name: ch.name, emoji: ch.emoji, desc: ch.desc, youtubeChannelId: ch.youtubeChannelId, color: ch.color, order: ch.order ?? idx }); setTvEditId(ch.id); setTvFormOpen(true); }}
                        className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-all"
                        title="Düzenle"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm(`"${ch.name}" kanalını silmek istediğine emin misin?`)) return;
                          await remove(ref(db, `tv_channels/${ch.id}`));
                          addLog('TV_CHANNEL_DELETE', ch.name);
                        }}
                        className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-all"
                        title="Sil"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="p-3 bg-blue-500/5 border border-blue-500/15 rounded-xl">
              <p className="text-xs text-blue-400/70">
                💡 <strong>Desteklenen formatlar:</strong><br/>
                • <span className="font-mono">youtube.com/channel/UC...</span> — Channel sayfası URL'i<br/>
                • <span className="font-mono">youtube.com/watch?v=...</span> — Canlı yayın video URL'i<br/>
                • <span className="font-mono">youtu.be/VIDEO_ID</span> — Kısa link<br/>
                • <span className="font-mono">UCxxxxxxxxxxxxxxxxxxxxxxxx</span> — Direkt Channel ID<br/>
                Herhangi birini yapıştır, sistem otomatik algılar.
              </p>
            </div>
          </div>
        )}

        {/* ─── USERS ─── */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white">Kullanıcılar</h2>
              <span className="text-white/40 text-sm">({filteredUsers.length})</span>
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input value={searchUser} onChange={e => setSearchUser(e.target.value)}
                placeholder="Kullanıcı ara..." className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50" />
            </div>

            <div className="space-y-2">
              {filteredUsers.map(u => (
                <Card key={u.id} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-sm font-bold text-white/50 border border-white/10 shrink-0">
                    {(u.username || u.id || '?').substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium text-sm">{u.username}</span>
                      {u.is_admin && <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 text-[10px] font-bold rounded">ADMIN</span>}
                      {u.is_banned && <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-bold rounded">BANLANDI</span>}
                      {u.is_muted && <span className="px-1.5 py-0.5 bg-orange-500/20 text-orange-400 text-[10px] font-bold rounded">SUSTURULDU</span>}
                      <div className={`w-2 h-2 rounded-full ${onlineUsers.includes(u.id) ? 'bg-emerald-400' : 'bg-white/20'}`} />
                    </div>
                    <p className="text-white/30 text-xs truncate">{u.email || 'E-posta yok'} · {u.message_count} mesaj · IP: {u.ip}</p>
                  </div>

                  {/* Mute controls */}
                  <div className="flex items-center gap-1 shrink-0">
                    {!u.is_muted ? (
                      <div className="flex items-center gap-1">
                        <input type="number" value={muteMinutes} onChange={e => setMuteMinutes(+e.target.value)}
                          className="w-12 bg-white/5 border border-white/10 rounded px-1 py-0.5 text-xs text-white text-center" />
                        <button onClick={() => muteUser(u)} title="Sustur"
                          className="p-1.5 rounded bg-orange-500/10 text-orange-400 hover:bg-orange-500/20">
                          <VolumeX size={13} />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => unmuteUser(u)} title="Susturmayı kaldır"
                        className="p-1.5 rounded bg-green-500/10 text-green-400 hover:bg-green-500/20">
                        <Volume2 size={13} />
                      </button>
                    )}
                    <button onClick={() => toggleAdmin(u)} title={u.is_admin ? 'Admin kaldır' : 'Admin yap'}
                      className={`p-1.5 rounded ${u.is_admin ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/5 text-white/40'} hover:brightness-125`}>
                      <Shield size={13} />
                    </button>
                    <button onClick={() => banUser(u)} title={u.is_banned ? 'Ban kaldır' : 'Ban'}
                      className={`p-1.5 rounded ${u.is_banned ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-white/40'} hover:brightness-125`}>
                      <Ban size={13} />
                    </button>
                    <button onClick={() => resetPassword(u)} title="Şifre sıfırla"
                      className="p-1.5 rounded bg-white/5 text-white/40 hover:text-blue-400">
                      <RefreshCw size={13} />
                    </button>
                    <button onClick={() => deleteUser(u)} title="Sil"
                      className="p-1.5 rounded bg-white/5 text-white/40 hover:text-red-400">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ─── MESSAGES ─── */}
        {activeTab === 'messages' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Mesaj Yönetimi</h2>
            {channels.map(ch => (
              <Card key={ch.id}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Hash size={14} className="text-white/40" />
                    <span className="text-white font-medium text-sm">{ch.name}</span>
                    <span className="text-white/30 text-xs">({allMessages[ch.id]?.length || 0} mesaj)</span>
                  </div>
                  <button onClick={() => clearChannelMessages(ch.id)}
                    className="flex items-center gap-1 px-2 py-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/20">
                    <Trash2 size={11} /> Tümünü Sil
                  </button>
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {(allMessages[ch.id] || []).slice(0, 20).map(m => (
                    <div key={m.id} className="flex items-start gap-2 p-2 rounded hover:bg-white/5 group">
                      <span className="text-emerald-400 text-xs font-bold shrink-0 w-20 truncate">{m.sender_name}</span>
                      <span className="text-white/60 text-xs flex-1 truncate">{m.content}</span>
                      <span className="text-white/20 text-[10px] shrink-0">{m.timestamp ? new Date(m.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                      <button onClick={() => deleteMessage(ch.id, m.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:bg-red-500/10 rounded">
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* ─── CHANNELS ─── */}
        {activeTab === 'channels' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Oda Yönetimi</h2>
              <button onClick={async () => {
                const name = prompt('Yeni kanal adı:');
                if (!name) return;
                await set(ref(db, `channels/${name.toLowerCase().replace(/\s+/g, '-')}`), {
                  name, type: 'text', category: 'Sohbet', is_locked: false, slow_mode: 0
                });
              }} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm hover:bg-emerald-500/30">
                <Plus size={14} /> Yeni Kanal
              </button>
            </div>
            {channels.map(ch => (
              <Card key={ch.id}>
                <div className="flex items-center gap-3 mb-3">
                  <Hash size={14} className="text-white/40" />
                  <span className="text-white font-medium">{ch.name}</span>
                  <span className="text-white/30 text-xs">{ch.type}</span>
                  <div className="flex gap-1 ml-auto">
                    {ch.is_locked && <span className="text-[10px] px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 rounded">KİLİTLİ</span>}
                    {ch.is_readonly && <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded">SALT OKU</span>}
                    {ch.is_hidden && <span className="text-[10px] px-1.5 py-0.5 bg-gray-500/20 text-gray-400 rounded">GİZLİ</span>}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm mb-3">
                  <div>
                    <p className="text-white/30 text-xs mb-1">Açıklama</p>
                    <input defaultValue={ch.description} onBlur={e => updateChannel(ch.id, { description: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500/50" />
                  </div>
                  <div>
                    <p className="text-white/30 text-xs mb-1">Yavaş Mod (sn)</p>
                    <input type="number" defaultValue={ch.slow_mode} onBlur={e => updateChannel(ch.id, { slow_mode: +e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500/50" />
                  </div>
                  <div className="space-y-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={ch.is_locked} onChange={e => updateChannel(ch.id, { is_locked: e.target.checked })} />
                      <span className="text-xs text-white/50">Kilitli</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={ch.is_readonly} onChange={e => updateChannel(ch.id, { is_readonly: e.target.checked })} />
                      <span className="text-xs text-white/50">Salt Okunur</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={ch.is_hidden} onChange={e => updateChannel(ch.id, { is_hidden: e.target.checked })} />
                      <span className="text-xs text-white/50">Gizli</span>
                    </label>
                  </div>
                </div>
                <button onClick={() => deleteChannel(ch)}
                  className="flex items-center gap-1 px-2 py-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/20">
                  <Trash2 size={11} /> Kanalı Sil
                </button>
              </Card>
            ))}
          </div>
        )}

        {/* ─── FORUM ─── */}
        {activeTab === 'forum' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Forum Yönetimi</h2>
              <button onClick={clearForum}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/20">
                <Trash2 size={14} /> Tümünü Temizle
              </button>
            </div>
            {forumPosts.map(p => (
              <Card key={p.id} className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">{p.title}</p>
                  <p className="text-white/40 text-xs">{p.author} · ❤️ {p.likes} · 💬 {p.comments}</p>
                  <p className="text-white/30 text-xs mt-1 truncate">{p.content}</p>
                </div>
                <button onClick={() => deletePost(p.id)}
                  className="p-1.5 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20 shrink-0">
                  <Trash2 size={13} />
                </button>
              </Card>
            ))}
          </div>
        )}

        {/* ─── ANNOUNCE ─── */}
        {activeTab === 'announce' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Duyurular</h2>
            <Card>
              <p className="text-white font-medium mb-3">Kanal Duyurusu Gönder</p>
              <div className="space-y-3">
                <select value={announceChannel} onChange={e => setAnnounceChannel(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                  <option value="all">Tüm Kanallar</option>
                  {channels.map(ch => <option key={ch.id} value={ch.id}>#{ch.name}</option>)}
                </select>
                <textarea value={announceText} onChange={e => setAnnounceText(e.target.value)}
                  placeholder="Duyuru metni..." rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/50 resize-none" />
                <button onClick={sendAnnouncement}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-bold hover:bg-emerald-600">
                  <Send size={14} /> Gönder
                </button>
              </div>
            </Card>
            <Card>
              <p className="text-white font-medium mb-3">Toplu Bildirim Gönder</p>
              <div className="space-y-3">
                <input value={notifTitle} onChange={e => setNotifTitle(e.target.value)}
                  placeholder="Başlık" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/50" />
                <textarea value={notifBody} onChange={e => setNotifBody(e.target.value)}
                  placeholder="Mesaj..." rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/50 resize-none" />
                <button onClick={sendBulkNotif}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-bold hover:bg-blue-600">
                  <Bell size={14} /> {users.length} Kullanıcıya Gönder
                </button>
              </div>
            </Card>
          </div>
        )}

        {/* ─── DESIGN ─── */}
        {activeTab === 'design' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Global Tasarım</h2>
            <Card>
              <p className="text-white/50 text-xs font-bold uppercase mb-4">Renkler</p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'primary_color', label: 'Ana Renk' },
                  { key: 'bg_color', label: 'Arka Plan' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <p className="text-white/40 text-xs mb-1">{label}</p>
                    <div className="flex gap-2">
                      <input type="color" value={(designSettings as any)[key]}
                        onChange={e => setDesignSettings(p => ({ ...p, [key]: e.target.value }))}
                        className="w-10 h-8 rounded cursor-pointer border-0 bg-transparent" />
                      <input value={(designSettings as any)[key]}
                        onChange={e => setDesignSettings(p => ({ ...p, [key]: e.target.value }))}
                        className="flex-1 bg-white/5 border border-white/10 rounded px-2 text-xs text-white focus:outline-none" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <p className="text-white/50 text-xs font-bold uppercase mb-4">Yazı Tipi & Boyut</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-white/40 text-xs mb-1">Mesaj Font Boyutu (px)</p>
                  <input type="number" value={designSettings.font_size}
                    onChange={e => setDesignSettings(p => ({ ...p, font_size: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white focus:outline-none" />
                </div>
                <div>
                  <p className="text-white/40 text-xs mb-1">Köşe Yuvarlaklığı (px)</p>
                  <input type="number" value={designSettings.border_radius}
                    onChange={e => setDesignSettings(p => ({ ...p, border_radius: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white focus:outline-none" />
                </div>
              </div>
            </Card>
            <Card>
              <p className="text-white/50 text-xs font-bold uppercase mb-4">Arka Plan Stili</p>
              <div className="flex gap-2">
                {['dark', 'gradient', 'deep'].map(s => (
                  <button key={s} onClick={() => setDesignSettings(p => ({ ...p, bg_style: s }))}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${designSettings.bg_style === s ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'border-white/10 text-white/40 hover:text-white'}`}>
                    {s === 'dark' ? 'Koyu' : s === 'gradient' ? 'Gradyan' : 'Derin Karanlık'}
                  </button>
                ))}
              </div>
            </Card>
            <button onClick={async () => {
              await update(ref(db, 'settings/design'), designSettings);
              addLog('SAVE_DESIGN', 'Tasarım güncellendi');
            }} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-bold hover:bg-emerald-600">
              <Save size={14} /> Tasarımı Kaydet & Uygula
            </button>
          </div>
        )}

        {/* ─── SETTINGS ─── */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Uygulama Ayarları</h2>
            <Card>
              <p className="text-white/50 text-xs font-bold uppercase mb-4">Genel</p>
              <div className="space-y-3">
                <div>
                  <p className="text-white/40 text-xs mb-1">Uygulama Adı</p>
                  <input value={settings.site_name} onChange={e => setSettings(p => ({ ...p, site_name: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50" />
                </div>
                <div>
                  <p className="text-white/40 text-xs mb-1">Hoşgeldin Mesajı</p>
                  <input value={settings.welcome_message} onChange={e => setSettings(p => ({ ...p, welcome_message: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50" />
                </div>
                <div>
                  <p className="text-white/40 text-xs mb-1">AI API Key (Gemini/OpenRouter)</p>
                  <input value={settings.ai_api_key} onChange={e => setSettings(p => ({ ...p, ai_api_key: e.target.value }))}
                    type="password" className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50" />
                </div>
                <div>
                  <p className="text-white/40 text-xs mb-1">Davet Kodu</p>
                  <div className="flex gap-2">
                    <input value={settings.invite_code} onChange={e => setSettings(p => ({ ...p, invite_code: e.target.value }))}
                      className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50" />
                    <button onClick={() => setSettings(p => ({ ...p, invite_code: Math.random().toString(36).substring(2, 10).toUpperCase() }))}
                      className="px-3 py-2 bg-white/5 border border-white/10 text-white/50 rounded text-sm hover:text-white">
                      <RefreshCw size={14} />
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-white/40 text-xs mb-1">Mesaj Geçmişi Limiti</p>
                  <input type="number" value={settings.message_history_limit} onChange={e => setSettings(p => ({ ...p, message_history_limit: +e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50" />
                </div>
                <div className="space-y-2 pt-1">
                  <Toggle value={settings.allow_registration} onChange={(v: boolean) => setSettings(p => ({ ...p, allow_registration: v }))} label="Üye Kaydına İzin Ver" />
                  <Toggle value={settings.maintenance_mode} onChange={(v: boolean) => setSettings(p => ({ ...p, maintenance_mode: v }))} label="Bakım Modu" />
                </div>
              </div>
            </Card>
            <div className="flex gap-3">
              <button onClick={saveSettings}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-bold hover:bg-emerald-600">
                <Save size={14} /> Ayarları Kaydet
              </button>
              <button onClick={exportData}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-white/70 rounded-lg text-sm hover:text-white">
                <Download size={14} /> JSON Yedek Al
              </button>
            </div>
          </div>
        )}

        {/* ─── SECURITY ─── */}
        {activeTab === 'security' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Güvenlik</h2>
            <Card>
              <p className="text-white/50 text-xs font-bold uppercase mb-4">Kullanıcı Limitleri</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-white/40 text-xs mb-1">Maks. Kullanıcı</p>
                  <input type="number" value={settings.max_users} onChange={e => setSettings(p => ({ ...p, max_users: +e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50" />
                </div>
                <div>
                  <p className="text-white/40 text-xs mb-1">Min. Kullanıcı Adı Uzunluğu</p>
                  <input type="number" value={settings.min_username_length} onChange={e => setSettings(p => ({ ...p, min_username_length: +e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50" />
                </div>
              </div>
            </Card>
            <Card>
              <p className="text-white/50 text-xs font-bold uppercase mb-2">Yasaklı Kelimeler</p>
              <p className="text-white/30 text-xs mb-3">Virgülle ayırın: kelime1, kelime2</p>
              <textarea value={settings.banned_words} onChange={e => setSettings(p => ({ ...p, banned_words: e.target.value }))}
                rows={3} className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/50 resize-none" />
            </Card>
            <div className="flex gap-3">
              <button onClick={saveSettings}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-bold hover:bg-emerald-600">
                <Save size={14} /> Kaydet
              </button>
              <button onClick={forceLogoutAll}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm hover:bg-red-500/20">
                <LogOut size={14} /> Tüm Kullanıcıları Çıkart
              </button>
              <button onClick={cleanInactive}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 rounded-lg text-sm hover:bg-yellow-500/20">
                <UserX size={14} /> Pasif Üyeleri Temizle
              </button>
            </div>
          </div>
        )}

        {/* ─── LOGS ─── */}
        {activeTab === 'logs' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Aktivite Logları</h2>
              <div className="flex gap-2">
                <div className="relative">
                  <Filter size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" />
                  <input value={logFilter} onChange={e => setLogFilter(e.target.value)}
                    placeholder="Filtrele..." className="bg-white/5 border border-white/10 rounded pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none" />
                </div>
                <button onClick={async () => { if (confirm('Loglar temizlensin mi?')) await remove(ref(db, 'logs')); }}
                  className="flex items-center gap-1 px-2 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/20">
                  <Trash2 size={11} /> Temizle
                </button>
              </div>
            </div>
            <div className="space-y-1">
              {logs.filter(l => !logFilter || l.action?.includes(logFilter.toUpperCase()) || l.detail?.includes(logFilter)).map(l => (
                <div key={l.id} className="flex items-center gap-3 px-3 py-2 bg-white/3 border border-white/5 rounded-lg">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 shrink-0">{l.action}</span>
                  <span className="text-white/60 text-xs flex-1 truncate">{l.detail}</span>
                  <span className="text-white/20 text-[10px] shrink-0">{l.admin}</span>
                  <span className="text-white/20 text-[10px] shrink-0">{l.timestamp ? new Date(l.timestamp).toLocaleString('tr-TR') : ''}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
