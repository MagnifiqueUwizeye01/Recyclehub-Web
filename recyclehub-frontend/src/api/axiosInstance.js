import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config/env';
import { getAuthToken, clearAuthSession } from '../utils/authStorage';

const api = axios.create({
  baseURL: API_BASE_URL,
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
    const status = err.response?.status;
    const path = err.config?.url || '';

    if (status === 401) {
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

    // No HTTP response: offline, DNS, or browser blocked the request (often CORS preflight).
    if (!err.response && err.code !== 'ERR_CANCELED') {
      toast.error('Cannot reach the API. Check your connection, or CORS on the server.', {
        id: 'recyclehub-api-network',
      });
    }

    return Promise.reject(err);
  },
);

export default api;
