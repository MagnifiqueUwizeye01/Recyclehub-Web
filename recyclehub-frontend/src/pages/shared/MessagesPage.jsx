import { useEffect, useState, useRef, useCallback } from 'react';
import { useLocation, useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useMessages } from '../../hooks/useMessages';
import RoleDashboardLayout from '../../layouts/RoleDashboardLayout';
import { searchUsers } from '../../api/users.api';
import {
  getConversations,
  getMessageThread,
  sendMessage,
  getMessageRecipients,
  sendAnnouncement,
  uploadChatImage,
  markMessageRead,
} from '../../api/messages.api';
import { timeAgo } from '../../utils/formatDate';
import { formatRWF } from '../../utils/formatCurrency';
import { 
  Send, Search, MessageCircle, Flag, Paperclip, Smile, 
  SquarePen, X, UserPlus, Phone, Video, MoreVertical, 
  Check, CheckCheck, Image, Mic, Trash2, Pin, 
  Star, Users, Archive, Bell, BellOff, Volume2,
  VolumeX, Loader2, AtSign, Hash, Gift, Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';
import ReportModal from '../../components/features/ReportModal';
import { resolveProfileImageUrl, resolveMaterialAssetUrl, resolveUploadedFileUrl } from '../../utils/assetUrl';
import EmojiPicker from 'emoji-picker-react';

// Extended emoji categories (fallback)
const QUICK_EMOJIS = ['😀', '😊', '👍', '🙏', '❤️', '🔥', '✅', '👋', '🎉', '💬', '📷', '🛒', '✨', '🙌', '😅', '🤝', '🚀', '💎', '⭐', '💚'];

function recipientToUser(r) {
  const full = r.fullName || r.FullName || '';
  const parts = full.trim().split(/\s+/);
  return {
    userId: r.userId ?? r.UserId,
    id: r.userId ?? r.UserId,
    firstName: parts[0] || r.username || r.Username || '',
    lastName: parts.slice(1).join(' ') || '',
    email: r.email ?? r.Email ?? '',
    username: r.username ?? r.Username ?? '',
    role: r.role ?? r.Role ?? '',
    profileImageUrl: r.profileImageUrl ?? r.ProfileImageUrl,
    isOnline: Math.random() > 0.5,
    lastSeen: new Date(),
  };
}

function adminUserRow(u) {
  return {
    userId: u.userId ?? u.UserId ?? u.id,
    id: u.userId ?? u.UserId ?? u.id,
    firstName: u.firstName ?? u.FirstName ?? '',
    lastName: u.lastName ?? u.LastName ?? '',
    email: u.email ?? u.Email ?? '',
    username: u.username ?? u.Username ?? '',
    role: u.role ?? u.Role ?? '',
    profileImageUrl: u.profileImageUrl ?? u.ProfileImageUrl,
    isOnline: Math.random() > 0.5,
  };
}

/** Inner chat UI — wrapped by dashboard layout */
function MessagesChat() {
  const { user } = useAuth();
  const { refreshUnreadCount } = useMessages() || {};
  const location = useLocation();
  const navigate = useNavigate();
  const { userId: routeUserId } = useParams();

  const [conversations, setConversations] = useState([]);
  const [activeThread, setActiveThread] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [pendingAttachmentUrl, setPendingAttachmentUrl] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [newChatSearch, setNewChatSearch] = useState('');
  const [newChatResults, setNewChatResults] = useState([]);
  const [newChatSearching, setNewChatSearching] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [messageMenuOpen, setMessageMenuOpen] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [searchMessages, setSearchMessages] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [muted, setMuted] = useState(false);
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const pendingProductIntroRef = useRef(null);
  const fileInputRef = useRef(null);
  const searchInputRef = useRef(null);

  const myId = user?.userId ?? user?.id;

  // Simulate typing indicator
  useEffect(() => {
    if (typing) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setTyping(false), 2000);
    }
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [typing]);

  const loadConversations = useCallback(async () => {
    setLoadingConvs(true);
    try {
      const res = await getConversations();
      const raw = res.data?.data ?? res.data ?? [];
      const convs = Array.isArray(raw) ? raw : [];
      setConversations(convs);
    } catch (err) {
      console.error('Failed to load conversations:', err);
      setConversations([]);
    } finally {
      setLoadingConvs(false);
    }
  }, []);

  const openThread = useCallback(async (otherUser) => {
    setActiveUser(otherUser);
    setLoadingThread(true);
    setActiveThread([]);
    setReplyingTo(null);
    try {
      const otherId = otherUser.userId || otherUser.id;
      const res = await getMessageThread(otherId);
      const raw = res.data?.data ?? res.data ?? [];
      const messages = Array.isArray(raw) ? [...raw].reverse() : [];
      setActiveThread(messages);

      const myIdNum = Number(myId);
      const unreadReceived = messages.filter((m) => {
        const senderId = Number(m.senderUserId ?? m.SenderUserId ?? 0);
        const isRead = m.isRead ?? m.IsRead ?? false;
        return !isRead && senderId !== myIdNum;
      });
      if (unreadReceived.length > 0) {
        Promise.all(
          unreadReceived.map((m) =>
            markMessageRead(m.messageId ?? m.MessageId ?? m.id).catch(() => {})
          )
        ).then(() => {
          refreshUnreadCount?.();
          loadConversations();
        });
      }
    } catch (err) {
      console.error('Failed to load thread:', err);
      setActiveThread([]);
      toast.error('Failed to load messages.');
    } finally {
      setLoadingThread(false);
    }
  }, [myId, loadConversations, refreshUnreadCount]);

  const openThreadByUserId = useCallback(async (userId) => {
    try {
      const res = await getMessageRecipients({});
      const list = res.data?.data ?? res.data ?? [];
      const found = Array.isArray(list) ? list.find((u) => (u.userId ?? u.UserId) === userId) : null;
      if (found) {
        await openThread(recipientToUser(found));
        return;
      }
      await openThread({
        userId,
        id: userId,
        firstName: 'User',
        lastName: `#${userId}`,
        email: '',
        role: '',
      });
    } catch {
      await openThread({
        userId,
        id: userId,
        firstName: 'User',
        lastName: `#${userId}`,
        email: '',
        role: '',
      });
    }
  }, [openThread]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    const st = location.state;
    if (st == null || typeof st !== 'object') return;
    const hasRoute = st.otherUserId != null || st.productContext != null;
    if (!hasRoute) return;
    if (st.productContext?.materialId && st.productContext?.sellerUserId) {
      pendingProductIntroRef.current = st.productContext;
    }
    if (st.otherUserId != null) {
      const id = Number(st.otherUserId);
      if (Number.isFinite(id)) openThreadByUserId(id);
    }
    navigate({ pathname: location.pathname, search: location.search }, { replace: true, state: {} });
  }, [location.state, location.pathname, location.search, navigate, openThreadByUserId]);

  useEffect(() => {
    if (!routeUserId) return;
    const id = Number(routeUserId);
    if (Number.isFinite(id)) openThreadByUserId(id);
  }, [routeUserId, openThreadByUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread]);

  const handleSearch = async (q) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      let rows = [];
      if (user?.role === 'Admin') {
        const res = await searchUsers(q.trim(), { pageSize: 20 });
        const pack = res.data;
        const arr = pack?.items ?? pack?.data ?? pack ?? [];
        rows = (Array.isArray(arr) ? arr : []).map(adminUserRow);
      } else {
        const res = await getMessageRecipients({ search: q.trim() });
        const arr = res.data?.data ?? res.data ?? [];
        rows = (Array.isArray(arr) ? arr : []).map(recipientToUser);
      }
      rows = rows.filter((u) => (u.userId || u.id) !== myId);
      setSearchResults(rows);
    } catch (err) {
      console.error('User search error:', err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSend = async () => {
    if (!activeUser) return;
    const text = messageText.trim();
    if (!text && !pendingAttachmentUrl) return;
    setSending(true);
    const otherId = activeUser.userId || activeUser.id;
    const displayText = text || (pendingAttachmentUrl ? '📷' : '');
    
    const newMsg = {
      messageId: Date.now(),
      id: Date.now(),
      senderUserId: myId,
      messageText: displayText,
      MessageText: displayText,
      attachmentUrl: pendingAttachmentUrl || undefined,
      sentAt: new Date().toISOString(),
      SentAt: new Date().toISOString(),
      isRead: false,
      isPending: true,
      replyTo: replyingTo,
    };
    
    setActiveThread((prev) => [...prev, newMsg]);
    setMessageText('');
    setShowEmoji(false);
    setReplyingTo(null);
    const attachmentToSend = pendingAttachmentUrl;
    setPendingAttachmentUrl(null);
    
    try {
      await sendMessage({
        receiverUserId: otherId,
        messageText: displayText,
        messageType: 'General',
        attachmentUrl: attachmentToSend || undefined,
        replyToMessageId: replyingTo?.messageId,
      });
      await loadConversations();
    } catch {
      toast.error('Failed to send message.');
      setActiveThread((prev) => prev.filter((m) => m.messageId !== newMsg.messageId));
    } finally {
      setSending(false);
    }
  };

  const handlePickChatImage = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    try {
      setUploadingImage(true);
      const url = await uploadChatImage(file);
      setPendingAttachmentUrl(url);
    } catch {
      toast.error('Could not upload photo.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAnnouncement = async () => {
    const text = window.prompt('Announcement message for all users:');
    if (!text || !text.trim()) return;
    try {
      await sendAnnouncement(text.trim());
      toast.success('Announcement sent.');
      await loadConversations();
    } catch {
      toast.error('Failed to send announcement.');
    }
  };

  const handleNewChatSearch = async (q) => {
    setNewChatSearch(q);
    if (!q.trim()) { setNewChatResults([]); return; }
    setNewChatSearching(true);
    try {
      let rows = [];
      if (user?.role === 'Admin') {
        const res = await searchUsers(q.trim(), { pageSize: 20 });
        const pack = res.data;
        const arr = pack?.items ?? pack?.data ?? pack ?? [];
        rows = (Array.isArray(arr) ? arr : []).map(adminUserRow);
      } else {
        const res = await getMessageRecipients({ search: q.trim() });
        const arr = res.data?.data ?? res.data ?? [];
        rows = (Array.isArray(arr) ? arr : []).map(recipientToUser);
      }
      setNewChatResults(rows.filter((u) => (u.userId || u.id) !== myId));
    } catch {
      setNewChatResults([]);
    } finally {
      setNewChatSearching(false);
    }
  };

  const startNewChat = (u) => {
    setNewChatOpen(false);
    setNewChatSearch('');
    setNewChatResults([]);
    openThread(u);
  };

  const handleTyping = (e) => {
    setMessageText(e.target.value);
    if (!typing && e.target.value.trim()) {
      setTyping(true);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatMessageTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    const hours = diff / (1000 * 60 * 60);
    
    if (hours < 24) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (hours < 48) {
      return 'Yesterday';
    } else {
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const isAdminNoticeThread = user?.role !== 'Admin' && activeThread.length > 0 &&
    activeThread.every((m) => (m.messageType ?? m.MessageType) === 'AdminNotice' || (m.senderRole ?? m.SenderRole) === 'Admin');

  const convOther = (conv) => {
    if (conv.otherUser) return conv.otherUser;
    return {
      userId: conv.otherUserId ?? conv.OtherUserId,
      id: conv.otherUserId ?? conv.OtherUserId,
      firstName: (conv.otherFullName ?? conv.OtherFullName ?? conv.otherUsername ?? '').split(' ')[0],
      lastName: (conv.otherFullName ?? conv.OtherFullName ?? '').split(' ').slice(1).join(' '),
      email: conv.otherEmail ?? '',
      role: conv.otherUserRole ?? conv.OtherUserRole ?? '',
      profileImageUrl: conv.otherAvatarUrl ?? conv.OtherAvatarUrl,
      isOnline: Math.random() > 0.5,
    };
  };

  const displayName = (u) => [u?.firstName, u?.lastName].filter(Boolean).join(' ') || u?.username || 'User';

  const initials = (u) => {
    const a = (u?.firstName?.[0] || u?.username?.[0] || '?').toUpperCase();
    const b = (u?.lastName?.[0] || '').toUpperCase();
    return b ? `${a}${b}` : a;
  };

  const avatarFor = (u, { w = 'w-12 h-12', text = 'text-sm', light = false } = {}) => {
    const url = resolveProfileImageUrl(u?.profileImageUrl);
    if (url) {
      return (
        <div className={`${w} rounded-full overflow-hidden shrink-0 ring-2 ${light ? 'ring-white/40' : 'ring-gray-200'} bg-gray-100`}>
          <img src={url} alt="" className="w-full h-full object-cover" />
        </div>
      );
    }
    return (
      <div className={`${w} rounded-full flex items-center justify-center ${text} font-semibold shrink-0 bg-gradient-to-br from-emerald-500 to-teal-500 text-white`}>
        {initials(u)}
      </div>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-[calc(100vh-120px)] min-h-[600px]">
        <div className="flex h-full">
          {/* Left Sidebar - Conversations List */}
          <div className="w-full max-w-[380px] border-r border-gray-100 flex flex-col bg-gray-50/30">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 bg-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Messages</h1>
                  <p className="text-xs text-gray-500 mt-0.5">{conversations.length} conversations</p>
                </div>
                <div className="flex items-center gap-2">
                  {user?.role === 'Admin' && (
                    <button
                      onClick={handleAnnouncement}
                      className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                      title="Send Announcement"
                    >
                      <Users size={18} />
                    </button>
                  )}
                  <button
                    onClick={() => { setNewChatOpen(true); setNewChatSearch(''); setNewChatResults([]); }}
                    className="p-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm"
                    title="New Message"
                  >
                    <SquarePen size={18} />
                  </button>
                </div>
              </div>
              
              {/* Search Bar */}
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search conversations or users..."
                  className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2.5 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all bg-gray-50"
                />
              </div>
              
              {/* Search Results */}
              {searchQuery.trim() && (
                <div className="absolute left-4 right-4 top-[140px] z-20 mt-1 bg-white rounded-xl shadow-lg border border-gray-100 max-h-80 overflow-y-auto">
                  {searching && (
                    <div className="p-4 text-center">
                      <Loader2 size={20} className="animate-spin text-gray-400 mx-auto" />
                    </div>
                  )}
                  {!searching && searchResults.length === 0 && (
                    <div className="p-4 text-center text-sm text-gray-500">No users found</div>
                  )}
                  {searchResults.map((u) => (
                    <button
                      key={u.userId || u.id}
                      onClick={() => {
                        openThread(u);
                        setSearchQuery('');
                        setSearchResults([]);
                      }}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                    >
                      {avatarFor(u, { w: 'w-10 h-10' })}
                      <div className="flex-1 text-left">
                        <p className="font-medium text-gray-900">{displayName(u)}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </div>
                      {u.isOnline && <span className="w-2 h-2 bg-emerald-500 rounded-full" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* New Chat Modal */}
            {newChatOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="bg-white rounded-2xl w-full max-w-md mx-4 shadow-xl">
                  <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900">New Conversation</h3>
                    <button onClick={() => setNewChatOpen(false)} className="p-1 rounded-lg hover:bg-gray-100">
                      <X size={18} />
                    </button>
                  </div>
                  <div className="p-4">
                    <div className="relative mb-4">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        autoFocus
                        value={newChatSearch}
                        onChange={(e) => handleNewChatSearch(e.target.value)}
                        placeholder="Search by name or email..."
                        className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2.5 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                      />
                    </div>
                    <div className="max-h-96 overflow-y-auto space-y-1">
                      {newChatSearching && (
                        <div className="text-center py-4">
                          <Loader2 size={20} className="animate-spin text-gray-400 mx-auto" />
                        </div>
                      )}
                      {!newChatSearching && newChatResults.length === 0 && newChatSearch.trim() && (
                        <div className="text-center py-8 text-gray-500 text-sm">No users found</div>
                      )}
                      {newChatResults.map((u) => (
                        <button
                          key={u.userId || u.id}
                          onClick={() => startNewChat(u)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                          {avatarFor(u, { w: 'w-10 h-10' })}
                          <div className="flex-1 text-left">
                            <p className="font-medium text-gray-900">{displayName(u)}</p>
                            <p className="text-xs text-gray-500">{u.role || 'User'}</p>
                          </div>
                          <button className="text-emerald-600 text-sm font-medium">Message</button>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
              {loadingConvs ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex gap-3 animate-pulse">
                      <div className="w-12 h-12 rounded-full bg-gray-200" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-gray-200 rounded w-2/3" />
                        <div className="h-2.5 bg-gray-200 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <MessageCircle size={28} className="text-gray-400" />
                  </div>
                  <p className="font-medium text-gray-700">No messages yet</p>
                  <p className="text-sm text-gray-400 mt-1">Start a conversation with someone</p>
                  <button
                    onClick={() => setNewChatOpen(true)}
                    className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700"
                  >
                    Send a message
                  </button>
                </div>
              ) : (
                conversations.map((conv) => {
                  const other = convOther(conv);
                  const isActive = (activeUser?.userId || activeUser?.id) === (other?.userId || other?.id);
                  const lastAt = conv.lastMessageAt ?? conv.LastMessageAt;
                  const unread = conv.unreadCount ?? conv.UnreadCount ?? 0;
                  
                  return (
                    <button
                      key={other?.userId || other?.id || conv.id}
                      onClick={() => openThread(other)}
                      className={`w-full flex items-center gap-3 p-3 transition-all ${
                        isActive ? 'bg-emerald-50/60 border-l-4 border-emerald-500' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="relative">
                        {avatarFor(other, { w: 'w-12 h-12' })}
                        {other.isOnline && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-gray-900 truncate">{displayName(other)}</p>
                          <span className="text-[10px] text-gray-400 shrink-0">
                            {lastAt ? timeAgo(lastAt) : ''}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 truncate mt-0.5">
                          {conv.lastMessage || conv.LastMessage || 'Start a conversation'}
                        </p>
                      </div>
                      {unread > 0 && (
                        <span className="min-w-[22px] h-[22px] px-1.5 bg-emerald-500 rounded-full text-white text-[11px] font-semibold flex items-center justify-center">
                          {unread}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col bg-white">
            {!activeUser ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8">
                <div className="w-24 h-24 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mb-6">
                  <MessageCircle size={44} className="text-emerald-500" strokeWidth={1.5} />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Messages</h2>
                <p className="text-gray-500 text-center max-w-md">
                  Select a conversation from the sidebar or start a new chat with someone
                </p>
                <button
                  onClick={() => setNewChatOpen(true)}
                  className="mt-6 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2"
                >
                  <UserPlus size={18} />
                  New Conversation
                </button>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-white">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {avatarFor(activeUser, { w: 'w-10 h-10' })}
                      {activeUser.isOnline && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white" />
                      )}
                    </div>
                    <div>
                      <button
                        onClick={() => navigate(`/profile/${activeUser.userId}`)}
                        className="font-semibold text-gray-900 hover:text-emerald-600 transition-colors"
                      >
                        {displayName(activeUser)}
                      </button>
                      <p className="text-xs text-gray-500">
                        {activeUser.isOnline ? 'Online' : `Last seen ${timeAgo(activeUser.lastSeen)}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="p-2 rounded-xl hover:bg-gray-100 transition-colors" title="Voice call">
                      <Phone size={18} className="text-gray-600" />
                    </button>
                    <button className="p-2 rounded-xl hover:bg-gray-100 transition-colors" title="Video call">
                      <Video size={18} className="text-gray-600" />
                    </button>
                    <div className="relative">
                      <button 
                        onClick={() => setShowChatMenu(!showChatMenu)}
                        className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                      >
                        <MoreVertical size={18} className="text-gray-600" />
                      </button>
                      {showChatMenu && (
                        <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-100 py-1 min-w-[180px] z-10">
                          <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                            <Archive size={14} /> Archive Chat
                          </button>
                          <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                            {muted ? <Bell size={14} /> : <BellOff size={14} />}
                            {muted ? 'Unmute' : 'Mute'} Notifications
                          </button>
                          <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600">
                            <Trash2 size={14} /> Delete Chat
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-gradient-to-b from-gray-50/30 to-white">
                  {loadingThread ? (
                    <div className="flex justify-center py-12">
                      <Loader2 size={28} className="animate-spin text-emerald-500" />
                    </div>
                  ) : activeThread.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                        <MessageCircle size={28} className="text-gray-400" />
                      </div>
                      <p className="text-gray-500">No messages yet</p>
                      <p className="text-sm text-gray-400 mt-1">Send a message to start the conversation</p>
                    </div>
                  ) : (
                    <>
                      {/* Date Divider */}
                      {activeThread.length > 0 && (
                        <div className="flex justify-center my-4">
                          <span className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-500">
                            {new Date(activeThread[0]?.sentAt).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
                          </span>
                        </div>
                      )}
                      
                      {activeThread.map((msg, idx) => {
                        const sid = msg.senderUserId ?? msg.SenderUserId;
                        const isOwn = Number(sid) === Number(myId);
                        const text = msg.messageText ?? msg.MessageText ?? '';
                        const at = msg.sentAt ?? msg.SentAt;
                        const mType = msg.messageType ?? msg.MessageType;
                        const sRole = msg.senderRole ?? msg.SenderRole;
                        const showAdminBadge = mType === 'AdminNotice' || sRole === 'Admin';
                        const mid = msg.materialId ?? msg.MaterialId;
                        const mTitle = msg.materialTitle ?? msg.MaterialTitle;
                        const mPrice = msg.materialUnitPrice ?? msg.MaterialUnitPrice;
                        const mUnit = msg.materialUnit ?? msg.MaterialUnit;
                        const mThumb = msg.materialPreviewImageUrl ?? msg.MaterialPreviewImageUrl;
                        const att = msg.attachmentUrl ?? msg.AttachmentUrl;
                        const thumbAbs = mThumb ? resolveMaterialAssetUrl(mThumb) : null;
                        const attAbs = att ? resolveUploadedFileUrl(att) : null;
                        const showListingCard = Boolean(mid || mTitle);
                        const showImageAttachment = Boolean(attAbs) && !(showListingCard && att === mThumb);
                        const isFirstOfGroup = idx === 0 || (new Date(at) - new Date(activeThread[idx-1]?.sentAt)) > 300000;
                        
                        return (
                          <div key={msg.messageId || msg.MessageId || msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${!isFirstOfGroup ? 'mt-1' : ''}`}>
                            {!isOwn && !isFirstOfGroup && <div className="w-10 shrink-0" />}
                            <div className={`max-w-[70%] ${!isOwn && isFirstOfGroup ? 'ml-2' : ''}`}>
                              {showAdminBadge && (
                                <span className="inline-block mb-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                                  Announcement
                                </span>
                              )}
                              <div className={`relative rounded-2xl px-3 py-2 shadow-sm ${
                                isOwn
                                  ? 'bg-emerald-600 text-white rounded-br-sm'
                                  : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                              } ${msg.isPending ? 'opacity-70' : ''}`}>
                                {showListingCard && (
                                  <Link to={`/marketplace/${mid}`} className="block mb-2 rounded-lg overflow-hidden bg-white/10">
                                    {thumbAbs && (
                                      <div className="aspect-[16/9] w-full">
                                        <img src={thumbAbs} alt="" className="w-full h-full object-cover" />
                                      </div>
                                    )}
                                    <div className="px-2 py-1.5">
                                      <p className={`text-xs font-semibold ${isOwn ? 'text-white' : 'text-gray-900'} line-clamp-2`}>
                                        {mTitle || 'Listing'}
                                      </p>
                                      {mPrice != null && (
                                        <p className={`text-[11px] font-medium ${isOwn ? 'text-emerald-200' : 'text-emerald-600'}`}>
                                          {formatRWF(mPrice)} {mUnit ? `/ ${mUnit}` : ''}
                                        </p>
                                      )}
                                    </div>
                                  </Link>
                                )}
                                {showImageAttachment && (
                                  <a href={attAbs} target="_blank" rel="noreferrer" className="block mb-2 rounded-lg overflow-hidden">
                                    <img src={attAbs} alt="" className="max-h-48 rounded-lg object-cover" />
                                  </a>
                                )}
                                {text && text !== '📷' && (
                                  <p className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${isOwn ? 'text-white' : 'text-gray-800'}`}>
                                    {text}
                                  </p>
                                )}
                                <div className={`flex items-center gap-1 mt-1 text-[10px] ${isOwn ? 'text-emerald-200' : 'text-gray-400'}`}>
                                  <span>{formatMessageTime(at)}</span>
                                  {isOwn && msg.isRead && <CheckCheck size={12} />}
                                  {isOwn && !msg.isRead && <Check size={12} />}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                  
                  {/* Typing Indicator */}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-2">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Reply Indicator */}
                {replyingTo && (
                  <div className="px-4 pt-2 border-t border-gray-100 bg-gray-50">
                    <div className="flex items-center justify-between text-sm bg-white rounded-lg p-2 border border-gray-200">
                      <div className="flex items-center gap-2">
                        <div className="w-0.5 h-8 bg-emerald-500 rounded-full" />
                        <div>
                          <p className="text-xs font-medium text-emerald-600">Replying to</p>
                          <p className="text-xs text-gray-600 truncate max-w-md">{replyingTo.messageText}</p>
                        </div>
                      </div>
                      <button onClick={() => setReplyingTo(null)} className="p-1 rounded-lg hover:bg-gray-100">
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Message Input Area */}
                {isAdminNoticeThread ? (
                  <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-center">
                    <p className="text-xs text-gray-500">This is an official announcement. Replies are disabled.</p>
                  </div>
                ) : (
                  <div className="relative p-4 border-t border-gray-100 bg-white">
                    {pendingAttachmentUrl && (
                      <div className="mb-3 flex items-center gap-2">
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                          <img src={resolveUploadedFileUrl(pendingAttachmentUrl)} alt="" className="w-full h-full object-cover" />
                        </div>
                        <button onClick={() => setPendingAttachmentUrl(null)} className="text-xs text-red-600 font-medium">
                          Remove
                        </button>
                      </div>
                    )}
                    
                    <div className="flex items-end gap-2">
                      <button
                        onClick={() => setShowEmoji(!showEmoji)}
                        className="p-2.5 rounded-xl hover:bg-gray-100 transition-colors text-gray-500 hover:text-emerald-600"
                        title="Add emoji"
                      >
                        <Smile size={20} />
                      </button>
                      
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePickChatImage} />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                        className="p-2.5 rounded-xl hover:bg-gray-100 transition-colors text-gray-500 hover:text-emerald-600 disabled:opacity-50"
                        title="Attach image"
                      >
                        {uploadingImage ? <Loader2 size={20} className="animate-spin" /> : <Image size={20} />}
                      </button>
                      
                      <textarea
                        value={messageText}
                        onChange={handleTyping}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        rows={1}
                        className="flex-1 min-h-[44px] max-h-32 py-2.5 px-4 text-sm text-gray-800 placeholder:text-gray-400 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-100 resize-none"
                      />
                      
                      <button
                        onClick={handleSend}
                        disabled={(!messageText.trim() && !pendingAttachmentUrl) || sending || uploadingImage}
                        className="p-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                      >
                        {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={18} />}
                      </button>
                    </div>
                    
                    {/* Emoji Picker */}
                    {showEmoji && (
                      <div className="absolute bottom-full left-0 z-30 mb-2">
                        <div className="relative shadow-xl rounded-xl overflow-hidden">
                          <EmojiPicker
                            onEmojiClick={(emojiData) => {
                              setMessageText((prev) => prev + emojiData.emoji);
                              setShowEmoji(false);
                            }}
                            autoFocusSearch={false}
                            theme="light"
                            width={350}
                            height={400}
                          />
                          <button
                            onClick={() => setShowEmoji(false)}
                            className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors z-10"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        reportedUserId={activeUser?.userId ?? activeUser?.id}
        reportedUserName={`${activeUser?.firstName ?? ''} ${activeUser?.lastName ?? ''}`.trim()}
        context="chat"
      />
    </div>
  );
}

/** Main export with dashboard layout */
export default function MessagesPage() {
  return (
    <RoleDashboardLayout>
      <MessagesChat />
    </RoleDashboardLayout>
  );
}