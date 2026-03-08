import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, Hash, Settings, Users, LogOut, Crown, Shield, Copy,
  Check, ChevronRight, Search, Globe, Lock, Trash2, UserMinus, X
} from 'lucide-react';
import {
  createGuild, joinGuildByCode, leaveGuild,
  listenUserGuilds, listenAllGuilds, listenGuildMembers,
  setMemberRole, kickMember, deleteGuild
} from '../services/guildService';
import { listenMessages, sendMessage } from '../services/firebaseService';

const GUILD_EMOJIS = ['🌿','🔥','⚡','🌊','🏔️','🌙','☀️','🎮','🎵','💻','🎨','📚'];
const GUILD_COLORS = ['#10b981','#3b82f6','#8b5cf6','#ef4444','#f97316','#eab308','#06b6d4','#ec4899'];

export const GuildSystem = ({ theme, userId, username }: { theme: any, userId: string, username: string }) => {
  const [view, setView] = useState<'list' | 'create' | 'join' | 'guild' | 'discover'>('list');
  const [userGuilds, setUserGuilds] = useState<any[]>([]);
  const [allGuilds, setAllGuilds] = useState<any[]>([]);
  const [activeGuild, setActiveGuild] = useState<any>(null);
  const [activeChannel, setActiveChannel] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<'channels' | 'members' | 'settings'>('channels');

  // Create form
  const [gName, setGName] = useState('');
  const [gEmoji, setGEmoji] = useState('🌿');
  const [gColor, setGColor] = useState('#10b981');
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsub = listenUserGuilds(userId, setUserGuilds);
    return unsub;
  }, [userId]);

  useEffect(() => {
    if (view === 'discover') {
      const unsub = listenAllGuilds(setAllGuilds);
      return unsub;
    }
  }, [view]);

  useEffect(() => {
    if (!activeGuild || !activeChannel) return;
    const unsub = listenMessages(activeChannel, setMessages as any);
    return unsub;
  }, [activeGuild, activeChannel]);

  useEffect(() => {
    if (!activeGuild) return;
    const unsub = listenGuildMembers(activeGuild.id, setMembers);
    return unsub;
  }, [activeGuild]);

  const handleCreate = async () => {
    if (!gName.trim()) return;
    setLoading(true);
    try {
      const { inviteCode: code } = await createGuild(gName, gEmoji, gColor, userId, username);
      setInviteCode(code);
      setView('list');
      setGName(''); setGEmoji('🌿'); setGColor('#10b981');
    } finally { setLoading(false); }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setLoading(true); setJoinError('');
    try {
      await joinGuildByCode(joinCode, userId);
      setJoinCode(''); setView('list');
    } catch (e: any) {
      setJoinError(e.message);
    } finally { setLoading(false); }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeChannel) return;
    await sendMessage(activeChannel, userId, username, input.trim());
    setInput('');
  };

  const copyInvite = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openGuild = (guild: any) => {
    setActiveGuild(guild);
    // Set first channel
    const channelId = `guild_${guild.id}_genel`;
    setActiveChannel(channelId);
    setView('guild');
    setTab('channels');
  };

  // ── LIST VIEW ──
  if (view === 'list') return (
    <div className="flex-1 flex flex-col bg-[#0B0E11] overflow-hidden">
      <header className="h-14 border-b border-white/5 flex items-center px-6 justify-between">
        <h3 className="font-bold text-white">Sunucularım</h3>
        <div className="flex gap-2">
          <button onClick={() => setView('join')} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 text-white/60 rounded-xl text-xs font-bold hover:bg-white/10 transition-all">
            <Hash size={12} /> Katıl
          </button>
          <button onClick={() => setView('create')} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-all">
            <Plus size={12} /> Oluştur
          </button>
          <button onClick={() => setView('discover')} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 text-white/60 rounded-xl text-xs font-bold hover:bg-white/10 transition-all">
            <Globe size={12} /> Keşfet
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        {userGuilds.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-24 h-24 rounded-[40px] bg-white/5 border border-white/10 flex items-center justify-center text-5xl mb-6">🏰</div>
            <h3 className="text-xl font-black text-white mb-2">Henüz sunucu yok</h3>
            <p className="text-white/40 text-sm max-w-xs">Kendi topluluğunu oluştur veya davet koduyla bir sunucuya katıl.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {userGuilds.map(guild => (
              <motion.div key={guild.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                onClick={() => openGuild(guild)}
                className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl cursor-pointer hover:bg-white/10 hover:border-white/20 transition-all group">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg" style={{ background: guild.color || '#10b981' }}>
                  {guild.emoji || '🌿'}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-white">{guild.name}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-white/30">{guild.member_count || 1} üye</span>
                    {guild.owner_id === userId && <span className="text-[10px] text-yellow-400 font-bold flex items-center gap-1"><Crown size={10} /> Sahip</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={e => { e.stopPropagation(); copyInvite(guild.invite_code); }}
                    className="p-2 bg-white/5 rounded-xl text-white/40 hover:text-white transition-all" title="Davet kodunu kopyala">
                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                  <ChevronRight size={16} className="text-white/20" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ── CREATE VIEW ──
  if (view === 'create') return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#0B0E11] p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <button onClick={() => setView('list')} className="flex items-center gap-2 text-white/40 hover:text-white text-sm mb-6 transition-all">
          ← Geri
        </button>
        <h2 className="text-3xl font-black text-white mb-2">Sunucu Oluştur</h2>
        <p className="text-white/40 text-sm mb-8">Topluluğunu kur, arkadaşlarını davet et.</p>

        <div className="space-y-6">
          {/* Preview */}
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-[30px] flex items-center justify-center text-4xl shadow-2xl transition-all" style={{ background: gColor }}>
              {gEmoji}
            </div>
          </div>

          {/* Emoji */}
          <div>
            <label className="text-xs font-bold text-white/40 uppercase tracking-widest block mb-2">Emoji</label>
            <div className="flex flex-wrap gap-2">
              {GUILD_EMOJIS.map(e => (
                <button key={e} onClick={() => setGEmoji(e)}
                  className={`w-10 h-10 rounded-xl text-xl transition-all ${gEmoji === e ? 'bg-white/20 ring-2 ring-white/40' : 'bg-white/5 hover:bg-white/10'}`}>{e}</button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="text-xs font-bold text-white/40 uppercase tracking-widest block mb-2">Renk</label>
            <div className="flex gap-2">
              {GUILD_COLORS.map(c => (
                <button key={c} onClick={() => setGColor(c)}
                  className={`w-8 h-8 rounded-xl transition-all ${gColor === c ? 'ring-2 ring-white scale-110' : ''}`} style={{ background: c }} />
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-xs font-bold text-white/40 uppercase tracking-widest block mb-2">Sunucu Adı</label>
            <input value={gName} onChange={e => setGName(e.target.value)}
              placeholder="örn: Doğa Dostları"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:border-emerald-500/50 transition-all" />
          </div>

          <button onClick={handleCreate} disabled={!gName.trim() || loading}
            className={`w-full py-4 rounded-2xl font-black text-sm transition-all ${gName.trim() ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600' : 'bg-white/5 text-white/20'}`}>
            {loading ? 'Oluşturuluyor...' : 'SUNUCUYU OLUŞTUR'}
          </button>
        </div>
      </motion.div>
    </div>
  );

  // ── JOIN VIEW ──
  if (view === 'join') return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#0B0E11] p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <button onClick={() => setView('list')} className="flex items-center gap-2 text-white/40 hover:text-white text-sm mb-6 transition-all">← Geri</button>
        <h2 className="text-3xl font-black text-white mb-2">Sunucuya Katıl</h2>
        <p className="text-white/40 text-sm mb-8">Davet kodunu girerek bir sunucuya katıl.</p>
        <div className="space-y-4">
          <input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
            placeholder="DAVET KODU (örn: ABC123)"
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-center font-mono text-lg tracking-widest focus:outline-none focus:border-blue-500/50 transition-all"
            maxLength={6} />
          {joinError && <p className="text-red-400 text-sm text-center">{joinError}</p>}
          <button onClick={handleJoin} disabled={joinCode.length !== 6 || loading}
            className={`w-full py-4 rounded-2xl font-black text-sm transition-all ${joinCode.length === 6 ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-white/5 text-white/20'}`}>
            {loading ? 'Katılıyor...' : 'KATIL'}
          </button>
        </div>
      </motion.div>
    </div>
  );

  // ── DISCOVER VIEW ──
  if (view === 'discover') return (
    <div className="flex-1 flex flex-col bg-[#0B0E11]">
      <header className="h-14 border-b border-white/5 flex items-center px-6 gap-4">
        <button onClick={() => setView('list')} className="text-white/40 hover:text-white transition-all">←</button>
        <Globe size={18} className="text-blue-400" />
        <h3 className="font-bold text-white">Sunucu Keşfet</h3>
      </header>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-2 gap-4">
          {allGuilds.map(guild => {
            const isMember = userGuilds.some(g => g.id === guild.id);
            return (
              <motion.div key={guild.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="p-5 bg-white/5 border border-white/10 rounded-2xl hover:border-white/20 transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: guild.color }}>
                    {guild.emoji || '🌿'}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{guild.name}</h4>
                    <p className="text-xs text-white/30">{guild.member_count || 1} üye</p>
                  </div>
                </div>
                {isMember ? (
                  <button onClick={() => openGuild(guild)}
                    className="w-full py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold">
                    Aç
                  </button>
                ) : (
                  <button onClick={async () => { await joinGuildByCode(guild.invite_code, userId); }}
                    className="w-full py-2 bg-white/5 border border-white/10 text-white/60 rounded-xl text-xs font-bold hover:bg-white/10 transition-all">
                    Katıl
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // ── GUILD CHAT VIEW ──
  if (view === 'guild' && activeGuild) {
    const channelList = [
      { id: `guild_${activeGuild.id}_genel`, name: 'genel' },
      { id: `guild_${activeGuild.id}_duyurular`, name: 'duyurular' },
    ];
    const isOwner = activeGuild.owner_id === userId;

    return (
      <div className="flex-1 flex overflow-hidden bg-[#0B0E11]">
        {/* Guild sidebar */}
        <aside className="w-56 border-r border-white/5 flex flex-col">
          <div className="p-4 border-b border-white/5">
            <button onClick={() => setView('list')} className="text-white/30 hover:text-white text-xs mb-3 transition-all">← Sunucular</button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: activeGuild.color }}>
                {activeGuild.emoji}
              </div>
              <div>
                <h4 className="font-bold text-white text-sm leading-tight">{activeGuild.name}</h4>
                <p className="text-[10px] text-white/30">{activeGuild.member_count || 1} üye</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/5">
            {(['channels', 'members', 'settings'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${tab === t ? 'text-white border-b-2 border-emerald-500' : 'text-white/30 hover:text-white'}`}>
                {t === 'channels' ? '# ' : t === 'members' ? '👥' : '⚙️'}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {tab === 'channels' && (
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-3 py-2">Kanallar</p>
                {channelList.map(ch => (
                  <button key={ch.id} onClick={() => setActiveChannel(ch.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all ${activeChannel === ch.id ? 'bg-white/10 text-white' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}>
                    <Hash size={14} />#{ch.name}
                  </button>
                ))}
              </div>
            )}

            {tab === 'members' && (
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-3 py-2">{members.length} Üye</p>
                {members.map(m => (
                  <div key={m.uid} className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/5 group">
                    <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold text-white/40">
                      {m.uid.substring(0, 2).toUpperCase()}
                    </div>
                    <span className="flex-1 text-sm text-white/60 truncate">{m.uid}</span>
                    {m.role === 'owner' && <Crown size={12} className="text-yellow-400" />}
                    {m.role === 'admin' && <Shield size={12} className="text-blue-400" />}
                    {isOwner && m.uid !== userId && (
                      <button onClick={() => kickMember(activeGuild.id, m.uid)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all">
                        <UserMinus size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {tab === 'settings' && (
              <div className="p-3 space-y-3">
                <div className="p-3 bg-white/5 rounded-xl">
                  <p className="text-xs text-white/40 mb-1">Davet Kodu</p>
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono text-emerald-400 flex-1">{activeGuild.invite_code}</code>
                    <button onClick={() => copyInvite(activeGuild.invite_code)} className="text-white/40 hover:text-white transition-all">
                      {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
                <button onClick={() => leaveGuild(activeGuild.id, userId).then(() => setView('list'))}
                  className="w-full py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold hover:bg-red-500/20 transition-all flex items-center justify-center gap-2">
                  <LogOut size={12} /> Sunucudan Ayrıl
                </button>
                {isOwner && (
                  <button onClick={() => deleteGuild(activeGuild.id).then(() => setView('list'))}
                    className="w-full py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold hover:bg-red-500/20 transition-all flex items-center justify-center gap-2">
                    <Trash2 size={12} /> Sunucuyu Sil
                  </button>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* Chat */}
        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b border-white/5 flex items-center px-6 gap-3">
            <Hash size={18} className="text-white/40" />
            <span className="font-bold text-white">{channelList.find(c => c.id === activeChannel)?.name || 'genel'}</span>
          </header>

          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {messages.map((msg: any) => (
              <div key={msg.id} className={`flex gap-3 ${msg.sender_id === userId ? 'flex-row-reverse' : ''}`}>
                <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-white/40 shrink-0">
                  {(msg.sender_name || msg.sender_id || '?').substring(0, 2).toUpperCase()}
                </div>
                <div className={`px-4 py-2.5 rounded-2xl text-sm max-w-[70%] ${msg.sender_id === userId ? 'text-white rounded-tr-sm' : 'bg-white/5 border border-white/10 text-white/80 rounded-tl-sm'}`}
                  style={msg.sender_id === userId ? { background: activeGuild.color } : {}}>
                  {msg.content}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSend} className="p-4 border-t border-white/5">
            <div className="flex gap-3">
              <input value={input} onChange={e => setInput(e.target.value)}
                placeholder={`#${channelList.find(c => c.id === activeChannel)?.name || 'genel'} kanalına yaz...`}
                className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/30 transition-all" />
              <button type="submit" disabled={!input.trim()}
                className={`px-5 py-3 rounded-2xl font-bold text-sm transition-all ${input.trim() ? 'text-white' : 'bg-white/5 text-white/20'}`}
                style={input.trim() ? { background: activeGuild.color } : {}}>
                Gönder
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return null;
};
