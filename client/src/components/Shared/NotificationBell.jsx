import React, { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { io } from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';

const API = 'http://localhost:5000';

const timeAgo = (dateString) => {
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const NotificationBell = ({ onNavigate }) => {
  const { user, getToken } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState([]);

  const socketRef = useRef(null);
  const containerRef = useRef(null);
  const toastTimeoutsRef = useRef({});
  const audioContextRef = useRef(null);

  const playNotificationSound = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }

      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.value = 880;

      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    } catch {}
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API}/api/notifications`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      if (!res.ok) return;

      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {}
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast._id !== id));
    if (toastTimeoutsRef.current[id]) {
      clearTimeout(toastTimeoutsRef.current[id]);
      delete toastTimeoutsRef.current[id];
    }
  };

  const showToast = (notification) => {
    setToasts((prev) => {
      const next = [notification, ...prev.filter((t) => t._id !== notification._id)];
      return next.slice(0, 3);
    });

    if (toastTimeoutsRef.current[notification._id]) {
      clearTimeout(toastTimeoutsRef.current[notification._id]);
    }

    toastTimeoutsRef.current[notification._id] = setTimeout(() => {
      removeToast(notification._id);
    }, 4500);
  };

  const markAsRead = async (notification) => {
    try {
      if (!notification.read) {
        await fetch(`${API}/api/notifications/${notification._id}/read`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${getToken()}` },
        });

        setNotifications((prev) =>
          prev.map((n) => (n._id === notification._id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(prev - 1, 0));
      }

      removeToast(notification._id);

      if (notification.targetTab && onNavigate) {
        onNavigate(notification.targetTab);
      }

      setOpen(false);
    } catch {}
  };

  const markAllAsRead = async () => {
    try {
      await fetch(`${API}/api/notifications/read-all`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();

    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    if (user?._id) {
      socketRef.current = io(API, { transports: ['websocket'] });

      socketRef.current.on('connect', () => {
        socketRef.current.emit('join', user._id);
      });

      socketRef.current.on('notification:new', (notification) => {
        setNotifications((prev) => [notification, ...prev].slice(0, 30));
        setUnreadCount((prev) => prev + 1);
        playNotificationSound();
        showToast(notification);
      });
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      socketRef.current?.disconnect();

      Object.values(toastTimeoutsRef.current).forEach((timeoutId) => clearTimeout(timeoutId));
    };
  }, [user?._id]);

  return (
    <>
      <div className="relative" ref={containerRef}>
        <button
          onClick={() => {
            setOpen((prev) => !prev);
            if (!open) fetchNotifications();
          }}
          className="text-gray-500 hover:text-gray-800 relative"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-brandOrange text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute right-0 mt-3 w-96 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-sm text-gray-900">Notifications</h3>
                <p className="text-xs text-gray-400">{unreadCount} unread</p>
              </div>
              <button
                onClick={markAllAsRead}
                className="text-xs font-bold text-brandOrange hover:underline flex items-center gap-1"
              >
                <CheckCheck size={14} />
                Mark all read
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-gray-400">
                  No notifications yet
                </div>
              ) : (
                notifications.map((notification) => (
                  <button
                    key={notification._id}
                    onClick={() => markAsRead(notification)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition ${
                      !notification.read ? 'bg-orange-50/40' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-800">{notification.title}</p>
                        <p className="text-xs text-gray-500 mt-1 leading-5">{notification.message}</p>
                      </div>
                      {!notification.read && (
                        <span className="w-2.5 h-2.5 rounded-full bg-brandOrange mt-1 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-2">{timeAgo(notification.createdAt)}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <div className="fixed top-20 right-6 z-[60] flex flex-col gap-3 w-[360px] max-w-[calc(100vw-2rem)] pointer-events-none">
        {toasts.map((notification) => (
          <button
            key={notification._id}
            onClick={() => markAsRead(notification)}
            className="pointer-events-auto text-left bg-white border border-gray-100 shadow-xl rounded-2xl p-4 hover:border-brandOrange/30 transition"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900">{notification.title}</p>
                <p className="text-xs text-gray-500 mt-1 leading-5">{notification.message}</p>
                <p className="text-[11px] text-gray-400 mt-2">{timeAgo(notification.createdAt)}</p>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-brandOrange mt-1 shrink-0" />
            </div>
          </button>
        ))}
      </div>
    </>
  );
};

export default NotificationBell;
