import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { ref, set, get, update } from 'firebase/database';
import { Eye, EyeOff, Leaf, Lock, User, X, ChevronRight } from 'lucide-react';

const AgreementModal = ({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
      className="w-full max-w-lg bg-[#111418] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[80vh]">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0">
        <h2 className="text-white font-bold text-base">{title}</h2>
        <button onClick={onClose} className="text-white/40 hover:text-white transition-all"><X size={18} /></button>
      </div>
      <div className="overflow-y-auto px-6 py-4 text-white/60 text-sm leading-relaxed space-y-4 flex-1">
        {children}
      </div>
      <div className="px-6 py-4 border-t border-white/10 flex-shrink-0">
        <button onClick={onClose} className="w-full py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-all">
          Anladım, Kapat
        </button>
      </div>
    </motion.div>
  </div>
);

const KVKKContent = () => (
  <>
    <p className="text-white/80 font-semibold">Kişisel Verilerin Korunması Aydınlatma Metni</p>
    <p>Bu metin, 6698 sayılı KVKK kapsamında <strong className="text-emerald-400">Nature.co</strong> olarak kullanıcılarımızı bilgilendirmek amacıyla hazırlanmıştır.</p>
    <div><p className="text-white/80 font-semibold mb-1">1. Veri Sorumlusu</p>
    <p>Nature.co platformu veri sorumlusudur. İletişim: <span className="text-emerald-400">info@natureco.me</span></p></div>
    <div><p className="text-white/80 font-semibold mb-1">2. İşlenen Kişisel Veriler</p>
    <ul className="list-disc pl-4 space-y-1">
      <li>Kimlik: kullanıcı adı</li><li>İletişim: e-posta adresi</li>
      <li>Güvenlik: IP adresi, giriş tarihi/saati</li>
      <li>Profil içeriği (biyografi, avatar vb.)</li>
      <li>Platform içi mesaj ve etkileşim verileri</li>
    </ul></div>
    <div><p className="text-white/80 font-semibold mb-1">3. İşlenme Amaçları</p>
    <ul className="list-disc pl-4 space-y-1">
      <li>Hesap oluşturma ve yönetimi</li><li>Platform hizmetlerinin sunulması</li>
      <li>Platform güvenliğinin sağlanması</li><li>Yasal yükümlülüklerin yerine getirilmesi</li>
    </ul></div>
    <div><p className="text-white/80 font-semibold mb-1">4. Veri Aktarımı</p>
    <p>Verileriniz Firebase (Google LLC) altyapısında işlenmekte olup yasal zorunluluk dışında paylaşılmamaktadır.</p></div>
    <div><p className="text-white/80 font-semibold mb-1">5. Saklama Süresi</p>
    <p>Verileriniz hesabınızı silene kadar saklanır. Talep: <span className="text-emerald-400">info@natureco.me</span></p></div>
    <div><p className="text-white/80 font-semibold mb-1">6. KVKK Haklarınız</p>
    <ul className="list-disc pl-4 space-y-1">
      <li>Verilerinizin işlenip işlenmediğini öğrenme</li>
      <li>Eksik/yanlış verilerin düzeltilmesini talep etme</li>
      <li>Verilerin silinmesini talep etme</li>
      <li>Hukuka aykırı işleme nedeniyle tazminat talep etme</li>
    </ul>
    <p className="mt-2">Başvuru: <span className="text-emerald-400">info@natureco.me</span></p></div>
  </>
);

const TermsContent = () => (
  <>
    <p className="text-white/80 font-semibold">Nature.co Kullanım Koşulları</p>
    <p>Platforma kayıt olarak bu koşulları kabul etmiş sayılırsınız.</p>
    <div><p className="text-white/80 font-semibold mb-1">1. Üyelik Koşulları</p>
    <ul className="list-disc pl-4 space-y-1">
      <li>Üye olabilmek için 13 yaşından büyük olmanız gerekir.</li>
      <li>Hesap bilgilerinizin doğruluğundan siz sorumlusunuz.</li>
      <li>Bir kişi yalnızca bir hesap oluşturabilir.</li>
    </ul></div>
    <div><p className="text-white/80 font-semibold mb-1">2. Yasaklanan Davranışlar</p>
    <ul className="list-disc pl-4 space-y-1">
      <li>Nefret söylemi, taciz, tehdit veya zorbalık</li>
      <li>Başkalarının kişisel bilgilerini izinsiz paylaşmak</li>
      <li>Yasadışı içerik veya faaliyetleri desteklemek</li>
      <li>Spam, reklam veya yanıltıcı içerik yaymak</li>
      <li>Başka kullanıcıları taklit etmek</li>
    </ul></div>
    <div><p className="text-white/80 font-semibold mb-1">3. İçerik Sorumluluğu</p>
    <p>Paylaştığınız içeriklerden yalnızca siz sorumlusunuz.</p></div>
    <div><p className="text-white/80 font-semibold mb-1">4. Hesap Askıya Alma</p>
    <p>Koşulların ihlalinde hesabınız önceden bildirim yapılmaksızın askıya alınabilir. İtiraz: <span className="text-emerald-400">info@natureco.me</span></p></div>
    <div><p className="text-white/80 font-semibold mb-1">5. Uygulanacak Hukuk</p>
    <p>Bu koşullar Türk Hukuku'na tabidir. İletişim: <span className="text-emerald-400">info@natureco.me</span></p></div>
  </>
);

export const AuthPage = ({ onAuth }: { onAuth: () => void }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptKvkk, setAcceptKvkk] = useState(false);
  const [showModal, setShowModal] = useState<'terms' | 'kvkk' | null>(null);
  const [needsEmail, setNeedsEmail] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (!username.trim()) { setError('Kullanıcı adı veya e-posta gerekli'); return; }
    if (!password.trim()) { setError('Şifre gerekli'); return; }
    if (mode === 'register') {
      if (!acceptTerms) { setError('Kullanım koşullarını kabul etmelisiniz'); return; }
      if (!acceptKvkk)  { setError('KVKK aydınlatma metnini onaylamalısınız'); return; }
    }
    setLoading(true);

    try {
      if (mode === 'register') {
        if (!email.trim()) { setError('E-posta gerekli'); setLoading(false); return; }
        const usernameSnap = await get(ref(db, `usernames/${username.toLowerCase()}`));
        if (usernameSnap.exists()) { setError('Bu kullanıcı adı alınmış'); setLoading(false); return; }

        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: username });
        await set(ref(db, `users/${cred.user.uid}`), {
          id: cred.user.uid, username, email, status: 'online', bio: '', avatar: '',
          created_at: Date.now(), message_count: 0, xp: 0, badges: [],
          is_admin: false, is_banned: false,
          terms_accepted_at: Date.now(), kvkk_accepted_at: Date.now(),
        });
        await set(ref(db, `usernames/${username.toLowerCase()}`), { uid: cred.user.uid, email });

      } else {
        const input = username.trim();
        let loginEmail: string | null = null;

        if (input.includes('@')) {
          loginEmail = input;
        } else {
          const unSnap = await get(ref(db, `usernames/${input.toLowerCase()}`));
          if (unSnap.exists()) {
            const val = unSnap.val();
            if (typeof val === 'object' && val?.email) {
              loginEmail = val.email;
            } else if (typeof val === 'string' && email.trim()) {
              loginEmail = email.trim();
            }
          }
          if (!loginEmail) {
            if (!needsEmail) {
              setNeedsEmail(true);
              setError('Hesabını güncellemek için e-posta adresini de gir');
              setLoading(false);
              return;
            } else if (email.trim()) {
              loginEmail = email.trim();
            } else {
              setError('Lütfen e-posta adresini gir');
              setLoading(false);
              return;
            }
          }
        }

        const cred = await signInWithEmailAndPassword(auth, loginEmail!, password);
        const uid = cred.user.uid;
        const displayUsername = input.includes('@') ? (cred.user.displayName || input.split('@')[0]) : input;

        const uidSnap = await get(ref(db, `users/${uid}`));
        if (!uidSnap.exists()) {
          await set(ref(db, `users/${uid}`), {
            id: uid, username: displayUsername, email: loginEmail, status: 'online',
            bio: '', avatar: '', is_admin: false, is_banned: false,
            created_at: Date.now(), message_count: 0, xp: 0, badges: [],
          });
        } else {
          await update(ref(db, `users/${uid}`), { status: 'online' });
        }

        if (!input.includes('@')) {
          await set(ref(db, `usernames/${input.toLowerCase()}`), { uid, email: loginEmail });
        }
        await updateProfile(cred.user, { displayName: displayUsername });
      }

      onAuth();
    } catch (e: any) {
      const msgs: Record<string, string> = {
        'auth/email-already-in-use': 'Bu e-posta zaten kullanımda',
        'auth/weak-password': 'Şifre en az 6 karakter olmalı',
        'auth/user-not-found': 'Kullanıcı bulunamadı',
        'auth/wrong-password': 'Kullanıcı adı veya şifre hatalı',
        'auth/invalid-email': 'Geçersiz e-posta adresi',
        'auth/invalid-credential': 'Kullanıcı adı/e-posta veya şifre hatalı',
        'auth/too-many-requests': 'Çok fazla deneme. Lütfen bekle.',
      };
      setError(msgs[e.code] || 'Hata: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-screen flex items-center justify-center bg-[#0B0E11] relative overflow-hidden" style={{ minHeight: '100dvh' }}>
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div key={i} className="absolute w-1 h-1 rounded-full bg-emerald-500/20"
            style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
            animate={{ opacity: [0, 1, 0], scale: [0, 2, 0] }}
            transition={{ duration: 3 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 5 }}
          />
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm mx-4 relative z-10 py-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <Leaf size={32} className="text-emerald-500" />
          </div>
          <h1 className="text-2xl font-black text-white">Nature.co</h1>
          <p className="text-white/40 text-sm mt-1">Ekosisteme hoş geldin</p>
        </div>

        <div className="flex bg-white/5 rounded-xl p-1 mb-6">
          {(['login', 'register'] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setError(''); setAcceptTerms(false); setAcceptKvkk(false); setNeedsEmail(false); setEmail(''); }}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${mode === m ? 'bg-emerald-500 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}>
              {m === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <div className="relative">
            <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input value={username} onChange={e => setUsername(e.target.value)}
              placeholder={mode === 'login' ? 'Kullanıcı adı veya e-posta' : 'Kullanıcı adı'}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/50 transition-all" />
          </div>

          {mode === 'register' && (
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-xs font-bold">@</span>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="E-posta adresi" onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/50 transition-all" />
            </div>
          )}

          {mode === 'login' && needsEmail && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-1">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-xs font-bold">@</span>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="Kayıtlı e-posta adresin" onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  className="w-full bg-white/5 border border-emerald-500/30 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/60 transition-all" />
              </div>
              <p className="text-[11px] text-white/30 px-1">Hesabın güvenli şekilde güncelleniyor — yalnızca bir kez gerekli.</p>
            </motion.div>
          )}

          <div className="relative">
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input type={showPassword ? 'text' : 'password'} value={password}
              onChange={e => setPassword(e.target.value)} placeholder="Şifre"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/50 transition-all" />
            <button onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <AnimatePresence>
            {mode === 'register' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="space-y-3 overflow-hidden">
                <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                  <button onClick={() => setAcceptTerms(!acceptTerms)}
                    className={`w-5 h-5 rounded flex-shrink-0 mt-0.5 flex items-center justify-center border-2 transition-all ${acceptTerms ? 'bg-emerald-500 border-emerald-500' : 'border-white/20'}`}>
                    {acceptTerms && <span className="text-white text-xs font-black">✓</span>}
                  </button>
                  <div className="flex-1 text-xs text-white/50 leading-relaxed">
                    <button onClick={() => setShowModal('terms')} className="text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center gap-0.5">
                      Kullanım Koşulları <ChevronRight size={11} />
                    </button>
                    'nı okudum ve kabul ediyorum.
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                  <button onClick={() => setAcceptKvkk(!acceptKvkk)}
                    className={`w-5 h-5 rounded flex-shrink-0 mt-0.5 flex items-center justify-center border-2 transition-all ${acceptKvkk ? 'bg-emerald-500 border-emerald-500' : 'border-white/20'}`}>
                    {acceptKvkk && <span className="text-white text-xs font-black">✓</span>}
                  </button>
                  <div className="flex-1 text-xs text-white/50 leading-relaxed">
                    <button onClick={() => setShowModal('kvkk')} className="text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center gap-0.5">
                      KVKK Aydınlatma Metni <ChevronRight size={11} />
                    </button>
                    'ni okudum, kabul ediyorum.
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-sm text-center">
              {error}
            </motion.p>
          )}

          <button onClick={handleSubmit} disabled={loading || (mode === 'register' && (!acceptTerms || !acceptKvkk))}
            className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold text-sm hover:bg-emerald-600 transition-all disabled:opacity-40 shadow-lg shadow-emerald-500/20">
            {loading ? 'Yükleniyor...' : mode === 'login' ? 'Giriş Yap' : 'Hesap Oluştur'}
          </button>

          {mode === 'login' && <p className="text-center text-[11px] text-white/20">Kullanıcı adı veya e-posta ile giriş yapabilirsin</p>}
          {mode === 'register' && <p className="text-center text-[11px] text-white/20">Sorularınız: <span className="text-emerald-400/60">info@natureco.me</span></p>}
        </div>
      </motion.div>

      <AnimatePresence>
        {showModal === 'terms' && <AgreementModal title="Kullanım Koşulları" onClose={() => setShowModal(null)}><TermsContent /></AgreementModal>}
        {showModal === 'kvkk' && <AgreementModal title="KVKK Aydınlatma Metni" onClose={() => setShowModal(null)}><KVKKContent /></AgreementModal>}
      </AnimatePresence>
    </div>
  );
};
