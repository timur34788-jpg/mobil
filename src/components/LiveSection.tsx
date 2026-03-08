import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play, Volume2, VolumeX, Maximize2, Share2, Users, Sparkles, Send,
  Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, PhoneOff,
  Eye, Radio, Heart, Settings2, Leaf, AlertTriangle, X
} from 'lucide-react';
import { db, auth } from '../firebase';
import { ref, onValue, push, set, remove, onDisconnect, update, serverTimestamp } from 'firebase/database';
import { useTvChannels } from './ChannelSidebar';

// ─────────────────────────────────────────────
// 📺 NATURE.CO TV SAYFASI (görselin birebir aynısı)
// ─────────────────────────────────────────────
const NatureTVPage = ({ theme, tvChannel }: { theme: any; tvChannel: string }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [viewerCount, setViewerCount] = useState(1240);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const user = auth.currentUser;
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Misafir';
  const tvChannels = useTvChannels();

  const ch = tvChannels.find(c => c.id === tvChannel) || tvChannels[0];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Canlı sohbet mesajlarını Firebase'den çek
  useEffect(() => {
    const msgRef = ref(db, `tv_chat/${tvChannel}`);
    const unsub = onValue(msgRef, snap => {
      const data = snap.val();
      if (!data) {
        setMessages([
          { id: '__bot1', user: 'NatureBot', isBot: true, text: 'Canlı yayına hoş geldiniz! Doğanın sesini dinleyin.' },
        ]);
        return;
      }
      const list = Object.entries(data)
        .map(([id, v]: any) => ({ id, ...v }))
        .sort((a, b) => (a.ts || 0) - (b.ts || 0))
        .slice(-80);
      setMessages([
        { id: '__bot1', user: 'NatureBot', isBot: true, text: 'Canlı yayına hoş geldiniz! Doğanın sesini dinleyin.' },
        ...list,
      ]);
    });

    // İzleyici sayacı
    if (user) {
      const viewRef = ref(db, `tv_viewers/${tvChannel}/${user.uid}`);
      set(viewRef, true);
      onDisconnect(viewRef).remove();
    }
    const viewsRef = ref(db, `tv_viewers/${tvChannel}`);
    const unsub2 = onValue(viewsRef, snap => {
      setViewerCount(1200 + (snap.size || 0));
    });

    return () => { unsub(); unsub2(); };
  }, [tvChannel]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;
    push(ref(db, `tv_chat/${tvChannel}`), {
      user: displayName,
      text: input.trim(),
      ts: Date.now(),
    });
    setInput('');
  };

  const embedUrl = ''; // artık kullanılmıyor

  return (
    <div className="flex-1 flex overflow-hidden bg-[#0B0E11]">
      {/* ── Ana Video Alanı ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Üst Header */}
        <div className="h-14 border-b border-white/5 flex items-center px-6 justify-between bg-black/20 backdrop-blur-md flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#ef4444"><path d="M21 6H3v12h18V6z"/><path d="M1 8h2v8H1zm20 0h2v8h-2z" fill="#ef4444"/></svg>
              </div>
              <span className="text-sm font-black text-white uppercase tracking-widest">
                Nature.co Canlı TV
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 border border-red-500/20 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Canlı</span>
            </div>
            <span className="text-sm text-white/60 font-semibold">{ch.emoji} {ch.name}</span>
          </div>
          <div className="flex items-center gap-1.5 text-white/40">
            <Users size={14} />
            <span className="text-xs font-bold">{viewerCount.toLocaleString('tr-TR')} İzleyici</span>
          </div>
        </div>

        {/* Video Player */}
        <div className="flex-1 relative bg-black overflow-hidden flex flex-col">
          <iframe
            key={tvChannel}
            src={ch.embedUrl
              ? ch.embedUrl.includes('?') ? `${ch.embedUrl}&autoplay=1&mute=0&rel=0&modestbranding=1` : `${ch.embedUrl}?autoplay=1&mute=0&rel=0&modestbranding=1`
              : `https://www.youtube.com/embed/live_stream?channel=${ch.youtubeChannelId}&autoplay=1&mute=0&rel=0&modestbranding=1`}
            className="w-full flex-1 border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            title={`${ch.name} Canlı`}
          />
        </div>
      </div>

      {/* ── Canlı Sohbet Paneli ── */}
      <div className="w-72 border-l border-white/5 flex flex-col bg-black/20 flex-shrink-0">
        {/* Panel Header */}
        <div className="h-14 border-b border-white/5 flex items-center px-5">
          <span className="text-xs font-black text-white uppercase tracking-widest">Canlı Sohbet</span>
        </div>

        {/* Mesajlar */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {messages.map(msg => (
            <div key={msg.id} className="group">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className={`text-[10px] font-black uppercase tracking-widest ${msg.isBot ? 'text-emerald-400' : 'text-blue-400'}`}>
                  {msg.user}
                </span>
                {msg.isBot && <Sparkles size={9} className="text-emerald-400" />}
              </div>
              <p className="text-sm text-white/80 leading-relaxed">{msg.text}</p>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-white/5 bg-black/20">
          <form onSubmit={handleSend} className="relative">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Sohbete katıl..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500/40 transition-all pr-10"
            />
            <button
              type="submit"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/20 hover:text-emerald-400 transition-all"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// 🎥 GENEL SOHBET ODASI — Profesyonel Yayın Platformu
// ─────────────────────────────────────────────

// Ses seviyesi göstergesi
const AudioMeter = ({ stream }: { stream: MediaStream | null }) => {
  const [level, setLevel] = useState(0);
  useEffect(() => {
    if (!stream) { setLevel(0); return; }
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const src = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    src.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);
    let raf: number;
    const tick = () => {
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length;
      setLevel(Math.min(100, avg * 2));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); ctx.close(); };
  }, [stream]);
  const bars = 20;
  return (
    <div className="flex items-end gap-0.5 h-5">
      {Array.from({ length: bars }).map((_, i) => {
        const threshold = (i / bars) * 100;
        const active = level > threshold;
        const color = i < bars * 0.6 ? 'bg-emerald-500' : i < bars * 0.85 ? 'bg-yellow-500' : 'bg-red-500';
        return <div key={i} className={`w-1 rounded-full transition-all ${active ? color : 'bg-white/10'}`} style={{ height: `${30 + (i / bars) * 70}%` }} />;
      })}
    </div>
  );
};

// Yayın süresi sayacı
const StreamTimer = ({ startTime }: { startTime: number }) => {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(i);
  }, [startTime]);
  const h = Math.floor(elapsed / 3600).toString().padStart(2, '0');
  const m = Math.floor((elapsed % 3600) / 60).toString().padStart(2, '0');
  const s = (elapsed % 60).toString().padStart(2, '0');
  return <span className="font-mono text-xs font-bold text-red-400">{h !== '00' ? `${h}:` : ''}{m}:{s}</span>;
};

const LiveChatPage = ({
  theme, userId, username, isVerified
}: {
  theme: any; userId: string; username: string; isVerified: boolean;
}) => {
  // Streams & Chat
  const [streams, setStreams] = useState<any[]>([]);
  const [selectedStream, setSelectedStream] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [viewerCount, setViewerCount] = useState(0);

  // Streaming state
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamStartTime, setStreamStartTime] = useState(0);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const myStreamRef = useRef<any>(null);

  // Setup wizard
  const [setupStep, setSetupStep] = useState<'idle' | 'setup' | 'live'>('idle');
  const [streamTitle, setStreamTitle] = useState('');
  const [streamCategory, setStreamCategory] = useState('Genel');
  const [streamMode, setStreamMode] = useState<'camera' | 'screen' | 'screen_cam' | 'audio'>('camera');

  // Device settings
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [mics, setMics] = useState<MediaDeviceInfo[]>([]);
  const [speakers, setSpeakers] = useState<MediaDeviceInfo[]>([]);
  const [selectedCam, setSelectedCam] = useState('');
  const [selectedMic, setSelectedMic] = useState('');
  const [selectedSpeaker, setSelectedSpeaker] = useState('');
  const [videoQuality, setVideoQuality] = useState<'360' | '720' | '1080'>('720');
  const [noiseSuppression, setNoiseSuppression] = useState(true);
  const [echoCancellation, setEchoCancellation] = useState(true);

  // Live controls
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [isPiP, setIsPiP] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const CATEGORIES = ['Genel', 'Oyun', 'Müzik', 'Yazılım', 'Sanat', 'Sohbet', 'Eğitim', 'Spor'];

  // ─── Cihaz Yönetimi ───────────────────────────
  const [permissionState, setPermissionState] = useState<'idle' | 'requesting' | 'granted' | 'denied'>('idle');
  const [deviceWarning, setDeviceWarning] = useState<string | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Cihaz listesini güncelle (izin alındıktan sonra label'lar gelir)
  const refreshDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cams = devices.filter(d => d.kind === 'videoinput');
      const micsArr = devices.filter(d => d.kind === 'audioinput');
      const spks = devices.filter(d => d.kind === 'audiooutput');
      setCameras(cams);
      setMics(micsArr);
      setSpeakers(spks);

      // Seçili cihaz hâlâ listede değilse varsayılana dön
      setSelectedCam(prev => {
        if (!prev || !cams.find(d => d.deviceId === prev)) {
          const def = cams.find(d => d.deviceId === 'default') || cams[0];
          return def?.deviceId || '';
        }
        return prev;
      });
      setSelectedMic(prev => {
        if (!prev || !micsArr.find(d => d.deviceId === prev)) {
          const def = micsArr.find(d => d.deviceId === 'default') || micsArr[0];
          return def?.deviceId || '';
        }
        return prev;
      });
      setSelectedSpeaker(prev => {
        if (!prev || !spks.find(d => d.deviceId === prev)) {
          const def = spks.find(d => d.deviceId === 'default') || spks[0];
          return def?.deviceId || '';
        }
        return prev;
      });
    } catch {}
  }, []);

  // İlk yükleme + devicechange dinleyici
  useEffect(() => {
    const init = async () => {
      // Önce mevcut izin durumunu kontrol et
      try {
        const camPerm = await navigator.permissions.query({ name: 'camera' as PermissionName });
        const micPerm = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        if (camPerm.state === 'granted' && micPerm.state === 'granted') {
          setPermissionState('granted');
          await refreshDevices();
        }
      } catch {}
    };
    init();

    // Cihaz takılma/çıkarma dinleyici
    const onDeviceChange = async () => {
      await refreshDevices();
      // Eğer yayındaysak ve aktif cihaz kopmuşsa uyar
      if (localStreamRef.current) {
        const activeTracks = localStreamRef.current.getTracks();
        const hasEndedTrack = activeTracks.some(t => t.readyState === 'ended');
        if (hasEndedTrack) {
          setDeviceWarning('⚠️ Bir cihaz bağlantısı kesildi! Ayarlardan yeni cihaz seç.');
        } else {
          setDeviceWarning(null);
        }
      }
    };
    navigator.mediaDevices.addEventListener('devicechange', onDeviceChange);
    return () => navigator.mediaDevices.removeEventListener('devicechange', onDeviceChange);
  }, [refreshDevices]);

  // İzin iste
  const requestPermissions = async () => {
    setPermissionState('requesting');
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      s.getTracks().forEach(t => t.stop()); // Hemen kapat, sadece izin için aldık
      setPermissionState('granted');
      await refreshDevices();
    } catch (err: any) {
      setPermissionState('denied');
      if (err.name === 'NotFoundError') setDeviceWarning('Kamera veya mikrofon bulunamadı.');
      else if (err.name === 'NotAllowedError') setDeviceWarning('Kamera/mikrofon izni reddedildi. Tarayıcı ayarlarından izin ver.');
      else setDeviceWarning('Cihaz erişim hatası: ' + err.message);
    }
  };

  // Yayın sırasında cihaz değiştir (hot-swap)
  const hotSwapDevice = useCallback(async (type: 'video' | 'audio', deviceId: string) => {
    const currentStream = localStreamRef.current;
    if (!currentStream) return;
    try {
      const constraints = type === 'video'
        ? { video: { deviceId: { exact: deviceId }, width: { ideal: videoQuality === '1080' ? 1920 : videoQuality === '720' ? 1280 : 640 }, height: { ideal: videoQuality === '1080' ? 1080 : videoQuality === '720' ? 720 : 360 } } }
        : { audio: { deviceId: { exact: deviceId }, noiseSuppression, echoCancellation, sampleRate: 48000 } };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      const [newTrack] = type === 'video' ? newStream.getVideoTracks() : newStream.getAudioTracks();

      // Eski track'i durdur ve yenisiyle değiştir
      const oldTracks = type === 'video' ? currentStream.getVideoTracks() : currentStream.getAudioTracks();
      oldTracks.forEach(t => { currentStream.removeTrack(t); t.stop(); });
      currentStream.addTrack(newTrack);

      // Video elementine yeniden bağla
      if (videoRef.current) videoRef.current.srcObject = null;
      setLocalStream(new MediaStream(currentStream.getTracks()));
      setDeviceWarning(null);
    } catch (err: any) {
      setDeviceWarning('Cihaz değiştirilirken hata: ' + err.message);
    }
  }, [videoQuality, noiseSuppression, echoCancellation]);

  // localStream değişince ref'i güncelle
  useEffect(() => { localStreamRef.current = localStream; }, [localStream]);

  // Aktif yayınları dinle
  useEffect(() => {
    const r = ref(db, 'live_streams');
    return onValue(r, snap => {
      const d = snap.val();
      if (!d) { setStreams([]); return; }
      const list = Object.entries(d)
        .map(([id, v]: any) => ({ id, ...v }))
        .filter(s => s.status === 'live')
        .sort((a: any, b: any) => (b.started_at || 0) - (a.started_at || 0));
      setStreams(list);
      if (selectedStream) {
        const upd = list.find(s => s.id === selectedStream.id);
        setSelectedStream(upd || null);
      }
    });
  }, []);

  // Seçili yayın sohbeti
  useEffect(() => {
    if (!selectedStream && !isStreaming) return;
    const roomId = isStreaming ? userId : selectedStream?.id;
    if (!roomId) return;
    const msgRef = ref(db, `stream_chat/${roomId}`);
    const unsub1 = onValue(msgRef, snap => {
      const d = snap.val();
      if (!d) { setMessages([]); return; }
      setMessages(Object.entries(d).map(([id, v]: any) => ({ id, ...v })).sort((a, b) => (a.ts || 0) - (b.ts || 0)).slice(-200));
    });
    const viewRef = ref(db, `stream_viewers/${roomId}/${userId}`);
    if (!isStreaming) { set(viewRef, true); onDisconnect(viewRef).remove(); }
    const unsub2 = onValue(ref(db, `stream_viewers/${roomId}`), snap => setViewerCount(snap.size || 0));
    return () => { unsub1(); unsub2(); };
  }, [selectedStream?.id, isStreaming]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Preview stream
  useEffect(() => {
    if (setupStep !== 'setup') return;
    const startPreview = async () => {
      try {
        const constraints = buildConstraints();
        const s = await navigator.mediaDevices.getUserMedia(constraints);
        setLocalStream(s);
      } catch {}
    };
    startPreview();
    return () => { localStream?.getTracks().forEach(t => t.stop()); };
  }, [setupStep, selectedCam, selectedMic, videoQuality]);

  useEffect(() => {
    if (previewRef.current && localStream && setupStep === 'setup') {
      previewRef.current.srcObject = localStream;
    }
    if (videoRef.current && localStream && setupStep === 'live') {
      videoRef.current.srcObject = localStream;
    }
  }, [localStream, setupStep]);

  const buildConstraints = () => ({
    video: streamMode !== 'audio' ? {
      deviceId: selectedCam ? { exact: selectedCam } : undefined,
      width: { ideal: videoQuality === '1080' ? 1920 : videoQuality === '720' ? 1280 : 640 },
      height: { ideal: videoQuality === '1080' ? 1080 : videoQuality === '720' ? 720 : 360 },
      frameRate: { ideal: 30 },
    } : false,
    audio: {
      deviceId: selectedMic ? { exact: selectedMic } : undefined,
      noiseSuppression,
      echoCancellation,
      sampleRate: 48000,
    },
  });

  // ─── WebRTC Signaling ────────────────────────
  const peerConns = useRef<Map<string, RTCPeerConnection>>(new Map());
  const viewerPc = useRef<RTCPeerConnection | null>(null);
  const viewerVideoRef = useRef<HTMLVideoElement>(null);
  const [viewerStream, setViewerStream] = useState<MediaStream | null>(null);

  const ICE_SERVERS = { iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ]};

  // YAYINCI: Yeni viewer join isteği gelince RTCPeerConnection kur
  const handleViewerJoin = useCallback(async (viewerId: string, stream: MediaStream) => {
    if (peerConns.current.has(viewerId)) return;
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConns.current.set(viewerId, pc);

    // Stream track'lerini ekle
    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    // Broadcaster ICE adaylarını Firebase'e yaz
    pc.onicecandidate = async ({ candidate }) => {
      if (candidate) {
        await push(ref(db, `webrtc/${userId}/viewers/${viewerId}/b_ice`), candidate.toJSON());
      }
    };

    // Offer oluştur
    const offer = await pc.createOffer({ offerToReceiveAudio: false, offerToReceiveVideo: false });
    await pc.setLocalDescription(offer);
    await set(ref(db, `webrtc/${userId}/viewers/${viewerId}/offer`), {
      type: offer.type, sdp: offer.sdp
    });

    // Viewer'ın answer'ını bekle
    onValue(ref(db, `webrtc/${userId}/viewers/${viewerId}/answer`), async snap => {
      const answer = snap.val();
      if (answer && pc.signalingState === 'have-local-offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    // Viewer'ın ICE adaylarını bekle
    onValue(ref(db, `webrtc/${userId}/viewers/${viewerId}/v_ice`), snap => {
      snap.forEach(child => {
        const c = child.val();
        if (c) pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
      });
    });
  }, [userId]);

  // YAYINCI: Yeni viewer join isteklerini dinle
  useEffect(() => {
    if (!isStreaming || !localStream) return;
    const joinRef = ref(db, `webrtc/${userId}/join_requests`);
    const unsub = onValue(joinRef, snap => {
      snap.forEach(child => {
        const viewerId = child.key!;
        if (!peerConns.current.has(viewerId)) {
          handleViewerJoin(viewerId, localStreamRef.current!);
        }
      });
    });
    return () => unsub();
  }, [isStreaming, localStream, handleViewerJoin, userId]);

  // İZLEYİCİ: Yayına katıl
  const joinStream = useCallback(async (broadcasterId: string) => {
    // Önceki bağlantıyı temizle
    viewerPc.current?.close();
    viewerPc.current = null;
    setViewerStream(null);

    const pc = new RTCPeerConnection(ICE_SERVERS);
    viewerPc.current = pc;

    // Gelen stream'i yakala
    pc.ontrack = ({ streams }) => {
      if (streams[0]) setViewerStream(streams[0]);
    };

    // Viewer ICE adaylarını Firebase'e yaz
    pc.onicecandidate = async ({ candidate }) => {
      if (candidate) {
        await push(ref(db, `webrtc/${broadcasterId}/viewers/${userId}/v_ice`), candidate.toJSON());
      }
    };

    // Join isteği gönder
    await set(ref(db, `webrtc/${broadcasterId}/join_requests/${userId}`), { ts: Date.now(), username });
    onDisconnect(ref(db, `webrtc/${broadcasterId}/join_requests/${userId}`)).remove();

    // Offer'ı bekle
    onValue(ref(db, `webrtc/${broadcasterId}/viewers/${userId}/offer`), async snap => {
      const offer = snap.val();
      if (!offer || pc.signalingState !== 'stable') return;
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await set(ref(db, `webrtc/${broadcasterId}/viewers/${userId}/answer`), {
        type: answer.type, sdp: answer.sdp
      });
    });

    // Broadcaster ICE adaylarını bekle
    onValue(ref(db, `webrtc/${broadcasterId}/viewers/${userId}/b_ice`), snap => {
      snap.forEach(child => {
        const c = child.val();
        if (c) pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
      });
    });
  }, [userId, username]);

  // İzleyici videoRef'e stream bağla
  useEffect(() => {
    if (viewerVideoRef.current && viewerStream) {
      viewerVideoRef.current.srcObject = viewerStream;
    }
  }, [viewerStream]);

  // Yayın seçilince WebRTC bağlantısını başlat
  useEffect(() => {
    if (!selectedStream) {
      viewerPc.current?.close();
      viewerPc.current = null;
      setViewerStream(null);
      return;
    }
    joinStream(selectedStream.id);
  }, [selectedStream?.id]);

  // Yayıncı bağlantıları temizle
  const cleanupBroadcaster = async () => {
    peerConns.current.forEach(pc => pc.close());
    peerConns.current.clear();
    await remove(ref(db, `webrtc/${userId}`));
  };

  const startStream = async () => {
    if (!streamTitle.trim()) return;
    try {
      let stream = localStream;
      if (!stream) {
        stream = await navigator.mediaDevices.getUserMedia(buildConstraints());
        setLocalStream(stream);
      }

      if (streamMode === 'screen' || streamMode === 'screen_cam') {
        const sc = await (navigator.mediaDevices as any).getDisplayMedia({ video: { frameRate: 30 }, audio: true });
        setScreenStream(sc);
        if (streamMode === 'screen') {
          if (stream.getAudioTracks().length > 0) sc.addTrack(stream.getAudioTracks()[0]);
          stream = sc;
          setLocalStream(sc);
        }
        sc.getTracks().forEach((t: MediaStreamTrack) => { t.onended = () => stopStream(); });
      }

      await set(ref(db, `live_streams/${userId}`), {
        uid: userId, username,
        title: streamTitle,
        category: streamCategory,
        mode: streamMode,
        quality: videoQuality,
        status: 'live',
        started_at: Date.now(),
      });
      onDisconnect(ref(db, `live_streams/${userId}`)).remove();
      onDisconnect(ref(db, `webrtc/${userId}`)).remove();
      myStreamRef.current = ref(db, `live_streams/${userId}`);

      setIsStreaming(true);
      setStreamStartTime(Date.now());
      setSetupStep('live');
    } catch (err: any) {
      alert('Cihaz erişimi reddedildi veya iptal edildi: ' + err.message);
    }
  };

  const stopStream = async () => {
    await cleanupBroadcaster();
    localStream?.getTracks().forEach(t => t.stop());
    screenStream?.getTracks().forEach(t => t.stop());
    setLocalStream(null); setScreenStream(null);
    setIsStreaming(false); setSetupStep('idle');
    if (myStreamRef.current) { await remove(myStreamRef.current); myStreamRef.current = null; }
  };

  const toggleMic = () => {
    localStream?.getAudioTracks().forEach(t => { t.enabled = !micOn; });
    setMicOn(!micOn);
  };

  // Hoparlör değişince video elementine uygula (setSinkId API)
  useEffect(() => {
    if (!selectedSpeaker) return;
    const applyAudioOutput = async () => {
      try {
        if (videoRef.current && 'setSinkId' in videoRef.current) {
          await (videoRef.current as any).setSinkId(selectedSpeaker);
        }
        if (previewRef.current && 'setSinkId' in previewRef.current) {
          await (previewRef.current as any).setSinkId(selectedSpeaker);
        }
      } catch {}
    };
    applyAudioOutput();
  }, [selectedSpeaker]);

  const toggleCam = () => {
    localStream?.getVideoTracks().forEach(t => { t.enabled = !camOn; });
    setCamOn(!camOn);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const roomId = isStreaming ? userId : selectedStream?.id;
    if (!input.trim() || !roomId) return;
    push(ref(db, `stream_chat/${roomId}`), { user: username, uid: userId, text: input.trim(), ts: Date.now() });
    setInput('');
  };

  // ── RENDER ────────────────────────────────────

  return (
    <div className="flex-1 flex overflow-hidden bg-[#0B0E11]">
      {/* ── Ana Alan ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Header */}
        <div className="h-14 border-b border-white/5 flex items-center px-5 justify-between bg-black/30 backdrop-blur-md flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-purple-500/10 border border-purple-500/20 rounded-lg flex items-center justify-center">
              <Video size={13} className="text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white tracking-tight">Genel Sohbet Odası</h3>
              <p className="text-[10px] text-white/30">Canlı yayın & görüntülü sohbet platformu</p>
            </div>
            {isStreaming && (
              <div className="flex items-center gap-2 ml-2">
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-500/20 border border-red-500/30 rounded-full">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black text-red-400">CANLI</span>
                </div>
                <StreamTimer startTime={streamStartTime} />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isStreaming ? (
              <>
                <button onClick={() => setShowSettings(!showSettings)} className={`p-2 rounded-xl border transition-all ${showSettings ? 'bg-white/10 border-white/20 text-white' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'}`}>
                  <Settings2 size={15} />
                </button>
                <button onClick={stopStream} className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold rounded-xl hover:bg-red-500/30 transition-all">
                  <PhoneOff size={13} /> Yayını Bitir
                </button>
              </>
            ) : isVerified ? (
              <button onClick={() => setSetupStep('setup')} className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold rounded-xl hover:bg-purple-500/30 transition-all">
                <Radio size={13} /> Yayın Başlat
              </button>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl">
                <Leaf size={11} className="text-emerald-400" />
                <span className="text-[10px] text-white/40">Yayın için 🍃 rozet gerekli</span>
              </div>
            )}
          </div>
        </div>

        {/* ── SETUP WIZARD ── */}
        {setupStep === 'setup' && permissionState !== 'granted' && (
          <div className="flex-1 flex items-center justify-center bg-[#070a0d] p-8">
            <div className="max-w-sm text-center">
              <div className="w-20 h-20 rounded-3xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-5">
                {permissionState === 'denied' ? <AlertTriangle size={32} className="text-red-400" /> : <Mic size={32} className="text-purple-400" />}
              </div>
              <h3 className="text-lg font-black text-white mb-2">
                {permissionState === 'denied' ? 'İzin Reddedildi' : permissionState === 'requesting' ? 'İzin Bekleniyor...' : 'Cihaz İzni Gerekli'}
              </h3>
              <p className="text-sm text-white/40 mb-2">
                {permissionState === 'denied'
                  ? 'Tarayıcı ayarlarından kamera ve mikrofon iznini aç, sonra sayfayı yenile.'
                  : 'Yayın başlatmak için kamera ve mikrofona erişim izni gerekiyor.'}
              </p>
              {deviceWarning && <p className="text-xs text-red-400 mb-4 px-4">{deviceWarning}</p>}
              <div className="flex flex-col gap-2">
                {permissionState !== 'denied' && (
                  <button onClick={requestPermissions} disabled={permissionState === 'requesting'}
                    className="px-6 py-3 bg-purple-500 text-white rounded-xl font-bold text-sm hover:bg-purple-400 disabled:opacity-50 transition-all">
                    {permissionState === 'requesting' ? '⏳ Bekleniyor...' : '🎙️ Kamera & Mikrofon İzni Ver'}
                  </button>
                )}
                {permissionState === 'denied' && (
                  <button onClick={() => { setPermissionState('idle'); setDeviceWarning(null); requestPermissions(); }}
                    className="px-6 py-3 bg-white/10 text-white rounded-xl font-bold text-sm hover:bg-white/20 transition-all">
                    🔄 Tekrar Dene
                  </button>
                )}
                <button onClick={() => setSetupStep('idle')} className="px-6 py-2 text-white/30 text-sm hover:text-white transition-all">İptal</button>
              </div>
            </div>
          </div>
        )}

        {setupStep === 'setup' && permissionState === 'granted' && (
          <div className="flex-1 overflow-y-auto p-6 bg-[#070a0d]">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <Settings2 size={18} className="text-purple-400" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">Yayın Kurulumu</h2>
                  <p className="text-xs text-white/40">Yayına başlamadan önce ayarlarını yapılandır</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Sol Kolon */}
                <div className="space-y-4">
                  {/* Yayın Bilgileri */}
                  <div className="p-4 bg-white/3 border border-white/8 rounded-2xl space-y-3">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Yayın Bilgileri</p>
                    <div>
                      <label className="text-xs text-white/50 block mb-1">Başlık *</label>
                      <input value={streamTitle} onChange={e => setStreamTitle(e.target.value)}
                        placeholder="Bugün ne yayınlıyorsun?"
                        className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50" />
                    </div>
                    <div>
                      <label className="text-xs text-white/50 block mb-1">Kategori</label>
                      <div className="flex flex-wrap gap-1.5">
                        {CATEGORIES.map(cat => (
                          <button key={cat} onClick={() => setStreamCategory(cat)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${streamCategory === cat ? 'bg-purple-500/30 border border-purple-500/40 text-purple-300' : 'bg-white/5 border border-white/8 text-white/40 hover:text-white'}`}>
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Yayın Türü */}
                  <div className="p-4 bg-white/3 border border-white/8 rounded-2xl space-y-3">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Yayın Türü</p>
                    <div className="grid grid-cols-2 gap-2">
                      {([
                        { id: 'camera', icon: <Video size={18} />, label: 'Kamera', desc: 'Webcam yayını' },
                        { id: 'screen', icon: <Monitor size={18} />, label: 'Ekran', desc: 'Ekran paylaşımı' },
                        { id: 'screen_cam', icon: <Eye size={18} />, label: 'Ekran + Kamera', desc: 'İkisi birden' },
                        { id: 'audio', icon: <Mic size={18} />, label: 'Sadece Ses', desc: 'Ses yayını' },
                      ] as const).map(opt => (
                        <button key={opt.id} onClick={() => setStreamMode(opt.id)}
                          className={`flex flex-col items-start gap-1 p-3 rounded-xl border transition-all text-left ${streamMode === opt.id ? 'bg-purple-500/15 border-purple-500/30 text-purple-300' : 'bg-white/3 border-white/8 text-white/40 hover:text-white hover:bg-white/5'}`}>
                          {opt.icon}
                          <span className="text-xs font-bold mt-1">{opt.label}</span>
                          <span className="text-[10px] text-white/30">{opt.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Ses Ayarları */}
                  <div className="p-4 bg-white/3 border border-white/8 rounded-2xl space-y-3">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Ses Ayarları</p>
                    <div>
                      <label className="text-xs text-white/50 block mb-1">Mikrofon</label>
                      <select value={selectedMic} onChange={e => setSelectedMic(e.target.value)}
                        className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none">
                        {mics.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Mikrofon ${d.deviceId.slice(0,8)}`}</option>)}
                      </select>
                    </div>
                    {speakers.length > 0 && (
                      <div>
                        <label className="text-xs text-white/50 block mb-1">Hoparlör</label>
                        <select value={selectedSpeaker} onChange={e => setSelectedSpeaker(e.target.value)}
                          className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none">
                          {speakers.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Hoparlör ${d.deviceId.slice(0,6)}`}</option>)}
                        </select>
                      </div>
                    )}
                    <div className="space-y-2">
                      {[
                        { label: 'Gürültü Bastırma', val: noiseSuppression, set: setNoiseSuppression },
                        { label: 'Eko Giderme', val: echoCancellation, set: setEchoCancellation },
                      ].map(item => (
                        <div key={item.label} className="flex items-center justify-between">
                          <span className="text-xs text-white/60">{item.label}</span>
                          <button onClick={() => item.set(!item.val)} className={`w-9 h-5 rounded-full relative transition-all ${item.val ? 'bg-emerald-500' : 'bg-white/10'}`}>
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${item.val ? 'left-4' : 'left-0.5'}`} />
                          </button>
                        </div>
                      ))}
                    </div>
                    {localStream && (
                      <div>
                        <p className="text-[10px] text-white/30 mb-1.5">Ses Seviyesi</p>
                        <AudioMeter stream={localStream} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Sağ Kolon */}
                <div className="space-y-4">
                  {/* Kamera Önizleme */}
                  {streamMode !== 'audio' && (
                    <div className="p-4 bg-white/3 border border-white/8 rounded-2xl space-y-3">
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Kamera Önizleme</p>
                      <div className="aspect-video bg-black rounded-xl overflow-hidden relative">
                        <video ref={previewRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                        {!localStream && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                              <Video size={24} className="text-white/20 mx-auto mb-2" />
                              <p className="text-[11px] text-white/30">Kamera yükleniyor...</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="text-xs text-white/50 block mb-1">Kamera</label>
                        <select value={selectedCam} onChange={e => setSelectedCam(e.target.value)}
                          className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none">
                          {cameras.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Kamera ${d.deviceId.slice(0,8)}`}</option>)}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Video Kalitesi */}
                  <div className="p-4 bg-white/3 border border-white/8 rounded-2xl space-y-3">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Video Kalitesi</p>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { id: '360', label: '360p', desc: 'Düşük bant' },
                        { id: '720', label: '720p HD', desc: 'Önerilen' },
                        { id: '1080', label: '1080p FHD', desc: 'Yüksek bant' },
                      ] as const).map(q => (
                        <button key={q.id} onClick={() => setVideoQuality(q.id)}
                          className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all ${videoQuality === q.id ? 'bg-purple-500/15 border-purple-500/30 text-purple-300' : 'bg-white/3 border-white/8 text-white/40 hover:text-white'}`}>
                          <span className="text-xs font-black">{q.label}</span>
                          <span className="text-[9px] text-white/30">{q.desc}</span>
                        </button>
                      ))}
                    </div>
                    <div className="p-2.5 bg-yellow-500/5 border border-yellow-500/15 rounded-xl">
                      <p className="text-[10px] text-yellow-400/70">⚡ 1080p için yüksek hızlı internet gerekir (10+ Mbps upload)</p>
                    </div>
                  </div>

                  {/* Başlat Butonu */}
                  <div className="space-y-2">
                    <button onClick={startStream} disabled={!streamTitle.trim()}
                      className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl text-sm font-black hover:from-purple-500 hover:to-purple-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/20">
                      🎬 Yayına Geç
                    </button>
                    <button onClick={() => { setSetupStep('idle'); localStream?.getTracks().forEach(t => t.stop()); setLocalStream(null); }}
                      className="w-full py-2.5 bg-white/5 text-white/40 rounded-xl text-sm hover:bg-white/10 hover:text-white transition-all">
                      İptal
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── CANLI YAYIN SAHNESI ── */}
        {setupStep === 'live' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Video Sahne */}
            <div className="flex-1 relative bg-black overflow-hidden">
              <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />

              {/* Cihaz Uyarısı */}
              {deviceWarning && (
                <div className="absolute top-0 left-0 right-0 z-20 flex items-center gap-2 px-4 py-2 bg-yellow-500/90 backdrop-blur-sm">
                  <AlertTriangle size={14} className="text-yellow-900 flex-shrink-0" />
                  <span className="text-xs font-bold text-yellow-900 flex-1">{deviceWarning}</span>
                  <button onClick={() => setDeviceWarning(null)} className="text-yellow-900/70 hover:text-yellow-900"><X size={13} /></button>
                </div>
              )}

              {/* HUD Üst Sol */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 rounded-full shadow-lg shadow-red-500/30">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  <span className="text-[11px] font-black text-white tracking-wide">CANLI</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-black/60 backdrop-blur-sm rounded-full">
                  <Eye size={11} className="text-white/70" />
                  <span className="text-[11px] text-white font-bold">{viewerCount}</span>
                </div>
                <div className="px-2.5 py-1.5 bg-black/60 backdrop-blur-sm rounded-full">
                  <StreamTimer startTime={streamStartTime} />
                </div>
              </div>

              {/* HUD Üst Sağ */}
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <div className="px-2.5 py-1.5 bg-black/60 backdrop-blur-sm rounded-full">
                  <span className="text-[11px] text-white/80 font-bold">{streamTitle}</span>
                </div>
              </div>

              {/* Ses Göstergesi */}
              <div className="absolute bottom-20 left-4">
                {micOn ? <AudioMeter stream={localStream} /> : (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/20 border border-red-500/30 rounded-full">
                    <MicOff size={11} className="text-red-400" />
                    <span className="text-[10px] text-red-400">Mikrofon kapalı</span>
                  </div>
                )}
              </div>

              {/* Canlı Ayarlar Paneli */}
              {showSettings && (
                <div className="absolute top-14 right-4 w-64 bg-[#111418]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl z-10">
                  <p className="text-xs font-black text-white/50 uppercase tracking-widest mb-3">Canlı Ayarlar</p>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] text-white/40 block mb-1">Mikrofon</label>
                      <select value={selectedMic} onChange={e => { setSelectedMic(e.target.value); hotSwapDevice('audio', e.target.value); }}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none">
                        {mics.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Mikrofon ${d.deviceId.slice(0,8)}`}</option>)}
                      </select>
                    </div>
                    {streamMode !== 'audio' && (
                      <div>
                        <label className="text-[11px] text-white/40 block mb-1">Kamera</label>
                        <select value={selectedCam} onChange={e => { setSelectedCam(e.target.value); hotSwapDevice('video', e.target.value); }}
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none">
                          {cameras.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Kamera ${d.deviceId.slice(0,8)}`}</option>)}
                        </select>
                      </div>
                    )}
                    {[
                      { label: 'Gürültü Bastırma', val: noiseSuppression, set: setNoiseSuppression },
                      { label: 'Eko Giderme', val: echoCancellation, set: setEchoCancellation },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between">
                        <span className="text-xs text-white/60">{item.label}</span>
                        <button onClick={() => item.set(!item.val)} className={`w-8 h-4 rounded-full relative transition-all ${item.val ? 'bg-emerald-500' : 'bg-white/10'}`}>
                          <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${item.val ? 'left-4' : 'left-0.5'}`} />
                        </button>
                      </div>
                    ))}
                    <div>
                      <label className="text-[11px] text-white/40 block mb-1">Yayın Başlığı</label>
                      <input value={streamTitle} onChange={e => { setStreamTitle(e.target.value); if (myStreamRef.current) update(myStreamRef.current, { title: e.target.value }); }}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Kontrol Çubuğu */}
            <div className="h-16 bg-[#0a0d10] border-t border-white/5 flex items-center justify-between px-6 flex-shrink-0">
              <div className="flex items-center gap-2">
                <button onClick={toggleMic}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${micOn ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30'}`}>
                  {micOn ? <Mic size={15} /> : <MicOff size={15} />}
                  <span className="hidden sm:block">{micOn ? 'Mikrofon' : 'Sessiz'}</span>
                </button>
                <button onClick={toggleCam}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${camOn ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30'}`}>
                  {camOn ? <Video size={15} /> : <VideoOff size={15} />}
                  <span className="hidden sm:block">{camOn ? 'Kamera' : 'Kamera Kapalı'}</span>
                </button>
                {(streamMode === 'screen' || streamMode === 'screen_cam') && (
                  <div className="flex items-center gap-1.5 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 text-xs font-bold">
                    <Monitor size={14} /> Ekran
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                {localStream && <AudioMeter stream={localStream} />}
                <span className="text-xs text-white/30 font-mono">{videoQuality}p</span>
              </div>

              <button onClick={stopStream}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-black rounded-xl hover:bg-red-500 hover:text-white transition-all">
                <PhoneOff size={14} /> Yayını Bitir
              </button>
            </div>
          </div>
        )}

        {/* ── YAYINLARI KEŞFET ── */}
        {setupStep === 'idle' && (
          <div className="flex-1 overflow-y-auto bg-[#070a0d]">
            {streams.length > 0 ? (
              <div className="p-5">
                {/* Seçili yayın izleme */}
                {selectedStream && (
                  <div className="mb-5 rounded-2xl overflow-hidden border border-white/10">
                    <div className="aspect-video bg-black relative overflow-hidden">
                      {/* Gerçek WebRTC video */}
                      <video
                        ref={viewerVideoRef}
                        autoPlay
                        playsInline
                        className={`w-full h-full object-cover transition-opacity duration-700 ${viewerStream ? 'opacity-100' : 'opacity-0'}`}
                      />
                      {/* Bağlanıyor ekranı */}
                      {!viewerStream && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-3">
                            <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                          </div>
                          <p className="text-white font-black">{selectedStream.username}</p>
                          <p className="text-white/40 text-sm mt-1">{selectedStream.title}</p>
                          <p className="text-white/25 text-xs mt-2 animate-pulse">Yayına bağlanılıyor...</p>
                        </div>
                      )}
                      {/* HUD overlay */}
                      {viewerStream && (
                        <div className="absolute top-3 left-3 flex items-center gap-2">
                          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/90 rounded-full backdrop-blur-sm">
                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                            <span className="text-[10px] font-black text-white">CANLI</span>
                          </div>
                          <div className="flex items-center gap-1 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-full">
                            <Eye size={9} className="text-white/70" />
                            <span className="text-[10px] text-white font-bold">{viewerCount}</span>
                          </div>
                          <span className="px-2 py-1 bg-black/60 backdrop-blur-sm rounded-full text-[10px] text-purple-300">{selectedStream.category || 'Genel'}</span>
                        </div>
                      )}
                      <button onClick={() => setSelectedStream(null)} className="absolute top-3 right-3 p-1.5 bg-black/50 text-white/50 hover:text-white rounded-xl transition-all">
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-black text-white/50 uppercase tracking-widest">Aktif Yayınlar</p>
                  <span className="text-xs text-red-400 font-bold">{streams.length} yayın</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {streams.map(stream => (
                    <div key={stream.id} onClick={() => setSelectedStream(stream)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all group ${selectedStream?.id === stream.id ? 'bg-purple-500/10 border-purple-500/30' : 'bg-white/3 border-white/8 hover:bg-white/5 hover:border-purple-500/20'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center text-xs font-black text-white/60">
                          {(stream.username || '?').substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold text-white truncate">{stream.username}</p>
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse flex-shrink-0" />
                          </div>
                          <p className="text-[10px] text-purple-400/70">{stream.category || 'Genel'}</p>
                        </div>
                      </div>
                      <p className="text-[11px] text-white/60 truncate mb-2">{stream.title}</p>
                      <div className="flex items-center gap-2 text-white/25">
                        <Eye size={10} /><span className="text-[10px]">{stream.viewers || 0}</span>
                        <span className="text-[10px] ml-auto">
                          {stream.mode === 'screen' ? '🖥️' : stream.mode === 'screen_cam' ? '🖥️📹' : stream.mode === 'audio' ? '🎙️' : '📹'}
                          {stream.quality && ` ${stream.quality}p`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-5 px-8 text-center">
                <div className="w-20 h-20 rounded-3xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <Video size={36} className="text-purple-400" />
                </div>
                <div>
                  <p className="text-white font-black text-xl mb-2">Genel Sohbet Odası</p>
                  <p className="text-white/40 text-sm max-w-xs">Doğrulanmış üyeler kamera, ekran paylaşımı veya sesli yayın başlatabilir.</p>
                </div>
                {isVerified ? (
                  <button onClick={() => setSetupStep('setup')}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white text-sm font-black rounded-2xl hover:from-purple-500 hover:to-purple-400 transition-all shadow-lg shadow-purple-500/20">
                    <Radio size={16} /> Yayın Başlat
                  </button>
                ) : (
                  <div className="flex items-center gap-2 px-5 py-3 bg-emerald-500/5 border border-emerald-500/15 rounded-2xl">
                    <Leaf size={14} className="text-emerald-400" />
                    <span className="text-sm text-emerald-400/70">Yayın için 🍃 doğrulanmış rozet gerekli</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Sohbet Paneli ── */}
      <div className="w-72 border-l border-white/5 flex flex-col bg-black/20 flex-shrink-0">
        <div className="h-14 border-b border-white/5 flex items-center px-5 gap-2">
          <span className="text-xs font-black text-white uppercase tracking-widest flex-1 truncate">
            {isStreaming ? 'Yayın Sohbeti' : selectedStream ? `${selectedStream.username} Sohbeti` : 'Sohbet'}
          </span>
          {(isStreaming || selectedStream) && (
            <div className="flex items-center gap-1 text-white/30">
              <Eye size={11} />
              <span className="text-[10px] font-bold">{viewerCount}</span>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
          {!selectedStream && !isStreaming ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-[11px] text-white/20 text-center">Önce bir yayın seç</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-[11px] text-white/20 text-center">Henüz mesaj yok<br />İlk yazan sen ol!</p>
            </div>
          ) : messages.map(msg => (
            <div key={msg.id} className={`flex gap-2 ${msg.uid === userId ? 'flex-row-reverse' : ''}`}>
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center text-[9px] font-black text-white/50 flex-shrink-0">
                {(msg.user || '?').substring(0, 2).toUpperCase()}
              </div>
              <div className={`max-w-[80%] ${msg.uid === userId ? 'items-end' : 'items-start'} flex flex-col`}>
                <span className={`text-[9px] font-black uppercase tracking-wider mb-0.5 ${msg.uid === userId ? 'text-purple-400' : 'text-blue-400'}`}>{msg.user}</span>
                <div className={`px-2.5 py-1.5 rounded-xl text-xs text-white/80 leading-relaxed ${msg.uid === userId ? 'bg-purple-500/15 border border-purple-500/20' : 'bg-white/5 border border-white/8'}`}>
                  {msg.text}
                </div>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div className="p-3 border-t border-white/5">
          <form onSubmit={handleSend} className="relative">
            <input value={input} onChange={e => setInput(e.target.value)}
              placeholder={(selectedStream || isStreaming) ? 'Mesaj yaz...' : 'Önce bir yayın seç...'}
              disabled={!selectedStream && !isStreaming}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500/40 pr-9 disabled:opacity-30" />
            <button type="submit" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/20 hover:text-purple-400 transition-all">
              <Send size={13} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// ANA EXPORT
// ─────────────────────────────────────────────
export const LiveSection = ({
  theme, type, tvChannel, userId, username, isVerified
}: {
  theme: any;
  type: 'tv' | 'chat';
  tvChannel?: string;
  userId?: string;
  username?: string;
  isVerified?: boolean;
}) => {
  if (type === 'tv') {
    return <NatureTVPage theme={theme} tvChannel={tvChannel || 'trt1'} />;
  }
  return (
    <LiveChatPage
      theme={theme}
      userId={userId || ''}
      username={username || 'Misafir'}
      isVerified={isVerified || false}
    />
  );
};
