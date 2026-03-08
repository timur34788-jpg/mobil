import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Search, Plus, MessageCircle, Clock, ThumbsUp, Eye } from 'lucide-react';
import { db } from '../firebase';
import { ref, onValue, push, off } from 'firebase/database';

interface Post {
  id: string;
  author_id: string;
  author_name: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
}

export const Forum = ({ theme }: { theme: any }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const r = ref(db, 'forum');
    onValue(r, snap => {
      const data = snap.val() || {};
      const list = Object.entries(data).map(([id, val]: any) => ({
        id, author_id: val.author_id || '', author_name: val.author_name || 'Anonim',
        title: val.title || '', content: val.content || '',
        category: val.category || 'Genel', created_at: val.created_at || ''
      }));
      setPosts(list.reverse());
    });
    return () => off(r);
  }, []);

  const filteredPosts = posts.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0B0E11] overflow-hidden">
      <header className="h-14 border-b border-white/5 flex items-center px-6 justify-between bg-black/20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <MessageSquare size={20} className="text-blue-500" />
          <h3 className="font-bold text-white uppercase tracking-widest text-sm">Ekosistem Forumu</h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={14} />
            <input 
              type="text" 
              placeholder="Tartışma ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-full py-1.5 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-blue-500/50 w-48 transition-all focus:w-64"
            />
          </div>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-lg shadow-blue-500/20"
          >
            <Plus size={14} /> Yeni Konu
          </button>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <div className="max-w-5xl mx-auto space-y-4">
          {filteredPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-white/20">
              <MessageCircle size={48} className="mb-4 opacity-20" />
              <p className="text-sm font-medium">Henüz bir tartışma başlatılmamış.</p>
            </div>
          ) : (
            filteredPosts.map((post) => (
              <motion.div 
                key={post.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/[0.07] transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] font-bold rounded-md uppercase tracking-wider">
                        {post.category || 'Genel'}
                      </span>
                      <span className="text-[10px] text-white/20 flex items-center gap-1">
                        <Clock size={10} /> {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors mb-2">
                      {post.title}
                    </h4>
                    <p className="text-sm text-white/40 line-clamp-2 leading-relaxed">
                      {post.content}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-white/20">
                    <div className="flex flex-col items-center">
                      <ThumbsUp size={16} />
                      <span className="text-[10px] mt-1">12</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <MessageCircle size={16} />
                      <span className="text-[10px] mt-1">8</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <Eye size={16} />
                      <span className="text-[10px] mt-1">124</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-2xl bg-[#111418] border border-white/10 rounded-2xl p-8 shadow-2xl"
            >
              <h3 className="text-xl font-bold text-white mb-6">Yeni Tartışma Başlat</h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const title = formData.get('title') as string;
                const content = formData.get('content') as string;
                const category = formData.get('category') as string;
                if (!title || !content) return;
                await push(ref(db, 'forum'), {
                  title, content, category,
                  author_name: 'Anonim',
                  created_at: new Date().toISOString()
                });
                setIsCreateModalOpen(false);
              }}>
                <div className="space-y-4">
                  <input name="title" type="text" placeholder="Başlık" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white" />
                  <select name="category" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white">
                    <option value="Genel">Genel</option>
                    <option value="Teknoloji">Teknoloji</option>
                  </select>
                  <textarea name="content" placeholder="İçerik" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white h-32" />
                  <div className="flex gap-4">
                    <button type="button" onClick={() => setIsCreateModalOpen(false)} className="flex-1 py-3 bg-white/5 text-white rounded-xl">Vazgeç</button>
                    <button type="submit" className="flex-1 py-3 bg-blue-500 text-white rounded-xl">Yayınla</button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
