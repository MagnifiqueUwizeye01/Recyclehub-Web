const TOKEN_KEY = 'rh_token';
const USER_KEY = 'rh_user';
const REMEMBER_FLAG = 'rh_session_remember';

/**
 * Read token: session first (current tab), then local (Remember me).
 */
export function getAuthToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getAuthTokenStorage() {
  try {
    if (sessionStorage.getItem(TOKEN_KEY)) return 'session';
    if (localStorage.getItem(TOKEN_KEY)) return 'local';
    return null;
  } catch {
    return null;
  }
}

/**
 * Legacy installs kept JWT only in localStorage. Move into sessionStorage once per tab
 * so closing the window ends the session — unless the user chose Remember me.
 */
export function migrateLegacyAuthToSessionStorage() {
  try {
    if (localStorage.getItem(REMEMBER_FLAG) === '1') return;
    if (sessionStorage.getItem('rh_legacy_auth_migrated') === '1') return;

    const locT = localStorage.getItem(TOKEN_KEY);
    const sessT = sessionStorage.getItem(TOKEN_KEY);
    if (locT && !sessT) {
      sessionStorage.setItem(TOKEN_KEY, locT);
      localStorage.removeItem(TOKEN_KEY);
    }
    const locU = localStorage.getItem(USER_KEY);
    const sessU = sessionStorage.getItem(USER_KEY);
    if (locU && !sessU) {
      sessionStorage.setItem(USER_KEY, locU);
      localStorage.removeItem(USER_KEY);
    }
    sessionStorage.setItem('rh_legacy_auth_migrated', '1');
  } catch {
    /* ignore */
  }
}

/**
 * @param {boolean} remember - if true, persist across browser restarts (localStorage).
 */
export function setAuthSession(token, user, remember = false) {
  try {
    if (remember) {
      localStorage.setItem(REMEMBER_FLAG, '1');
      localStorage.setItem(TOKEN_KEY, token);
      if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);
    } else {
      localStorage.removeItem(REMEMBER_FLAG);
      sessionStorage.setItem(TOKEN_KEY, token);
      if (user) sessionStorage.setItem(USER_KEY, JSON.stringify(user));
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  } catch {
    /* ignore */
  }
}

export function clearAuthSession() {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    sessionStorage.removeItem('rh_legacy_auth_migrated');
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(REMEMBER_FLAG);
  } catch {
    /* ignore */
  }
}

export function persistUserSnapshot(user) {
  if (!user) return;
  try {
    const json = JSON.stringify(user);
    const where = getAuthTokenStorage();
    if (where === 'local') localStorage.setItem(USER_KEY, json);
    else if (where === 'session') sessionStorage.setItem(USER_KEY, json);
  } catch {
    /* ignore */
  }
}
