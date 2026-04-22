import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMe } from '../api/auth.api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('rh_token'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const role = user?.role || null;

  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem('rh_token');
      if (!storedToken) {
        setLoading(false);
        setIsAuthenticated(false);
        return;
      }
      try {
        const u = await getMe();
        setUser(u);
        setIsAuthenticated(true);
      } catch {
        localStorage.removeItem('rh_token');
        localStorage.removeItem('rh_user');
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []);

  const login = useCallback((newToken, userData) => {
    localStorage.setItem('rh_token', newToken);
    if (userData) {
      try {
        localStorage.setItem('rh_user', JSON.stringify(userData));
      } catch {
        /* ignore */
      }
    }
    setToken(newToken);
    setUser(userData);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('rh_token');
    localStorage.removeItem('rh_user');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    window.location.href = '/';
  }, []);

  /** Clears stored session without navigating (e.g. public homepage should show logged-out UI). */
  const clearSession = useCallback(() => {
    localStorage.removeItem('rh_token');
    localStorage.removeItem('rh_user');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser((prev) => ({ ...prev, ...updatedUser }));
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, token, isAuthenticated, role, loading, login, logout, clearSession, updateUser }}
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
