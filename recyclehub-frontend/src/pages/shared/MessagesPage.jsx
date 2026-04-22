import { useEffect, useState, useRef, useCallback } from 'react';
import { useLocation, useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import RoleDashboardLayout from '../../layouts/RoleDashboardLayout';
import { searchUsers } from '../../api/users.api';
import {
  getConversations,
  getMessageThread,
  sendMessage,
  getMessageRecipients,
  sendAnnouncement,
  uploadChatImage,
} from '../../api/messages.api';
import { timeAgo } from '../../utils/formatDate';
import { formatRWF } from '../../utils/formatCurrency';
import { Send, Search, MessageCircle, Flag, Paperclip, Smile } from 'lucide-react';
import toast from 'react-hot-toast';
import ReportModal from '../../components/features/ReportModal';
import { resolveProfileImageUrl, resolveMaterialAssetUrl, resolveUploadedFileUrl } from '../../utils/assetUrl';

const QUICK_EMOJIS = ['😀', '😊', '👍', '🙏', '❤️', '🔥', '✅', '👋', '🎉', '💬', '📷', '🛒', '✨', '🙌', '😅', '🤝'];

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
  };
}

/** Inner chat UI — wrapped by dashboard layout in default export */
function MessagesChat() {
  const { user } = useAuth();
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
  const messagesEndRef = useRef(null);
  const pendingProductIntroRef = useRef(null);
  const fileInputRef = useRef(null);

  const myId = user?.userId ?? user?.id;

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
    try {
      const otherId = otherUser.userId || otherUser.id;
      const res = await getMessageThread(otherId);
      const raw = res.data?.data ?? res.data ?? [];
      const messages = Array.isArray(raw) ? [...raw].reverse() : [];
      setActiveThread(messages);
    } catch (err) {
      console.error('Failed to load thread:', err);
      setActiveThread([]);
      toast.error('Failed to load messages. Please try again.');
    } finally {
      setLoadingThread(false);
    }
  }, []);

  const openThreadByUserId = useCallback(
    async (userId) => {
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
    },
    [openThread]
  );

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

  /** Auto-send first message with listing context when opening chat from product or order. */
  useEffect(() => {
    const ctx = pendingProductIntroRef.current;
    if (!ctx?.materialId || !activeUser) return;
    const otherId = activeUser.userId ?? activeUser.id;
    if (Number(ctx.sellerUserId) !== Number(otherId)) return;

    const key = `rh_listing_intro_${ctx.materialId}_${otherId}`;
    if (sessionStorage.getItem(key)) {
      pendingProductIntroRef.current = null;
      return;
    }
    sessionStorage.setItem(key, '1');
    pendingProductIntroRef.current = null;

    let cancelled = false;
    (async () => {
      try {
        const line =
          ctx.title != null && String(ctx.title).trim()
            ? `Hi! I'm interested in "${String(ctx.title).trim()}". Could you share more details?`
            : "Hi! I'd like to know more about this listing.";
        await sendMessage({
          receiverUserId: otherId,
          messageText: line,
          materialId: ctx.materialId,
          messageType: 'General',
        });
        if (cancelled) return;
        await loadConversations();
        const res = await getMessageThread(otherId);
        const raw = res.data?.data ?? res.data ?? [];
        const messages = Array.isArray(raw) ? [...raw].reverse() : [];
        setActiveThread(messages);
      } catch (e) {
        console.error(e);
        toast.error('Could not attach the listing to your message.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeUser, loadConversations]);

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
    };
    setActiveThread((prev) => [...prev, newMsg]);
    setMessageText('');
    setShowEmoji(false);
    const attachmentToSend = pendingAttachmentUrl;
    setPendingAttachmentUrl(null);
    try {
      await sendMessage({
        receiverUserId: otherId,
        messageText: displayText,
        messageType: 'General',
        attachmentUrl: attachmentToSend || undefined,
      });
      await loadConversations();
    } catch {
      toast.error('Failed to send message. Please try again.');
      setActiveThread((prev) => prev.filter((m) => m.messageId !== newMsg.messageId && m.id !== newMsg.id));
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

  const isAdminNoticeThread =
    activeUser?.role === 'Admin' ||
    activeThread.some(
      (m) =>
        (m.messageType ?? m.MessageType) === 'AdminNotice' ||
        (m.senderRole ?? m.SenderRole) === 'Admin',
    );

  const profileLinkForActiveUser = () => {
    const uid = activeUser?.userId ?? activeUser?.id;
    const role = activeUser?.role;
    if (!uid || !role) return null;
    if (role === 'Seller') return `/sellers/${uid}`;
    return null;
  };

  const convOther = (conv) => {
    if (conv.otherUser) return conv.otherUser;
    return {
      userId: conv.otherUserId ?? conv.OtherUserId,
      id: conv.otherUserId ?? conv.OtherUserId,
      firstName: (conv.otherFullName ?? conv.OtherFullName ?? conv.otherUsername ?? '')
        .split(' ')[0],
      lastName: (conv.otherFullName ?? conv.OtherFullName ?? '')
        .split(' ')
        .slice(1)
        .join(' '),
      email: conv.otherEmail ?? '',
      role: conv.otherUserRole ?? conv.OtherUserRole ?? '',
      profileImageUrl: conv.otherAvatarUrl ?? conv.OtherAvatarUrl,
    };
  };

  const displayName = (u) =>
    [u?.firstName, u?.lastName].filter(Boolean).join(' ') || u?.username || 'User';

  const initials = (u) => {
    const a = (u?.firstName?.[0] || u?.username?.[0] || '?').toUpperCase();
    const b = (u?.lastName?.[0] || '').toUpperCase();
    return b ? `${a}${b}` : a;
  };

  const avatarFor = (u, { w = 'w-12 h-12', text = 'text-sm', light = false } = {}) => {
    const url = resolveProfileImageUrl(u?.profileImageUrl);
    if (url) {
      return (
        <div
          className={`${w} rounded-full overflow-hidden shrink-0 ring-2 ${
            light ? 'ring-white/40' : 'ring-black/5'
          } bg-[#dfe5e7]`}
        >
          <img src={url} alt="" className="w-full h-full object-cover" />
        </div>
      );
    }
    return (
      <div
        className={`${w} rounded-full flex items-center justify-center ${text} font-semibold shrink-0 ${
          light ? 'bg-white/20 text-white' : 'bg-[#dfe5e7] text-[#54656f]'
        }`}
      >
        {initials(u)}
      </div>
    );
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="flex h-[min(720px,calc(100vh-10rem))] min-h-[420px] rounded-xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.08)] border border-black/5 bg-[#f0f2f5]">
        {/* Left: chat list — WhatsApp-style */}
        <div className="w-full max-w-[340px] shrink-0 flex flex-col border-r border-black/6 bg-white">
          <div className="flex items-center justify-between gap-2 px-3 py-3 bg-[#008069] text-white shrink-0">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold leading-tight">Chats</h2>
              <p className="text-xs text-white/80 truncate">RecycleHub messages</p>
            </div>
            {user?.role === 'Admin' && (
              <button
                type="button"
                onClick={handleAnnouncement}
                className="text-xs font-semibold px-3 py-1.5 rounded-md bg-white/15 hover:bg-white/25 shrink-0"
              >
                Broadcast
              </button>
            )}
          </div>

          <div className="p-2 bg-[#f0f2f5] border-b border-black/5 shrink-0">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#54656f]" />
              <input
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search or start new chat"
                className="w-full rounded-lg bg-white border-0 pl-10 pr-3 py-2 text-sm text-[#111b21] placeholder:text-[#667781] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#008069]/30"
              />
            </div>
            {searchQuery.trim() && (
              <div className="mt-2 max-h-48 overflow-y-auto rounded-lg bg-white shadow-md border border-black/5 z-20">
                {searching && <div className="p-3 text-center text-xs text-[#667781]">Searching…</div>}
                {!searching && searchResults.length === 0 && (
                  <div className="p-3 text-center text-xs text-[#667781]">No contacts found</div>
                )}
                {searchResults.map((u) => (
                  <button
                    key={u.userId || u.id}
                    type="button"
                    onClick={() => {
                      openThread(u);
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#f0f2f5] transition-colors text-left border-b border-black/[0.04] last:border-0"
                  >
                    {avatarFor(u, { w: 'w-10 h-10', text: 'text-xs' })}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#111b21] truncate">{displayName(u)}</p>
                      <p className="text-xs text-[#667781] truncate">
                        {u.email} · {u.role}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto bg-white">
            {loadingConvs ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-12 h-12 rounded-full bg-[#f0f2f5]" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-3 bg-[#f0f2f5] rounded w-2/3" />
                      <div className="h-2.5 bg-[#f0f2f5] rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[200px] px-6 text-center">
                <MessageCircle size={48} className="text-[#c6d4d0] mb-3" strokeWidth={1.25} />
                <p className="text-sm font-medium text-[#41525d]">No chats yet</p>
                <p className="text-xs text-[#667781] mt-1 max-w-[220px]">
                  Search above to find people and start a conversation.
                </p>
              </div>
            ) : (
              conversations.map((conv) => {
                const other = convOther(conv);
                const isActive = (activeUser?.userId || activeUser?.id) === (other?.userId || other?.id);
                const lastAt = conv.lastMessageAt ?? conv.LastMessageAt;
                return (
                  <button
                    key={other?.userId || other?.id || conv.id}
                    type="button"
                    onClick={() => openThread(other)}
                    className={`w-full flex items-center gap-3 px-3 py-3 text-left border-b border-black/[0.06] transition-colors ${
                      isActive ? 'bg-[#f0f2f5]' : 'hover:bg-[#f5f6f6]'
                    }`}
                  >
                    {avatarFor(other)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[15px] font-medium text-[#111b21] truncate">{displayName(other)}</p>
                        <span className="text-[11px] text-[#667781] shrink-0">
                          {lastAt ? timeAgo(lastAt) : ''}
                        </span>
                      </div>
                      <p className="text-sm text-[#667781] truncate mt-0.5">
                        {conv.lastMessage || conv.LastMessage || 'Tap to chat'}
                      </p>
                    </div>
                    {(conv.unreadCount > 0 || conv.UnreadCount > 0) && (
                      <span className="min-w-[20px] h-5 px-1.5 bg-[#25d366] rounded-full text-white text-[11px] font-semibold flex items-center justify-center shrink-0">
                        {conv.unreadCount ?? conv.UnreadCount}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: active thread */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#efeae2]">
          {!activeUser ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8 border-l border-black/[0.06] bg-[#f8f9fa]">
              <div className="w-64 h-64 mb-6 opacity-90">
                <svg viewBox="0 0 303 172" className="w-full h-full text-[#c6d4d0]" aria-hidden>
                  <path
                    fill="currentColor"
                    d="M153.5 0C68.9 0 0 38.3 0 85.5S68.9 171 153.5 171 307 132.7 307 85.5 238.1 0 153.5 0zm0 156.2c-75.1 0-136-31.7-136-70.7s60.9-70.7 136-70.7 136 31.7 136 70.7-60.9 70.7-136 70.7z"
                  />
                </svg>
              </div>
              <p className="text-[28px] font-light text-[#41525d] tracking-tight">RecycleHub Web</p>
              <p className="text-sm text-[#667781] mt-2 max-w-md">
                Select a chat from the list or search for someone to start messaging.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 px-4 py-3 bg-[#008069] text-white shrink-0">
                {avatarFor(activeUser, { w: 'w-10 h-10', text: 'text-sm', light: true })}
                <div className="flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => {
                      const p = profileLinkForActiveUser();
                      if (p) navigate(p);
                    }}
                    className="font-medium text-[16px] text-left truncate w-full hover:underline disabled:opacity-70 disabled:no-underline"
                    disabled={!profileLinkForActiveUser()}
                  >
                    {displayName(activeUser)}
                  </button>
                  <p className="text-xs text-white/75 truncate">
                    {activeUser?.email || ' '}
                    {activeUser?.role ? ` · ${activeUser.role}` : ''}
                  </p>
                </div>
                {user?.role !== 'Admin' && (activeUser?.role === 'Buyer' || activeUser?.role === 'Seller') && (
                  <button
                    type="button"
                    title="Report"
                    onClick={() => setReportOpen(true)}
                    className="p-2 rounded-full hover:bg-white/10 text-white shrink-0"
                  >
                    <Flag size={18} />
                  </button>
                )}
              </div>

              <div
                className="flex-1 overflow-y-auto px-[5%] py-4 space-y-2 bg-[#efeae2]"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c6c3b9' fill-opacity='0.12'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
              >
                {loadingThread ? (
                  <div className="flex justify-center py-12">
                    <div className="w-9 h-9 border-2 border-[#008069] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : activeThread.length === 0 ? (
                  <div className="flex flex-col items-center justify-center min-h-[120px] text-center">
                    <p className="text-sm text-[#667781]">No messages yet. Say hello!</p>
                  </div>
                ) : (
                  activeThread.map((msg) => {
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
                    return (
                      <div
                        key={msg.messageId || msg.MessageId || msg.id}
                        className={`flex w-full ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] sm:max-w-[65%] rounded-lg px-2 py-1.5 shadow-sm ${
                            isOwn
                              ? 'bg-[#d9fdd3] text-[#111b21] rounded-br-none'
                              : 'bg-white text-[#111b21] rounded-bl-none'
                          } ${msg.isPending ? 'opacity-70' : ''}`}
                        >
                          {showAdminBadge && (
                            <span className="inline-block mb-1 text-[10px] font-semibold uppercase tracking-wide text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                              Admin
                            </span>
                          )}
                          {showListingCard && (
                            <Link
                              to={`/marketplace/${mid}`}
                              className="block mb-2 rounded-lg overflow-hidden border border-black/10 bg-[#f7f8f9] hover:bg-[#eef0f2] transition-colors text-left"
                            >
                              {thumbAbs && (
                                <div className="aspect-[16/10] w-full bg-black/5">
                                  <img src={thumbAbs} alt="" className="w-full h-full object-cover" />
                                </div>
                              )}
                              <div className="px-2.5 py-2 space-y-0.5">
                                <p className="text-[13px] font-semibold text-[#111b21] line-clamp-2">
                                  {mTitle || 'Listing'}
                                </p>
                                {mPrice != null && (
                                  <p className="text-[12px] text-[#008069] font-medium">
                                    {formatRWF(mPrice)}
                                    {mUnit ? ` / ${mUnit}` : ''}
                                  </p>
                                )}
                                <p className="text-[10px] text-[#667781]">Tap to view listing</p>
                              </div>
                            </Link>
                          )}
                          {showImageAttachment && (
                            <a href={attAbs} target="_blank" rel="noreferrer" className="block mb-2 rounded-lg overflow-hidden border border-black/8">
                              <img src={attAbs} alt="" className="max-h-56 w-full object-cover" />
                            </a>
                          )}
                          {text && text !== '📷' && (
                            <p className="text-[14.2px] leading-[1.4] whitespace-pre-wrap break-words">{text}</p>
                          )}
                          <p
                            className={`text-[11px] mt-1 text-right ${
                              isOwn ? 'text-[#667781]' : 'text-[#667781]'
                            }`}
                          >
                            {at ? timeAgo(at) : ''}
                            {isOwn && msg.isRead && ' · Read'}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {isAdminNoticeThread ? (
                <div className="px-4 py-3 bg-[#f0f2f5] border-t border-black/5 text-center">
                  <p className="text-xs text-[#667781]">
                    Official message from RecycleHub — replies are disabled.
                  </p>
                </div>
              ) : (
                <div className="px-3 py-2 bg-[#f0f2f5] border-t border-black/5 shrink-0 relative">
                  {showEmoji && (
                    <div className="absolute bottom-[calc(100%+4px)] left-3 right-3 z-30 rounded-xl border border-black/10 bg-white shadow-lg p-2 flex flex-wrap gap-1 max-h-36 overflow-y-auto">
                      {QUICK_EMOJIS.map((em) => (
                        <button
                          key={em}
                          type="button"
                          className="text-xl p-1.5 rounded-lg hover:bg-[#f0f2f5]"
                          onClick={() => {
                            setMessageText((t) => t + em);
                            setShowEmoji(false);
                          }}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  )}
                  {pendingAttachmentUrl && (
                    <div className="mb-2 flex items-center gap-2 px-1">
                      <div className="relative h-14 w-14 rounded-lg overflow-hidden border border-black/10">
                        <img
                          src={resolveUploadedFileUrl(pendingAttachmentUrl)}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        className="text-xs text-rose-600 font-medium"
                        onClick={() => setPendingAttachmentUrl(null)}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                  <div className="flex items-end gap-1 bg-white rounded-lg px-1 py-1 border border-black/[0.08]">
                    <button
                      type="button"
                      className="p-2 rounded-full text-[#54656f] hover:bg-[#f0f2f5] shrink-0"
                      aria-label="Emoji"
                      onClick={() => setShowEmoji((s) => !s)}
                    >
                      <Smile size={20} />
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePickChatImage} />
                    <button
                      type="button"
                      className="p-2 rounded-full text-[#54656f] hover:bg-[#f0f2f5] shrink-0 disabled:opacity-40"
                      aria-label="Photo"
                      disabled={uploadingImage}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Paperclip size={20} />
                    </button>
                    <textarea
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="Type a message"
                      rows={1}
                      className="flex-1 min-h-[44px] max-h-32 py-2.5 px-2 text-[15px] text-[#111b21] placeholder:text-[#8696a0] bg-transparent focus:outline-none resize-y"
                    />
                    <button
                      type="button"
                      onClick={handleSend}
                      disabled={(!messageText.trim() && !pendingAttachmentUrl) || sending || uploadingImage}
                      className="mb-0.5 p-2 rounded-full bg-[#008069] hover:bg-[#006b5a] disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors shrink-0"
                      aria-label="Send"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
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

/** Keeps seller/buyer/admin sidebar visible — same shell as other dashboard pages */
export default function MessagesPage() {
  return (
    <RoleDashboardLayout>
      <MessagesChat />
    </RoleDashboardLayout>
  );
}
