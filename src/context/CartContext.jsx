import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { syncCartApi, markCartCheckedOutApi } from '../services/api';

const CartContext = createContext(null);
const STORAGE_KEY = 'trongdinhstore:cart';
const SYNC_DEBOUNCE_MS = 2000;

const readStorage = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.warn('Cannot read cart from storage', error);
    return [];
  }
};

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => readStorage());
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const syncTimerRef = useRef(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.warn('Cannot persist cart', error);
    }
  }, [items]);

  // Auto-sync lên Firestore khi user đã login (debounced 2s, P6 abandoned cart)
  useEffect(() => {
    if (!isAuthenticated || !user?.email) return;
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      const userId = user.id || user.email;
      syncCartApi(userId, user.email, items).catch(() => {
        // Silent — abandoned cart tracking là feature optional
      });
    }, SYNC_DEBOUNCE_MS);
    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [items, isAuthenticated, user?.email, user?.id]);

  /**
   * Build composite key cho cart line — distinguish cùng product nhưng khác variant
   * @param {string} productId
   * @param {string|null} variantId
   */
  const lineKey = (productId, variantId) => `${productId}::${variantId || ''}`;

  /**
   * Add item vào giỏ. Hỗ trợ variant.
   * @param {object} product - { id, slug, name, price, image }
   * @param {number} quantity
   * @param {object|null} variant - { id, sku, attributes, price, images, stock }
   */
  const addToCart = useCallback((product, quantity = 1, variant = null) => {
    const variantId = variant?.id || null;
    const key = lineKey(product.id, variantId);
    const finalPrice = variant?.price ?? product.price;
    const finalImage = (variant?.images && variant.images[0]) || product.image;

    setItems((current) => {
      const existing = current.find((item) => lineKey(item.id, item.variantId) === key);
      if (existing) {
        return current.map((item) =>
          lineKey(item.id, item.variantId) === key
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [
        ...current,
        {
          id: product.id,
          variantId,
          slug: product.slug,
          name: product.name,
          price: finalPrice,
          image: finalImage,
          quantity,
          // Snapshot tại thời điểm add — dùng cho hiển thị nếu product/variant thay đổi sau này
          snapshot: {
            productName: product.name,
            variantName: variant
              ? Object.entries(variant.attributes || {})
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(', ')
              : null,
            sku: variant?.sku || null,
            priceAtAdd: finalPrice,
            imageAtAdd: finalImage,
            addedAt: new Date().toISOString()
          }
        }
      ];
    });
    setIsOpen(true);
  }, []);

  const updateQuantity = useCallback((id, change, variantId = null) => {
    const key = lineKey(id, variantId);
    setItems((current) =>
      current
        .map((item) =>
          lineKey(item.id, item.variantId) === key
            ? { ...item, quantity: item.quantity + change }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }, []);

  const removeItem = useCallback((id, variantId = null) => {
    const key = lineKey(id, variantId);
    setItems((current) => current.filter((item) => lineKey(item.id, item.variantId) !== key));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    // Đánh dấu cart đã checkout trên Firestore (P6) — tránh job gửi reminder
    if (isAuthenticated && user?.email) {
      const userId = user.id || user.email;
      markCartCheckedOutApi(userId).catch(() => {});
    }
  }, [isAuthenticated, user?.email, user?.id]);

  const value = useMemo(() => {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return {
      items,
      totalItems,
      subtotal,
      isOpen,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      addToCart,
      updateQuantity,
      removeItem,
      clearCart
    };
  }, [items, isOpen, addToCart, updateQuantity, removeItem, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
