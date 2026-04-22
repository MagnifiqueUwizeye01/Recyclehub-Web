import api from './axiosInstance';

/** `id` is buyer profile id (not user id). */
export const getBuyerProfileById = (id) => api.get(`/buyerprofiles/${id}`);

export const getBuyerProfile = () => api.get('/buyerprofiles/me');
export const getMyBuyerProfile = () => api.get('/buyerprofiles/me');

export const createBuyerProfile = (data) => api.post('/buyerprofiles', data);
export const updateBuyerProfile = (id, data) => api.put(`/buyerprofiles/${id}`, data);
export const updateMyBuyerProfile = (data) => api.put('/buyerprofiles/me', data);