import api from './axiosInstance';
import { unwrapApiPayload } from '../utils/authMapper';

export const getPublicSellerProfile = async (userId) => {
  const res = await api.get(`/sellerprofiles/public/${userId}`);
  return unwrapApiPayload(res);
};

export const submitCertificateRequest = (userId, formData) =>
  api.post(`/sellerprofiles/${userId}/certificate-request`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const getCertificateRequests = (params) => api.get('/certificate-requests', { params });

export const approveCertificateRequest = (userId, requestId) =>
  api.put(`/sellerprofiles/${userId}/certificate-request/${requestId}/approve`);

export const rejectCertificateRequest = (userId, requestId, body) =>
  api.put(`/sellerprofiles/${userId}/certificate-request/${requestId}/reject`, body ?? {});

export const getSellerProfiles = (params) => api.get('/sellerprofiles', { params });

/** `id` is seller profile id (not user id). */
export const getSellerProfileById = (id) => api.get(`/sellerprofiles/${id}`);

export const getSellerProfile = () => api.get('/sellerprofiles/me');
export const getMySellerProfile = () => api.get('/sellerprofiles/me');

export const createSellerProfile = (data) => api.post('/sellerprofiles', data);
export const updateSellerProfile = (id, data) => api.put(`/sellerprofiles/${id}`, data);
export const updateMySellerProfile = (data) => api.put('/sellerprofiles/me', data);

export const verifySellerProfile = (userId, data) =>
  api.post(`/sellerprofiles/${userId}/verify`, {
    verificationStatus: data.verificationStatus ?? data.status,
    verificationNote: data.verificationNote ?? data.note ?? '',
  });

export const getSellerStats = (id) => api.get(`/sellerprofiles/${id}/stats`);
