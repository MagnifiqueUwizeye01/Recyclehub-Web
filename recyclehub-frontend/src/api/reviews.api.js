import api from './axiosInstance';

export const createReview = (data) => api.post('/reviews', data);
export const getSellerReviews = (userId, params) =>
  api.get(`/reviews/seller/${userId}`, { params });
export const getBuyerReviews = (userId, params) =>
  api.get(`/reviews/buyer/${userId}`, { params });
export const getAllReviews = (params) => api.get('/reviews', { params });
export const updateReviewVisibility = (id, data) =>
  api.put(`/reviews/${id}/visibility`, {
    status: data.status,
    hiddenReason: data.hiddenReason ?? null,
  });
export const deleteReview = (id) => api.delete(`/reviews/${id}`);
