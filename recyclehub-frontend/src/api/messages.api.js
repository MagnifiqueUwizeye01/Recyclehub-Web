import api from './axiosInstance';
import { unwrapApiPayload } from '../utils/authMapper';

export const getConversations = () => api.get('/messages/conversations');

/** Upload a chat image; returns relative URL (e.g. /uploads/messages/...). */
export const uploadChatImage = async (file) => {
  const form = new FormData();
  form.append('file', file);
  const res = await api.post('/messages/upload-image', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return unwrapApiPayload(res);
};

export const getMessageThread = (otherUserId, params = {}) =>
  api.get('/messages/thread', { params: { otherUserId, ...params } });

/** @deprecated use getMessageThread */
export const getMessages = ({ otherUserId, page = 1, pageSize = 50 }) =>
  getMessageThread(otherUserId, { page, pageSize });

export const sendMessage = (data) =>
  api.post('/messages', {
    receiverUserId: data.receiverUserId,
    messageText: data.messageText,
    messageType: data.messageType ?? 'General',
    orderId: data.orderId ?? undefined,
    materialId: data.materialId ?? undefined,
    attachmentUrl: data.attachmentUrl ?? undefined,
  });

export const sendAnnouncement = (messageText) =>
  api.post('/messages/announcement', { messageText });

export const markMessageRead = (id) => api.put(`/messages/${id}/read`);

export const getUnreadCount = () => api.get('/messages/unread-count');

export const getMessageRecipients = (params) =>
  api.get('/messages/recipients', { params });
