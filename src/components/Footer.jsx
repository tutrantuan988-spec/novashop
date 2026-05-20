import { memo } from 'react';
import { Mail, MapPin, Phone, ShoppingBag } from 'lucide-react';
import SITE from '../config/site-config';
import { useI18n } from '../context/I18nContext';

function Footer() {
  const { t } = useI18n();
  return (
    <footer className="footer" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">Footer {SITE.name}</h2>
      <div className="footer-grid">
        <div>
          <div className="footer-brand">
            <span><ShoppingBag size={20} aria-hidden /></span>
            <strong>{SITE.name}</strong>
          </div>
          <p>{SITE.name} – Nền tảng thương mại đa ngành, mang đến trải nghiệm mua sắm không giới hạn với hàng nghìn sản phẩm chính hãng.</p>
          <div className="footer-social" aria-label="Mạng xã hội">
            <a href={SITE.facebook} aria-label="Facebook" target="_blank" rel="noopener noreferrer"><span aria-hidden>f</span></a>
            <a href={SITE.zalo} aria-label="Zalo" target="_blank" rel="noopener noreferrer" className="social-zalo"><span aria-hidden>zl</span></a>
            <a href={SITE.instagram} aria-label="Instagram" target="_blank" rel="noopener noreferrer"><span aria-hidden>ig</span></a>
            <a href={SITE.tiktok} aria-label="TikTok" target="_blank" rel="noopener noreferrer"><span aria-hidden>tt</span></a>
            <a href={SITE.youtube} aria-label="Youtube" target="_blank" rel="noopener noreferrer"><span aria-hidden>yt</span></a>
          </div>
        </div>

        <div>
          <h3>{t.footer.support}</h3>
          <ul>
            <li><a href="/danh-muc">Danh mục sản phẩm</a></li>
            <li><a href="/so-sanh">So sánh sản phẩm</a></li>
            <li><a href="/flash-sale">Flash Sale</a></li>
            <li><a href="/chinh-sach/doi-tra">{t.footer.returns}</a></li>
            <li><a href="/chinh-sach/van-chuyen">{t.footer.shipping}</a></li>
            <li><a href="/chinh-sach/dieu-khoan">{t.footer.terms}</a></li>
            <li><a href="/chinh-sach/faq">{t.footer.faq}</a></li>
          </ul>
        </div>

        <div>
          <h3>{t.footer.about} {SITE.name}</h3>
          <ul>
            <li><a href="/about">Giới thiệu</a></li>
            <li><a href="/blog">Blog & Kiến thức</a></li>
            <li><a href="/chinh-sach/bao-mat">{t.footer.privacy}</a></li>
            <li><a href="/danh-gia">{t.footer.reviews}</a></li>
            <li><a href="/contact">{t.footer.contact}</a></li>
          </ul>
        </div>

        <div>
          <h3>{t.footer.contactTitle}</h3>
          <ul className="contact">
            <li><Phone size={16} aria-hidden /> {SITE.phone}</li>
            <li><Mail size={16} aria-hidden /> {SITE.email}</li>
            <li><MapPin size={16} aria-hidden /> {SITE.address}</li>
            <li style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>MST: {SITE.taxId}</li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 {SITE.name}. Mọi quyền được bảo lưu.</span>
        <span>{t.footer.design} {SITE.name}</span>
      </div>
    </footer>
  );
}

export default memo(Footer);
