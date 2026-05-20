import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ProductsProvider } from './context/ProductsContext';
import { ToastProvider } from './context/ToastContext';
import { WishlistProvider } from './context/WishlistContext';
import ErrorBoundary from './components/ErrorBoundary';
import Header from './components/Header';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import Breadcrumb from './components/Breadcrumb';
import ChatWidget from './components/ChatWidget';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';

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
const AddressesPage = lazy(() => import('./pages/account/AddressesPage'));
const ReturnRequestPage = lazy(() => import('./pages/ReturnRequestPage'));
const SignInPage = lazy(() => import('./pages/SignInPage'));
const SignUpPage = lazy(() => import('./pages/SignUpPage'));
const AddProductPage = lazy(() => import('./pages/AddProductPage'));
const DanhGiaPage = lazy(() => import('./pages/DanhGiaPage'));
const ProductListPage = lazy(() => import('./pages/ProductListPage'));
const AgentDashboardPage = lazy(() => import('./pages/AgentDashboardPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const CategoryPage = lazy(() => import('./pages/CategoryPage'));
const CategoryListPage = lazy(() => import('./pages/CategoryListPage'));
const BrandPage = lazy(() => import('./pages/BrandPage'));
const OrderConfirmationPage = lazy(() => import('./pages/OrderConfirmationPage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));

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
                      <Route path="/gio-hang" element={<CartPage />} />
                      <Route path="/tim-kiem" element={<SearchPage />} />
                      <Route path="/them-san-pham" element={<AddProductPage />} />
                      <Route path="/quan-ly-san-pham" element={<ProductListPage />} />
                      <Route path="/san-pham/:slug" element={<ProductDetailPage />} />
                      <Route path="/chinh-sach/:slug" element={<PolicyPage />} />
                      <Route path="/about" element={<AboutPage />} />
                      <Route path="/contact" element={<ContactPage />} />
                      <Route path="/blog" element={<BlogPage />} />
                      <Route path="/blog/:slug" element={<BlogPage />} />
                      <Route path="/track-order" element={<GuestOrderTrackingPage />} />
                      <Route path="/tai-khoan/dia-chi" element={(
                        <ProtectedRoute>
                          <AddressesPage />
                        </ProtectedRoute>
                      )} />
                      <Route path="/tai-khoan/doi-tra/:orderId" element={(
                        <ProtectedRoute>
                          <ReturnRequestPage />
                        </ProtectedRoute>
                      )} />
                      <Route path="/thanh-toan/momo-return" element={<MomoReturnPage />} />
                      <Route path="/sign-in/*" element={<SignInPage />} />
                      <Route path="/sign-up/*" element={<SignUpPage />} />
                      <Route
                        path="/thanh-toan"
                        element={<CheckoutPage />}
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
                      <Route
                        path="/admin/agents"
                        element={(
                          <ProtectedRoute requireAdmin>
                            <AgentDashboardPage />
                          </ProtectedRoute>
                        )}
                      />
                      <Route path="/danh-muc" element={<CategoryListPage />} />
                      <Route path="/danh-muc/:slug" element={<CategoryPage />} />
                      <Route path="/thuong-hieu/:slug" element={<BrandPage />} />
                      <Route path="/don-hang/:id" element={<OrderConfirmationPage />} />
                      <Route path="/khuyen-mai" element={<Navigate to="/#flash-sale" replace />} />
                      <Route path="/danh-gia" element={<DanhGiaPage />} />
                      <Route path="/ho-tro" element={<Navigate to="/contact" replace />} />
                      <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                  </Suspense>
                </main>
                <Footer />
                <CartDrawer />
                <ChatWidget />
                <ScrollToTop />
              </div>
              </CartProvider>
            </WishlistProvider>
          </ProductsProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
