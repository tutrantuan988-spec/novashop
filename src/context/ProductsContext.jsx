import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { isBackendConfigured } from '../services/api';
import { isV2ApiConfigured, fetchProducts, createProductV2, updateProductV2, deleteProductV2 } from '../services/apiV2';
import { useAuth } from './AuthContext';
import {
  listProductsApi,
  createProductApi,
  updateProductApi,
  deleteProductApi
} from '../services/api';

const ProductsContext = createContext(null);
const STORAGE_KEY = 'trongdinhstore:products';

const EMPTY_PRODUCTS = [];

const readStorage = () => {
  if (typeof window === 'undefined') return EMPTY_PRODUCTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : EMPTY_PRODUCTS;
  } catch {
    return EMPTY_PRODUCTS;
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

  const resetProducts = useCallback(() => setItems(EMPTY_PRODUCTS), []);

  const value = useMemo(
    () => ({ items, addProduct, updateProduct, removeProduct, resetProducts, loading: false }),
    [items, addProduct, updateProduct, removeProduct, resetProducts]
  );

  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>;
}

function ApiProductsProvider({ children }) {
  const { user } = useAuth();
  const adminEmail = user?.email;
  const queryClient = useQueryClient();
  const productQuery = useQuery({
    queryKey: ['products'],
    queryFn: listProductsApi
  });
  const items = useMemo(() => {
    const data = Array.isArray(productQuery.data) ? productQuery.data : [];
    return data.length ? data : EMPTY_PRODUCTS;
  }, [productQuery.data]);
  const loading = productQuery.isLoading;

  const addProduct = useCallback(async (data) => {
    const product = {
      ...data,
      slug: data.slug || `${slugify(data.name)}-${Date.now()}`,
      gallery: data.gallery && data.gallery.length ? data.gallery : [data.image],
      rating: data.rating || 4.5,
      reviewCount: data.reviewCount || 0,
      colors: data.colors || [],
      sizes: data.sizes || []
    };
    const saved = await createProductApi(product, adminEmail);
    queryClient.setQueryData(['products'], (current = []) => [saved, ...(Array.isArray(current) ? current : [])]);
    return saved;
  }, [adminEmail, queryClient]);

  const updateProduct = useCallback(async (id, patch) => {
    await updateProductApi(id, patch, adminEmail);
    queryClient.setQueryData(['products'], (current = []) =>
      (Array.isArray(current) ? current : []).map((p) => (String(p.id) === String(id) ? { ...p, ...patch } : p))
    );
  }, [adminEmail, queryClient]);

  const removeProduct = useCallback(async (id) => {
    await deleteProductApi(id, adminEmail);
    queryClient.setQueryData(['products'], (current = []) =>
      (Array.isArray(current) ? current : []).filter((p) => String(p.id) !== String(id))
    );
  }, [adminEmail, queryClient]);

  const resetProducts = useCallback(() => queryClient.invalidateQueries({ queryKey: ['products'] }), [queryClient]);

  const value = useMemo(
    () => ({ items, addProduct, updateProduct, removeProduct, resetProducts, loading }),
    [items, addProduct, updateProduct, removeProduct, resetProducts, loading]
  );

  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>;
}

/**
 * V2ProductsProvider — fetches products from PostgreSQL /api/v2 endpoints.
 * Transforms PG data format to frontend-expected shape.
 * Falls back to seed data if API is unreachable.
 */
function V2ProductsProvider({ children }) {
  const [items, setItems] = useState(() => EMPTY_PRODUCTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchProducts()
      .then((transformed) => {
        if (!cancelled) {
          setItems(transformed.length > 0 ? transformed : EMPTY_PRODUCTS);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setItems(EMPTY_PRODUCTS);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, []);

  const addProduct = useCallback(async (data) => {
    try {
      const saved = await createProductV2(data);
      setItems((current) => [saved, ...current]);
      return saved;
    } catch {
      // Fallback to local state
      setItems((current) => {
        const nextId = `local-${Date.now()}`;
        const newProduct = {
          ...data,
          id: nextId,
          slug: slugify(data.name) + '-' + nextId,
          gallery: data.gallery || [data.image],
          rating: data.rating || 4.5,
          reviewCount: data.reviewCount || 0,
          colors: data.colors || [],
          sizes: data.sizes || []
        };
        return [newProduct, ...current];
      });
    }
  }, []);

  const updateProduct = useCallback(async (id, patch) => {
    try {
      await updateProductV2(id, patch);
      setItems((current) => current.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    } catch {
      // Fallback to local state update
      setItems((current) => current.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    }
  }, []);

  const removeProduct = useCallback(async (id) => {
    try {
      await deleteProductV2(id);
      setItems((current) => current.filter((p) => p.id !== id));
    } catch {
      // Fallback to local filter
      setItems((current) => current.filter((p) => p.id !== id));
    }
  }, []);

  const resetProducts = useCallback(() => {
    setLoading(true);
    fetchProducts()
      .then((transformed) => setItems(transformed.length > 0 ? transformed : EMPTY_PRODUCTS))
      .catch(() => setItems(EMPTY_PRODUCTS))
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(
    () => ({ items, addProduct, updateProduct, removeProduct, resetProducts, loading }),
    [items, addProduct, updateProduct, removeProduct, resetProducts, loading]
  );

  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>;
}

export function ProductsProvider({ children }) {
  // Check if both backend and PostgreSQL v2 are configured
  const useV2 = isBackendConfigured() && isV2ApiConfigured();

  if (useV2) {
    return <V2ProductsProvider>{children}</V2ProductsProvider>;
  }

  if (isBackendConfigured()) {
    return <ApiProductsProvider>{children}</ApiProductsProvider>;
  }
  return <LocalProductsProvider>{children}</LocalProductsProvider>;
}

export const useProducts = () => {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error('useProducts must be used within ProductsProvider');
  return ctx;
};
