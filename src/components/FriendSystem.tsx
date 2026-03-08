import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserPlus, UserCheck, UserX, Users, Search, Shield, Flag, X, Check, MessageSquare } from 'lucide-react';
import { db } from '../firebase';
import { ref, onValue, off, push, set, remove, update, get } from 'firebase/database';

interface Props {
  theme: any;
  userId: string;
  allUsers: any[];
  onStartDM: (targetId: string) => void;
}

export const FriendSystem = ({ theme, userId, allUsers, onStartDM }: Props) => {
  const [tab, setTab] = useState<'friends' | 'requests' | 'find'>('friends');
  const [friends, setFriends] = useState<string[]>([]);
  const [blocked, setBlocked] = useState<string[]>([]);
  const [incoming, setIncoming] = useState<any[]>([]);
  const [outgoing, setOutgoing] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!userId) return;
    const refs: any[] = [];

    const uRef = ref(db, `users/${userId}`);
    onValue(uRef, snap => {
      const d = snap.val() || {};
      setFriends(Object.keys(d.friends || {}));
      setBlocked(Object.keys(d.blocked || {}));
    });
    refs.push(uRef);

    const frRef = ref(db, `friend_requests/${userId}`);
    onValue(frRef, snap => {
      const d = snap.val() || {};
      setIncoming(Object.entries(d).map(([id, v]: any) => ({ id, ...v })));
    });
    refs.push(frRef);

    // Outgoing: requests I sent
    const allFrRef = ref(db, 'friend_requests');
    onValue(allFrRef, snap => {
      const d = snap.val() || {};
      const sent: string[] = [];
      Object.entries(d).forEach(([toId, reqs]: any) => {
        Object.values(reqs || {}).forEach((r: any) => {
          if (r.from === userId) sent.push(toId);
        });
      });
      setOutgoing(sent);
    });
    refs.push(allFrRef);

    return () => refs.forEach(r => off(r));
  }, [userId]);

  const sendRequest = async (targetId: string) => {
    await push(ref(db, `friend_requests/${targetId}`), { from: userId, timestamp: new Date().toISOString() });
    await push(ref(db, `notifications/${targetId}`), {
      type: 'friend_request', from_id: userId,
      content: `${allUsers.find(u => u.id === userId)?.username || 'Biri'} sana arkadaşlık isteği gönderdi`,
      read: false, timestamp: new Date().toISOString()
    });
  };

  const acceptRequest = async (req: any) => {
    await remove(ref(db, `friend_requests/${userId}/${req.id}`));
    await update(ref(db, `users/${userId}/friends`), { [req.from]: true });
    await update(ref(db, `users/${req.from}/friends`), { [userId]: true });
    await push(ref(db, `notifications/${req.from}`), {
      type: 'friend_accept', from_id: userId,
      content: `${allUsers.find(u => u.id === userId)?.username || 'Biri'} arkadaşlık isteğini kabul etti`,
      read: false, timestamp: new Date().toISOString()
    });
  };

  const rejectRequest = async (req: any) => {
    await remove(ref(db, `friend_requests/${userId}/${req.id}`));
  };

  const removeFriend = async (fId: string) => {
    await remove(ref(db, `users/${userId}/friends/${fId}`));
    await remove(ref(db, `users/${fId}/friends/${userId}`));
  };

  const blockUser = async (targetId: string) => {
    await set(ref(db, `users/${userId}/blocked/${targetId}`), true);
    await removeFriend(targetId);
  };

  const unblockUser = async (targetId: string) => {
    await remove(ref(db, `users/${userId}/blocked/${targetId}`));
  };

  const reportUser = async (targetId: string) => {
    const target = allUsers.find(u => u.id === targetId);
    await push(ref(db, 'logs'), {
      action: 'USER_REPORT', detail: `${allUsers.find(u => u.id === userId)?.username} → ${target?.username}`,
      timestamp: new Date().toISOString(), admin: 'system'
    });
    alert('Şikayet iletildi, admin inceleyecek.');
  };

  const friendUsers = allUsers.filter(u => friends.includes(u.id));
  const filteredAll = allUsers.filter(u =>
    u.id !== userId &&
    !blocked.includes(u.id) &&
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  const UserCard = ({ u, isFriend, isPending }: { u: any; isFriend: boolean; isPending: boolean }) => (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 border border-white/5">
      <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-sm font-bold text-white/60 shrink-0">
        {(u.username || '?').substring(0, 2).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">{u.username}</p>
        <p className="text-white/30 text-xs">{u.status === 'online' ? '🟢 Çevrimiçi' : '⚫ Çevrimdışı'}</p>
      </div>
      <div className="flex gap-1 shrink-0">
        {isFriend && (
          <button onClick={() => onStartDM(u.id)} className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20" title="Mesaj gönder">
            <MessageSquare size={13} />
          </button>
        )}
        {!isFriend && !isPending && !blocked.includes(u.id) && (
          <button onClick={() => sendRequest(u.id)} className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20" title="Arkadaş ekle">
            <UserPlus size={13} />
          </button>
        )}
        {isPending && (
          <span className="text-[10px] text-white/30 px-2">İstek gönderildi</span>
        )}
        {isFriend && (
          <button onClick={() => removeFriend(u.id)} className="p-1.5 rounded-lg bg-white/5 text-white/30 hover:text-red-400" title="Arkadaşlıktan çıkar">
            <UserX size={13} />
          </button>
        )}
        <button onClick={() => blockUser(u.id)} className="p-1.5 rounded-lg bg-white/5 text-white/30 hover:text-orange-400" title="Engelle">
          <Shield size={13} />
        </button>
        <button onClick={() => reportUser(u.id)} className="p-1.5 rounded-lg bg-white/5 text-white/30 hover:text-red-400" title="Şikayet et">
          <Flag size={13} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0B0E11]">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-white/5">
        <h2 className="text-xl font-bold text-white mb-4">Arkadaşlar</h2>
        <div className="flex gap-2">
          {([['friends', `Arkadaşlar (${friends.length})`], ['requests', `İstekler ${incoming.length > 0 ? `(${incoming.length})` : ''}`], ['find', 'Bul']] as const).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id as any)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === id ? 'bg-emerald-500 text-white' : 'bg-white/5 text-white/50 hover:text-white'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {/* Friends */}
        {tab === 'friends' && (
          <>
            {friendUsers.length === 0 ? (
              <div className="text-center py-12 text-white/30">
                <Users size={40} className="mx-auto mb-3 opacity-30" />
                <p>Henüz arkadaşın yok</p>
                <p className="text-xs mt-1">"Bul" sekmesinden arkadaş ekleyebilirsin</p>
              </div>
            ) : friendUsers.map(u => (
              <UserCard key={u.id} u={u} isFriend={true} isPending={false} />
            ))}

            {blocked.length > 0 && (
              <div className="mt-6">
                <p className="text-white/30 text-xs font-bold uppercase mb-2">Engellenenler</p>
                {allUsers.filter(u => blocked.includes(u.id)).map(u => (
                  <div key={u.id} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/3 border border-white/5 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs text-white/30">{(u.username || '?').substring(0, 2).toUpperCase()}</div>
                    <span className="text-white/40 text-sm flex-1">{u.username || u.id}</span>
                    <button onClick={() => unblockUser(u.id)} className="text-xs text-white/30 hover:text-white px-2 py-1 rounded bg-white/5">Engeli Kaldır</button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Requests */}
        {tab === 'requests' && (
          <>
            {incoming.length === 0 ? (
              <div className="text-center py-12 text-white/30">
                <UserPlus size={40} className="mx-auto mb-3 opacity-30" />
                <p>Bekleyen istek yok</p>
              </div>
            ) : incoming.map(req => {
              const sender = allUsers.find(u => u.id === req.from);
              return (
                <div key={req.id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-sm font-bold text-white/60">
                    {sender?.username?.substring(0, 2).toUpperCase() || '??'}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">{sender?.username || req.from}</p>
                    <p className="text-white/30 text-xs">Arkadaşlık isteği gönderdi</p>
                  </div>
                  <button onClick={() => acceptRequest(req)} className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30">
                    <Check size={15} />
                  </button>
                  <button onClick={() => rejectRequest(req)} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20">
                    <X size={15} />
                  </button>
                </div>
              );
            })}
          </>
        )}

        {/* Find */}
        {tab === 'find' && (
          <>
            <div className="relative mb-2">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Kullanıcı ara..." className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/50" />
            </div>
            {filteredAll.map(u => (
              <UserCard key={u.id} u={u} isFriend={friends.includes(u.id)} isPending={outgoing.includes(u.id)} />
            ))}
          </>
        )}
      </div>
    </div>
  );
};
