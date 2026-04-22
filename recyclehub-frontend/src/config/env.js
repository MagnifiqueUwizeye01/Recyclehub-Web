/**
 * API base must match RecycleHub.API launchSettings (default http profile: port 5123).
 * Override with VITE_API_BASE_URL in .env.development
 */
const raw = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5123/api';

export const API_BASE_URL = raw.endsWith('/api') ? raw : `${raw.replace(/\/$/, '')}/api`;

export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

/** SignalR hub path matches RecycleHub.API AppConstants.NotificationHubPath */
export const SIGNALR_HUB_URL = `${API_ORIGIN}/notificationhub`;
