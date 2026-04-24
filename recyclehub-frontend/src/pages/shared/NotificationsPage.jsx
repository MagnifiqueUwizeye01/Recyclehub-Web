import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RoleDashboardLayout from '../../layouts/RoleDashboardLayout';
import { useNotifications } from '../../hooks/useNotifications';
import { timeAgo } from '../../utils/formatDate';
import {
  Bell, CheckCheck, Package, MessageSquare, ShieldCheck,
  Star, Zap, Shield, Inbox,
} from 'lucide-react';

/* ─── type meta ─────────────────────────────────────────────────────────── */
const TYPE_META = {
  Order:       { icon: Package,      bg: 'bg-blue-50',    text: 'text-blue-500' },
  Message:     { icon: MessageSquare, bg: 'bg-emerald-50', text: 'text-emerald-500' },
  Verification:{ icon: ShieldCheck,  bg: 'bg-amber-50',   text: 'text-amber-500' },
  Review:      { icon: Star,         bg: 'bg-amber-50',   text: 'text-amber-500' },
  Payment:     { icon: Zap,          bg: 'bg-purple-50',  text: 'text-purple-500' },
  AdminNotice: { icon: Shield,       bg: 'bg-emerald-50', text: 'text-emerald-600' },
  General:     { icon: Bell,         bg: 'bg-gray-100',   text: 'text-gray-500' },
};

function getTypeMeta(type) {
  return TYPE_META[type] || TYPE_META.General;
}

/* ─── notification row ──────────────────────────────────────────────────── */
function NotifRow({ n, onClick }) {
  const { icon: Icon, bg, text } = getTypeMeta(n.type ?? n.notificationType);
  const isAdmin = (n.type ?? n.notificationType) === 'AdminNotice';
  const label   = isAdmin ? 'RecycleHub Admin' : n.title || '';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(n)}
      onKeyDown={(e) => e.key === 'Enter' && onClick(n)}
      className={`group flex cursor-pointer items-start gap-3 px-5 py-4 transition-colors hover:bg-gray-50 ${!n.isRead ? 'bg-emerald-50/30' : ''}`}
    >
      <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${bg}`}>
        <Icon size={16} className={text} />
      </div>
      <div className="min-w-0 flex-1">
        {label && <p className="mb-0.5 text-xs font-semibold text-gray-700">{label}</p>}
        <p className={`text-sm line-clamp-2 ${n.isRead ? 'text-gray-500' : 'font-medium text-gray-900'}`}>
          {n.message}
        </p>
        <p className="mt-1 text-xs text-gray-400">{timeAgo(n.createdAt)}</p>
      </div>
      {!n.isRead && (
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
      )}
    </div>
  );
}

/* ─── inner content ─────────────────────────────────────────────────────── */
function NotificationsContent() {
  const navigate = useNavigate();
  const { notifications = [], loading, unreadCount, markRead, markAllRead } = useNotifications() || {};

  // Auto-mark all notifications as read when this page is opened
  useEffect(() => {
    if (!loading && unreadCount > 0 && markAllRead) {
      markAllRead();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]); // run once after initial load

  const handleClick = (n) => {
    if (!n.isRead) markRead?.(n.id);
    if (n.actionUrl) navigate(n.actionUrl);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* title */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-2xl font-bold text-transparent md:text-3xl">
            Notifications
            {unreadCount > 0 && (
              <span className="rounded-full bg-red-500 px-2.5 py-0.5 text-sm font-semibold text-white">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button type="button" onClick={() => markAllRead?.()}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-all hover:border-emerald-200 hover:bg-emerald-50">
            <CheckCheck size={14} className="text-emerald-500" />
            Mark all read
          </button>
        )}
      </div>

      {/* card */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        {loading ? (
          <div className="space-y-1 divide-y divide-gray-50 p-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-3 p-3">
                <div className="h-9 w-9 animate-pulse rounded-xl bg-gray-100" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3 w-3/4 animate-pulse rounded-full bg-gray-100" />
                  <div className="h-3 w-1/2 animate-pulse rounded-full bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <Inbox size={28} className="text-gray-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">No notifications yet</h3>
            <p className="mt-1 text-sm text-gray-500">We'll let you know when something happens.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {notifications.map((n) => (
              <NotifRow key={n.id} n={n} onClick={handleClick} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <RoleDashboardLayout>
      <NotificationsContent />
    </RoleDashboardLayout>
  );
}
