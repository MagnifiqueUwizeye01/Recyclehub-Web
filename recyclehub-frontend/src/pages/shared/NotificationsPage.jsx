import { useNavigate } from 'react-router-dom';
import RoleDashboardLayout from '../../layouts/RoleDashboardLayout';
import NotificationItem from '../../components/features/NotificationItem';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { useNotifications } from '../../hooks/useNotifications';
import { Bell, CheckCheck } from 'lucide-react';

function NotificationsContent() {
  const navigate = useNavigate();
  const { notifications, loading, unreadCount, markRead, markAllRead } = useNotifications() || {
    notifications: [],
    loading: false,
    unreadCount: 0,
  };

  const handleClick = (n) => {
    markRead?.(n.id);
    if (n.actionUrl) navigate(n.actionUrl);
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
          <Bell size={22} className="text-emerald-600" />
          Notifications
          {unreadCount > 0 && (
            <span className="text-sm bg-red-500 text-white rounded-full px-2 py-0.5 font-medium">{unreadCount}</span>
          )}
        </h1>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" icon={<CheckCheck size={14} />} onClick={markAllRead}>
            Mark all read
          </Button>
        )}
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16">
            <Bell size={36} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((n) => (
              <div key={n.id} className="px-4">
                <NotificationItem notification={n} onClick={handleClick} />
              </div>
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
