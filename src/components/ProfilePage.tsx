import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { auth, storage } from '../firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile, signOut } from 'firebase/auth';
import { getUser, updateUser, checkDailyReward } from '../services/firebaseService';
import { db } from '../firebase';
import { ref, set, get, remove } from 'firebase/database';
import {
  Camera, Edit3, Save, X, Twitter, Github, Instagram, LogOut,
  Star, Shield, Zap, Award, Gift, ChevronRight, Globe, BadgeCheck, Clock, CheckCircle2
} from 'lucide-react';

const BADGE_CONFIG: Record<string, { label: string, color: string, icon: any }> = {
  founder: { label: 'Kurucu', color: 'text-yellow-400', icon: '👑' },
  admin: { label: 'Admin', color: 'text-red-400', icon: '🛡️' },
  early: { label: 'Erken Üye', color: 'text-purple-400', icon: '⭐' },
  active: { label: 'Aktif Üye', color: 'text-emerald-400', icon: '🌿' },
  chatty: { label: 'Sohbetçi', color: 'text-blue-400', icon: '💬' },
};

const getXPLevel = (xp: number) => {
  const level = Math.floor(xp / 100) + 1;
  const progress = xp % 100;
  return { level, progress };
};

export const ProfilePage = ({ theme, userId, viewUserId }: { theme: any, userId: string, viewUserId?: string }) => {
  const targetId = viewUserId || userId;
  const isOwnProfile = targetId === userId;

  const [user, setUser] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editSocial, setEditSocial] = useState({ twitter: '', github: '', instagram: '' });
  const [uploading, setUploading] = useState(false);
  const [dailyReward, setDailyReward] = useState<{ claimed: boolean, xp: number } | null>(null);
  const [verifyRequest, setVerifyRequest] = useState<any>(null);
  const [verifyNote, setVerifyNote] = useState('');
  const [verifySubmitting, setVerifySubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      const data = await getUser(targetId);
      if (data) {
        setUser(data);
        setEditBio(data.bio || '');
        setEditStatus(data.status_message || '');
        setEditSocial(data.social_links || {});
      }
    };
    load();
  }, [targetId]);

  useEffect(() => {
    if (isOwnProfile) {
      const reqRef = ref(db, `verification_requests/${userId}`);
      get(reqRef).then(snap => {
        if (snap.exists()) setVerifyRequest(snap.val());
      });
    }
  }, [userId, isOwnProfile]);

  useEffect(() => {
    if (isOwnProfile) {
      checkDailyReward(userId).then(setDailyReward);
    }
  }, [userId, isOwnProfile]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const sRef = storageRef(storage, `avatars/${userId}`);
      await uploadBytes(sRef, file);
      const url = await getDownloadURL(sRef);
      await updateUser(userId, { avatar: url });
      if (auth.currentUser) await updateProfile(auth.currentUser, { photoURL: url });
      setUser((prev: any) => ({ ...prev, avatar: url }));
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    await updateUser(userId, {
      bio: editBio,
      status_message: editStatus,
      social_links: editSocial
    });
    setUser((prev: any) => ({ ...prev, bio: editBio, status_message: editStatus, social_links: editSocial }));
    setEditing(false);
  };

  const handleVerifySubmit = async () => {
    if (!verifyNote.trim()) return;
    setVerifySubmitting(true);
    await set(ref(db, `verification_requests/${userId}`), {
      userId,
      username: user.username,
      email: user.email || '',
      note: verifyNote.trim(),
      requestedAt: new Date().toISOString(),
      status: 'pending',
    });
    setVerifyRequest({ status: 'pending', note: verifyNote.trim() });
    setVerifyNote('');
    setVerifySubmitting(false);
  };

  const handleVerifyCancel = async () => {
    await remove(ref(db, `verification_requests/${userId}`));
    setVerifyRequest(null);
  };

  const handleLogout = async () => {
    await updateUser(userId, { status: 'offline' });
    await signOut(auth);
    window.location.reload();
  };

  if (!user) return <div className="flex-1 flex items-center justify-center text-white/40">Yükleniyor...</div>;

  const { level, progress } = getXPLevel(user.xp || 0);

  return (
    <div className="flex-1 overflow-y-auto bg-[#0B0E11]">
      {/* Banner */}
      <div className="h-32 bg-gradient-to-r from-emerald-900/50 to-teal-900/50 relative">
        <div className="absolute inset-0 opacity-20" style={{ background: `radial-gradient(circle at 30% 50%, ${theme.accent}, transparent 60%)` }} />
      </div>

      <div className="px-6 pb-6">
        {/* Avatar + Actions */}
        <div className="flex items-end justify-between -mt-12 mb-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-[24px] border-4 border-[#0B0E11] bg-white/5 overflow-hidden">
              {user.avatar ? (
                <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-black text-white/40">
                  {user.username?.substring(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            {isOwnProfile && (
              <>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="absolute bottom-0 right-0 w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg hover:bg-emerald-600 transition-all"
                >
                  <Camera size={14} className="text-white" />
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </>
            )}
          </div>

          <div className="flex items-center gap-2 mb-2">
            {isOwnProfile && (
              <>
                <button
                  onClick={() => editing ? handleSave() : setEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-white rounded-xl text-sm font-bold hover:bg-white/10 transition-all"
                >
                  {editing ? <><Save size={14} /> Kaydet</> : <><Edit3 size={14} /> Düzenle</>}
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-bold hover:bg-red-500/20 transition-all"
                >
                  <LogOut size={14} /> Çıkış
                </button>
              </>
            )}
          </div>
        </div>

        {/* Username + Status */}
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-white">{user.username}</h2>
            {user.is_admin && <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold rounded-full uppercase tracking-widest">Admin</span>}
          </div>
          {editing ? (
            <input
              value={editStatus}
              onChange={e => setEditStatus(e.target.value)}
              placeholder="Durum mesajı..."
              className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
              maxLength={100}
            />
          ) : (
            <p className="text-white/40 text-sm mt-1">{user.status_message || 'Durum mesajı yok'}</p>
          )}
        </div>

        {/* XP Bar */}
        <div className="mb-4 p-4 bg-white/5 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-yellow-400" />
              <span className="text-sm font-bold text-white">Seviye {level}</span>
            </div>
            <span className="text-xs text-white/40">{user.xp || 0} XP</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-[10px] text-white/30 mt-1">{100 - progress} XP sonraki seviyeye</p>
        </div>

        {/* Daily Reward */}
        {isOwnProfile && dailyReward && !dailyReward.claimed && dailyReward.xp > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-center gap-3"
          >
            <Gift size={24} className="text-yellow-400" />
            <div>
              <p className="text-sm font-bold text-yellow-400">Günlük Ödül!</p>
              <p className="text-xs text-white/60">+{dailyReward.xp} XP kazandın 🎉</p>
            </div>
          </motion.div>
        )}

        {/* Badges */}
        {user.badges?.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Rozetler</p>
            <div className="flex flex-wrap gap-2">
              {user.badges.map((badge: string) => {
                const cfg = BADGE_CONFIG[badge];
                if (!cfg) return null;
                return (
                  <span key={badge} className={`flex items-center gap-1 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-bold ${cfg.color}`}>
                    {cfg.icon} {cfg.label}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Doğrulanmış Rozet */}
        {isOwnProfile && (
          <div className="mb-4 rounded-2xl overflow-hidden border border-emerald-500/20 bg-gradient-to-b from-emerald-950/40 to-transparent">

            {/* Başlık */}
            <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-emerald-500/10">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <BadgeCheck size={18} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-black text-white tracking-wide">🍃 Doğrulanmış Üye Rozeti</p>
                <p className="text-[11px] text-white/40">Nature.co topluluğunun güvenilir üyelerine verilir</p>
              </div>
              {user.is_verified && (
                <span className="ml-auto flex items-center gap-1.5 px-3 py-1 bg-emerald-500/15 border border-emerald-500/30 rounded-full text-emerald-400 text-[11px] font-black uppercase tracking-widest">
                  <CheckCircle2 size={12} /> Aktif
                </span>
              )}
            </div>

            <div className="px-5 py-4">
              {/* Kurallar */}
              <div className="mb-4">
                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-3">Kimler başvurabilir?</p>
                <div className="space-y-2.5">
                  {[
                    { icon: '🌱', title: 'Gerçek Kimlik', desc: 'Hesabın gerçek bir kişiye veya kuruluşa ait olmalı. Taklit veya sahte profiller kesinlikle reddedilir.' },
                    { icon: '🌿', title: 'Tamamlanmış Profil', desc: 'Profil fotoğrafı, kullanıcı adı ve biyografi doldurulmuş olmalı. Yarım bırakılmış profiller değerlendirmeye alınmaz.' },
                    { icon: '🍃', title: 'Topluluk Katkısı', desc: 'Ekosisteme aktif katkı sağlayan; içerik üreten, tartışmalara katılan veya topluluğu destekleyen üyeler önceliklidir.' },
                    { icon: '🌲', title: 'Güvenilir Davranış', desc: 'Kurallara uyan, saygılı ve yapıcı bir iletişim geçmişine sahip olmalısın. Uyarı almış hesaplar reddedilebilir.' },
                    { icon: '🌍', title: 'Tanınırlık', desc: 'İçerik üreticisi, sanatçı, yazar, akademisyen, aktivist veya kendi alanında öne çıkan kişiler tercih edilir.' },
                  ].map(rule => (
                    <div key={rule.icon} className="flex gap-3 p-3 bg-white/3 rounded-xl border border-white/5">
                      <span className="text-base flex-shrink-0 mt-0.5">{rule.icon}</span>
                      <div>
                        <p className="text-xs font-bold text-white/80 mb-0.5">{rule.title}</p>
                        <p className="text-[11px] text-white/40 leading-relaxed">{rule.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 p-3 bg-yellow-500/5 border border-yellow-500/15 rounded-xl">
                  <p className="text-[11px] text-yellow-400/80 leading-relaxed">
                    ⚠️ Rozet, hesabının ne kadar popüler olduğunu değil, <span className="font-bold">gerçek ve güvenilir</span> olduğunu gösterir. Onay veya red kararı tamamen Nature.co yönetimine aittir.
                  </p>
                </div>
              </div>

              {/* Durum / Form */}
              {user.is_verified ? (
                <div className="flex items-center gap-2.5 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  <span className="text-sm font-bold text-emerald-300">Hesabın doğrulanmış, rozet aktif 🎉</span>
                </div>
              ) : verifyRequest?.status === 'pending' ? (
                <div className="p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
                  <div className="flex items-center gap-2 text-yellow-400 mb-2">
                    <Clock size={14} />
                    <span className="text-sm font-bold">Talebiniz inceleniyor...</span>
                  </div>
                  <p className="text-[11px] text-white/40 mb-3 italic">"{verifyRequest.note}"</p>
                  <button onClick={handleVerifyCancel} className="text-xs text-red-400/70 hover:text-red-400 transition-colors">
                    Talebi geri çek
                  </button>
                </div>
              ) : verifyRequest?.status === 'rejected' ? (
                <div>
                  <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-xl mb-3">
                    <p className="text-sm font-bold text-red-400 mb-1">Talebiniz reddedildi</p>
                    {verifyRequest.adminNote && <p className="text-[11px] text-white/40">Gerekçe: {verifyRequest.adminNote}</p>}
                  </div>
                  <textarea
                    value={verifyNote}
                    onChange={e => setVerifyNote(e.target.value)}
                    placeholder="Yukarıdaki kurallara göre neden uygun olduğunu açıkla..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/40 resize-none mb-2"
                    rows={3}
                    maxLength={300}
                  />
                  <button
                    onClick={handleVerifySubmit}
                    disabled={verifySubmitting || !verifyNote.trim()}
                    className="w-full py-2.5 bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 rounded-xl text-sm font-bold hover:bg-emerald-500/25 transition-all disabled:opacity-40"
                  >
                    {verifySubmitting ? 'Gönderiliyor...' : '🍃 Tekrar Başvur'}
                  </button>
                </div>
              ) : (
                <div>
                  <textarea
                    value={verifyNote}
                    onChange={e => setVerifyNote(e.target.value)}
                    placeholder="Kendin hakkında kısaca yaz. Kim olduğunu, ne yaptığını ve neden doğrulanmak istediğini anlat..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/40 resize-none mb-2"
                    rows={4}
                    maxLength={300}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-white/25">{verifyNote.length}/300</span>
                    <button
                      onClick={handleVerifySubmit}
                      disabled={verifySubmitting || verifyNote.trim().length < 20}
                      className="px-5 py-2.5 bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 rounded-xl text-sm font-bold hover:bg-emerald-500/25 transition-all disabled:opacity-40"
                    >
                      {verifySubmitting ? 'Gönderiliyor...' : '🍃 Rozet Talep Et'}
                    </button>
                  </div>
                  <p className="text-[10px] text-white/25 mt-1.5">En az 20 karakter gerekli</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bio */}
        <div className="mb-4">
          <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Hakkında</p>
          {editing ? (
            <textarea
              value={editBio}
              onChange={e => setEditBio(e.target.value)}
              placeholder="Kendini tanıt..."
              rows={3}
              maxLength={300}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white resize-none focus:outline-none focus:border-emerald-500/50"
            />
          ) : (
            <p className="text-sm text-white/60">{user.bio || 'Biyografi eklenmemiş.'}</p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'Mesaj', value: user.message_count || 0, icon: '💬' },
            { label: 'Arkadaş', value: Object.keys(user.friends || {}).length, icon: '👥' },
            { label: 'XP', value: user.xp || 0, icon: '⚡' },
          ].map(stat => (
            <div key={stat.label} className="p-3 bg-white/5 rounded-xl border border-white/10 text-center">
              <div className="text-xl mb-1">{stat.icon}</div>
              <div className="text-lg font-black text-white">{stat.value}</div>
              <div className="text-[10px] text-white/40 uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Social Links */}
        <div>
          <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Sosyal Medya</p>
          {editing ? (
            <div className="space-y-2">
              {(['twitter', 'github', 'instagram'] as const).map(platform => (
                <div key={platform} className="flex items-center gap-2">
                  <span className="text-white/40 w-20 text-xs capitalize">{platform}</span>
                  <input
                    value={editSocial[platform] || ''}
                    onChange={e => setEditSocial(prev => ({ ...prev, [platform]: e.target.value }))}
                    placeholder={`@${platform} kullanıcı adı`}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex gap-3">
              {user.social_links?.twitter && (
                <a href={`https://twitter.com/${user.social_links.twitter}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white/60 hover:text-white transition-all">
                  <Twitter size={14} /> @{user.social_links.twitter}
                </a>
              )}
              {user.social_links?.github && (
                <a href={`https://github.com/${user.social_links.github}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white/60 hover:text-white transition-all">
                  <Github size={14} /> {user.social_links.github}
                </a>
              )}
              {user.social_links?.instagram && (
                <a href={`https://instagram.com/${user.social_links.instagram}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white/60 hover:text-white transition-all">
                  <Instagram size={14} /> @{user.social_links.instagram}
                </a>
              )}
              {!user.social_links?.twitter && !user.social_links?.github && !user.social_links?.instagram && (
                <p className="text-sm text-white/30">Sosyal medya linki eklenmemiş</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
