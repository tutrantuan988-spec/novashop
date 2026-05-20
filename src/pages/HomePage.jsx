import { memo, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap, ArrowRight, ShieldCheck, Truck, LockKeyhole, Sparkles, Gem, Headphones, PackageCheck, BadgeCheck, MessageCircle, Wallet, RotateCcw, ChevronRight, PlusCircle, List, ShoppingBag } from 'lucide-react';
import { fetchCategoryTree, fetchProducts } from '../services/apiV2';
import AnimatedHeroCard from '../components/AnimatedHeroCard';
import PolicyModal from '../components/PolicyModal';
import RecentlyViewed from '../components/RecentlyViewed';
import { SkeletonGrid } from '../components/Skeleton';
import Newsletter from '../components/Newsletter';
import MotionWrapper from '../components/MotionWrapper';
import { formatVND } from '../utils/format';
import SITE from '../config/site-config';

const homeReviews = [
  { id: 'r1', name: 'Lan Anh', role: 'Khách hàng thân thiết', rating: 5, content: 'Sản phẩm chất lượng tuyệt vời, giao hàng siêu nhanh. Sẽ ủng hộ shop dài dài!' },
  { id: 'r2', name: 'Hoàng Minh', role: 'Đã mua 3 lần', rating: 4, content: 'Giá cả hợp lý, đóng gói cẩn thận. Shop tư vấn rất nhiệt tình.' },
  { id: 'r3', name: 'Thanh Thảo', role: 'Mua online lần đầu', rating: 5, content: 'Lần đầu mua hàng online nhưng rất yên tâm vì được kiểm tra hàng trước khi nhận.' },
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
  { id: 'authentic', icon: BadgeCheck, title: 'Cam kết chính hãng', summary: 'Sản phẩm có nguồn gốc rõ ràng, đảm bảo chất lượng' },
  { id: 'support-card', icon: Headphones, title: 'Tư vấn tận tình', summary: 'Đội ngũ hỗ trợ qua chat, hotline và Zalo' },
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
  const [activePolicy, setActivePolicy] = useState(null);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [latestProducts, setLatestProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState(null);
  const [productsError, setProductsError] = useState(null);
  const [industryProducts, setIndustryProducts] = useState({});

  useEffect(() => {
    document.title = `${SITE.name} — Mua sắm không giới hạn`;
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
    fetchProducts({ limit: 8, sort_by: 'created_at', sort_order: 'desc' })
      .then((products) => {
        setLatestProducts(products || []);
      })
      .catch((err) => {
        setProductsError(err.message || 'Lỗi tải sản phẩm');
        setLatestProducts([]);
      })
      .finally(() => setProductsLoading(false));
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

      <section className="hero premium-hero" id="home">
        <div className="hero-content">
          <div className="eyebrow"><Zap size={18} aria-hidden /> {SITE.name} — {SITE.slogan}</div>
          <h1>{SITE.name} — {SITE.slogan}.</h1>
          <p>Đa dạng ngành hàng: Thời trang · Điện tử · Gia dụng · Thể thao · Sách · Mẹ & Bé · Thực phẩm · Và hơn thế nữa. COD toàn quốc, freeship từ 300K.</p>
          <div className="hero-actions">
            <Link className="primary-button" to="/danh-muc">Khám phá sản phẩm <ArrowRight size={18} aria-hidden /></Link>
            <a className="secondary-button" href="#categories">Xem danh mục</a>
          </div>
          <div className="hero-trust">
            <span><ShieldCheck size={16} aria-hidden /> 100% chính hãng</span>
            <span><Truck size={16} aria-hidden /> Freeship từ 300K</span>
            <span><LockKeyhole size={16} aria-hidden /> Đổi trả 7 ngày</span>
          </div>
        </div>
        <AnimatedHeroCard />
      </section>

      {/* Brand Strip */}
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

      {/* Benefit Cards */}
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

      {/* SECTION 2 — CATEGORY GRID (dynamic from API) */}
      <section className="section" id="categories" aria-labelledby="categories-heading">
        <div className="section-heading centered">
          <div>
            <span className="section-kicker"><Gem size={16} aria-hidden /> Danh mục sản phẩm</span>
            <h2 id="categories-heading">Khám phá danh mục</h2>
          </div>
        </div>
        {categoriesError ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--error-color, #e74c3c)' }}>
            <p style={{ fontWeight: 600, marginBottom: 8 }}>Không thể tải danh mục</p>
            <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>Vui lòng thử lại sau</p>
          </div>
        ) : categoriesLoading ? (
          <div style={{ textAlign: 'center', padding: '32px' }}>
            <span>Đang tải danh mục...</span>
          </div>
        ) : categories.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', opacity: 0.6 }}>
            Chưa có danh mục nào
          </div>
        ) : (
          <div className="luxury-grid category-api-grid">
            {categories.map((cat) => (
              <Link
                to={`/danh-muc/${cat.slug}`}
                className="luxury-card category-card"
                key={cat.id}
                style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
              >
                <div className="category-card-icon-wrapper">
                  <ShoppingBag size={28} />
                </div>
                <div>
                  <h3>{cat.name}</h3>
                  <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>{cat.description || ''}</p>
                  <span className="luxury-link">Xem sản phẩm <ArrowRight size={16} aria-hidden /></span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* SECTION 3 — LATEST PRODUCTS (dynamic from API) */}
      <section className="section" id="latest-products" aria-labelledby="latest-heading">
        <div className="section-heading">
          <div>
            <span className="section-kicker"><Sparkles size={16} aria-hidden /> Sản phẩm mới nhất</span>
            <h2 id="latest-heading">Hàng mới về</h2>
          </div>
          <Link to="/danh-muc" className="secondary-button" style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
            Xem tất cả <ArrowRight size={16} aria-hidden />
          </Link>
        </div>

        {productsError ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--error-color, #e74c3c)' }}>
            <p style={{ fontWeight: 600, marginBottom: 8 }}>Không thể tải sản phẩm</p>
            <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>Vui lòng thử lại sau</p>
          </div>
        ) : productsLoading ? (
          <SkeletonGrid count={6} />
        ) : latestProducts.length === 0 ? (
          <div className="empty-result" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <PackageCheck size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
            <p style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 8 }}>Chưa có sản phẩm nào</p>
            <p style={{ color: 'var(--muted)', marginBottom: 16 }}>Sản phẩm đang được cập nhật</p>
            <Link to="/them-san-pham" className="primary-button" style={{ display: 'inline-flex', gap: 8 }}>
              <PlusCircle size={18} /> Thêm sản phẩm đầu tiên
            </Link>
          </div>
        ) : (
          <div className="latest-product-grid">              {latestProducts.map((product) => {
              const productSlug = product.slug || product.id;
              return (
                <Link
                  key={product.id}
                  to={`/san-pham/${productSlug}`}
                  className="latest-product-card"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div className="latest-product-icon" style={{ overflow: 'hidden' }}>
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }}
                        loading="lazy"
                      />
                    ) : (
                      <PackageCheck size={32} />
                    )}
                  </div>
                  <div className="latest-product-info">
                    <h4>{product.name}</h4>
                    <span className="latest-product-category">{product.category || product.brand || ''}</span>
                    <strong className="latest-product-price">{formatVND(product.price)}</strong>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 4 — INDUSTRY PRODUCT SECTIONS */}
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
                  <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>{cat.description || ''}</p>
                </div>
                <Link to={`/danh-muc/${slug}`} className="secondary-button" style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                  Xem tất cả <ArrowRight size={16} aria-hidden />
                </Link>
              </div>
              <div className="latest-product-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
                {products.map((product) => {
                  const productSlug = product.slug || product.id;
                  return (
                    <Link
                      key={product.id}
                      to={`/san-pham/${productSlug}`}
                      className="latest-product-card"
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <div className="latest-product-icon" style={{ overflow: 'hidden', width: 64, height: 64 }}>
                        {product.image ? (
                          <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} loading="lazy" />
                        ) : (
                          <PackageCheck size={28} />
                        )}
                      </div>
                      <div className="latest-product-info">
                        <h4>{product.name}</h4>
                        <strong className="latest-product-price">{formatVND(product.price)}</strong>
                        {product.oldPrice > product.price && (
                          <span style={{ textDecoration: 'line-through', color: 'var(--muted)', fontSize: 12, marginLeft: 6 }}>{formatVND(product.oldPrice)}</span>
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

      {/* SECTION 5 — QUICK LINKS (static, generic) */}
      <section className="section" id="quick-links" aria-labelledby="quick-heading">
        <div className="section-heading centered">
          <div>
            <span className="section-kicker"><Zap size={16} aria-hidden /> Tiện ích</span>
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

      {/* Reviews */}
      {homeReviews.length > 0 && (
        <section className="section reviews" id="reviews" aria-labelledby="reviews-heading">
          <div className="section-heading">
            <div>
              <span className="section-kicker">Khách hàng nói gì</span>
              <h2 id="reviews-heading">Trải nghiệm thực tế</h2>
            </div>
          </div>
          <div className="review-grid">
            {homeReviews.slice(0, 3).map((review) => (
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

      <Newsletter />

      {/* FAQ */}
      <section className="section faq-section" aria-labelledby="faq-heading">
        <div className="section-heading centered">
          <div>
            <span className="section-kicker">Câu hỏi thường gặp</span>
            <h2 id="faq-heading">Mua sắm thông minh tại {SITE.name}</h2>
          </div>
        </div>
        <div className="faq-grid">
          <article><h3>{SITE.name} có gói quà không?</h3><p>Có. Bạn có thể yêu cầu hộp quà, thiệp viết tay và gói theo dịp sinh nhật, kỷ niệm hoặc doanh nghiệp.</p></article>
          <article><h3>Sản phẩm có chính hãng không?</h3><p>Tất cả sản phẩm đều được kiểm định, lưu thông tin bảo hành và hỗ trợ đổi trả theo chính sách.</p></article>
          <article><h3>Có giao nhanh trong ngày không?</h3><p>Có tại một số khu vực nội thành. Hệ thống sẽ gợi ý khung giờ giao nhanh khi bạn thanh toán.</p></article>
        </div>
      </section>

      {/* Inline styles for new sections */}
      <style>{`
        .category-api-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }
        .category-card {
          background: var(--card-bg, #fff);
          border-radius: 12px;
          overflow: hidden;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 32px 24px;
          gap: 12px;
        }
        .category-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
        }
        .category-card-icon-wrapper {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: var(--accent-bg, #f0f0ff);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent, #6c5ce7);
        }
        .category-card h3 {
          margin: 0;
          font-size: 1.15rem;
        }
        .latest-product-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 16px;
        }
        .latest-product-card {
          background: var(--card-bg, #fff);
          border-radius: 12px;
          padding: 20px;
          display: flex;
          gap: 16px;
          align-items: center;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }
        .latest-product-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.1);
        }
        .latest-product-icon {
          width: 56px;
          height: 56px;
          border-radius: 10px;
          background: var(--accent-bg, #f0f0ff);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-weight: 700;
          font-size: 1.2rem;
          color: var(--accent, #6c5ce7);
        }
        .latest-product-info {
          flex: 1;
          min-width: 0;
        }
        .latest-product-info h4 {
          margin: 0 0 4px;
          font-size: 0.95rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .latest-product-category {
          font-size: 0.8rem;
          color: var(--muted, #888);
          display: block;
          margin-bottom: 4px;
        }
        .latest-product-price {
          font-size: 1rem;
          color: var(--price-color, #e74c3c);
        }
        .quick-links-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 16px;
          max-width: 600px;
          margin: 0 auto;
        }
        .quick-link-card {
          background: var(--card-bg, #fff);
          border-radius: 12px;
          padding: 28px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 8px;
          text-decoration: none;
          color: inherit;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }
        .quick-link-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
        }
        .quick-link-card strong {
          font-size: 1.05rem;
        }
        .quick-link-card span {
          font-size: 0.85rem;
          color: var(--muted, #888);
        }
      `}</style>
    </>
  );
}

export default memo(HomePage);
