import { createContext, useContext, useState, useCallback } from 'react';
import {
  getConversations,
  getMessageThread,
  sendMessage as sendMsg,
  getUnreadCount,
} from '../api/messages.api';
import { useSignalR } from '../hooks/useSignalR';

const MessageContext = createContext(null);

export function MessageProvider({ children }) {
  const [conversations,  setConversations]  = useState([]);
  const [activeThread,   setActiveThread]   = useState([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [loadingThread,  setLoadingThread]  = useState(false);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await getConversations();
      setConversations(res?.data?.data || res?.data || []);
    } catch {}
  }, []);

  /** Re-fetch the real unread count from the server and sync it to state. */
  const refreshUnreadCount = useCallback(async () => {
    try {
      const res = await getUnreadCount();
      const raw = res.data?.count ?? res.data?.data ?? res.data ?? 0;
      const c = typeof raw === 'number' ? raw : Number(raw) || 0;
      setUnreadMessages(c);
    } catch {}
  }, []);

  const loadThread = useCallback(async (otherUserId) => {
    try {
      setLoadingThread(true);
      const res = await getMessageThread({ otherUserId });
      setActiveThread(res?.data?.data || res?.data || []);
    } catch {
      setActiveThread([]);
    } finally {
      setLoadingThread(false);
    }
  }, []);

  const sendMessage = useCallback(async (data) => {
    const res = await sendMsg(data);
    const payload = res?.data?.data || res?.data;
    setActiveThread((prev) => [...prev, payload]);
    return payload;
  }, []);

  /** Called by SignalR when a new message arrives — always increments the badge. */
  const addIncomingMessage = useCallback((message) => {
    setActiveThread((prev) => {
      const exists = prev.find((m) => m.id === message.id);
      return exists ? prev : [...prev, message];
    });
    setUnreadMessages((prev) => prev + 1);
  }, []);

  useSignalR({ onMessage: addIncomingMessage });

  return (
    <MessageContext.Provider value={{
      conversations,
      activeThread,
      unreadMessages,
      loadingThread,
      fetchConversations,
      loadThread,
      sendMessage,
      addIncomingMessage,
      setUnreadMessages,
      refreshUnreadCount,
    }}>
      {children}
    </MessageContext.Provider>
  );
}

export function useMessageContext() {
  return useContext(MessageContext);
}

export default MessageContext;
