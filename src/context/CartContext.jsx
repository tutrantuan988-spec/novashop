import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);
const STORAGE_KEY = 'trongdinhstore:cart';

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

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.warn('Cannot persist cart', error);
    }
  }, [items]);

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

  const clearCart = useCallback(() => setItems([]), []);

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
