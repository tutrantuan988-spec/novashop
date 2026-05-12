import {
  collection,
  getDocs,
  addDoc,
  setDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { db, isFirebaseReady } from '../lib/firebase';

const PRODUCTS_COLLECTION = 'products';
const ORDERS_COLLECTION = 'orders';

export async function getProducts() {
  if (!isFirebaseReady()) return [];
  const snapshot = await getDocs(
    query(collection(db, PRODUCTS_COLLECTION), orderBy('createdAt', 'desc'))
  );
  return snapshot.docs.map((d) => ({ id: Number(d.id) || d.id, ...d.data() }));
}

export async function seedProductsFirestore(seedProducts) {
  if (!isFirebaseReady()) return;
  const existing = await getDocs(collection(db, PRODUCTS_COLLECTION));
  if (!existing.empty) return;
  for (const product of seedProducts) {
    await setDoc(doc(db, PRODUCTS_COLLECTION, String(product.id)), {
      ...product,
      createdAt: serverTimestamp()
    });
  }
}

export async function addProductFirestore(product) {
  if (!isFirebaseReady()) throw new Error('Firebase chưa được cấu hình');
  await setDoc(doc(db, PRODUCTS_COLLECTION, String(product.id)), {
    ...product,
    createdAt: serverTimestamp()
  });
  return product;
}

export async function updateProductFirestore(id, data) {
  if (!isFirebaseReady()) throw new Error('Firebase chưa được cấu hình');
  await updateDoc(doc(db, PRODUCTS_COLLECTION, String(id)), data);
}

export async function deleteProductFirestore(id) {
  if (!isFirebaseReady()) throw new Error('Firebase chưa được cấu hình');
  await deleteDoc(doc(db, PRODUCTS_COLLECTION, String(id)));
}

export async function createOrder(order) {
  if (!isFirebaseReady()) throw new Error('Firebase chưa được cấu hình');
  const ref = await addDoc(collection(db, ORDERS_COLLECTION), {
    ...order,
    status: 'pending',
    createdAt: serverTimestamp()
  });
  return { id: ref.id, ...order };
}

export async function getOrders() {
  if (!isFirebaseReady()) return [];
  const snapshot = await getDocs(
    query(collection(db, ORDERS_COLLECTION), orderBy('createdAt', 'desc'))
  );
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getOrdersByEmail(email) {
  if (!isFirebaseReady() || !email) return [];
  const snapshot = await getDocs(
    query(collection(db, ORDERS_COLLECTION), orderBy('createdAt', 'desc'))
  );
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((o) => o.customer?.email === email);
}

export async function updateOrderStatus(orderId, status) {
  if (!isFirebaseReady()) throw new Error('Firebase chưa được cấu hình');
  await updateDoc(doc(db, ORDERS_COLLECTION, orderId), {
    status,
    updatedAt: serverTimestamp()
  });
}

export async function updateOrderShipping(orderId, shipping) {
  if (!isFirebaseReady()) throw new Error('Firebase chưa được cấu hình');
  await updateDoc(doc(db, ORDERS_COLLECTION, orderId), {
    shippingInfo: shipping,
    updatedAt: serverTimestamp()
  });
}

export async function getOrderById(orderId) {
  if (!isFirebaseReady()) return null;
  const snap = await getDoc(doc(db, ORDERS_COLLECTION, orderId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}
