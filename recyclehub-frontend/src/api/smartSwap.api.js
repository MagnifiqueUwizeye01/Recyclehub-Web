import api from './axiosInstance';

export const getMatchesForMaterial = (materialId) => api.get(`/smartswapmatches/${materialId}`);
export const generateMatches = (data) => api.post('/smartswapmatches/generate', data);
export const respondToMatch = (matchId, data) => api.put(`/smartswapmatches/${matchId}/respond`, data);
export const getBuyerMatches = () => api.get('/smartswapmatches/my');
export const getSellerMatches = () => api.get('/smartswapmatches/my');
