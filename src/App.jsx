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
import Breadcrumb from './components/Breadcrumb';
import ChatWidget from './components/ChatWidget';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';

const DogFoodPage = lazy(() => import('./pages/DogFoodPage'));
const CatFoodPage = lazy(() => import('./pages/CatFoodPage'));
const PetAccessoriesPage = lazy(() => import('./pages/PetAccessoriesPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const PaymentSuccessPage = lazy(() => import('./pages/PaymentSuccessPage'));
const PaymentFailedPage = lazy(() => import('./pages/PaymentFailedPage'));
const MomoReturnPage = lazy(() => import('./pages/MomoReturnPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const UserProfilePage = lazy(() => import('./pages/UserProfilePage'));
const OrderHistoryPage = lazy(() => import('./pages/OrderHistoryPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const PolicyPage = lazy(() => import('./pages/PolicyPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const GuestOrderTrackingPage = lazy(() => import('./pages/GuestOrderTrackingPage'));
const SignInPage = lazy(() => import('./pages/SignInPage'));
const SignUpPage = lazy(() => import('./pages/SignUpPage'));

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
                <Breadcrumb />
                <main id="main">
                  <Suspense fallback={<Loading />}>
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/tim-kiem" element={<SearchPage />} />
                      <Route path="/dog-food" element={<DogFoodPage />} />
                      <Route path="/cat-food" element={<CatFoodPage />} />
                      <Route path="/pet-accessories" element={<PetAccessoriesPage />} />
                      <Route path="/san-pham/:slug" element={<ProductDetailPage />} />
                      <Route path="/chinh-sach/:slug" element={<PolicyPage />} />
                      <Route path="/about" element={<AboutPage />} />
                      <Route path="/contact" element={<ContactPage />} />
                      <Route path="/track-order" element={<GuestOrderTrackingPage />} />
                      <Route path="/thanh-toan/momo-return" element={<MomoReturnPage />} />
                      <Route path="/sign-in/*" element={<SignInPage />} />
                      <Route path="/sign-up/*" element={<SignUpPage />} />
                      <Route
                        path="/thanh-toan"
                        element={(
                          <ProtectedRoute>
                            <CheckoutPage />
                          </ProtectedRoute>
                        )}
                      />
                      <Route
                        path="/thanh-toan/thanh-cong"
                        element={(
                          <ProtectedRoute>
                            <PaymentSuccessPage />
                          </ProtectedRoute>
                        )}
                      />
                      <Route
                        path="/thanh-toan/that-bai"
                        element={(
                          <ProtectedRoute>
                            <PaymentFailedPage />
                          </ProtectedRoute>
                        )}
                      />
                      <Route
                        path="/tai-khoan"
                        element={(
                          <ProtectedRoute>
                            <AccountPage />
                          </ProtectedRoute>
                        )}
                      />
                      <Route
                        path="/tai-khoan/profile"
                        element={(
                          <ProtectedRoute>
                            <UserProfilePage />
                          </ProtectedRoute>
                        )}
                      />
                      <Route
                        path="/tai-khoan/yeu-thich"
                        element={(
                          <ProtectedRoute>
                            <WishlistPage />
                          </ProtectedRoute>
                        )}
                      />
                      <Route
                        path="/tai-khoan/don-hang"
                        element={(
                          <ProtectedRoute>
                            <OrderHistoryPage />
                          </ProtectedRoute>
                        )}
                      />
                      <Route
                        path="/admin"
                        element={(
                          <ProtectedRoute requireAdmin>
                            <AdminPage />
                          </ProtectedRoute>
                        )}
                      />
                      <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                  </Suspense>
                </main>
                <Footer />
                <CartDrawer />
                <AuthModal />
                <ChatWidget />
              </div>
              </CartProvider>
            </WishlistProvider>
          </ProductsProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
