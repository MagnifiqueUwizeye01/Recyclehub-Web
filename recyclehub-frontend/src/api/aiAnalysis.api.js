import api from './axiosInstance';

export const analyzeMaterial = (formData) =>
  api.post('/aianalysisresults/analyze', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const getAnalysisResult = (materialId) => api.get(`/aianalysisresults/${materialId}`);
export const getAnalysisHistory = (userId) => api.get(`/aianalysisresults/history/${userId}`);
