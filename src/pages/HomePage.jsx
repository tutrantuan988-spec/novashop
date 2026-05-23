import { memo, useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Zap, ArrowRight, ShieldCheck, Truck, LockKeyhole, Sparkles, Gem,
  Headphones, PackageCheck, BadgeCheck, MessageCircle, Wallet,
  RotateCcw, ChevronRight, PlusCircle, List, ShoppingBag, Clock,
  Users, Star, TrendingUp, BookOpen, Calendar, Heart,
  Award, Leaf, ChevronLeft, Check, Shirt, Smartphone, Home
} from 'lucide-react';
import { fetchCategoryTree, fetchProducts, fetchFeaturedProducts } from '../services/apiV2';
import ProductCard from '../components/ProductCard';
import PolicyModal from '../components/PolicyModal';
import RecentlyViewed from '../components/RecentlyViewed';
import { SkeletonGrid } from '../components/Skeleton';
import Newsletter from '../components/Newsletter';
import MotionWrapper from '../components/MotionWrapper';
import { formatVND } from '../utils/format';
import SITE from '../config/site-config';
import { useAuth } from '../context/AuthContext';

const homeReviews = [
  { id: 'r1', name: 'Lan Anh', role: 'Khách hàng thân thiết', rating: 5, content: 'Sản phẩm chất lượng tuyệt vời, giao hàng siêu nhanh. Mình rất hài lòng!', avatar: 'LA' },
  { id: 'r2', name: 'Hoàng Minh', role: 'Đã mua 3 lần', rating: 5, content: 'Giá cả hợp lý, đóng gói cẩn thận. Shop tư vấn rất nhiệt tình về sản phẩm phù hợp.', avatar: 'HM' },
  { id: 'r3', name: 'Thanh Thảo', role: 'Mua online lần đầu', rating: 4, content: 'Lần đầu mua hàng online nhưng rất yên tâm vì được kiểm tra hàng trước khi nhận. Sẽ ủng hộ shop dài dài!', avatar: 'TT' },
  { id: 'r4', name: 'Minh Đức', role: 'Khách hàng thân thiết', rating: 5, content: 'Sản phẩm chính hãng, giá tốt hơn nhiều so với cửa hàng. Giao hàng nhanh, đóng gói kỹ.', avatar: 'MD' },
  { id: 'r5', name: 'Hương Giang', role: 'Đã mua 5 lần', rating: 5, content: 'Shop có nhiều danh mục đa dạng lắm. Tư vấn chọn sản phẩm phù hợp theo nhu cầu rất chuẩn!', avatar: 'HG' },
];

const BRAND_PILLS = [
  { id: 'freeship', label: 'Freeship từ 300K' },
  { id: 'inspect', label: 'Đồng kiểm khi nhận' },
  { id: 'return7', label: 'Đổi trả 7 ngày' },
  { id: 'support', label: 'Hỗ trợ chat nhanh' },
  { id: 'cod', label: 'Thanh toán COD' }
];

const POLICY_SLUG_MAP = {
  freeship: 'freeship',
  inspect: 'dong-kiem',
  return7: 'doi-tra',
  support: 'ho-tro-chat',
  cod: 'thanh-toan-cod'
};

const BENEFIT_CARDS = [
  { id: 'shipping', icon: Truck, title: 'Giao nhanh toàn quốc', summary: 'Nội thành trong ngày, tỉnh thành 2-4 ngày' },
  { id: 'authentic', icon: BadgeCheck, title: 'Cam kết chính hãng', summary: 'Sản phẩm có nguồn gốc rõ ràng, đảm bảo chất lượng' },
  { id: 'support-card', icon: Headphones, title: 'Tư vấn tận tình', summary: 'Đội ngũ hỗ trợ qua chat, hotline và Zalo' },
  { id: 'packaging', icon: PackageCheck, title: 'Đóng gói cẩn thận', summary: 'Bảo quản tốt, kiểm tra hàng trước khi thanh toán COD' }
];

const POLICIES = {
  freeship: {
    icon: Truck,
    kicker: 'Freeship từ 300K',
    title: 'Chính sách Freeship',
    lead: `Tiết kiệm phí ship khi mua sắm tại ${SITE.name} trên toàn quốc.`,
    points: [
      'Đơn từ 300.000đ: Freeship toàn quốc (trừ hải đảo).',
      'Đơn dưới 300.000đ: Phí ship 30.000đ cố định toàn quốc.',
      'Áp dụng cho đơn thường, không áp dụng cho Flash Sale.'
    ],
    footnote: 'Phí ship đảo / vùng xa có thể được báo lại trước khi xuất kho.'
  },
  inspect: {
    icon: ShieldCheck,
    kicker: 'Đồng kiểm khi nhận',
    title: 'Quyền đồng kiểm hàng',
    lead: 'Bạn luôn được mở kiện kiểm tra trước khi thanh toán.',
    points: [
      'Bạn có quyền kiểm tra hàng TRƯỚC khi thanh toán.',
      'Không đúng mô tả → từ chối nhận và được hoàn tiền 100%.',
      'Áp dụng với tất cả đơn COD và chuyển khoản trước.',
      'Khuyến nghị quay video lúc mở hàng để làm bằng chứng nếu cần.'
    ],
    footnote: `Nếu shipper không cho đồng kiểm, vui lòng báo ${SITE.name} để xử lý.`
  },
  return7: {
    icon: RotateCcw,
    kicker: 'Đổi trả 7 ngày',
    title: 'Chính sách Đổi Trả',
    lead: 'Đổi trả minh bạch, dễ thao tác chỉ trong vài bước.',
    points: [
      '7 ngày đổi/trả kể từ ngày nhận hàng.',
      'Điều kiện: còn nguyên tem nhãn, chưa qua sử dụng.',
      `Lỗi do sản xuất: đổi mới 100%, ${SITE.name} chịu phí ship.`,
      'Đổi size / màu: khách chịu phí ship 1 chiều.',
      'Liên hệ: chat Zalo hoặc hotline để tạo yêu cầu đổi trả.'
    ]
  },
  support: {
    icon: MessageCircle,
    kicker: 'Hỗ trợ chat nhanh',
    title: 'Kênh Hỗ Trợ',
    lead: `Đội ngũ ${SITE.name} hỗ trợ bạn 24/7 qua nhiều kênh.`,
    points: [
      'Zalo OA: phản hồi trong 5 phút (8h – 22h).',
      'Chat website: có AI hỗ trợ 24/7.',
      'Hotline: 0369712958 (8h – 20h).',
      'Email: tutrantuan988@gmail.com – phản hồi trong 24h.'
    ]
  },
  cod: {
    icon: Wallet,
    kicker: 'Thanh toán COD',
    title: 'Thanh toán khi nhận hàng',
    lead: 'Mua hàng không cần thẻ – trả tiền khi nhận đơn.',
    points: [
      'Trả tiền mặt cho shipper khi nhận hàng.',
      'Không cần thẻ, không cần tài khoản ngân hàng.',
      'Áp dụng toàn quốc cho hầu hết khu vực giao hàng.',
      'Cũng hỗ trợ: Chuyển khoản MBBank.'
    ]
  },
  shipping: {
    icon: Truck,
    kicker: 'Giao hàng',
    title: 'Giao nhanh toàn quốc',
    lead: 'Mạng lưới đối tác vận chuyển phủ khắp 63 tỉnh thành.',
    points: [
      'Phí ship: 30.000đ cố định toàn quốc (freeship từ 300.000đ).',
      'HCM & HN nội thành: giao trong ngày nếu đặt trước 14h.',
      'Tỉnh thành lân cận: 1 – 2 ngày làm việc.',
      'Tỉnh xa / vùng sâu: 3 – 5 ngày làm việc.',
      'Đối tác: GHN, GHTK, J&T Express, Viettel Post.',
      `Theo dõi đơn hàng real-time ngay trên ${SITE.name}.`
    ]
  },
  authentic: {
    icon: BadgeCheck,
    kicker: 'Cam kết chính hãng',
    title: 'Hàng chính hãng – truy xuất nguồn gốc',
    lead: `${SITE.name} chỉ kinh doanh sản phẩm có nguồn gốc rõ ràng.`,
    points: [
      '100% sản phẩm có hoá đơn VAT.',
      'Mỗi sản phẩm có mã QR kiểm tra nguồn gốc.',
      'Hàng lỗi / nhái → hoàn tiền 200% giá trị đơn.',
      'Đối tác với các thương hiệu uy tín trong và ngoài nước.'
    ]
  },
  'support-card': {
    icon: Headphones,
    kicker: 'Chăm sóc khách hàng',
    title: 'Hỗ trợ như shop Việt',
    lead: 'Đội ngũ người Việt, hiểu khách Việt – phản hồi nhanh.',
    points: [
      'Tư vấn qua Zalo, Messenger, hotline và chat website.',
      'Hỗ trợ chọn size, phối đồ, tư vấn quà tặng.',
      'Theo dõi đơn hàng, xử lý khiếu nại nhanh trong 24h.',
      'Đặt lịch giao hàng theo khung giờ thuận tiện.'
    ]
  },
  packaging: {
    icon: PackageCheck,
    kicker: 'Đóng gói an toàn',
    title: 'Đóng gói cẩn thận – kiểm tra trước khi nhận',
    lead: 'Mỗi đơn được đóng gói chuẩn quy trình, an tâm khi nhận.',
    points: [
      'Bọc chống sốc, niêm phong cẩn thận cho hàng dễ vỡ.',
      'Túi / hộp thân thiện môi trường, có sẵn tem niêm phong.',
      'Cho kiểm tra hàng trước khi thanh toán COD.',
      'Có gói quà miễn phí cho dịp lễ / sinh nhật khi yêu cầu.'
    ]
  }
};

const SHOP_CATEGORIES = [
  { slug: 'thoi-trang', name: 'Thời trang', icon: Shirt, color: '#E05353', bg: '#FCEEEF' },
  { slug: 'dien-tu', name: 'Điện tử', icon: Smartphone, color: '#D8BFD8', bg: '#F0E6F6' },
  { slug: 'do-gia-dung', name: 'Gia dụng', icon: Home, color: '#B8D4E3', bg: '#E8F0F8' },
  { slug: 'suc-khoe-lam-dep', name: 'Sức khỏe & Làm đẹp', icon: Sparkles, color: '#C8E6C8', bg: '#E8F5E8' },
  { slug: 'the-thao', name: 'Thể thao', icon: Star, color: '#FFDAB9', bg: '#FFF0E0' },
  { slug: 'sach', name: 'Sách & Văn phòng phẩm', icon: BookOpen, color: '#F4C2C2', bg: '#FCEEEF' },
];

const FLASH_SALE_PRODUCTS = [
  {
    id: 'fs1',
    name: 'Áo khoác nữ dáng ngắn trendy',
    price: 285000,
    oldPrice: 350000,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85&cs=tinysrgb',
    discount: 19
  },
  {
    id: 'fs2',
    name: 'Tai nghe Bluetooth không dây',
    price: 250000,
    oldPrice: 350000,
    image: 'https://images.unsplash.com/photo-1518449007434-83e03aba580a?auto=format&fit=crop&w=900&q=85&cs=tinysrgb',
    discount: 29
  },
  {
    id: 'fs3',
    name: 'Bộ nồi inox cao cấp 5 món',
    price: 320000,
    oldPrice: 455000,
    image: 'https://images.unsplash.com/photo-1505576391880-b3f9d713dc4b?auto=format&fit=crop&w=900&q=85&cs=tinysrgb',
    discount: 23
  },
  {
    id: 'fs4',
    name: 'Nước hoa lifestyle signature',
    price: 195000,
    oldPrice: 250000,
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=900&q=85&cs=tinysrgb',
    discount: 22
  }
];

const WHY_CHOOSE_STATS = [
  { icon: PackageCheck, value: '10.000+', label: 'Đơn hàng thành công', color: '#E05353' },
  { icon: Users, value: '5.000+', label: 'Khách hàng hài lòng', color: '#B8D4E3' },
  { icon: Star, value: '4.9/5', label: 'Đánh giá trung bình', color: '#FFDAB9' },
  { icon: Award, value: '50+', label: 'Thương hiệu đối tác', color: '#D8BFD8' },
];


const HERO_PARTICLES = Array.from({ length: 12 }, (_, index) => index);
const HERO_TRAILS = Array.from({ length: 5 }, (_, index) => index);
const HERO_ORBS = Array.from({ length: 3 }, (_, index) => index);
const HERO_SHARDS = Array.from({ length: 8 }, (_, index) => index);


const LATEST_BLOG = [
  {
    id: 1,
    slug: 'huong-dan-phoi-do-thoi-trang-mua-2026',
    title: 'Hướng dẫn phối đồ thời trang theo mùa 2026',
    category: 'Thời trang',
    date: '2026-05-15',
    image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1000&q=85&cs=tinysrgb'
  },
  {
    id: 2,
    slug: 'top-10-san-pham-cong-nghe-2026',
    title: 'Top 10 sản phẩm công nghệ đáng mua nhất 2026',
    category: 'Công nghệ',
    date: '2026-05-12',
    image: 'https://images.unsplash.com/photo-1505740106531-4243f3831c69?auto=format&fit=crop&w=1000&q=85&cs=tinysrgb'
  },
  {
    id: 3,
    slug: 'huong-dan-chon-nuoc-hoa-phu-hop',
    title: 'Hướng dẫn chọn nước hoa phù hợp với từng dịp',
    category: 'Làm đẹp',
    date: '2026-05-10',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=85&cs=tinysrgb'
  }
];

function FlashCountdown() {
  const [time, setTime] = useState({ h: 0, m: 0, s: 0 });
  useEffect(() => {
    const calc = () => {
      const now = new Date();
      const end = new Date();
      end.setHours(23, 59, 59, 0);
      const diff = Math.max(0, end - now);
      setTime({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000)
      });
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, []);
  const pad = n => String(n).padStart(2, '0');
  return (
    <div className="flash-countdown">
      <Clock size={18} className="flash-countdown-icon" />
      {[{ v: pad(time.h), l: 'Giờ' }, { v: pad(time.m), l: 'Phút' }, { v: pad(time.s), l: 'Giây' }].map((item, i) => (
        <div key={i} className="flash-countdown-group">
          <span className="flash-countdown-value">{item.v}</span>
          {i < 2 && <span className="flash-countdown-sep">:</span>}
        </div>
      ))}
    </div>
  );
}

function TestimonialCarousel() {
  const [current, setCurrent] = useState(0);
  const [progressKey, setProgressKey] = useState(0);
  const intervalRef = useRef(null);
  const reviews = homeReviews;

  const goTo = useCallback((index) => {
    setCurrent(index);
    setProgressKey((k) => k + 1);
  }, []);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % reviews.length);
    setProgressKey((k) => k + 1);
  }, [reviews.length]);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + reviews.length) % reviews.length);
    setProgressKey((k) => k + 1);
  }, [reviews.length]);

  useEffect(() => {
    intervalRef.current = setInterval(next, 5000);
    return () => clearInterval(intervalRef.current);
  }, [next]);

  const handleMouseEnter = () => clearInterval(intervalRef.current);
  const handleMouseLeave = () => {
    intervalRef.current = setInterval(next, 5000);
  };

  const review = reviews[current];

  return (
    <div className="testimonial-carousel" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <div className="testimonial-carousel-track">
        <div className="testimonial-card" key={review.id}>
          <div className="testimonial-card-header">
            <div className="testimonial-avatar">{review.avatar}</div>
            <div className="testimonial-card-info">
              <strong>{review.name}</strong>
              <span>{review.role}</span>
            </div>
          </div>
          <div className="testimonial-stars" aria-label={`${review.rating} sao`}>
            {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
          </div>
          <p className="testimonial-content">"{review.content}"</p>
        </div>
      </div>
      <div className="testimonial-progress" aria-hidden>
        <span key={progressKey} className="testimonial-progress-bar" />
      </div>
      <div className="testimonial-carousel-controls">
        <button type="button" className="testimonial-nav-btn" onClick={prev} aria-label="Đánh giá trước">
          <ChevronLeft size={20} />
        </button>
        <div className="testimonial-dots">
          {reviews.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`testimonial-dot ${i === current ? 'active' : ''}`}
              onClick={() => goTo(i)}
              aria-label={`Đánh giá ${i + 1}`}
            />
          ))}
        </div>
        <button type="button" className="testimonial-nav-btn" onClick={next} aria-label="Đánh giá tiếp theo">
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}

function HomePage() {
  const { isAdmin } = useAuth();
  const [activePolicy, setActivePolicy] = useState(null);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [latestProducts, setLatestProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState(null);
  const [productsError, setProductsError] = useState(null);
  const [industryProducts, setIndustryProducts] = useState({});
  const [featuredProducts, setFeaturedProducts] = useState([]);

  useEffect(() => {
    document.title = `${SITE.name} — Mua sắm đa danh mục, giá tốt mỗi ngày`;
  }, []);

  useEffect(() => {
    setCategoriesLoading(true);
    setCategoriesError(null);
    fetchCategoryTree()
      .then((tree) => {
        setCategories(Array.isArray(tree) ? tree.filter((c) => c.is_active !== false) : []);
      })
      .catch((err) => {
        setCategoriesError(err.message || 'Lỗi tải danh mục');
        setCategories([]);
      })
      .finally(() => setCategoriesLoading(false));
  }, []);

  useEffect(() => {
    setProductsLoading(true);
    setProductsError(null);
    
    // Fetch latest products independently
    fetchProducts({ limit: 8, sort_by: 'created_at', sort_order: 'desc' })
      .then((products) => {
        setLatestProducts(products || []);
      })
      .catch((err) => {
        setProductsError(err.message || 'Lỗi tải sản phẩm mới');
        setLatestProducts([]);
      });

    // Fetch featured products independently
    fetchFeaturedProducts(12)
      .then((products) => {
        setFeaturedProducts(products || []);
      })
      .catch(() => {
        setFeaturedProducts([]);
      })
      .finally(() => {
        setProductsLoading(false);
      });
  }, []);

  const industrySlugs = ['thoi-trang', 'dien-tu', 'do-gia-dung', 'suc-khoe-lam-dep', 'the-thao', 'sach', 'me-be', 'thuc-pham'];
  useEffect(() => {
    industrySlugs.forEach((slug) => {
      fetchProducts({ category_slug: slug, limit: 4, sort_by: 'created_at', sort_order: 'desc' })
        .then((products) => {
          if (products?.length > 0) {
            setIndustryProducts((prev) => ({ ...prev, [slug]: products }));
          }
        })
        .catch(() => {});
    });
  }, []);

  return (
    <>
      <PolicyModal policy={activePolicy} onClose={() => setActivePolicy(null)} />

      {/* ===== HERO SECTION ===== */}
      <section className="hero premium-hero luxe-cinematic-hero" id="home">
        <div className="hero-backdrop" aria-hidden>
          <span className="ambient-wave wave-one" />
          <span className="ambient-wave wave-two" />
          <span className="ambient-wave wave-three" />
        </div>

        <div className="hero-particles" aria-hidden>
          {HERO_PARTICLES.map((particle) => (
            <span
              key={`particle-${particle}`}
              className="hero-particle"
              style={{
                '--particle-index': particle,
                '--x': `${(particle * 7) % 90 + 5}%`,
                '--y': `${(particle * 13) % 70 + 10}%`,
                '--delay': `${particle * 0.2}s`
              }}
            />
          ))}
        </div>

        <div className="hero-light-trails" aria-hidden>
          {HERO_TRAILS.map((trail) => (
            <span
              key={`trail-${trail}`}
              className="hero-light-trail"
              style={{
                '--trail-index': trail,
                '--trail-left': `${16 + trail * 14}%`,
                '--trail-delay': `${trail * 0.8}s`
              }}
            />
          ))}
        </div>

        <div className="hero-content pastel-copy">
          <p className="hero-kicker">Lifestyle Prism Capsule · Soft Bloom Motion</p>
          <h1 className="hero-title-luxe pastel-title">
            Lifestyle dẫn dắt sân khấu pastel sống động, đầy cảm hứng
          </h1>
          <p className="hero-subtitle">
            Bộ sưu tập dream capsule mới của {SITE.name} tái hiện phòng thí nghiệm Lifestyle Motion Lab: ánh sáng volumetric, nhịp chuyển động tinh tế và mọi chi tiết đều mềm mại, giàu cảm xúc.
          </p>
          <div className="hero-points" role="list">
            <span className="hero-point" role="listitem"><Sparkles size={16} aria-hidden /> Lifestyle cinematic loop</span>
            <span className="hero-point" role="listitem"><Gem size={16} aria-hidden /> Lifestyle pastel palette</span>
            <span className="hero-point" role="listitem"><ShieldCheck size={16} aria-hidden /> Capsule Lifestyle chính hãng</span>
          </div>
          <div className="hero-actions">
            <Link className="primary-button sheen-button" to="/danh-muc">
              Bắt đầu trải nghiệm <ArrowRight size={16} aria-hidden />
            </Link>
            <Link className="secondary-button hero-ghost-cta" to="/blog">
              Xem studio tương tác
            </Link>
          </div>
          <div className="hero-meta">
            <span><Truck size={14} aria-hidden /> Giao nhanh toàn quốc</span>
            <span><LockKeyhole size={14} aria-hidden /> Checkout bảo mật</span>
            <span><Heart size={14} aria-hidden /> Stylist tư vấn riêng</span>
          </div>
        </div>

        <div className="hero-visual pastel-stage">
          <div className="mascot-stage" data-tilt data-tilt-max="10" data-tilt-speed="600" data-tilt-perspective="1400">
            <div className="mascot-card" aria-live="polite">
              <p className="mascot-card-label">Lifestyle Blooming Lookbook</p>
              <h3>Pastel Flow Session by Lifestyle</h3>
              <p>Lightweight couture · dreamy accessories · Lifestyle studio exclusive drops</p>
              <div className="mascot-card-meta">
                <span>Lifestyle sparkle feed</span>
                <span>12:12 Lifestyle loop</span>
              </div>
            </div>

            <div className="mascot-floating" aria-label="Mascot bay bổng">
              <div className="mascot-launch" aria-hidden>
                <span className="launch-ring" />
                <span className="launch-ring ring-secondary" />
                <div className="launch-pad">
                  {HERO_SHARDS.map((shard) => (
                    <span
                      key={`shard-${shard}`}
                      className="launch-shard"
                      style={{
                        '--shard-index': shard,
                        '--shard-delay': `${shard * 0.12}s`,
                        '--shard-left': `${8 + shard * 10}%`,
                        '--shard-rotate': `${-20 + shard * 5}deg`
                      }}
                    />
                  ))}
                </div>
                <span className="mascot-shadow" aria-hidden />
              </div>
              <div className="chibi-mascot" role="img" aria-label="Chibi mascot pastel">
                <span className="mascot-pop-glow" aria-hidden />
                <div className="mascot-body">
                  <div className="mascot-head">
                    <span className="mascot-hair" />
                    <span className="mascot-hair fringe" />
                    <span className="mascot-eye eye-left" />
                    <span className="mascot-eye eye-right" />
                    <span className="mascot-cheek cheek-left" />
                    <span className="mascot-cheek cheek-right" />
                    <span className="mascot-smile" />
                  </div>
                  <div className="mascot-dress">
                    <span className="mascot-bow" />
                    <span className="mascot-glint" />
                  </div>
                  <div className="mascot-arm arm-left" />
                  <div className="mascot-arm arm-right" />
                  <div className="mascot-leg leg-left" />
                  <div className="mascot-leg leg-right" />
                </div>
                <div className="mascot-orbit" aria-hidden>
                  {HERO_ORBS.map((orb) => (
                    <span
                      key={`orb-${orb}`}
                      className="floating-orb"
                      style={{
                        '--orb-index': orb,
                        '--orb-delay': `${orb * 0.9}s`
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="floating-lights" aria-hidden>
              {HERO_TRAILS.map((trail) => (
                <span
                  key={`streak-${trail}`}
                  className="light-streak"
                  style={{
                    '--streak-index': trail,
                    '--streak-delay': `${trail * 0.5}s`
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== BRAND STRIP ===== */}
      <section className="brand-strip" aria-label="Các cam kết nổi bật">
        {BRAND_PILLS.map((pill) => {
          const slug = POLICY_SLUG_MAP[pill.id] || 'faq';
          return (
            <Link
              key={pill.id}
              to={`/chinh-sach/${slug}`}
              className="brand-strip-pill"
              aria-label={`Xem chi tiết ${pill.label}`}
            >
              {pill.label}
            </Link>
          );
        })}
      </section>

      {/* ===== SHOP CATEGORY QUICK LINKS ===== */}
      <section className="section shop-categories" aria-labelledby="shop-cat-heading">
        <div className="section-heading centered">
          <div>
            <span className="section-kicker"><ShoppingBag size={16} aria-hidden /> Danh mục mua sắm</span>
            <h2 id="shop-cat-heading">Mua sắm theo nhu cầu</h2>
          </div>
        </div>
        <div className="shop-category-grid">
          {SHOP_CATEGORIES.map((cat) => {
            const CatIcon = cat.icon;
            return (
              <Link
                key={cat.slug}
                to={`/danh-muc/${cat.slug}`}
                className="shop-category-card"
                style={{ '--cat-color': cat.color, '--cat-bg': cat.bg }}
              >
                <div className="shop-category-icon">
                  <CatIcon size={28} />
                </div>
                <span>{cat.name}</span>
                <ChevronRight size={16} className="shop-category-arrow" />
              </Link>
            );
          })}
        </div>
      </section>

      {/* ===== BENEFIT CARDS ===== */}
      <MotionWrapper>
        <section className="benefits" id="benefits" aria-label="Lợi ích khi mua sắm">
          {BENEFIT_CARDS.map((card) => {
            const CardIcon = card.icon;
            return (
              <button
                key={card.id}
                type="button"
                className="benefit-card"
                onClick={() => setActivePolicy(POLICIES[card.id])}
                aria-haspopup="dialog"
              >
                <CardIcon aria-hidden />
                <div>
                  <strong>{card.title}</strong>
                  <span>{card.summary}</span>
                </div>
                <ChevronRight size={18} className="benefit-card-chevron" aria-hidden />
              </button>
            );
          })}
        </section>
      </MotionWrapper>

      {/* ===== FEATURED PRODUCTS (SẢN PHẨM NỔI BẬT) ===== */}
      <section className="section" id="featured-products" aria-labelledby="featured-heading" style={{ maxWidth: '1240px', margin: '0 auto', padding: '24px' }}>
        <div className="section-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <span className="section-kicker" style={{ color: 'var(--accent)', fontWeight: '800', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={16} aria-hidden /> Gợi ý mua sắm
            </span>
            <h2 id="featured-heading" style={{ color: 'var(--ink)', fontSize: '28px', fontWeight: '900', margin: '6px 0 0 0' }}>Sản phẩm nổi bật</h2>
          </div>
          <Link to="/danh-muc" className="secondary-button" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 18px', borderRadius: '20px', fontWeight: '700', fontSize: '14px' }}>
            Xem tất cả <ArrowRight size={16} aria-hidden />
          </Link>
        </div>

        {productsLoading ? (
          <SkeletonGrid count={6} />
        ) : (
          <div className="shopee-products-grid">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>


      {/* ===== WHY CHOOSE US ===== */}
      <MotionWrapper>
        <section className="section why-choose-section" aria-labelledby="why-choose-heading">
          <div className="section-heading centered">
            <div>
              <span className="section-kicker"><Award size={16} aria-hidden /> Tại sao chọn chúng tôi</span>
              <h2 id="why-choose-heading">{SITE.name} có gì đặc biệt?</h2>
              <p className="section-subtitle">Hàng ngàn khách hàng tin tưởng lựa chọn</p>
            </div>
          </div>
          <div className="why-choose-grid">
            {WHY_CHOOSE_STATS.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="why-choose-card">
                  <div className="why-choose-icon" style={{ '--stat-color': stat.color }}>
                    <Icon size={28} />
                  </div>
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              );
            })}
          </div>
          <div className="why-choose-features">
            {[
              { icon: Leaf, title: 'Sản phẩm chính hãng', desc: 'Nguồn gốc rõ ràng, cam kết chất lượng 100%' },
              { icon: ShieldCheck, title: 'Bảo hành chính hãng', desc: 'Hoàn tiền 200% nếu phát hiện hàng giả, hàng nhái' },
              { icon: Heart, title: 'Tư vấn bởi chuyên gia', desc: 'Đội ngũ tư vấn giàu kinh nghiệm hỗ trợ 24/7' },
              { icon: Truck, title: 'Giao hàng thần tốc', desc: 'Nội thành trong ngày, toàn quốc 2-4 ngày' },
            ].map((feature) => {
              const FeatureIcon = feature.icon;
              return (
                <div key={feature.title} className="why-choose-feature">
                  <div className="why-choose-feature-icon">
                    <FeatureIcon size={22} />
                  </div>
                  <div className="why-choose-feature-body">
                    <strong>{feature.title}</strong>
                    <span>{feature.desc}</span>
                  </div>
                  <Check size={18} className="why-choose-feature-check" />
                </div>
              );
            })}
          </div>
        </section>
      </MotionWrapper>

      {/* ===== INDUSTRY PRODUCT SECTIONS ===== */}
      {Object.keys(industryProducts).length > 0 && categories.length > 0 && (
        industrySlugs.map((slug) => {
          const products = industryProducts[slug];
          if (!products || products.length === 0) return null;
          const cat = categories.find((c) => c.slug === slug);
          if (!cat) return null;
          return (
            <section key={slug} className="section industry-section" aria-labelledby={`industry-${slug}`}>
              <div className="section-heading">
                <div>
                  <span className="section-kicker">Ngành hàng</span>
                  <h2 id={`industry-${slug}`}>{cat.name}</h2>
                  <p className="section-subtitle">{cat.description || ''}</p>
                </div>
                <Link to={`/danh-muc/${slug}`} className="secondary-button view-all-btn">
                  Xem tất cả <ArrowRight size={16} aria-hidden />
                </Link>
              </div>
              <div className="latest-product-grid industry-product-grid">
                {products.map((product) => {
                  const productSlug = product.slug || product.id;
                  return (
                    <Link
                      key={product.id}
                      to={`/san-pham/${productSlug}`}
                      className="latest-product-card"
                    >
                      <div className="latest-product-icon industry-product-icon">
                        {product.image ? (
                          <img src={product.image} alt={product.name} loading="lazy" />
                        ) : (
                          <PackageCheck size={28} />
                        )}
                      </div>
                      <div className="latest-product-info">
                        <h4>{product.name}</h4>
                        <strong className="latest-product-price">{formatVND(product.price)}</strong>
                        {product.oldPrice > product.price && (
                          <span className="latest-product-old">{formatVND(product.oldPrice)}</span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })
      )}

      {/* ===== TESTIMONIALS ===== */}
      <section className="section testimonials-section" aria-labelledby="testimonials-heading">
        <div className="section-heading centered">
          <div>
            <span className="section-kicker"><Heart size={16} aria-hidden /> Khách hàng nói gì</span>
            <h2 id="testimonials-heading">Trải nghiệm thực tế</h2>
            <p className="section-subtitle">Cảm nhận từ những khách hàng đã tin tưởng {SITE.name}</p>
          </div>
        </div>
        <TestimonialCarousel />
      </section>

      {/* ===== BLOG PREVIEW ===== */}
      <section className="section" id="latest-blog" aria-labelledby="blog-heading">
        <div className="section-heading">
          <div>
            <span className="section-kicker"><BookOpen size={16} aria-hidden /> Blog & Kiến thức</span>
            <h2 id="blog-heading">Blog & Kiến thức mua sắm</h2>
          </div>
          <Link to="/blog" className="secondary-button view-all-btn">
            Xem tất cả <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
        <div className="blog-preview-grid">
          {LATEST_BLOG.map((post) => (
            <Link key={post.id} to={`/blog/${post.slug}`} className="blog-preview-card">
              <div className="blog-preview-image">
                <img src={post.image} alt={post.title} loading="lazy" />
              </div>
              <div className="blog-preview-body">
                <span className="blog-preview-cat">{post.category}</span>
                <h3>{post.title}</h3>
                <div className="blog-preview-date">
                  <Calendar size={12} />
                  {new Date(post.date).toLocaleDateString('vi-VN')}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ===== NEWSLETTER ===== */}
      <Newsletter />

      {/* ===== QUICK LINKS (admin only) ===== */}
      {isAdmin && (
        <section className="section" id="quick-links" aria-labelledby="quick-heading">
          <div className="section-heading centered">
            <div>
              <span className="section-kicker"><Zap size={16} aria-hidden /> Quản trị</span>
              <h2 id="quick-heading">Công cụ quản lý</h2>
            </div>
          </div>
          <div className="quick-links-grid">
            <Link to="/them-san-pham" className="quick-link-card">
              <PlusCircle size={28} aria-hidden />
              <strong>Thêm sản phẩm mới</strong>
              <span>Tạo sản phẩm với form động theo danh mục</span>
            </Link>
            <Link to="/quan-ly-san-pham" className="quick-link-card">
              <List size={28} aria-hidden />
              <strong>Quản lý sản phẩm</strong>
              <span>Xem, lọc, sửa và xóa sản phẩm</span>
            </Link>
          </div>
        </section>
      )}

      <RecentlyViewed />

      {/* ===== FAQ ===== */}
      <section className="section faq-section" aria-labelledby="faq-heading">
        <div className="section-heading centered">
          <div>
            <span className="section-kicker">Câu hỏi thường gặp</span>
            <h2 id="faq-heading">Mua sắm thông minh tại {SITE.name}</h2>
          </div>
        </div>
        <div className="faq-grid">
          <article>
            <h3>{SITE.name} có gói quà không?</h3>
            <p>Có. Bạn có thể yêu cầu hộp quà, thiệp viết tay và gói theo dịp sinh nhật, kỷ niệm hoặc doanh nghiệp.</p>
          </article>
          <article>
            <h3>Sản phẩm có chính hãng không?</h3>
            <p>Tất cả sản phẩm đều được kiểm định, lưu thông tin bảo hành và hỗ trợ đổi trả theo chính sách.</p>
          </article>
          <article>
            <h3>Có giao nhanh trong ngày không?</h3>
            <p>Có tại một số khu vực nội thành. Hệ thống sẽ gợi ý khung giờ giao nhanh khi bạn thanh toán.</p>
          </article>
        </div>
      </section>

      {/* ===== SCHEMA.ORG FAQPAGE ===== */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": `${SITE.name} có gói quà không?`,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Có. Bạn có thể yêu cầu hộp quà, thiệp viết tay và gói theo dịp sinh nhật, kỷ niệm hoặc doanh nghiệp."
                }
              },
              {
                "@type": "Question",
                "name": "Sản phẩm có chính hãng không?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Tất cả sản phẩm đều được kiểm định, lưu thông tin bảo hành và hỗ trợ đổi trả theo chính sách."
                }
              },
              {
                "@type": "Question",
                "name": "Có giao nhanh trong ngày không?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Có tại một số khu vực nội thành. Hệ thống sẽ gợi ý khung giờ giao nhanh khi bạn thanh toán."
                }
              }
            ]
          })
        }}
      />

      {/* ===== INLINE STYLES FOR NEW SECTIONS ===== */}
      <style>{`
        /* Hero accent */
        .hero-accent {
          color: var(--primary);
        }

        /* Shop Categories */
        .shop-categories {
          padding-top: 0;
        }
        .shop-category-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 16px;
          margin-top: 24px;
        }
        .shop-category-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 28px 16px;
          border-radius: 20px;
          background: var(--cat-bg, #fff4eb);
          text-decoration: none;
          color: var(--ink);
          font-weight: 700;
          font-size: 0.9rem;
          text-align: center;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 2px solid transparent;
          position: relative;
          overflow: hidden;
        }
        .shop-category-card:hover {
          transform: translateY(-4px);
          border-color: var(--cat-color, var(--primary));
          box-shadow: 0 12px 32px rgba(224, 83, 83, 0.12);
        }
        .shop-category-icon {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          background: var(--surface);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--cat-color, var(--primary));
          transition: transform 0.3s ease;
        }
        .shop-category-card:hover .shop-category-icon {
          transform: scale(1.1);
        }
        .shop-category-arrow {
          position: absolute;
          bottom: 8px;
          right: 8px;
          opacity: 0;
          transform: translateX(-4px);
          transition: all 0.3s ease;
          color: var(--cat-color, var(--primary));
        }
        .shop-category-card:hover .shop-category-arrow {
          opacity: 1;
          transform: translateX(0);
        }

        /* Flash Sale */
        .flash-sale-section {
          padding-top: 0;
        }
        .flash-sale-banner {
          background: linear-gradient(135deg, #E05353 0%, #F48080 100%);
          border-radius: 24px;
          padding: 32px;
          color: #fff;
          box-shadow: 0 18px 48px rgba(224, 83, 83, 0.25);
        }
        .flash-sale-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 20px;
          margin-bottom: 24px;
        }
        .flash-sale-title {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .flash-sale-zap {
          flex-shrink: 0;
        }
        .flash-sale-title h2 {
          margin: 0;
          font-size: 1.6rem;
          font-weight: 900;
          letter-spacing: -0.03em;
          color: #fff;
        }
        .flash-sale-title p {
          margin: 4px 0 0;
          opacity: 0.9;
          font-size: 14px;
          color: #fff;
        }
        .flash-countdown {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .flash-countdown-icon {
          color: #fff;
        }
        .flash-countdown-group {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .flash-countdown-value {
          background: rgba(255, 255, 255, 0.2);
          color: #fff;
          border-radius: 8px;
          padding: 4px 10px;
          font-weight: 800;
          font-size: 18px;
          min-width: 42px;
          text-align: center;
          font-variant-numeric: tabular-nums;
        }
        .flash-countdown-sep {
          font-weight: 900;
          font-size: 20px;
        }
        .flash-sale-products {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        .flash-sale-product {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 16px;
          padding: 16px;
          text-decoration: none;
          color: #fff;
          transition: all 0.3s ease;
          position: relative;
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .flash-sale-product:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: translateY(-3px);
        }
        .flash-sale-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          background: #fff;
          color: #E05353;
          font-size: 0.75rem;
          font-weight: 900;
          padding: 4px 8px;
          border-radius: 8px;
        }
        .flash-sale-product-img {
          width: 100%;
          aspect-ratio: 1;
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 12px;
          background: rgba(255, 255, 255, 0.1);
        }
        .flash-sale-product-img img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .flash-sale-product-info h4 {
          margin: 0 0 8px;
          font-size: 0.85rem;
          font-weight: 700;
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .flash-sale-prices {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .flash-sale-price {
          font-weight: 900;
          font-size: 1rem;
        }
        .flash-sale-old-price {
          font-size: 0.8rem;
          opacity: 0.6;
          text-decoration: line-through;
        }
        .flash-sale-footer {
          display: flex;
          justify-content: center;
          margin-top: 24px;
        }
        .flash-sale-cta {
          background: #fff;
          color: #E05353;
          padding: 12px 24px;
          border-radius: 999px;
          font-weight: 900;
          font-size: 14px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          transition: all 0.3s ease;
        }
        .flash-sale-cta:hover {
          transform: scale(1.05);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        }

        /* Why Choose Us */
        .why-choose-section {
          padding-top: 0;
        }
        .section-subtitle {
          color: var(--muted);
          font-size: 1rem;
          margin-top: 8px;
        }
        .why-choose-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-top: 24px;
        }
        .why-choose-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 28px 20px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .why-choose-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08);
        }
        .why-choose-icon {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          background: rgba(224, 83, 83, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--stat-color, var(--primary));
        }
        .why-choose-card strong {
          font-size: 1.5rem;
          font-weight: 900;
          color: var(--text);
        }
        .why-choose-card span {
          font-size: 0.9rem;
          color: var(--muted);
          font-weight: 500;
        }
        .why-choose-features {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-top: 32px;
        }
        .why-choose-feature {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          transition: all 0.3s ease;
        }
        .why-choose-feature:hover {
          border-color: var(--primary);
          box-shadow: 0 8px 24px rgba(224, 83, 83, 0.08);
        }
        .why-choose-feature-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: rgba(224, 83, 83, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary);
          flex-shrink: 0;
        }
        .why-choose-feature-body {
          flex: 1;
        }
        .why-choose-feature-body strong {
          display: block;
          font-size: 0.95rem;
          color: var(--text);
        }
        .why-choose-feature-body span {
          font-size: 0.85rem;
          color: var(--muted);
        }
        .why-choose-feature-check {
          color: #10b981;
          flex-shrink: 0;
        }

        /* Testimonials */
        .testimonials-section {
          padding-top: 0;
        }
        .testimonial-carousel {
          max-width: 720px;
          margin: 0 auto;
        }
        .testimonial-carousel-track {
          min-height: 220px;
        }
        .testimonial-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 24px;
          padding: 32px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.04);
        }
        .testimonial-card-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 16px;
        }
        .testimonial-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary), #F48080);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 0.9rem;
          flex-shrink: 0;
        }
        .testimonial-card-info strong {
          display: block;
          font-size: 1rem;
          color: var(--text);
        }
        .testimonial-card-info span {
          font-size: 0.85rem;
          color: var(--muted);
        }
        .testimonial-stars {
          color: #f59e0b;
          font-size: 1.1rem;
          letter-spacing: 2px;
          margin-bottom: 12px;
        }
        .testimonial-content {
          color: var(--text);
          font-size: 1.05rem;
          line-height: 1.7;
          margin: 0;
        }
        .testimonial-carousel-controls {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin-top: 24px;
        }
        .testimonial-nav-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 1px solid var(--border);
          background: var(--surface);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          color: var(--muted);
        }
        .testimonial-nav-btn:hover {
          border-color: var(--primary);
          color: var(--primary);
          background: rgba(224, 83, 83, 0.06);
        }
        .testimonial-dots {
          display: flex;
          gap: 8px;
        }
        .testimonial-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          border: none;
          background: var(--border);
          cursor: pointer;
          transition: all 0.2s ease;
          padding: 0;
        }
        .testimonial-dot.active {
          background: var(--primary);
          width: 24px;
          border-radius: 5px;
        }

        /* View all button */
        .view-all-btn {
          display: inline-flex;
          gap: 8px;
          align-items: center;
        }

        /* Error / Loading states */
        .error-state {
          text-align: center;
          padding: 48px 24px;
          color: var(--destructive, #e74c3c);
        }
        .error-title {
          font-weight: 600;
          margin-bottom: 8px;
        }
        .error-desc {
          font-size: 0.85rem;
          opacity: 0.7;
        }
        .loading-state {
          text-align: center;
          padding: 32px;
        }
        .empty-result-icon {
          margin-bottom: 16px;
          opacity: 0.5;
        }
        .empty-result-title {
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 8px;
        }
        .empty-result-desc {
          color: var(--muted);
          margin-bottom: 16px;
        }

        /* Category card description */
        .category-card-desc {
          font-size: 13px;
          color: var(--muted);
          margin-top: 4px;
        }

        /* Industry product grid */
        .industry-product-grid {
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        }
        .industry-product-icon {
          width: 64px;
          height: 64px;
        }
        .latest-product-old {
          text-decoration: line-through;
          color: var(--muted);
          font-size: 12px;
          margin-left: 6px;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .shop-category-grid {
            grid-template-columns: repeat(3, 1fr);
          }
          .flash-sale-products {
            grid-template-columns: repeat(2, 1fr);
          }
          .why-choose-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 768px) {
          .shop-category-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .flash-sale-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .flash-sale-products {
            grid-template-columns: 1fr;
          }
          .why-choose-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .why-choose-features {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 480px) {
          .shop-category-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }
          .shop-category-card {
            padding: 20px 12px;
          }
          .why-choose-grid {
            grid-template-columns: 1fr;
          }
          .flash-sale-banner {
            padding: 20px;
          }
        }
      `}</style>
    </>
  );
}

export default memo(HomePage);
