import { Link } from 'react-router-dom';

function ForbiddenPage() {
  return (
    <section className="section" style={{ textAlign: 'center', padding: '80px 20px' }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <h1 style={{ fontSize: '4rem', marginBottom: 8, color: '#e53935' }}>403</h1>
        <h2 style={{ marginBottom: 16 }}>Truy cập bị từ chối</h2>
        <p style={{ color: '#666', marginBottom: 32, lineHeight: 1.6 }}>
          Bạn không có quyền truy cập vào trang này.
          Trang này yêu cầu quyền quản trị viên.
        </p>
        <Link to="/" className="primary-button" style={{ textDecoration: 'none', display: 'inline-block' }}>
          Quay lại trang chủ
        </Link>
      </div>
    </section>
  );
}

export default ForbiddenPage;
