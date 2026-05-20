import { memo, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, ArrowRight, BookOpen } from 'lucide-react';
import SITE from '../config/site-config';

const BLOG_POSTS = [
  {
    id: 1,
    slug: 'huong-dan-chon-thuc-an-cho-cho',
    title: 'Hướng dẫn chọn thức ăn cho chó theo độ tuổi',
    excerpt: 'Mỗi giai đoạn phát triển của chó cần chế độ dinh dưỡng khác nhau. Bài viết này sẽ giúp bạn chọn đúng loại thức ăn phù hợp.',
    category: 'Chăm sóc thú cưng',
    date: '2026-05-15',
    readTime: '5 phút',
    image: 'https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=500',
    featured: true
  },
  {
    id: 2,
    slug: 'dau-hieu-meo-thieu-chat-dinh-duong',
    title: '5 dấu hiệu mèo thiếu chất dinh dưỡng',
    excerpt: 'Lông xơ xác, sụt cân, mệt mỏi... là những dấu hiệu cho thấy mèo cưng của bạn đang thiếu chất. Cùng tìm hiểu cách bổ sung.',
    category: 'Sức khỏe',
    date: '2026-05-12',
    readTime: '4 phút',
    image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500',
    featured: true
  },
  {
    id: 3,
    slug: 'cach-chon-size-quan-ao-thu-cung',
    title: 'Cách chọn size quần áo cho thú cưng',
    excerpt: 'Chọn đúng size giúp thú cưng thoải mái vận động và tránh các vấn đề về da. Hướng dẫn chi tiết đo size cho chó mèo.',
    category: 'Phụ kiện',
    date: '2026-05-10',
    readTime: '3 phút',
    image: 'https://images.unsplash.com/photo-1583337130417-13104dec14a3?w=500',
    featured: false
  },
  {
    id: 4,
    slug: 'top-10-do-choi-meo-duoc-yeu-thich',
    title: 'Top 10 đồ chơi cho mèo được yêu thích nhất 2026',
    excerpt: 'Tổng hợp những món đồ chơi giúp mèo vui vẻ, vận động và giảm stress. Cập nhật xu hướng mới nhất.',
    category: 'Đồ chơi',
    date: '2026-05-08',
    readTime: '6 phút',
    image: 'https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=500',
    featured: false
  },
  {
    id: 5,
    slug: 'huong-dan-tam-cho-dung-cach',
    title: 'Hướng dẫn tắm cho chó đúng cách tại nhà',
    excerpt: 'Tắm cho chó không đúng cách có thể gây kích ứng da. Học cách tắm an toàn và hiệu quả ngay tại nhà.',
    category: 'Chăm sóc thú cưng',
    date: '2026-05-05',
    readTime: '7 phút',
    image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=500',
    featured: false
  },
  {
    id: 6,
    slug: 'thuc-an-hat- hay-wet-cho-meo',
    title: 'Thức ăn hạt hay wet food cho mèo? So sánh chi tiết',
    excerpt: 'Nên cho mèo ăn thức ăn hạt hay wet food? Phân tích ưu nhược điểm của từng loại để bạn chọn đúng.',
    category: 'Dinh dưỡng',
    date: '2026-05-01',
    readTime: '5 phút',
    image: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=500',
    featured: false
  }
];

function BlogPage() {
  const [filter, setFilter] = useState('Tất cả');

  useEffect(() => {
    document.title = `Blog - ${SITE.name}`;
    window.scrollTo({ top: 0 });
  }, []);

  const categories = ['Tất cả', ...new Set(BLOG_POSTS.map(p => p.category))];
  const filteredPosts = filter === 'Tất cả' ? BLOG_POSTS : BLOG_POSTS.filter(p => p.category === filter);
  const featuredPosts = BLOG_POSTS.filter(p => p.featured);

  return (
    <section className="section" style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <span className="section-kicker"><BookOpen size={16} aria-hidden /> Blog & Kiến thức</span>
        <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 12 }}>Blog {SITE.name}</h1>
        <p style={{ fontSize: 16, color: 'var(--muted)', maxWidth: 600, margin: '0 auto' }}>
          Chia sẻ kiến thức chăm sóc thú cưng, mẹo hay và cập nhật xu hướng mới nhất
        </p>
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 32 }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            style={{
              padding: '8px 20px',
              borderRadius: 20,
              border: '1.5px solid var(--border)',
              background: filter === cat ? 'var(--accent)' : 'transparent',
              color: filter === cat ? '#fff' : 'var(--text)',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Featured posts */}
      {filter === 'Tất cả' && featuredPosts.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Bài viết nổi bật</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
            {featuredPosts.map((post) => (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                style={{
                  background: 'var(--surface)',
                  borderRadius: 20,
                  border: '1.5px solid var(--border)',
                  overflow: 'hidden',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ height: 200, overflow: 'hidden' }}>
                  <img src={post.image} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                </div>
                <div style={{ padding: 20 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase' }}>{post.category}</span>
                  <h3 style={{ fontSize: 18, fontWeight: 700, marginTop: 8, marginBottom: 8, lineHeight: 1.4 }}>{post.title}</h3>
                  <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 12 }}>{post.excerpt}</p>
                  <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={14} /> {new Date(post.date).toLocaleDateString('vi-VN')}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={14} /> {post.readTime}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* All posts */}
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>
          {filter === 'Tất cả' ? 'Tất cả bài viết' : filter}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {filteredPosts.map((post) => (
            <Link
              key={post.id}
              to={`/blog/${post.slug}`}
              style={{
                background: 'var(--surface)',
                borderRadius: 16,
                border: '1.5px solid var(--border)',
                overflow: 'hidden',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ height: 160, overflow: 'hidden' }}>
                <img src={post.image} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
              </div>
              <div style={{ padding: 16 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase' }}>{post.category}</span>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 6, marginBottom: 6, lineHeight: 1.4 }}>{post.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 10 }}>{post.excerpt}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--muted)' }}>
                  <span>{new Date(post.date).toLocaleDateString('vi-VN')}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600, color: 'var(--accent)' }}>
                    Đọc thêm <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default memo(BlogPage);
