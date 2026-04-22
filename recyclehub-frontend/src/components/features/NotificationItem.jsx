import { timeAgo } from '../../utils/formatDate';
import { Bell, Package, MessageSquare, ShieldCheck, Star, Zap, Shield } from 'lucide-react';

const typeIcons = {
  Order: <Package size={16} className="text-blue-400" />,
  Message: <MessageSquare size={16} className="text-emerald-400" />,
  Verification: <ShieldCheck size={16} className="text-amber-400" />,
  Review: <Star size={16} className="text-amber-400" />,
  Payment: <Zap size={16} className="text-hub-accent" />,
  AdminNotice: <Shield size={16} className="text-emerald-600" />,
  General: <Bell size={16} className="text-hub-muted" />,
};

export default function NotificationItem({ notification, onClick }) {
  const isAdmin = notification.type === 'AdminNotice' || notification.notificationType === 'AdminNotice';
  const senderLabel = isAdmin ? 'RecycleHub Admin' : notification.title || '';
  return (
    <div
      onClick={() => onClick?.(notification)}
      className={`flex gap-3 p-3 rounded-xl cursor-pointer transition-colors hover:bg-hub-surface2 ${notification.isRead ? 'opacity-70' : 'bg-hub-surface2/50'}`}
    >
      <div className="shrink-0 w-8 h-8 rounded-full bg-hub-surface flex items-center justify-center border border-hub-border">
        {typeIcons[notification.type] || typeIcons[notification.notificationType] || typeIcons.General}
      </div>
      <div className="flex-1 min-w-0">
        {senderLabel && (
          <p className="text-xs font-semibold text-hub-text mb-0.5">{senderLabel}</p>
        )}
        <p className={`text-sm font-body ${notification.isRead ? 'text-hub-muted' : 'text-hub-text font-medium'} line-clamp-2`}>{notification.message}</p>
        <p className="text-xs text-hub-muted mt-0.5">{timeAgo(notification.createdAt)}</p>
      </div>
      {!notification.isRead && <div className="shrink-0 w-2 h-2 rounded-full bg-hub-accent mt-1.5" />}
    </div>
  );
}
