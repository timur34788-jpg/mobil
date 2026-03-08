import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Hash, User, MessageSquare, X, ArrowRight } from 'lucide-react';
import { db } from '../firebase';
import { ref, get } from 'firebase/database';

interface GlobalSearchProps {
  theme: any;
  onNavigate: (type: 'channel' | 'user' | 'message', id: string) => void;
}

export const GlobalSearch = ({ theme, onNavigate }: GlobalSearchProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ channels: any[], users: any[], messages: any[] }>({ channels: [], users: [], messages: [] });
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('search_recent') || '[]'); } catch { return []; }
  });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    if (!query.trim()) { setResults({ channels: [], users: [], messages: [] }); return; }
    const timer = setTimeout(() => doSearch(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const doSearch = async (q: string) => {
    setLoading(true);
    const lq = q.toLowerCase();
    try {
      const [chanSnap, userSnap] = await Promise.all([
        get(ref(db, 'channels')),
        get(ref(db, 'users')),
      ]);

      const channels: any[] = [];
      const chanData = chanSnap.val() || {};
      Object.entries(chanData).forEach(([id, val]: any) => {
        if (val.name?.toLowerCase().includes(lq)) channels.push({ id, ...val });
      });

      const users: any[] = [];
      const userData = userSnap.val() || {};
      Object.entries(userData).forEach(([id, val]: any) => {
        const username = val.username || id;
        if (username.toLowerCase().includes(lq)) users.push({ id, username, avatar: val.avatar || '', status: val.status });
      });

      setResults({ channels: channels.slice(0, 5), users: users.slice(0, 5), messages: [] });
    } finally { setLoading(false); }
  };

  const handleSelect = (type: 'channel' | 'user' | 'message', id: string, label: string) => {
    const newRecent = [label, ...recent.filter(r => r !== label)].slice(0, 5);
    setRecent(newRecent);
    try { localStorage.setItem('search_recent', JSON.stringify(newRecent)); } catch {}
    onNavigate(type, id);
  };

  const totalResults = results.channels.length + results.users.length + results.messages.length;

  return (
    <div className="flex-1 flex flex-col bg-[#0B0E11]">
      <div className="p-6 border-b border-white/5">
        <div className="relative max-w-2xl mx-auto">
          <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Kanal, kullanıcı veya mesaj ara..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-12 py-4 text-white text-base focus:outline-none focus:border-emerald-500/50 transition-all"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-all">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto w-full">
        {!query && recent.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3">Son Aramalar</p>
            <div className="flex flex-wrap gap-2">
              {recent.map(r => (
                <button key={r} onClick={() => setQuery(r)}
                  className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all">
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}

        {!query && (
          <div className="text-center py-12 text-white/20">
            <Search size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-sm">Aramak için yazmaya başla</p>
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        )}

        {query && !loading && (
          <AnimatePresence>
            {totalResults === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 text-white/30">
                <p className="text-sm">"{query}" için sonuç bulunamadı</p>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                {results.channels.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3">Kanallar</p>
                    <div className="space-y-1">
                      {results.channels.map(ch => (
                        <button key={ch.id} onClick={() => handleSelect('channel', ch.id, ch.name)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all group text-left">
                          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                            <Hash size={16} className="text-emerald-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-white">#{ch.name}</p>
                            <p className="text-xs text-white/30">{ch.type === 'text' ? 'Metin Kanalı' : ch.type}</p>
                          </div>
                          <ArrowRight size={14} className="text-white/20 opacity-0 group-hover:opacity-100 transition-all" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {results.users.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3">Kullanıcılar</p>
                    <div className="space-y-1">
                      {results.users.map(user => (
                        <button key={user.id} onClick={() => handleSelect('user', user.id, user.username)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all group text-left">
                          <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-sm font-bold text-white/40 overflow-hidden">
                            {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" alt="" /> : (user.username || '?').substring(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-white">{user.username}</p>
                            <div className="flex items-center gap-1.5">
                              <div className={`w-1.5 h-1.5 rounded-full ${user.status === 'online' ? 'bg-emerald-500' : 'bg-white/20'}`} />
                              <p className="text-xs text-white/30">{user.status === 'online' ? 'Çevrimiçi' : 'Çevrimdışı'}</p>
                            </div>
                          </div>
                          <ArrowRight size={14} className="text-white/20 opacity-0 group-hover:opacity-100 transition-all" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};
