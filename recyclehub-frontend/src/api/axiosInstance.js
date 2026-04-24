import axios from 'axios';
import { API_BASE_URL } from '../config/env';
import { getAuthToken, clearAuthSession } from '../utils/authStorage';

const api = axios.create({
  baseURL: API_BASE_URL || 'http://localhost:5123/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (config.data instanceof FormData && config.headers) {
    if (typeof config.headers.delete === 'function') {
      config.headers.delete('Content-Type');
    } else {
      delete config.headers['Content-Type'];
    }
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const path = err.config?.url || '';
      const isAuthAttempt =
        path.includes('/auth/login') ||
        path.includes('/auth/register') ||
        path.includes('/auth/refresh');
      const isSessionProbe = path.includes('/auth/me');
      if (!isAuthAttempt && !isSessionProbe) {
        clearAuthSession();
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  },
);

export default api;
