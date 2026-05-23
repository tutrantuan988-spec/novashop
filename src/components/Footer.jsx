import { memo, useState } from 'react';
import { Mail, MapPin, Phone, Send, Facebook, Instagram, Music, Youtube, Zap } from 'lucide-react';
import SITE from '../config/site-config';
import { useI18n } from '../context/I18nContext';

const SOCIAL_LINKS = [
  { name: 'Facebook', href: SITE.facebook, Icon: Facebook },
  { name: 'Instagram', href: SITE.instagram, Icon: Instagram },
  { name: 'TikTok', href: SITE.tiktok, Icon: Music },
  { name: 'YouTube', href: SITE.youtube, Icon: Youtube },
];

const PAYMENT_METHODS = [
  { name: 'COD', label: 'COD' },
  { name: 'Bank', label: 'ATM' },
  { name: 'MoMo', label: 'MoMo' },
  { name: 'VNPay', label: 'VNPay' },
  { name: 'Stripe', label: 'Stripe' },
];

function ZaloIcon({ size = 20, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 13.27c-.32.48-.88.96-1.6 1.28-.16.08-.32.12-.48.16l-.08.04c-.12.04-.2.08-.28.12-.12.08-.2.16-.24.28l-.04.12c-.04.12-.04.24.04.36.08.12.2.2.36.24h.04c.12.04.24.04.36 0 .16-.08.32-.2.44-.36.12-.16.2-.36.2-.56v-.08c0-.2-.04-.4-.12-.56-.08-.16-.2-.28-.36-.36-.16-.08-.32-.12-.52-.12h-.08c-.2 0-.4.04-.56.12-.16.08-.28.2-.36.36-.08.16-.12.36-.12.56v.08c0 .2.04.4.12.56.08.16.2.28.36.36.16.08.32.12.52.12h.08c.2 0 .4-.04.56-.12.16-.08.28-.2.36-.36.08-.16.12-.36.12-.56v-.08c0-.12-.04-.24-.08-.36-.04-.12-.12-.2-.2-.28-.08-.08-.2-.12-.32-.16l-.04-.02c-.12-.04-.24-.08-.36-.08h-.04c-.12 0-.24.04-.32.08-.08.04-.16.12-.2.2-.04.08-.08.2-.08.32v.04c0 .12.04.24.08.32.04.08.12.16.2.2.08.04.2.08.32.08h.04c.12 0 .24-.04.32-.08.08-.04.16-.12.2-.2.04-.08.08-.2.08-.32v-.04c0-.12-.04-.24-.08-.32-.04-.08-.12-.16-.2-.2-.08-.04-.2-.08-.32-.08h-.04c-.12 0-.24.04-.32.08-.08.04-.16.12-.2.2-.04.08-.08.2-.08.32v.04c0 .12.04.24.08.32.04.08.12.16.2.2.08.04.2.08.32.08h.04c.12 0 .24-.04.32-.08.08-.04.16-.12.2-.2.04-.08.08-.2.08-.32v-.04c0-.12-.04-.24-.08-.32-.04-.08-.12-.16-.2-.2-.08-.04-.2-.08-.32-.08h-.04c-.12 0-.24.04-.32.08-.08.04-.16.12-.2.2-.04.08-.08.2-.08.32v.04c0 .12.04.24.08.32.04.08.12.16.2.2.08.04.2.08.32.08h.04c.12 0 .24-.04.32-.08.08-.04.16-.12.2-.2.04-.08.08-.2.08-.32v-.04c0-.12-.04-.24-.08-.32-.04-.08-.12-.16-.2-.2-.08-.04-.2-.08-.32-.08h-.04c-.12 0-.24.04-.32.08-.08.04-.16.12-.2.2-.04.08-.08.2-.08.32v.04c0 .12.04.24.08.32.04.08.12.16.2.2.08.04.2.08.32.08h.04" />
    </svg>
  );
}

function Footer() {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <footer className="footer" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">Footer {SITE.name}</h2>
      <div className="footer-highlight-strip" aria-label="Chỉ số vận hành">
        <div><strong>10.000+</strong><span>Đơn thành công</span></div>
        <div><strong>4.9/5</strong><span>Điểm hài lòng</span></div>
        <div><strong>63 Tỉnh</strong><span>Giao hàng toàn quốc</span></div>
        <div><strong>24/7</strong><span>Hỗ trợ khách hàng</span></div>
      </div>
      <div className="footer-container">
        <div className="footer-top">
          <div className="footer-grid">
            <div className="footer-col footer-col-about">
              <div className="footer-brand">
                <span className="footer-logo-icon"><Zap size={20} aria-hidden /></span>
                <strong>{SITE.name}</strong>
              </div>
              <p className="footer-desc">
                {SITE.name} – Sàn thương mại điện tử đa danh mục: Thời trang, Điện tử, Gia dụng, Làm đẹp & nhiều hơn nữa.
              </p>
              <div className="footer-company-info">
                <div className="footer-info-row">
                  <MapPin size={14} aria-hidden />
                  <span>{SITE.address}</span>
                </div>
                <div className="footer-info-row">
                  <Phone size={14} aria-hidden />
                  <a href={`tel:${SITE.phone}`}>{SITE.phone}</a>
                </div>
                <div className="footer-info-row">
                  <Mail size={14} aria-hidden />
                  <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
                </div>
                <div className="footer-info-row">
                  <span className="footer-mst-label">MST:</span>
                  <span>{SITE.taxId}</span>
                </div>
              </div>
            </div>

            <div className="footer-col footer-col-links">
              <h3>{t.footer.about} {SITE.name}</h3>
              <ul>
                <li><a href="/about">Giới thiệu</a></li>
                <li><a href="/blog">Blog & Kiến thức</a></li>
                <li><a href="/danh-muc">Danh mục sản phẩm</a></li>
                <li><a href="/flash-sale">Flash Sale</a></li>
                <li><a href="/contact">{t.footer.contact}</a></li>
              </ul>
            </div>

            <div className="footer-col footer-col-support">
              <h3>{t.footer.support}</h3>
              <ul>
                <li><a href="/chinh-sach/doi-tra">{t.footer.returns}</a></li>
                <li><a href="/chinh-sach/van-chuyen">{t.footer.shipping}</a></li>
                <li><a href="/chinh-sach/bao-mat">{t.footer.privacy}</a></li>
                <li><a href="/chinh-sach/dieu-khoan">{t.footer.terms}</a></li>
                <li><a href="/chinh-sach/faq">{t.footer.faq}</a></li>
              </ul>
            </div>

            <div className="footer-col footer-col-newsletter">
              <h3>Đăng ký nhận tin</h3>
              <p className="footer-newsletter-desc">
                Nhận ngay mã giảm giá & tin tức khuyến mãi mới nhất.
              </p>
              <form className="footer-newsletter-form" onSubmit={handleNewsletterSubmit}>
                <div className="footer-newsletter-input-wrap">
                  <Mail size={16} className="footer-newsletter-icon" aria-hidden />
                  <input
                    type="email"
                    placeholder="Email của bạn"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    aria-label="Địa chỉ email đăng ký nhận tin"
                  />
                  <button type="submit" aria-label="Đăng ký">
                    <Send size={16} aria-hidden />
                  </button>
                </div>
                {subscribed && (
                  <span className="footer-newsletter-success">
                    Đăng ký thành công! Cảm ơn bạn.
                  </span>
                )}
              </form>
              <div className="footer-social" aria-label="Mạng xã hội">
                {SOCIAL_LINKS.map(({ name, href, Icon }) => (
                  <a
                    key={name}
                    href={href}
                    aria-label={name}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="footer-social-link"
                  >
                    <Icon size={18} aria-hidden />
                  </a>
                ))}
                <a
                  href={SITE.zalo}
                  aria-label="Zalo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-social-link footer-social-zalo"
                >
                  <ZaloIcon size={18} aria-hidden />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-bottom-left">
            <span>© {new Date().getFullYear()} {SITE.name}. Mọi quyền được bảo lưu.</span>
          </div>
          <div className="footer-payments">
            <span className="footer-payments-label">Thanh toán:</span>
            <div className="footer-payment-icons">
              {PAYMENT_METHODS.map(({ name, label }) => (
                <span key={name} className="footer-payment-icon" title={name}>
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default memo(Footer);
