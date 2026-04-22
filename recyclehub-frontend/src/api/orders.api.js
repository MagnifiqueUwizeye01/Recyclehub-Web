import api from './axiosInstance';

export const getAllOrders = (params) => api.get('/orders', { params });
export const getOrders = (params) => api.get('/orders', { params });
export const getOrderById = (id) => api.get(`/orders/${id}`);
export const createOrder = (data) => api.post('/orders', data);
/** @deprecated Prefer confirmOrder / rejectOrder / ship — backend has no PUT /status */
export const updateOrderStatus = (id, data) => api.put(`/orders/${id}/status`, data);
export const confirmOrder = (id) => api.post(`/orders/${id}/confirm`);
export const rejectOrder = (id, note = '') => api.post(`/orders/${id}/reject`, { note });
export const shipOrder = (id) => api.post(`/orders/${id}/ship`);
export const deliverOrder = (id) => api.post(`/orders/${id}/deliver`);
export const getBuyerOrders = (params) => api.get('/orders/my', { params });
export const getSellerOrders = (params) => api.get('/orders/my', { params });
/** Backend: POST /orders/{id}/cancel with optional reason */
export const cancelOrder = (id, reason = '') => api.post(`/orders/${id}/cancel`, { reason });

/** Maps legacy UI statuses to real API routes (no PUT /status on backend). */
export async function applySellerOrderAction(orderId, status, sellerNote = '') {
  const id = typeof orderId === 'string' ? parseInt(orderId, 10) : orderId;
  if (status === 'Accepted') return confirmOrder(id);
  if (status === 'Rejected') return rejectOrder(id, sellerNote || 'Declined by seller');
  if (status === 'Shipped') return shipOrder(id);
  throw new Error(`Unsupported order action: ${status}`);
}
