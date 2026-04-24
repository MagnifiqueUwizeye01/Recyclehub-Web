import api from './axiosInstance';

export const createReport = (body) => api.post('/reports', body);

export const getReports = (params) => api.get('/reports', { params });

export const getMyReports = (params) => api.get('/reports/my', { params });

export const getReportPendingCount = () => api.get('/reports/pending-count');

export const getReportById = (id) => api.get(`/reports/${id}`);

export const updateReportStatus = (id, status) =>
  api.put(`/reports/${id}/status`, { status });
