import api from './axiosInstance';
import { unwrapApiPayload } from '../utils/authMapper';

export const initiatePayment = async (data) => {
  const res = await api.post('/payments/initiate', data);
  return unwrapApiPayload(res);
};

export const getPaymentByOrder = async (orderId) => {
  const res = await api.get(`/payments/order/${orderId}`);
  return unwrapApiPayload(res);
};

export const getPaymentById = async (paymentId) => {
  const res = await api.get(`/payments/${paymentId}`);
  return unwrapApiPayload(res);
};

export const checkPaymentStatus = (paymentId) => api.get(`/payments/${paymentId}/status`);

export const getAllPayments = (params) => api.get('/payments', { params });
