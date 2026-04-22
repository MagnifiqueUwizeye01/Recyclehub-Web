import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationItem from '../../components/features/NotificationItem';

export default function NotificationBell({ variant = 'light' }) {
  const isDark = variant === 'dark';
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications() || { notifications: [], unreadCount: 0 };
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleClick = (n) => {
    markRead(n.id);
    if (n.actionUrl) navigate(n.actionUrl);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={
          isDark
            ? 'relative p-2 rounded-lg text-emerald-200/90 hover:bg-white/10 hover:text-white transition-colors'
            : 'relative p-2 rounded-xl hover:bg-hub-surface2 text-hub-muted hover:text-hub-text transition-colors'
        }
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-mono">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-12 w-80 bg-hub-surface border border-hub-border rounded-2xl shadow-2xl z-50 animate-slide-up">
          <div className="flex items-center justify-between px-4 py-3 border-b border-hub-border">
            <h3 className="font-display font-bold text-hub-text text-sm">Notifications</h3>
            <button onClick={markAllRead} className="text-xs text-hub-muted hover:text-hub-accent transition-colors">Mark all read</button>
          </div>
          <div className="max-h-80 overflow-y-auto p-2 space-y-1">
            {notifications.slice(0, 5).map((n) => (
              <NotificationItem key={n.id} notification={n} onClick={handleClick} />
            ))}
            {notifications.length === 0 && <p className="text-center text-hub-muted text-xs py-6">No notifications</p>}
          </div>
          <div className="border-t border-hub-border p-3 space-y-2">
            <button
              type="button"
              onClick={() => {
                navigate('/notifications');
                setOpen(false);
              }}
              className="w-full text-xs font-medium text-hub-accent hover:underline text-center transition-colors"
            >
              View all notifications
            </button>
            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[11px] text-hub-muted">
              <Link to="/profile" onClick={() => setOpen(false)} className="hover:text-hub-accent">
                Profile
              </Link>
              <span aria-hidden>·</span>
              <Link to="/settings" onClick={() => setOpen(false)} className="hover:text-hub-accent">
                Settings
              </Link>
              <span aria-hidden>·</span>
              <Link to="/change-password" onClick={() => setOpen(false)} className="hover:text-hub-accent">
                Password
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
