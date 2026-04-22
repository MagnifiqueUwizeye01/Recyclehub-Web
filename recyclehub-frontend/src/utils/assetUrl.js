import { API_ORIGIN } from '../config/env';

/**
 * Turns a stored path or URL into a browser-openable absolute URL on the API host.
 * - Full http(s) URLs pass through.
 * - Paths starting with / (e.g. /uploads/licenses/..) are prefixed with API_ORIGIN.
 * - Legacy bare filenames (no slash) map to /uploads/licenses/<name> (may 404 if never uploaded).
 */
export function resolveUploadedFileUrl(stored) {
  if (stored == null || stored === '') return null;
  const s = String(stored).trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith('/')) return `${API_ORIGIN}${s}`;
  return `${API_ORIGIN}/uploads/licenses/${encodeURIComponent(s)}`;
}

/**
 * Material listing images (wwwroot/uploads/materials/...) — same rules as uploads; bare filenames go to /uploads/materials/.
 */
export function resolveMaterialAssetUrl(stored) {
  if (stored == null || stored === '') return null;
  const s = String(stored).trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith('/')) return `${API_ORIGIN}${s}`;
  return `${API_ORIGIN}/uploads/materials/${encodeURIComponent(s)}`;
}

/** User profile/avatar URLs (wwwroot/uploads/profiles/). */
export function resolveProfileImageUrl(stored) {
  if (stored == null || stored === '') return null;
  const s = String(stored).trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith('/')) return `${API_ORIGIN}${s}`;
  return `${API_ORIGIN}/uploads/profiles/${encodeURIComponent(s)}`;
}
