import { memo, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap, ArrowRight, ShieldCheck, Truck, LockKeyhole, Search, Sparkles, X, Gem, Headphones, PackageCheck, BadgeCheck, Star, Filter, SlidersHorizontal, Clock, Crown, Gift, MessageCircle, Wallet, RotateCcw, ChevronRight } from 'lucide-react';
import AnimatedHeroCard from '../components/AnimatedHeroCard';
import PolicyModal from '../components/PolicyModal';
import { useProducts } from '../context/ProductsContext';
import { categories, reviews } from '../data/products';
import ProductCard from '../components/ProductCard';
import RecentlyViewed from '../components/RecentlyViewed';
import { SkeletonGrid } from '../components/Skeleton';
import FlashSale from '../components/FlashSale';
import Newsletter from '../components/Newsletter';
import MotionWrapper from '../components/MotionWrapper';
import { formatVND } from '../utils/format';
import SITE from '../config/site-config';

const SORT_OPTIONS = [
  { value: 'featured', label: 'Nổi bật' },
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price-asc', label: 'Giá: thấp → cao' },
  { value: 'price-desc', label: 'Giá: cao → thấp' },
  { value: 'rating', label: 'Đánh giá cao' },
  { value: 'popular', label: 'Bán chạy' }
];

const BRAND_PILLS = [
  { id: 'freeship', label: 'Freeship từ 300K' },
  { id: 'inspect', label: 'Đồng kiểm khi nhận' },
  { id: 'return7', label: 'Đổi trả 7 ngày' },
  { id: 'support', label: 'Hỗ trợ chat nhanh' },
  { id: 'cod', label: 'Thanh toán COD' }
];

const BENEFIT_CARDS = [
  { id: 'shipping', icon: Truck, title: 'Giao nhanh toàn quốc', summary: 'Nội thành trong ngày, tỉnh thành 2-4 ngày' },
  { id: 'authentic', icon: BadgeCheck, title: 'Cam kết chính hãng', summary: 'Thức ăn nhập khẩu, có nguồn gốc rõ ràng' },
  { id: 'support-card', icon: Headphones, title: 'Tư vấn dinh dưỡng', summary: 'Tư vấn nhanh qua chat, hotline và Zalo' },
  { id: 'packaging', icon: PackageCheck, title: 'Đóng gói cẩn thận', summary: 'Bảo quản tốt, kiểm tra hàng trước khi thanh toán COD' }
];

const POLICIES = {
  freeship: {
    icon: Truck,
    kicker: 'Freeship từ 300K',
    title: 'Chính sách Freeship',
    lead: 'Tiết kiệm phí ship khi mua sắm tại TRỌNG ĐỊNH STORE trên toàn quốc.',
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
    footnote: 'Nếu shipper không cho đồng kiểm, vui lòng báo TRỌNG ĐỊNH STORE để xử lý.'
  },
  return7: {
    icon: RotateCcw,
    kicker: 'Đổi trả 7 ngày',
    title: 'Chính sách Đổi Trả',
    lead: 'Đổi trả minh bạch, dễ thao tác chỉ trong vài bước.',
    points: [
      '7 ngày đổi/trả kể từ ngày nhận hàng.',
      'Điều kiện: còn nguyên tem nhãn, chưa qua sử dụng.',
      'Lỗi do sản xuất: đổi mới 100%, TRỌNG ĐỊNH STORE chịu phí ship.',
      'Đổi size / màu: khách chịu phí ship 1 chiều.',
      'Liên hệ: chat Zalo hoặc hotline để tạo yêu cầu đổi trả.'
    ]
  },
  support: {
    icon: MessageCircle,
    kicker: 'Hỗ trợ chat nhanh',
    title: 'Kênh Hỗ Trợ',
    lead: 'Đội ngũ TRỌNG ĐỊNH STORE hỗ trợ bạn 24/7 qua nhiều kênh.',
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
      'Theo dõi đơn hàng real-time ngay trên TRỌNG ĐỊNH STORE.'
    ]
  },
  authentic: {
    icon: BadgeCheck,
    kicker: 'Cam kết chính hãng',
    title: 'Hàng chính hãng – truy xuất nguồn gốc',
    lead: 'TRỌNG ĐỊNH STORE chỉ kinh doanh sản phẩm có nguồn gốc rõ ràng.',
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

function HomePage() {
  const { items, loading } = useProducts();
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('featured');
  const [minRating, setMinRating] = useState(0);
  const [priceMax, setPriceMax] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [activePolicy, setActivePolicy] = useState(null);

  useEffect(() => {
    document.title = `${SITE.name} - Thức ăn chính hãng cho thú cưng`;
  }, []);

  const priceCeiling = useMemo(() => {
    if (!items.length) return 0;
    return Math.max(...items.map((p) => Number(p.price) || 0));
  }, [items]);

  useEffect(() => {
    if (priceMax === null && priceCeiling > 0) {
      setPriceMax(priceCeiling);
    }
  }, [priceCeiling, priceMax]);

  const filteredProducts = useMemo(() => {
    const lowerQuery = query.trim().toLowerCase();
    const cap = priceMax ?? priceCeiling;

    let list = items.filter((product) => {
      const matchesCategory = activeCategory === 'Tất cả' || product.category === activeCategory;
      const text = [product.name, product.description, product.category, ...(product.colors || []), ...(product.sizes || [])]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const matchesQuery = !lowerQuery || text.includes(lowerQuery);
      const matchesRating = !minRating || (Number(product.rating) || 0) >= minRating;
      const matchesPrice = !cap || (Number(product.price) || 0) <= cap;
      return matchesCategory && matchesQuery && matchesRating && matchesPrice;
    });

    list = [...list];
    switch (sort) {
      case 'newest':
        list.sort((a, b) => Number(b.id) - Number(a.id));
        break;
      case 'price-asc':
        list.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
        break;
      case 'price-desc':
        list.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
        break;
      case 'rating':
        list.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
        break;
      case 'popular':
        list.sort((a, b) => (Number(b.reviewCount) || 0) - (Number(a.reviewCount) || 0));
        break;
      default:
        break;
    }
    return list;
  }, [items, activeCategory, query, sort, minRating, priceMax, priceCeiling]);

  const topProducts = useMemo(() => items.slice(0, 4), [items]);

  const activeFilterCount = (activeCategory !== 'Tất cả' ? 1 : 0)
    + (query ? 1 : 0)
    + (minRating > 0 ? 1 : 0)
    + (priceMax !== null && priceMax < priceCeiling ? 1 : 0);

  const resetFilters = () => {
    setActiveCategory('Tất cả');
    setQuery('');
    setSort('featured');
    setMinRating(0);
    setPriceMax(priceCeiling);
  };

  const luxuryCollections = [
    {
      title: 'Thức Ăn Cho Chó',
      label: 'DINH DƯỠNG CHO BÉ CÚN',
      image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=900&q=80',
      slug: '/dog-food'
    },
    {
      title: 'Thức Ăn Cho Mèo',
      label: 'CHĂM SÓC BÉ MÈO',
      image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=900&q=80',
      slug: '/cat-food'
    },
    {
      title: 'Phụ Kiện Thú Cưng',
      label: 'ĐỒ CHƠI & VẬT DỤNG',
      image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=900&q=80',
      slug: '/pet-accessories'
    }
  ];

  return (
    <>
      <PolicyModal policy={activePolicy} onClose={() => setActivePolicy(null)} />
      <section className="hero premium-hero" id="home">
        <div className="hero-content">
          <div className="eyebrow"><Zap size={18} aria-hidden /> {SITE.name} Việt Nam • Sale mỗi ngày</div>
          <h1>Thức ăn chính hãng cho thú cưng, giao nhanh tận nhà.</h1>
          <p>{SITE.name} chuyên cung cấp thức ăn chính hãng cho thú cưng, thanh toán COD hoặc chuyển khoản MBBank và giao hàng toàn quốc.</p>
          <div className="hero-actions">
            <a className="primary-button" href="#products">Mua sắm ngay <ArrowRight size={18} aria-hidden /></a>
            <a className="secondary-button" href="#deals">Xem ưu đãi hôm nay</a>
          </div>
          <div className="hero-stats">
            <div><strong>Chính hãng</strong><span>Thức ăn nhập khẩu</span></div>
            <div><strong>24h</strong><span>Giao nhanh nội thành</span></div>
            <div><strong>7 ngày</strong><span>Đổi trả dễ dàng</span></div>
          </div>
          <div className="hero-trust">
            <span><ShieldCheck size={16} aria-hidden /> Hàng chính hãng</span>
            <span><Truck size={16} aria-hidden /> Freeship từ 300K</span>
            <span><LockKeyhole size={16} aria-hidden /> Thanh toán an toàn</span>
          </div>
        </div>
        <AnimatedHeroCard />
      </section>

      <section className="brand-strip" aria-label="Các cam kết nổi bật">
        {BRAND_PILLS.map((pill) => (
          <button
            key={pill.id}
            type="button"
            className="brand-strip-pill"
            onClick={() => setActivePolicy(POLICIES[pill.id])}
            aria-haspopup="dialog"
          >
            {pill.label}
          </button>
        ))}
      </section>

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

      <RecentlyViewed />

      <section className="section luxury-section" id="luxury" aria-labelledby="luxury-heading">
        <div className="section-heading centered">
          <div>
            <span className="section-kicker"><Gem size={16} aria-hidden /> Danh mục Việt Nam</span>
            <h2 id="luxury-heading">Khám phá danh mục nổi bật</h2>
          </div>
        </div>
        <div className="luxury-grid">
          {luxuryCollections.map((collection) => (
            <Link
              to={collection.slug}
              className="luxury-card"
              key={collection.title}
              style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
            >
              <img src={collection.image} alt={collection.title} loading="lazy" decoding="async" />
              <div>
                <span>{collection.label}</span>
                <h3>{collection.title}</h3>
                <span className="luxury-link">Khám phá ngay <ArrowRight size={16} aria-hidden /></span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="section" id="products" aria-labelledby="products-heading">
        <div className="section-heading">
          <div>
            <span className="section-kicker"><Sparkles size={16} aria-hidden /> Sản phẩm nổi bật</span>
            <h2 id="products-heading">Những món đáng sở hữu hôm nay</h2>
          </div>
          <div className="search-box">
            <Search size={18} aria-hidden />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm theo tên, mô tả, màu, size..."
              aria-label="Tìm sản phẩm"
              type="search"
            />
            {query && (
              <button type="button" className="search-clear" onClick={() => setQuery('')} aria-label="Xoá tìm kiếm">
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="categories" role="tablist" aria-label="Danh mục sản phẩm">
          {categories.map((category) => (
            <button
              type="button"
              role="tab"
              aria-selected={activeCategory === category}
              className={activeCategory === category ? 'active' : ''}
              onClick={() => setActiveCategory(category)}
              key={category}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="filter-bar">
          <button
            type="button"
            className={`filter-toggle ${showFilters ? 'open' : ''}`}
            onClick={() => setShowFilters((s) => !s)}
            aria-expanded={showFilters}
          >
            <SlidersHorizontal size={16} aria-hidden /> Bộ lọc
            {activeFilterCount > 0 && <span className="filter-badge">{activeFilterCount}</span>}
          </button>

          <div className="sort-select">
            <label htmlFor="sort">Sắp xếp:</label>
            <select id="sort" value={sort} onChange={(event) => setSort(event.target.value)}>
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <span className="result-count">{filteredProducts.length} sản phẩm</span>

          {activeFilterCount > 0 && (
            <button type="button" className="filter-reset" onClick={resetFilters}>
              <X size={14} aria-hidden /> Xoá bộ lọc
            </button>
          )}
        </div>

        {showFilters && (
          <div className="filter-panel">
            <div className="filter-group">
              <label>
                <span>Giá tối đa: <strong>{formatVND(priceMax ?? priceCeiling)}</strong></span>
                <input
                  type="range"
                  min={0}
                  max={priceCeiling || 100}
                  step={Math.max(10000, Math.round((priceCeiling || 100) / 50))}
                  value={priceMax ?? priceCeiling}
                  onChange={(event) => setPriceMax(Number(event.target.value))}
                />
              </label>
            </div>
            <div className="filter-group">
              <span>Đánh giá tối thiểu</span>
              <div className="rating-pills">
                {[0, 3, 4, 4.5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={minRating === value ? 'rating-pill active' : 'rating-pill'}
                    onClick={() => setMinRating(value)}
                  >
                    {value === 0 ? 'Tất cả' : (
                      <>
                        <Star size={12} fill="currentColor" aria-hidden /> {value}+
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <SkeletonGrid count={8} />
        ) : filteredProducts.length === 0 ? (
          <div className="empty-result" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <PackageCheck size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
            <p style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 8 }}>Sản phẩm đang được cập nhật</p>
            <p style={{ color: 'var(--muted)', marginBottom: 16 }}>Liên hệ Zalo <strong>0369712958</strong> để đặt hàng trực tiếp</p>
            <a href="https://zalo.me/0369712958" target="_blank" rel="noopener noreferrer" className="primary-button" style={{ display: 'inline-flex', gap: 8 }}>
              <MessageCircle size={18} /> Chat Zalo đặt hàng
            </a>
          </div>
        ) : (
          <div className="product-grid">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      <MotionWrapper>
        <FlashSale />
      </MotionWrapper>

      {topProducts.length > 0 && (
        <section className="section editorial-section" aria-labelledby="editorial-heading">
          <div className="editorial-card">
            <div>
              <span className="section-kicker"><Star size={16} aria-hidden /> Editor's pick</span>
              <h2 id="editorial-heading">Top sản phẩm được đội ngũ {SITE.name} đề xuất</h2>
              <p>Danh sách được chọn theo xu hướng, điểm đánh giá, chất lượng hoàn thiện và độ phù hợp.</p>
            </div>
            <div className="mini-products">
              {topProducts.map((product, index) => (
                <a href={`/san-pham/${product.slug}`} className="mini-product" key={product.id}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <img src={product.image} alt={product.name} loading="lazy" />
                  <div>
                    <strong>{product.name}</strong>
                    <small>{product.category} · {product.rating}★</small>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {reviews.length > 0 && (
        <section className="section reviews" id="reviews" aria-labelledby="reviews-heading">
          <div className="section-heading">
            <div>
              <span className="section-kicker">Khách hàng nói gì</span>
              <h2 id="reviews-heading">Trải nghiệm được tin chọn</h2>
            </div>
          </div>
          <div className="review-grid">
            {reviews.slice(0, 3).map((review) => (
              <article key={review.id}>
                <div aria-label={`${review.rating} sao`}>{'★'.repeat(review.rating)}</div>
                <p>"{review.content}"</p>
                <strong>{review.name}</strong>
                <span className="reviewer-role">{review.role}</span>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="deal-section" id="deals" aria-labelledby="deal-heading">
        <div>
          <span className="section-kicker"><Zap size={16} aria-hidden /> Ưu đãi giới hạn</span>
          <h2 id="deal-heading">Ưu đãi cho thành viên mới</h2>
          <p>Đăng ký tài khoản để nhận thông báo ưu đãi và mã giảm giá mới nhất từ {SITE.name}.</p>
          <div className="countdown" aria-label="Đếm ngược ưu đãi">
            <span><Clock size={15} aria-hidden /> 12 giờ</span>
            <span>28 phút</span>
            <span>45 giây</span>
          </div>
        </div>
        <a className="primary-button" href="#products">Săn deal ngay <ArrowRight size={18} aria-hidden /></a>
      </section>

      <section className="section concierge-section" id="concierge" aria-labelledby="concierge-heading">
        <div className="concierge-panel">
          <div>
            <span className="section-kicker"><Crown size={16} aria-hidden /> {SITE.name} Concierge</span>
            <h2 id="concierge-heading">Dịch vụ mua sắm cá nhân cho khách hàng VIP</h2>
            <p>Đội ngũ concierge hỗ trợ chọn quà, phối sản phẩm, đặt lịch giao theo khung giờ, gói quà theo dịp và chăm sóc sau mua.</p>
            <a className="primary-button" href="#products">Bắt đầu trải nghiệm VIP</a>
          </div>
          <div className="concierge-list">
            <article><Gift aria-hidden /><strong>Gift advisor</strong><span>Gợi ý quà theo ngân sách và phong cách người nhận.</span></article>
            <article><ShieldCheck aria-hidden /><strong>Premium assurance</strong><span>Kiểm tra ngoại quan, phụ kiện và bảo hành trước khi giao.</span></article>
            <article><Headphones aria-hidden /><strong>Priority support</strong><span>Hỗ trợ ưu tiên qua chat, điện thoại và email.</span></article>
          </div>
        </div>
      </section>

      <Newsletter />

      <section className="section faq-section" aria-labelledby="faq-heading">
        <div className="section-heading centered">
          <div>
            <span className="section-kicker">Câu hỏi thường gặp</span>
            <h2 id="faq-heading">Mua sắm thông minh cho thú cưng</h2>
          </div>
        </div>
        <div className="faq-grid">
          <article><h3>{SITE.name} có gói quà không?</h3><p>Có. Bạn có thể yêu cầu hộp quà, thiệp viết tay và gói theo dịp sinh nhật, kỷ niệm hoặc doanh nghiệp.</p></article>
          <article><h3>Sản phẩm có chính hãng không?</h3><p>Tất cả sản phẩm đều được kiểm định, lưu thông tin bảo hành và hỗ trợ đổi trả theo chính sách.</p></article>
          <article><h3>Có giao nhanh trong ngày không?</h3><p>Có tại một số khu vực nội thành. Hệ thống sẽ gợi ý khung giờ giao nhanh khi bạn thanh toán.</p></article>
        </div>
      </section>
    </>
  );
}

export default memo(HomePage);
