import axios from 'axios';
import { API_BASE_URL } from '../config/env';

const api = axios.create({
  baseURL: API_BASE_URL || 'http://localhost:5123/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('rh_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  // FormData: must not send application/json or a manual multipart boundary — browser sets Content-Type + boundary.
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
      if (!isAuthAttempt) {
        localStorage.removeItem('rh_token');
        localStorage.removeItem('rh_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
