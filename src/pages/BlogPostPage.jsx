import { memo, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, Clock, ArrowLeft, Share2, Facebook, Twitter, Link as LinkIcon, User } from 'lucide-react';
import SITE from '../config/site-config';

// Mock data (in a real app, this would be fetched from an API based on the slug)
const MOCK_POSTS = {
  'huong-dan-phoi-do-thoi-trang-mua-2026': {
    title: 'Hướng dẫn phối đồ thời trang theo mùa 2026',
    category: 'Thời trang',
    date: '2026-05-15',
    readTime: '5 phút',
    author: 'Admin',
    image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1200',
    content: `
      <h2>1. Xu hướng Xuân Hè 2026</h2>
      <p>Mùa xuân hè 2026 lên ngôi với các gam màu pastel nhẹ nhàng, chất liệu linen thoáng mát và kiểu dáng oversized. Hãy kết hợp áo sơ mi linen với quần short kaki hoặc chân váy midi để tạo vẻ ngoài thanh lịch nhưng vẫn thoải mái.</p>
      
      <h2>2. Phong cách Thu Đông 2026</h2>
      <p>Thu đông năm nay trending với áo khoác blazer dáng rộng, áo len cashmere và quần tây ống rộng. Phối layer nhiều lớp với áo thun bên trong, áo cardigan ở giữa và blazer ngoài cùng là công thức không thể sai.</p>
      
      <h2>3. Phụ kiện không thể thiếu</h2>
      <p>Một chiếc túi tote canvas, kính mát vintage và đôi sneaker trắng là những phụ kiện "quốc dân" có thể phối với mọi outfit. Đừng quên thắt lưng để tạo điểm nhấn và tôn dáng.</p>
      
      <h3>Lưu ý quan trọng</h3>
      <ul>
        <li>Luôn chọn size phù hợp với dáng người, không quá rộng hoặc quá bó.</li>
        <li>Đầu tư vào những món đồ basic chất lượng tốt để mặc được nhiều mùa.</li>
        <li>Phối màu theo quy tắc 3 màu: không quá 3 tông màu chính trong một outfit.</li>
      </ul>
    `
  },
  'top-10-san-pham-cong-nghe-2026': {
    title: 'Top 10 sản phẩm công nghệ đáng mua nhất 2026',
    category: 'Công nghệ',
    date: '2026-05-12',
    readTime: '6 phút',
    author: 'Admin',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200',
    content: `
      <h2>1. Smartphone tầm trung</h2>
      <p>Năm 2026 chứng kiến cuộc đua khốc liệt ở phân khúc 5-8 triệu đồng. Samsung Galaxy A series, Xiaomi Redmi Note và OPPO Reno đều có camera xịn, pin trâu và màn hình AMOLED.</p>
      
      <h2>2. Tai nghe không dây</h2>
      <p>Tai nghe TWS (True Wireless Stereo) ngày càng rẻ và chất lượng tốt hơn. Chống ồn chủ động (ANC) giờ đã có mặt trên cả các mẫu giá dưới 500K.</p>
      
      <h2>3. Laptop cho sinh viên</h2>
      <p>Laptop mỏng nhẹ dưới 15 triệu với chip thế hệ mới đủ sức xử lý mọi tác vụ học tập, văn phòng và giải trí cơ bản.</p>
      
      <h2>4. Smartwatch theo dõi sức khỏe</h2>
      <p>Đồng hồ thông minh giờ không chỉ xem giờ mà còn đo SpO2, nhịp tim, theo dõi giấc ngủ và nhắc nhở vận động.</p>
      
      <h3>Lời khuyên</h3>
      <ul>
        <li>Xác định rõ nhu cầu trước khi mua để tránh lãng phí.</li>
        <li>So sánh giá trên nhiều sàn thương mại điện tử.</li>
        <li>Ưu tiên sản phẩm có bảo hành chính hãng tại Việt Nam.</li>
      </ul>
    `
  }
};

function BlogPostPage() {
  const { slug } = useParams();
  const [copied, setCopied] = useState(false);
  
  const post = MOCK_POSTS[slug] || {
    title: 'Bài viết đang được cập nhật',
    category: 'Thông báo',
    date: new Date().toISOString(),
    readTime: '1 phút',
    author: 'Admin',
    image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=1200',
    content: '<p>Nội dung bài viết đang được đội ngũ biên tập cập nhật. Vui lòng quay lại sau.</p>'
  };

  useEffect(() => {
    document.title = `${post.title} - ${SITE.name}`;
    window.scrollTo({ top: 0 });
  }, [post.title]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <article className="section" style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px' }}>
      <Link to="/blog" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--muted)', textDecoration: 'none', marginBottom: 24, fontWeight: 600 }}>
        <ArrowLeft size={16} /> Quay lại trang Blog
      </Link>
      
      <div style={{ marginBottom: 32 }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{post.category}</span>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginTop: 12, marginBottom: 24, lineHeight: 1.3 }}>{post.title}</h1>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center', color: 'var(--muted)', fontSize: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <User size={16} /> <strong>{post.author}</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={16} /> {new Date(post.date).toLocaleDateString('vi-VN')}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={16} /> {post.readTime} đọc
          </div>
        </div>
      </div>

      <div style={{ borderRadius: 24, overflow: 'hidden', marginBottom: 40, aspectRatio: '16/9' }}>
        <img src={post.image} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>

      <div 
        className="blog-content" 
        style={{ fontSize: '1.1rem', lineHeight: 1.8, color: 'var(--text)' }}
        dangerouslySetInnerHTML={{ __html: post.content }} 
      />

      <div style={{ marginTop: 60, paddingTop: 30, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
        <div style={{ fontWeight: 700 }}>Chia sẻ bài viết này:</div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={copyLink} className="secondary-button" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px' }}>
            <LinkIcon size={16} /> {copied ? 'Đã sao chép' : 'Copy Link'}
          </button>
          <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noopener noreferrer" className="secondary-button" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, padding: 0, borderRadius: '50%' }}>
            <Facebook size={18} />
          </a>
          <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(post.title)}`} target="_blank" rel="noopener noreferrer" className="secondary-button" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, padding: 0, borderRadius: '50%' }}>
            <Twitter size={18} />
          </a>
        </div>
      </div>
    </article>
  );
}

export default memo(BlogPostPage);
