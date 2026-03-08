import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Check, UserPlus, MessageSquare, Gamepad2, X } from 'lucide-react';
import { listenNotifications, markNotificationRead, acceptFriendRequest } from '../services/firebaseService';

interface NotificationCenterProps {
  theme: any;
  userId: string;
}

export const NotificationCenter = ({ theme, userId }: NotificationCenterProps) => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!userId) return;
    const unsub = listenNotifications(userId, setNotifications);
    return unsub;
  }, [userId]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleAcceptFriend = async (notif: any) => {
    // Find the friend request and accept
    await acceptFriendRequest(userId, notif.from_id, notif.id);
    await markNotificationRead(userId, notif.id);
  };

  const icons: Record<string, any> = {
    friend_request: <UserPlus size={16} className="text-blue-400" />,
    mention: <MessageSquare size={16} className="text-emerald-400" />,
    game_invite: <Gamepad2 size={16} className="text-purple-400" />,
    message: <MessageSquare size={16} className="text-white/40" />,
    system: <Bell size={16} className="text-yellow-400" />,
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-white/40 hover:text-white transition-all"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute right-0 top-10 w-80 bg-[#1a1d21] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="font-bold text-white text-sm">Bildirimler</h3>
                <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white">
                  <X size={16} />
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-white/30 text-sm">
                    <Bell size={32} className="mx-auto mb-2 opacity-20" />
                    Bildirim yok
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div
                      key={notif.id}
                      className={`p-4 border-b border-white/5 flex items-start gap-3 transition-all ${!notif.read ? 'bg-white/5' : ''}`}
                    >
                      <div className="mt-0.5">{icons[notif.type] || <Bell size={16} />}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white/80">{notif.content}</p>
                        <p className="text-[10px] text-white/30 mt-0.5">
                          {new Date(notif.timestamp).toLocaleString('tr-TR')}
                        </p>
                        {notif.type === 'friend_request' && !notif.read && (
                          <button
                            onClick={() => handleAcceptFriend(notif)}
                            className="mt-2 px-3 py-1 bg-emerald-500 text-white text-xs rounded-lg font-bold hover:bg-emerald-600 transition-all"
                          >
                            Kabul Et
                          </button>
                        )}
                      </div>
                      {!notif.read && (
                        <button
                          onClick={() => markNotificationRead(userId, notif.id)}
                          className="text-white/20 hover:text-white transition-all"
                        >
                          <Check size={14} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
