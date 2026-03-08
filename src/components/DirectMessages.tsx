import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Phone, Video, Info, Paperclip, Send, Search, Smile, Edit3, Trash2, Pin, Reply, Check, X, Download } from 'lucide-react';
import { db } from '../firebase';
import { ref, onValue, push, off, update, remove, get } from 'firebase/database';
import { checkRateLimit } from '../services/securityService';
import { playDmSound } from '../services/soundService';

const EMOJIS = ['👍','❤️','😂','😮','😢','🔥','🎉','👀','✅','💯'];

function formatTime(ts: string) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const day = 24 * 60 * 60 * 1000;
  if (diff < day && d.getDate() === now.getDate()) return 'Bugün ' + d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  if (diff < 2 * day) return 'Dün ' + d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) + ' ' + d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

function isSameDay(ts1: string, ts2: string) {
  return new Date(ts1).toDateString() === new Date(ts2).toDateString();
}

function dayLabel(ts: string) {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 24 * 60 * 60 * 1000 && d.getDate() === now.getDate()) return 'Bugün';
  if (diff < 2 * 24 * 60 * 60 * 1000) return 'Dün';
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export const DirectMessages = ({ theme, userId, activeDmUserId: initialActiveDmUserId, currentUserName, onStartCall }: {
  theme: any, userId: string, activeDmUserId: string | null, currentUserName?: string,
  onStartCall?: (targetId: string, targetName: string, mode: 'voice' | 'video') => void
}) => {
  const [activeDmUserId, setActiveDmUserId] = useState<string | null>(initialActiveDmUserId);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [onlineIds, setOnlineIds] = useState<string[]>([]);
  const [hoveredMsg, setHoveredMsg] = useState<string | null>(null);
  const [emojiPickerFor, setEmojiPickerFor] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [replyTo, setReplyTo] = useState<any | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const usersRef = ref(db, 'users');
    onValue(usersRef, snap => {
      const data = snap.val() || {};
      
      const byUsername = new Map<string, any>();
      Object.entries(data).forEach(([id, val]: any) => {
        if (id === userId || !val || typeof val !== 'object') return;
        const username = val.username || id;
        const lc = username.toLowerCase();
        if (!byUsername.has(lc)) {
          byUsername.set(lc, { id, username, val });
        } else {
          const existing = byUsername.get(lc);
          if (val.username && !existing.val.username) byUsername.set(lc, { id, username, val });
        }
      });
      const list: any[] = [];
      byUsername.forEach(({ id, username, val }) => {
        list.push({ id, username, avatar: val.avatar || val.photoURL || '', status: val.status || (val.statusObj && val.statusObj.status) || 'offline' });
      });
      setUsers(list);
    });
    const onlineRef = ref(db, 'online');
    onValue(onlineRef, snap => {
      const data = snap.val() || {};
      setOnlineIds(Object.keys(data).filter(k => data[k] === true));
    });
    return () => { off(ref(db, 'users')); off(ref(db, 'online')); };
  }, []);

  useEffect(() => {
    if (!activeDmUserId) return;
    const dmKey = [userId, activeDmUserId].sort().join('_');
    const dmRef = ref(db, `dm/${dmKey}`);
    let initialized = false;
    onValue(dmRef, snap => {
      const data = snap.val() || {};
      const msgs = Object.entries(data).map(([id, val]: any) => ({ id, ...val }))
        .sort((a: any, b: any) => (a.timestamp || 0) - (b.timestamp || 0));
      if (initialized) {
        const lastMsg = msgs[msgs.length - 1];
        if (lastMsg?.sender_id !== userId) {
          // AudioContext'i zorla aç (önceki etkileşim olmasa bile dene)
          try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            ctx.resume().then(() => { playDmSound(); setTimeout(() => ctx.close(), 1000); }).catch(() => playDmSound());
          } catch (_) { playDmSound(); }
        }
      }
      initialized = true;
      setMessages(msgs);
    });
    return () => off(ref(db, `dm/${[userId, activeDmUserId].sort().join('_')}`));
  }, [activeDmUserId]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const dmKey = activeDmUserId ? [userId, activeDmUserId].sort().join('_') : null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeDmUserId || !dmKey) return;
    if (!checkRateLimit(`dm_${userId}`, 20)) return;
    const content = input.trim();
    setInput('');
    await push(ref(db, `dm/${dmKey}`), {
      sender_id: userId,
      sender_name: currentUserName || userId,
      receiver_id: activeDmUserId,
      content,
      timestamp: new Date().toISOString(),
      type: 'text',
      reactions: {},
      is_edited: false,
      is_pinned: false,
      reply_to_id: replyTo?.id || null,
    });
    setReplyTo(null);
  };

  const handleReact = async (msgId: string, emoji: string) => {
    if (!dmKey) return;
    const r = ref(db, `dm/${dmKey}/${msgId}/reactions/${emoji}`);
    const snap = await get(r);
    const users: string[] = snap.val() || [];
    const idx = users.indexOf(userId);
    if (idx === -1) users.push(userId);
    else users.splice(idx, 1);
    if (users.length === 0) await remove(r);
    else await update(ref(db, `dm/${dmKey}/${msgId}/reactions`), { [emoji]: users });
  };

  const handleEditSave = async (msgId: string) => {
    if (!dmKey || !editValue.trim()) return;
    const msgRef = ref(db, `dm/${dmKey}/${msgId}`);
    const snap = await get(msgRef);
    const old = snap.val();
    const history = old.edit_history || [];
    history.push(old.content);
    await update(msgRef, { content: editValue.trim(), is_edited: true, edit_history: history });
    setEditingId(null);
  };

  const handleDelete = async (msgId: string) => {
    if (!dmKey) return;
    await remove(ref(db, `dm/${dmKey}/${msgId}`));
  };

  const handlePin = async (msgId: string, isPinned: boolean) => {
    if (!dmKey) return;
    await update(ref(db, `dm/${dmKey}/${msgId}`), { is_pinned: !isPinned });
  };

  const activeUser = users.find(u => u.id === activeDmUserId);
  const isOnline = activeDmUserId ? onlineIds.includes(activeDmUserId) : false;
  const pinnedMessages = messages.filter(m => m.is_pinned);

  // Group by day
  const grouped: { date: string; messages: any[] }[] = [];
  messages.forEach((msg, i) => {
    if (i === 0 || !isSameDay(msg.timestamp, messages[i - 1].timestamp)) {
      grouped.push({ date: msg.timestamp, messages: [msg] });
    } else {
      grouped[grouped.length - 1].messages.push(msg);
    }
  });

  return (
    <div className="flex-1 flex overflow-hidden bg-[#0B0E11]">
      {/* DM Sidebar */}
      <aside className="w-64 border-r border-white/5 flex flex-col bg-black/20">
        <header className="h-14 border-b border-white/5 flex items-center px-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={14} />
            <input type="text" placeholder="Arkadaş ara..." className="w-full bg-white/5 border border-white/10 rounded-full py-1.5 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-emerald-500/50 transition-all" />
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {users.map(user => (
            <button key={user.id} onClick={() => setActiveDmUserId(user.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeDmUserId === user.id ? 'bg-white/10 text-white' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}>
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center text-blue-400 font-bold border border-blue-500/20 overflow-hidden">
                  {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" alt="" /> : user.username.substring(0, 2).toUpperCase()}
                </div>
                <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#111418] ${onlineIds.includes(user.id) ? 'bg-emerald-500' : 'bg-white/20'}`} />
              </div>
              <div className="flex-1 text-left overflow-hidden">
                <p className="text-sm font-bold truncate">{user.username}</p>
                <p className="text-[10px] opacity-40 truncate">{onlineIds.includes(user.id) ? 'Çevrimiçi' : 'Çevrimdışı'}</p>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Chat */}
      <div className="flex-1 flex flex-col">
        {!activeDmUserId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
            <div className="w-24 h-24 rounded-[40px] bg-white/5 flex items-center justify-center mb-6 border border-white/10">
              <MessageSquare size={40} className="text-white/10" />
            </div>
            <h3 className="text-xl font-bold text-white">Mesajlaşmaya Başla</h3>
            <p className="text-sm text-white/40 mt-2 max-w-xs">Soldaki listeden bir arkadaşını seçerek özel mesajlaşmaya başlayabilirsin.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <header className="h-16 border-b border-white/5 flex items-center px-6 justify-between bg-black/20 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20 overflow-hidden">
                  {activeUser?.avatar ? <img src={activeUser.avatar} className="w-full h-full object-cover" alt="" /> : activeUser?.username?.substring(0, 2).toUpperCase() || '??'}
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">{activeUser?.username || 'Yükleniyor...'}</h3>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-white/20'}`} />
                    <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => onStartCall?.(activeDmUserId!, activeUser?.username || activeDmUserId!, 'voice')} className="p-2.5 text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-all"><Phone size={18} /></button>
                <button onClick={() => onStartCall?.(activeDmUserId!, activeUser?.username || activeDmUserId!, 'video')} className="p-2.5 text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-all"><Video size={18} /></button>
                <button className="p-2.5 text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-all"><Info size={18} /></button>
              </div>
            </header>

            {/* Pin bar */}
            <AnimatePresence>
              {pinnedMessages.length > 0 && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                  className="border-b border-yellow-500/20 bg-yellow-500/5 px-6 py-2">
                  <div className="flex items-center gap-2 text-xs text-yellow-400/80">
                    <Pin size={12} />
                    <span className="font-bold">Sabitlenmiş:</span>
                    <span className="truncate text-white/60">{pinnedMessages[pinnedMessages.length - 1]?.content}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-1 custom-scrollbar">
              {grouped.map(group => (
                <div key={group.date}>
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-white/5" />
                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-2">{dayLabel(group.date)}</span>
                    <div className="flex-1 h-px bg-white/5" />
                  </div>

                  {group.messages.map(msg => {
                    const isOwn = msg.sender_id === userId;
                    const isEditing = editingId === msg.id;
                    const reactionEntries = Object.entries(msg.reactions || {}) as [string, string[]][];

                    return (
                      <div key={msg.id}
                        className={`flex gap-3 group mb-2 relative ${isOwn ? 'flex-row-reverse' : ''}`}
                        onMouseEnter={() => setHoveredMsg(msg.id)}
                        onMouseLeave={() => { setHoveredMsg(null); setEmojiPickerFor(null); }}>

                        <div className="w-9 h-9 rounded-xl shrink-0 overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center text-xs font-black text-white/40">
                          {msg.sender_id === userId
                            ? (currentUserName || 'Sen').substring(0, 2).toUpperCase()
                            : (activeUser?.avatar ? <img src={activeUser.avatar} className="w-full h-full object-cover" alt="" /> : activeUser?.username?.substring(0, 2).toUpperCase() || '??')}
                        </div>

                        <div className={`flex flex-col max-w-[70%] ${isOwn ? 'items-end' : ''}`}>
                          <div className={`flex items-center gap-2 mb-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
                            <span className="text-xs font-bold text-white/60">{msg.sender_name || msg.sender_id}</span>
                            <span className="text-[10px] text-white/20">{formatTime(msg.timestamp)}</span>
                            {msg.is_edited && <span className="text-[9px] text-white/20 italic">(düzenlendi)</span>}
                            {msg.is_pinned && <Pin size={10} className="text-yellow-400" />}
                          </div>

                          {msg.reply_to_id && (
                            <div className={`text-[11px] text-white/30 border-l-2 border-white/20 pl-2 mb-1 italic ${isOwn ? 'text-right border-l-0 border-r-2 pr-2' : ''}`}>
                              Yanıtlandı
                            </div>
                          )}

                          {isEditing ? (
                            <div className="flex gap-2 items-center">
                              <input value={editValue} onChange={e => setEditValue(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleEditSave(msg.id); if (e.key === 'Escape') setEditingId(null); }}
                                className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 min-w-48" autoFocus />
                              <button onClick={() => handleEditSave(msg.id)} className="p-1.5 bg-blue-500 rounded-lg text-white"><Check size={14} /></button>
                              <button onClick={() => setEditingId(null)} className="p-1.5 bg-white/10 rounded-lg text-white/60"><X size={14} /></button>
                            </div>
                          ) : (
                            <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isOwn ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-tr-sm' : 'bg-white/5 text-white/85 border border-white/10 rounded-tl-sm'}`}>
                              {msg.type === 'image' && msg.file_url ? (
                                <img src={msg.file_url} alt={msg.file_name} className="max-w-xs rounded-xl cursor-pointer" onClick={() => window.open(msg.file_url, '_blank')} />
                              ) : msg.type === 'file' && msg.file_url ? (
                                <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-300 hover:text-blue-200">
                                  <Download size={14} />{msg.file_name || 'Dosya'}
                                </a>
                              ) : msg.content}
                            </div>
                          )}

                          {reactionEntries.length > 0 && (
                            <div className={`flex flex-wrap gap-1 mt-1 ${isOwn ? 'justify-end' : ''}`}>
                              {reactionEntries.map(([emoji, users]) => (
                                <button key={emoji} onClick={() => handleReact(msg.id, emoji)}
                                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-all ${users.includes(userId) ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30'}`}>
                                  {emoji} <span>{users.length}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Action toolbar */}
                        <AnimatePresence>
                          {hoveredMsg === msg.id && !isEditing && (
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                              className={`absolute top-0 flex items-center gap-1 bg-[#1a1d21] border border-white/10 rounded-xl p-1 shadow-lg z-10 ${isOwn ? 'right-12' : 'left-12'}`}>
                              <div className="relative">
                                <button onClick={() => setEmojiPickerFor(emojiPickerFor === msg.id ? null : msg.id)}
                                  className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-all"><Smile size={14} /></button>
                                <AnimatePresence>
                                  {emojiPickerFor === msg.id && (
                                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                                      className="absolute bottom-8 left-0 flex gap-1 bg-[#1a1d21] border border-white/10 rounded-xl p-2 shadow-xl z-20">
                                      {EMOJIS.map(emoji => (
                                        <button key={emoji} onClick={() => { handleReact(msg.id, emoji); setEmojiPickerFor(null); }}
                                          className="text-lg hover:scale-125 transition-transform">{emoji}</button>
                                      ))}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                              <button onClick={() => setReplyTo(msg)} className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-all"><Reply size={14} /></button>
                              <button onClick={() => handlePin(msg.id, msg.is_pinned)} className="p-1.5 text-white/40 hover:text-yellow-400 hover:bg-white/10 rounded-lg transition-all"><Pin size={14} /></button>
                              {isOwn && <>
                                <button onClick={() => { setEditingId(msg.id); setEditValue(msg.content); }}
                                  className="p-1.5 text-white/40 hover:text-blue-400 hover:bg-white/10 rounded-lg transition-all"><Edit3 size={14} /></button>
                                <button onClick={() => handleDelete(msg.id)}
                                  className="p-1.5 text-white/40 hover:text-red-400 hover:bg-white/10 rounded-lg transition-all"><Trash2 size={14} /></button>
                              </>}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Reply bar */}
            <AnimatePresence>
              {replyTo && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                  className="mx-6 px-4 py-2 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Reply size={14} className="text-blue-400" />
                    <span className="text-xs text-white/40">{replyTo.sender_name}'e yanıt:</span>
                    <span className="text-xs text-white/60 truncate max-w-48">{replyTo.content}</span>
                  </div>
                  <button onClick={() => setReplyTo(null)} className="text-white/30 hover:text-white"><X size={14} /></button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input */}
            <form onSubmit={handleSend} className="p-6 pt-2 bg-black/20 border-t border-white/5">
              <div className="relative flex items-center gap-3">
                <input ref={fileInputRef} type="file" className="hidden" />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-white/20 hover:text-white transition-all"><Paperclip size={20} /></button>
                <div className="flex-1 relative">
                  <input value={input} onChange={e => setInput(e.target.value)}
                    placeholder={`${activeUser?.username || 'Arkadaşına'} mesaj gönder...`}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-3.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all" />
                </div>
                <button type="submit" disabled={!input.trim()}
                  className={`p-3.5 rounded-2xl transition-all ${input.trim() ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-white/5 text-white/10'}`}>
                  <Send size={20} />
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
