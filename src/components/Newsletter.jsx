import { memo, useState } from 'react';
import { Mail, Send, CheckCircle } from 'lucide-react';
import { useToast } from '../context/ToastContext';

function Newsletter() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const toast = useToast();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error('Vui lòng nhập email hợp lệ');
      return;
    }
    setSubmitted(true);
    toast.success('Đã đăng ký nhận ưu đãi!');
    setEmail('');
    setTimeout(() => setSubmitted(false), 4000);
  };

  return (
    <section
      className="section newsletter-section"
      style={{
        background: 'linear-gradient(135deg, #14213d 0%, #1e3a5f 100%)',
        borderRadius: 24,
        margin: '40px 24px',
        padding: '60px 40px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: -40,
          right: -40,
          width: 180,
          height: 180,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)'
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -60,
          left: -60,
          width: 240,
          height: 240,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.03)'
        }}
      />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 560, margin: '0 auto' }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: 'rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px'
          }}
        >
          <Mail size={28} color="#fff" />
        </div>
        <h2 style={{ color: '#fff', fontSize: '1.75rem', marginBottom: 10 }}>
          Nhận ưu đãi độc quyền
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.75)', marginBottom: 28, fontSize: 15 }}>
          Đăng ký email để nhận mã giảm giá 10% cho đơn hàng đầu tiên và cập nhật khuyến mãi mới nhất.
        </p>

        {submitted ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              color: '#4ade80',
              fontWeight: 700,
              fontSize: '1.1rem'
            }}
          >
            <CheckCircle size={22} /> Đăng ký thành công! Kiểm tra email của bạn.
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={{
              display: 'flex',
              gap: 10,
              maxWidth: 420,
              margin: '0 auto',
              flexWrap: 'wrap',
              justifyContent: 'center'
            }}
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Nhập email của bạn"
              required
              style={{
                flex: 1,
                minWidth: 220,
                padding: '12px 18px',
                borderRadius: 12,
                border: '1.5px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.08)',
                color: '#fff',
                fontSize: 15,
                outline: 'none'
              }}
            />
            <button
              type="submit"
              style={{
                padding: '12px 24px',
                borderRadius: 12,
                border: 'none',
                background: '#f97316',
                color: '#fff',
                fontWeight: 700,
                fontSize: 15,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#ea580c'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#f97316'; }}
            >
              <Send size={16} /> Đăng ký
            </button>
          </form>
        )}

        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 16 }}>
          Không spam. Có thể huỷ đăng ký bất cứ lúc nào.
        </p>
      </div>
    </section>
  );
}

export default memo(Newsletter);
