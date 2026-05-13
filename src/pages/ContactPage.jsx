import { memo, useState } from 'react';
import { Phone, Mail, MapPin, Clock, Send, MessageCircle } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import SITE from '../config/site-config';

function ContactPage() {
  const toast = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'Tư vấn sản phẩm',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }
    setLoading(true);
    // Simulate sending
    await new Promise(r => setTimeout(r, 1000));
    toast.success('Cảm ơn bạn! Chúng tôi sẽ liên hệ lại trong 24 giờ.');
    setFormData({ name: '', email: '', phone: '', subject: 'Tư vấn sản phẩm', message: '' });
    setLoading(false);
  };

  const faqs = [
    {
      q: 'Thời gian giao hàng là bao lâu?',
      a: 'Chúng tôi giao hàng trong 24-48 giờ đối với nội thành HCM và 3-5 ngày đối với tỉnh thành khác.'
    },
    {
      q: 'Chính sách đổi trả như thế nào?',
      a: 'Bạn có thể đổi trả trong vòng 7 ngày nếu sản phẩm còn nguyên seal và chưa qua sử dụng.'
    },
    {
      q: 'Có miễn phí vận chuyển không?',
      a: 'Miễn phí vận chuyển cho đơn hàng từ 300,000đ trở lên.'
    },
    {
      q: 'Làm sao để tôi biết thức ăn phù hợp với thú cưng?',
      a: 'Bạn có thể chat với chúng tôi hoặc gọi hotline để được tư vấn miễn phí.'
    }
  ];

  return (
    <section className="section contact" style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 16, textAlign: 'center' }}>
        Liên Hệ Với Chúng Tôi
      </h1>
      <p style={{ fontSize: 16, color: 'var(--muted)', textAlign: 'center', marginBottom: 40 }}>
        Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn. Đừng ngần ngại liên hệ!
      </p>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: 40 
      }}>
        {/* Contact Info */}
        <div>
          <div style={{ 
            background: 'var(--surface)', 
            borderRadius: 20, 
            padding: 30,
            border: '1px solid var(--border)',
            marginBottom: 24
          }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Thông Tin Liên Hệ</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ 
                  width: 48, 
                  height: 48, 
                  borderRadius: 12, 
                  background: 'var(--bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent)'
                }}>
                  <Phone size={24} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Hotline</div>
                  <div style={{ fontSize: 20, color: 'var(--accent)', fontWeight: 700 }}>0901 234 567</div>
                  <div style={{ fontSize: 14, color: 'var(--muted)' }}>8:00 - 21:00 (Tất cả các ngày)</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ 
                  width: 48, 
                  height: 48, 
                  borderRadius: 12, 
                  background: 'var(--bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent)'
                }}>
                  <Mail size={24} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Email</div>
                  <div style={{ color: 'var(--text)' }}>support@novashop.com</div>
                  <div style={{ fontSize: 14, color: 'var(--muted)' }}>Phản hồi trong 24h</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ 
                  width: 48, 
                  height: 48, 
                  borderRadius: 12, 
                  background: 'var(--bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent)'
                }}>
                  <MapPin size={24} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Địa chỉ</div>
                  <div style={{ color: 'var(--text)' }}>123 Nguyễn Văn A, Quận 1</div>
                  <div style={{ fontSize: 14, color: 'var(--muted)' }}>TP. Hồ Chí Minh</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ 
                  width: 48, 
                  height: 48, 
                  borderRadius: 12, 
                  background: 'var(--bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent)'
                }}>
                  <Clock size={24} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Giờ Làm Việc</div>
                  <div style={{ color: 'var(--text)' }}>Thứ 2 - Chủ nhật</div>
                  <div style={{ fontSize: 14, color: 'var(--muted)' }}>8:00 - 21:00</div>
                </div>
              </div>
            </div>
          </div>

          {/* Social */}
          <div style={{ 
            background: 'var(--surface)', 
            borderRadius: 20, 
            padding: 30,
            border: '1px solid var(--border)'
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Kết Nối Với Chúng Tôi</h3>
            <div style={{ display: 'flex', gap: 12 }}>
              {['Facebook', 'Zalo', 'Instagram'].map((social) => (
                <a
                  key={social}
                  href="#"
                  style={{
                    padding: '10px 20px',
                    background: 'var(--bg)',
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'var(--text)',
                    textDecoration: 'none',
                    border: '1px solid var(--border)'
                  }}
                >
                  {social}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div>
          <div style={{ 
            background: 'var(--surface)', 
            borderRadius: 20, 
            padding: 30,
            border: '1px solid var(--border)'
          }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Gửi Tin Nhắn</h2>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
                  Họ và tên *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    fontSize: 15
                  }}
                  placeholder="Nguyễn Văn A"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    fontSize: 15
                  }}
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    fontSize: 15
                  }}
                  placeholder="0901 234 567"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
                  Chủ đề
                </label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    fontSize: 15
                  }}
                >
                  <option>Tư vấn sản phẩm</option>
                  <option>Khiếu nại dịch vụ</option>
                  <option>Hợp tác kinh doanh</option>
                  <option>Khác</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
                  Nội dung *
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  rows={5}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    fontSize: 15,
                    resize: 'vertical'
                  }}
                  placeholder="Nhập nội dung bạn muốn gửi..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '14px 24px',
                  background: 'var(--accent)',
                  color: '#fff',
                  borderRadius: 10,
                  fontSize: 16,
                  fontWeight: 700,
                  border: 'none',
                  cursor: loading ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  opacity: loading ? 0.7 : 1
                }}
              >
                <Send size={18} />
                {loading ? 'Đang gửi...' : 'Gửi Tin Nhắn'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div style={{ marginTop: 60 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, textAlign: 'center' }}>
          Câu Hỏi Thường Gặp
        </h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: 20 
        }}>
          {faqs.map((faq, i) => (
            <div 
              key={i} 
              style={{ 
                background: 'var(--surface)', 
                borderRadius: 16,
                padding: 24,
                border: '1px solid var(--border)'
              }}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 12,
                marginBottom: 12
              }}>
                <MessageCircle size={20} style={{ color: 'var(--accent)' }} />
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>{faq.q}</h3>
              </div>
              <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default memo(ContactPage);
