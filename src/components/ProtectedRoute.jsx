import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children, requireAdmin = false }) {
  const { isAuthenticated, isAdmin, authMode } = useAuth();
  const location = useLocation();

  if (authMode === 'unconfigured') {
    return (
      <section className="section">
        <div className="modal" style={{ margin: '64px auto', maxWidth: 520 }}>
          <h2>Chưa cấu hình đăng nhập</h2>
          <p>
            Trang này yêu cầu đăng nhập, nhưng máy chủ chưa được cấu hình{' '}
            <code>VITE_CLERK_PUBLISHABLE_KEY</code>. Vui lòng liên hệ quản trị viên.
          </p>
        </div>
      </section>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/sign-in" replace state={{ from: location }} />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;
