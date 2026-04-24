import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getNotifications, getUnreadNotificationCount, markNotificationRead, markAllNotificationsRead } from '../api/notifications.api';
import { useAuthContext } from './AuthContext';
import { useSignalR } from '../hooks/useSignalR';

const NotificationContext = createContext(null);

function normalizeNotification(n) {
  if (!n || typeof n !== 'object') return null;
  const id = n.id ?? n.notificationId ?? n.NotificationId;
  const userId = n.userId ?? n.UserId;
  return {
    ...n,
    id,
    userId,
    isRead: n.isRead ?? n.IsRead ?? false,
  };
}

export function NotificationProvider({ children }) {
  const { isAuthenticated, user } = useAuthContext();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    const myId = user?.userId;
    try {
      setLoading(true);
      const [notifRes, countRes] = await Promise.all([
        getNotifications({ page: 1, pageSize: 20 }),
        getUnreadNotificationCount(),
      ]);
      const raw = notifRes.data?.data || notifRes.data || [];
      const list = (Array.isArray(raw) ? raw : []).map(normalizeNotification).filter(Boolean);
      const scoped = myId == null ? list : list.filter((n) => n.userId == null || Number(n.userId) === Number(myId));
      setNotifications(scoped);
      const c = countRes.data?.count ?? countRes.data?.data ?? countRes.data ?? 0;
      setUnreadCount(typeof c === 'number' ? c : Number(c) || 0);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user?.userId]);

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    fetchNotifications();
  }, [isAuthenticated, fetchNotifications]);

  const addNotification = useCallback(
    (payload) => {
      const myId = user?.userId;
      const n = normalizeNotification(payload);
      if (!n) return;
      const senderId = n.userId ?? n.UserId;
      if (myId != null && senderId != null && Number(senderId) !== Number(myId)) {
        return;
      }
      setNotifications((prev) => [n, ...prev]);
      if (!n.isRead) setUnreadCount((prev) => prev + 1);
    },
    [user?.userId],
  );

  useSignalR({
    onNotification: addNotification,
  });

  const markRead = useCallback(async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {}
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  }, []);

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, loading, addNotification, markRead, markAllRead, fetchNotifications }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  return useContext(NotificationContext);
}

export default NotificationContext;
