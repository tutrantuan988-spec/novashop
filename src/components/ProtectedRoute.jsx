import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ForbiddenPage from '../pages/ForbiddenPage';
import { ShieldCheck } from 'lucide-react';
import {
  clearAdminSessionToken,
  getAdminConfigApi,
  getAdminSessionToken,
  setAdminSessionToken,
  verifyAdminApi
} from '../services/api';

function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, isAuthenticated, isAdmin, authLoading } = useAuth();
  const location = useLocation();
  
  const [tokenRequired, setTokenRequired] = useState(false);
  const [adminVerified, setAdminVerified] = useState(false);
  const [verifyingAdmin, setVerifyingAdmin] = useState(requireAdmin && isAdmin);
  const [adminTokenInput, setAdminTokenInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!requireAdmin || !isAdmin || !user?.email) {
      setVerifyingAdmin(false);
      return;
    }

    let cancelled = false;
    setVerifyingAdmin(true);

    getAdminConfigApi()
      .then(async (config) => {
        if (cancelled) return;
        const required = !!config.tokenRequired;
        setTokenRequired(required);
        
        if (!required) {
          setAdminVerified(true);
          setVerifyingAdmin(false);
          return;
        }

        const savedToken = getAdminSessionToken();
        if (!savedToken) {
          setAdminVerified(false);
          setVerifyingAdmin(false);
          return;
        }

        try {
          await verifyAdminApi(user.email, savedToken);
          if (!cancelled) {
            setAdminVerified(true);
          }
        } catch {
          clearAdminSessionToken();
          if (!cancelled) {
            setAdminVerified(false);
          }
        } finally {
          if (!cancelled) {
            setVerifyingAdmin(false);
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTokenRequired(true);
          setAdminVerified(false);
          setVerifyingAdmin(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [requireAdmin, isAdmin, user?.email]);

  const handleAdminTokenSubmit = async (event) => {
    event.preventDefault();
    const token = adminTokenInput.trim();
    if (!token) {
      setErrorMsg('Vui lòng nhập admin secret');
      return;
    }
    try {
      setVerifyingAdmin(true);
      setErrorMsg('');
      await verifyAdminApi(user.email, token);
      setAdminSessionToken(token);
      setAdminVerified(true);
      setAdminTokenInput('');
    } catch (err) {
      clearAdminSessionToken();
      setAdminVerified(false);
      setErrorMsg(err.message || 'Admin secret không hợp lệ');
    } finally {
      setVerifyingAdmin(false);
    }
  };

  if (authLoading || verifyingAdmin) {
    return (
      <div className="page-loading" role="status" aria-live="polite">
        <div className="spinner" aria-hidden />
        <span>Đang xác thực bảo mật...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/sign-in" replace state={{ from: location }} />;
  }

  if (requireAdmin && !isAdmin) {
    return <ForbiddenPage />;
  }

  if (requireAdmin && tokenRequired && !adminVerified) {
    return (
      <section className="section admin-denied admin-token-gate" style={{ padding: '60px 20px', display: 'flex', justifyContent: 'center' }}>
        <div className="card-box" style={{ maxWidth: '400px', width: '100%', textAlign: 'center', background: 'rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', padding: '30px' }}>
          <ShieldCheck size={48} color="#FF69B4" style={{ marginBottom: '15px' }} aria-hidden />
          <h1 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '10px' }}>Xác thực admin API</h1>
          <p style={{ fontSize: '13px', color: '#888', marginBottom: '20px', lineHeight: '1.6' }}>Nhập admin secret để mở bảng quản trị. Secret chỉ lưu trong session hiện tại và không được build vào frontend.</p>
          <form onSubmit={handleAdminTokenSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="password"
              value={adminTokenInput}
              onChange={(event) => setAdminTokenInput(event.target.value)}
              placeholder="Admin secret"
              autoComplete="current-password"
              aria-label="Admin secret"
              style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.2)', color: '#fff', fontSize: '14px', outline: 'none' }}
            />
            {errorMsg && <p style={{ color: '#ff4d4f', fontSize: '12px', margin: '0 0 5px 0', textAlign: 'left' }}>{errorMsg}</p>}
            <button type="submit" className="primary-button" style={{ padding: '12px', borderRadius: '8px', background: '#FF69B4', color: '#fff', fontWeight: '500', border: 'none', cursor: 'pointer', transition: 'opacity 0.2s' }}>Xác thực</button>
          </form>
        </div>
      </section>
    );
  }

  return children;
}

export default ProtectedRoute;
