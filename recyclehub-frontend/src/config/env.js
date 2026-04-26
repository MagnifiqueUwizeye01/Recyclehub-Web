/**
 * Single place for API origin. Vite injects VITE_* from:
 * - .env.production → `vite build` (see repo .env.production for Azure API)
 * - .env.development / .env.local → `vite` dev (gitignored; see .env.development.example)
 */
const raw = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5123/api';

export const API_BASE_URL = raw.endsWith('/api') ? raw : `${raw.replace(/\/$/, '')}/api`;

export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

/** Matches RecycleHub.API AppConstants.NotificationHubPath */
export const SIGNALR_HUB_URL = `${API_ORIGIN}/notificationhub`;
