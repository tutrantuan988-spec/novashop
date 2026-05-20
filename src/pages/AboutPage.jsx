import { memo } from 'react';
import { Heart, Shield, Zap, Smile, Phone, Mail, MapPin } from 'lucide-react';
import SITE from '../config/site-config';

function AboutPage() {
  const values = [
    { icon: Heart, title: 'Tận Tâm', desc: 'Mỗi sản phẩm đều được chọn lọc kỹ càng cho khách hàng' },
    { icon: Shield, title: 'An Toàn', desc: 'Chỉ bán hàng chính hãng, nguồn gốc rõ ràng, chất lượng đảm bảo' },
    { icon: Zap, title: 'Nhanh Chóng', desc: 'Giao hàng trong 24-48 giờ, đóng gói cẩn thận' },
    { icon: Smile, title: 'Vui Vẻ', desc: 'Mang trải nghiệm mua sắm tuyệt vời đến cho mọi khách hàng' }
  ];

  const stats = [
    { value: '10,000+', label: 'Khách hàng hài lòng' },
    { value: '50,000+', label: 'Đơn hàng thành công' },
    { value: '500+', label: 'Sản phẩm đa dạng' },
    { value: '99%', label: 'Đánh giá tích cực' }
  ];

  return (
    <section className="section about" style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 20px' }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 60 }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 16 }}>Về {SITE.name}</h1>
        <p style={{ fontSize: 20, color: 'var(--muted)', maxWidth: 600, margin: '0 auto' }}>
          Mua Sắm Thông Minh, Chất Lượng Hàng Đầu
        </p>
      </div>

      {/* Story */}
      <div style={{ 
        background: 'var(--surface)', 
        borderRadius: 20, 
        padding: 40, 
        marginBottom: 40,
        border: '1px solid var(--border)'
      }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>Câu Chuyện Của Chúng Tôi</h2>
        <p style={{ fontSize: 16, lineHeight: 1.8, color: 'var(--text)' }}>
          {SITE.name} được thành lập với sứ mệnh mang đến trải nghiệm mua sắm trực tuyến tốt nhất. 

          Chúng tôi cung cấp đa dạng sản phẩm từ nhiều ngành hàng — Thời trang, Điện tử, Gia dụng, Thể thao, Sách, Mẹ & Bé, Thực phẩm và nhiều hơn nữa. 

          Mỗi sản phẩm đều được chọn lọc kỹ càng — chất lượng cao, giá cả hợp lý, giao hàng nhanh toàn quốc.
        </p>
      </div>

      {/* Mission */}
      <div style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, textAlign: 'center' }}>Sứ Mệnh</h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: 20 
        }}>
          {[
            'Cung cấp sản phẩm chất lượng, giá cả hợp lý',
            'Mang đến trải nghiệm mua sắm thuận tiện, nhanh chóng',
            'Tư vấn chuyên nghiệp, tận tâm cho từng khách hàng',
            'Xây dựng cộng đồng mua sắm đáng tin cậy'
          ].map((item, i) => (
            <div key={i} style={{ 
              background: 'var(--bg)', 
              padding: 20, 
              borderRadius: 12,
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: 12
            }}>
              <div style={{ 
                width: 32, 
                height: 32, 
                borderRadius: '50%', 
                background: 'var(--accent)', 
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700
              }}>{i + 1}</div>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Values */}
      <div style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, textAlign: 'center' }}>Giá Trị Cốt Lõi</h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: 20 
        }}>
          {values.map((v, i) => (
            <div key={i} style={{ 
              background: 'var(--surface)', 
              padding: 24, 
              borderRadius: 16,
              border: '1px solid var(--border)',
              textAlign: 'center'
            }}>
              <v.icon size={40} style={{ color: 'var(--accent)', marginBottom: 12 }} />
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{v.title}</h3>
              <p style={{ fontSize: 14, color: 'var(--muted)' }}>{v.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{ 
        background: 'linear-gradient(135deg, var(--accent) 0%, #ea580c 100%)',
        borderRadius: 20,
        padding: 40,
        marginBottom: 40,
        color: '#fff'
      }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, textAlign: 'center' }}>
          {SITE.name} Trong Số Liệu
        </h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
          gap: 20,
          textAlign: 'center'
        }}>
          {stats.map((s, i) => (
            <div key={i}>
              <div style={{ fontSize: 36, fontWeight: 800, marginBottom: 8 }}>{s.value}</div>
              <div style={{ fontSize: 14, opacity: 0.9 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact CTA */}
      <div style={{ 
        background: 'var(--surface)', 
        borderRadius: 20, 
        padding: 40,
        textAlign: 'center',
        border: '1px solid var(--border)'
      }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Liên Hệ Với Chúng Tôi</h2>
        <p style={{ fontSize: 16, color: 'var(--muted)', marginBottom: 24 }}>
          Có câu hỏi? Chúng tôi luôn sẵn sàng hỗ trợ bạn!
        </p>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: 24, 
          flexWrap: 'wrap',
          marginBottom: 24
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Phone size={20} style={{ color: 'var(--accent)' }} />
            <span>{SITE.phone}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Mail size={20} style={{ color: 'var(--accent)' }} />
            <span>{SITE.email}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapPin size={20} style={{ color: 'var(--accent)' }} />
            <span>{SITE.address}</span>
          </div>
        </div>
        <a 
          href="/contact" 
          style={{ 
            display: 'inline-block',
            padding: '12px 32px',
            background: 'var(--accent)',
            color: '#fff',
            borderRadius: 10,
            fontWeight: 700,
            textDecoration: 'none'
          }}
        >
          Liên Hệ Ngay
        </a>
      </div>
    </section>
  );
}

export default memo(AboutPage);
