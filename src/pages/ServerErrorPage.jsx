import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertOctagon, RotateCcw, Home, Headphones } from 'lucide-react';
import SITE from '../config/site-config';

export default function ServerErrorPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = `Lỗi hệ thống — ${SITE.name}`;
  }, []);

  return (
    <div className="not-found-container" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '60px 20px' }}>
      <AlertOctagon size={80} style={{ color: 'var(--destructive)', marginBottom: 24, animation: 'pulse 2s infinite' }} />
      <h1 style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--text)', marginBottom: 16 }}>500</h1>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>Hệ thống đang gặp sự cố</h2>
      <p style={{ color: 'var(--muted)', maxWidth: 500, margin: '0 auto 32px', lineHeight: 1.6 }}>
        Rất xin lỗi vì sự bất tiện này. Máy chủ của chúng tôi đang gặp chút vấn đề kỹ thuật và không thể xử lý yêu cầu của bạn lúc này. Đội ngũ kỹ thuật đã được thông báo và đang khắc phục.
      </p>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button 
          onClick={() => window.location.reload()} 
          className="primary-button" 
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <RotateCcw size={18} /> Thử lại
        </button>
        <Link 
          to="/" 
          className="secondary-button" 
          style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}
        >
          <Home size={18} /> Về trang chủ
        </Link>
        <Link 
          to="/contact" 
          className="ghost-button" 
          style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}
        >
          <Headphones size={18} /> Liên hệ hỗ trợ
        </Link>
      </div>
    </div>
  );
}
