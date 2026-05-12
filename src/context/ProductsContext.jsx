import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { products as seedProducts } from '../data/products';
import { isFirebaseReady } from '../lib/firebase';
import { useAuth } from './AuthContext';
import {
  listProductsApi,
  createProductApi,
  updateProductApi,
  deleteProductApi
} from '../services/api';

const ProductsContext = createContext(null);
const STORAGE_KEY = 'novashop:products';

const readStorage = () => {
  if (typeof window === 'undefined') return seedProducts;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : seedProducts;
  } catch {
    return seedProducts;
  }
};

const writeStorage = (items) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.warn('Cannot persist products', error);
  }
};

const slugify = (text) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

function LocalProductsProvider({ children }) {
  const [items, setItems] = useState(() => readStorage());

  useEffect(() => { writeStorage(items); }, [items]);

  const addProduct = useCallback((data) => {
    setItems((current) => {
      const nextId = Math.max(0, ...current.map((p) => p.id)) + 1;
      const newProduct = {
        ...data,
        id: nextId,
        slug: slugify(data.name) + '-' + nextId,
        gallery: data.gallery && data.gallery.length ? data.gallery : [data.image],
        rating: data.rating || 4.5,
        reviewCount: data.reviewCount || 0,
        colors: data.colors || [],
        sizes: data.sizes || []
      };
      return [newProduct, ...current];
    });
  }, []);

  const updateProduct = useCallback((id, patch) => {
    setItems((current) => current.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }, []);

  const removeProduct = useCallback((id) => {
    setItems((current) => current.filter((p) => p.id !== id));
  }, []);

  const resetProducts = useCallback(() => setItems(seedProducts), []);

  const value = useMemo(
    () => ({ items, addProduct, updateProduct, removeProduct, resetProducts }),
    [items, addProduct, updateProduct, removeProduct, resetProducts]
  );

  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>;
}

function ApiProductsProvider({ children }) {
  const { user } = useAuth();
  const adminEmail = user?.email;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await listProductsApi();
        if (!cancelled) setItems(data.length ? data : seedProducts);
      } catch {
        if (!cancelled) setItems(seedProducts);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const addProduct = useCallback(async (data) => {
    const nextId = Math.max(0, ...items.map((p) => Number(p.id) || 0)) + 1;
    const product = {
      ...data,
      id: String(nextId),
      slug: slugify(data.name) + '-' + nextId,
      gallery: data.gallery && data.gallery.length ? data.gallery : [data.image],
      rating: data.rating || 4.5,
      reviewCount: data.reviewCount || 0,
      colors: data.colors || [],
      sizes: data.sizes || []
    };
    const saved = await createProductApi(product, adminEmail);
    setItems((current) => [saved, ...current]);
  }, [items, adminEmail]);

  const updateProduct = useCallback(async (id, patch) => {
    await updateProductApi(id, patch, adminEmail);
    setItems((current) => current.map((p) => (String(p.id) === String(id) ? { ...p, ...patch } : p)));
  }, [adminEmail]);

  const removeProduct = useCallback(async (id) => {
    await deleteProductApi(id, adminEmail);
    setItems((current) => current.filter((p) => String(p.id) !== String(id)));
  }, [adminEmail]);

  const resetProducts = useCallback(() => setItems(seedProducts), []);

  const value = useMemo(
    () => ({ items, addProduct, updateProduct, removeProduct, resetProducts, loading }),
    [items, addProduct, updateProduct, removeProduct, resetProducts, loading]
  );

  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>;
}

export function ProductsProvider({ children }) {
  if (isFirebaseReady()) {
    return <ApiProductsProvider>{children}</ApiProductsProvider>;
  }
  return <LocalProductsProvider>{children}</LocalProductsProvider>;
}

export const useProducts = () => {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error('useProducts must be used within ProductsProvider');
  return ctx;
};
