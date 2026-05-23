import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  registerApi,
  loginApi,
  getMeApi,
  getAuthToken,
  setAuthToken,
  clearAuthToken,
  loginWithGoogleApi
} from '../services/api';
import { signInWithGoogle, getRedirectResult, onAuthChange, logoutFirebase } from '../lib/firebaseAuth';

const AuthContext = createContext(null);
const USER_KEY = 'novashop:user';

const isAdminEmail = (email) => {
  const admins = (import.meta.env.VITE_ADMIN_EMAILS || 'admin@example.com')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(String(email || '').toLowerCase());
};

function PgAuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(USER_KEY) : null;
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [authLoading, setAuthLoading] = useState(!user);

  // Restore auth on mount via JWT token
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setAuthLoading(false);
      window.localStorage.removeItem(USER_KEY);
      return;
    }

    let cancelled = false;
    getMeApi()
      .then((userData) => {
        if (cancelled) return;
        const userObj = {
          id: userData.id,
          email: userData.email,
          full_name: userData.full_name,
          name: userData.full_name || userData.email.split('@')[0],
          role: userData.role,
          photoURL: userData.photo_url || userData.photoURL || ''
        };
        setUser(userObj);
        window.localStorage.setItem(USER_KEY, JSON.stringify(userObj));
      })
      .catch(() => {
        clearAuthToken();
        window.localStorage.removeItem(USER_KEY);
        setUser(null);
      })
      .finally(() => {
        if (!cancelled) setAuthLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  // Listen for Firebase auth state changes (Google Sign-In redirect)
  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser && firebaseUser.idToken) {
        try {
          const result = await loginWithGoogleApi(firebaseUser.idToken);
          setAuthToken(result.token);
          const userObj = {
            id: result.user.id,
            email: result.user.email,
            full_name: result.user.full_name,
            name: result.user.full_name || result.user.email.split('@')[0],
            role: result.user.role,
            photoURL: result.user.photo_url || firebaseUser.photoURL || ''
          };
          setUser(userObj);
          window.localStorage.setItem(USER_KEY, JSON.stringify(userObj));
        } catch (err) {
          console.error('Google login exchange failed:', err);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Handle redirect result (popup blocked fallback)
  useEffect(() => {
    getRedirectResult().then(async (result) => {
      if (result && result.idToken) {
        try {
          const apiResult = await loginWithGoogleApi(result.idToken);
          setAuthToken(apiResult.token);
          const userObj = {
            id: apiResult.user.id,
            email: apiResult.user.email,
            full_name: apiResult.user.full_name,
            name: apiResult.user.full_name || apiResult.user.email.split('@')[0],
            role: apiResult.user.role,
            photoURL: apiResult.user.photo_url || result.photoURL || ''
          };
          setUser(userObj);
          window.localStorage.setItem(USER_KEY, JSON.stringify(userObj));
        } catch (err) {
          console.error('Google redirect login failed:', err);
        }
      }
    });
  }, []);

  const register = useCallback(async ({ name, email, password }) => {
    const result = await registerApi({ email, password, full_name: name });
    setAuthToken(result.token);
    const userObj = {
      id: result.user.id,
      email: result.user.email,
      full_name: result.user.full_name,
      name: result.user.full_name || result.user.email.split('@')[0],
      role: result.user.role
    };
    setUser(userObj);
    window.localStorage.setItem(USER_KEY, JSON.stringify(userObj));
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const result = await loginApi({ email, password });
    setAuthToken(result.token);
    const userObj = {
      id: result.user.id,
      email: result.user.email,
      full_name: result.user.full_name,
      name: result.user.full_name || result.user.email.split('@')[0],
      role: result.user.role
    };
    setUser(userObj);
    window.localStorage.setItem(USER_KEY, JSON.stringify(userObj));
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const firebaseUser = await signInWithGoogle();
    if (!firebaseUser) return null; // redirect flow

    if (!firebaseUser.idToken) {
      throw new Error('Không lấy được Google idToken, vui lòng thử lại.');
    }

    const result = await loginWithGoogleApi(firebaseUser.idToken);
    setAuthToken(result.token);
    const userObj = {
      id: result.user.id,
      email: result.user.email,
      full_name: result.user.full_name,
      name: result.user.full_name || result.user.email.split('@')[0],
      role: result.user.role,
      photoURL: result.user.photo_url || firebaseUser.photoURL || ''
    };
    setUser(userObj);
    window.localStorage.setItem(USER_KEY, JSON.stringify(userObj));
    return userObj;
  }, []);

  const logout = useCallback(async () => {
    try { await logoutFirebase(); } catch {}
    clearAuthToken();
    window.localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const openAuthModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin' || isAdminEmail(user?.email),
      authLoading,
      isModalOpen,
      openAuthModal,
      closeAuthModal,
      register,
      login,
      loginWithGoogle,
      logout,
      authMode: 'pg'
    }),
    [user, authLoading, isModalOpen, openAuthModal, closeAuthModal, register, login, loginWithGoogle, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children }) {
  return <PgAuthProvider>{children}</PgAuthProvider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
