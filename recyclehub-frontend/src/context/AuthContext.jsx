import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMe } from '../api/auth.api';
import {
  getAuthToken,
  setAuthSession,
  clearAuthSession,
  persistUserSnapshot,
  migrateLegacyAuthToSessionStorage,
} from '../utils/authStorage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => getAuthToken());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const role = user?.role || null;

  const applyInvalidSession = useCallback(() => {
    clearAuthSession();
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setLoading(false);
  }, []);

  const validateSession = useCallback(async ({ silent } = {}) => {
    const storedToken = getAuthToken();
    if (!storedToken) {
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }
    if (!silent) setLoading(true);
    setToken(storedToken);
    try {
      const u = await getMe();
      if (!u) {
        applyInvalidSession();
        return;
      }
      setUser(u);
      setIsAuthenticated(true);
      persistUserSnapshot(u);
    } catch {
      applyInvalidSession();
    } finally {
      if (!silent) setLoading(false);
    }
  }, [applyInvalidSession]);

  useEffect(() => {
    migrateLegacyAuthToSessionStorage();
    validateSession({ silent: false });
  }, [validateSession]);

  // Remember-me sessions (localStorage): sync logout across tabs.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.storageArea !== localStorage || e.key !== 'rh_token') return;
      if (e.newValue) return;
      if (getAuthToken()) return;
      applyInvalidSession();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [applyInvalidSession]);

  useEffect(() => {
    let t;
    const onVisibility = () => {
      if (document.visibilityState !== 'visible') return;
      if (!getAuthToken()) return;
      clearTimeout(t);
      t = setTimeout(() => {
        validateSession({ silent: true }).catch(() => applyInvalidSession());
      }, 300);
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearTimeout(t);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [validateSession, applyInvalidSession]);

  const login = useCallback((newToken, userData, options = {}) => {
    const remember = Boolean(options.remember);
    setAuthSession(newToken, userData, remember);
    setToken(newToken);
    setUser(userData);
    setIsAuthenticated(true);
    setLoading(false);
    getMe()
      .then((u) => {
        if (u) {
          setUser(u);
          persistUserSnapshot(u);
        }
      })
      .catch(() => {});
  }, []);

  const logout = useCallback(() => {
    clearAuthSession();
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setLoading(false);
    window.location.href = '/';
  }, []);

  const clearSession = useCallback(() => {
    clearAuthSession();
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setLoading(false);
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser((prev) => {
      const next = { ...prev, ...updatedUser };
      persistUserSnapshot(next);
      return next;
    });
  }, []);

  const refreshSession = useCallback(() => validateSession({ silent: true }), [validateSession]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        role,
        loading,
        login,
        logout,
        clearSession,
        updateUser,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
