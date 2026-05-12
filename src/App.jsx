import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ProductsProvider } from './context/ProductsContext';
import { ToastProvider } from './context/ToastContext';
import { WishlistProvider } from './context/WishlistContext';
import ErrorBoundary from './components/ErrorBoundary';
import Header from './components/Header';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import AuthModal from './components/AuthModal';
import HomePage from './pages/HomePage';

const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const PaymentSuccessPage = lazy(() => import('./pages/PaymentSuccessPage'));
const PaymentFailedPage = lazy(() => import('./pages/PaymentFailedPage'));
const MomoReturnPage = lazy(() => import('./pages/MomoReturnPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const PolicyPage = lazy(() => import('./pages/PolicyPage'));

const Loading = () => (
  <div className="page-loading" role="status" aria-live="polite">
    <div className="spinner" aria-hidden />
    <span>Đang tải...</span>
  </div>
);

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <ProductsProvider>
            <WishlistProvider>
              <CartProvider>
              <div className="site-shell">
                <Header />
                <main id="main">
                  <Suspense fallback={<Loading />}>
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/san-pham/:slug" element={<ProductDetailPage />} />
                      <Route path="/thanh-toan" element={<CheckoutPage />} />
                      <Route path="/thanh-toan/thanh-cong" element={<PaymentSuccessPage />} />
                      <Route path="/thanh-toan/that-bai" element={<PaymentFailedPage />} />
                      <Route path="/thanh-toan/momo-return" element={<MomoReturnPage />} />
                      <Route path="/tai-khoan" element={<AccountPage />} />
                      <Route path="/admin" element={<AdminPage />} />
                      <Route path="/chinh-sach/:slug" element={<PolicyPage />} />
                      <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                  </Suspense>
                </main>
                <Footer />
                <CartDrawer />
                <AuthModal />
              </div>
              </CartProvider>
            </WishlistProvider>
          </ProductsProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
