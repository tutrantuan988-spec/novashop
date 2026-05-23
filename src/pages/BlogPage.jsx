import { memo, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, ArrowRight, BookOpen } from 'lucide-react';
import SITE from '../config/site-config';

const BLOG_POSTS = [
  {
    id: 1,
    slug: 'huong-dan-phoi-do-thoi-trang-mua-2026',
    title: 'Hướng dẫn phối đồ thời trang theo mùa 2026',
    excerpt: 'Cập nhật xu hướng phối đồ mới nhất cho từng mùa trong năm. Từ xuân hè đến thu đông, bạn luôn tự tin và stylish.',
    category: 'Thời trang',
    date: '2026-05-15',
    readTime: '5 phút',
    image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400',
    featured: true
  },
  {
    id: 2,
    slug: 'top-10-san-pham-cong-nghe-2026',
    title: 'Top 10 sản phẩm công nghệ đáng mua nhất 2026',
    excerpt: 'Tổng hợp những gadget và thiết bị công nghệ hot nhất năm 2026 mà bạn không nên bỏ lỡ.',
    category: 'Công nghệ',
    date: '2026-05-12',
    readTime: '6 phút',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
    featured: true
  },
  {
    id: 3,
    slug: 'huong-dan-chon-nuoc-hoa-phu-hop',
    title: 'Hướng dẫn chọn nước hoa phù hợp với từng dịp',
    excerpt: 'Cách chọn mùi hương phù hợp cho công sở, hẹn hò hay dự tiệc. Bí quyết để luôn thơm tho và tự tin.',
    category: 'Làm đẹp',
    date: '2026-05-10',
    readTime: '4 phút',
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400',
    featured: false
  },
  {
    id: 4,
    slug: 'huong-dan-chon-laptop-sinh-vien-2026',
    title: 'Hướng dẫn chọn laptop cho sinh viên 2026',
    excerpt: 'Tiêu chí chọn laptop phù hợp cho sinh viên: hiệu năng, giá cả, trọng lượng và thời lượng pin.',
    category: 'Công nghệ',
    date: '2026-05-08',
    readTime: '7 phút',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
    featured: false
  },
  {
    id: 5,
    slug: 'meo-giu-quan-ao-ben-dep-lau-hon',
    title: 'Mẹo giữ quần áo bền đẹp lâu hơn',
    excerpt: 'Những mẹo giặt ủi, bảo quản quần áo giúp đồ bền màu, không bai xù và luôn như mới.',
    category: 'Thời trang',
    date: '2026-05-05',
    readTime: '5 phút',
    image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400',
    featured: false
  },
  {
    id: 6,
    slug: 'dien-thoai-tam-trung-samsung-xiaomi-oppo',
    title: 'Điện thoại tầm trung: Samsung vs Xiaomi vs OPPO?',
    excerpt: 'So sánh chi tiết các dòng điện thoại tầm trung từ 5-8 triệu. Hãng nào đáng mua nhất 2026?',
    category: 'Công nghệ',
    date: '2026-05-01',
    readTime: '6 phút',
    image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400',
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
          Chia sẻ kiến thức mua sắm, mẹo hay và cập nhật xu hướng mới nhất
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
