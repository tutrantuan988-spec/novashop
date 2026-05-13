import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const WishlistContext = createContext(null);
const STORAGE_KEY = 'trongdinhstore:wishlist';

function readStorage() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeStorage(ids) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    /* no-op */
  }
}

export function WishlistProvider({ children }) {
  const [ids, setIds] = useState(() => readStorage());

  useEffect(() => {
    writeStorage(ids);
  }, [ids]);

  const isWishlisted = useCallback((productId) => {
    return ids.some((id) => String(id) === String(productId));
  }, [ids]);

  const toggleWishlist = useCallback((productId) => {
    const key = String(productId);
    setIds((current) => (
      current.some((id) => String(id) === key)
        ? current.filter((id) => String(id) !== key)
        : [...current, key]
    ));
  }, []);

  const removeWishlist = useCallback((productId) => {
    const key = String(productId);
    setIds((current) => current.filter((id) => String(id) !== key));
  }, []);

  const clearWishlist = useCallback(() => setIds([]), []);

  const value = useMemo(() => ({
    ids,
    count: ids.length,
    isWishlisted,
    toggleWishlist,
    removeWishlist,
    clearWishlist
  }), [ids, isWishlisted, toggleWishlist, removeWishlist, clearWishlist]);

  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  );
}

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
};
