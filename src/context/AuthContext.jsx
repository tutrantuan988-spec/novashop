import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';

const AuthContext = createContext(null);
const USER_KEY = 'trongdinhstore:user';
const USERS_KEY = 'trongdinhstore:users';
const isAdminEmail = (email) => {
  const admins = (import.meta.env.VITE_ADMIN_EMAILS || 'admin@example.com')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(String(email || '').toLowerCase());
};

const readJson = (key, fallback) => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key, value) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('Cannot persist', key, error);
  }
};

// Web Crypto API: hash password using SHA-256
const hashPassword = async (password) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
};

const verifyPassword = async (password, hash) => {
  const hashed = await hashPassword(password);
  return hashed === hash;
};

function LocalAuthProvider({ children }) {
  const [user, setUser] = useState(() => readJson(USER_KEY, null));
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (user) writeJson(USER_KEY, user);
    else window.localStorage.removeItem(USER_KEY);
  }, [user]);

  const register = useCallback(async ({ name, email, password }) => {
    const users = readJson(USERS_KEY, []);
    if (users.find((u) => u.email === email)) {
      throw new Error('Email đã được đăng ký');
    }
    const hashedPassword = await hashPassword(password);
    const newUser = { name, email, password: hashedPassword, role: isAdminEmail(email) ? 'admin' : 'user' };
    writeJson(USERS_KEY, [...users, newUser]);
    setUser({ name, email, role: newUser.role });
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const users = readJson(USERS_KEY, []);
    const found = users.find((u) => u.email === email);
    if (!found) throw new Error('Email hoặc mật khẩu không đúng');
    const valid = await verifyPassword(password, found.password);
    if (!valid) throw new Error('Email hoặc mật khẩu không đúng');
    setUser({ name: found.name, email: found.email, role: found.role });
  }, []);

  const loginSocial = useCallback(({ id, name, email, avatar, provider }) => {
    const socialUser = { id, name, email: email || `${id}@${provider}.social`, avatar, role: isAdminEmail(email) ? 'admin' : 'user', provider };
    setUser(socialUser);
  }, []);

  const logout = useCallback(() => setUser(null), []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin',
      authLoading: false,
      isModalOpen,
      openAuthModal: () => setIsModalOpen(true),
      closeAuthModal: () => setIsModalOpen(false),
      register,
      login,
      loginSocial,
      logout,
      authMode: 'local'
    }),
    [user, isModalOpen, register, login, loginSocial, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function ClerkAuthProvider({ children }) {
  const { user: clerkUser, isLoaded } = useUser();
  const { signOut, openSignIn } = useClerk();

  const user = useMemo(() => {
    if (!clerkUser) return null;
    const email = clerkUser.primaryEmailAddress?.emailAddress || '';
    return {
      name: clerkUser.fullName || clerkUser.firstName || email.split('@')[0] || 'User',
      email,
      role: clerkUser.publicMetadata?.role || (isAdminEmail(email) ? 'admin' : 'user')
    };
  }, [clerkUser]);

  const openAuthModal = useCallback(() => {
    openSignIn();
  }, [openSignIn]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!clerkUser,
      isAdmin: user?.role === 'admin',
      authLoading: !isLoaded,
      isModalOpen: false,
      openAuthModal,
      closeAuthModal: () => {},
      register: null,
      login: null,
      logout: signOut,
      authMode: 'clerk'
    }),
    [user, clerkUser, isLoaded, openAuthModal, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children }) {
  const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  if (clerkKey && clerkKey.startsWith('pk_')) {
    return <ClerkAuthProvider>{children}</ClerkAuthProvider>;
  }
  return <LocalAuthProvider>{children}</LocalAuthProvider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
