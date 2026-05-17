import { memo } from 'react';
import { Star, ThumbsUp } from 'lucide-react';
import { reviews } from '../data/products';

const EXTRA_REVIEWS = [
  { id: 'r4', name: 'Minh Anh', role: 'Nuôi 2 bé Corgi', rating: 5, content: 'Royal Canin mua ở đây chất lượng không kém gì mua ở pet shop lớn mà giá tốt hơn nhiều. Ship nhanh, đóng gói cẩn thận.' },
  { id: 'r5', name: 'Thu Hương', role: 'Mèo Maine Coon', rating: 5, content: 'Lần đầu mua Whiskas Adult ở đây. Mèo ăn rất thích, lông bóng mượt hơn hẳn. Sẽ ủng hộ dài dài!' },
  { id: 'r6', name: 'Quốc Bảo', role: 'Chó Poodle 3 tuổi', rating: 4, content: 'Pedigree DentaStix hiệu quả thật sự, răng chó trắng hơn, ít hôi miệng. Giao đúng hẹn, tư vấn nhiệt tình.' },
  { id: 'r7', name: 'Linh Chi', role: 'Mèo Anh lông ngắn', rating: 5, content: 'Nekko Creamy là mèo nhà mình mê nhất. Đặt hôm nay nhận ngay hôm sau. Shop rất uy tín!' },
  { id: 'r8', name: 'Trọng Nghĩa', role: 'Nuôi Golden Retriever', rating: 5, content: 'SmartHeart Adult giá hợp lý, chó ăn ngon, phân không quá nặng mùi. Hài lòng 100%.' },
  { id: 'r9', name: 'Bảo Châu', role: 'Mèo Ragdoll', rating: 5, content: 'Royal Canin Indoor cho mèo trong nhà cực phù hợp, kiểm soát cân tốt. Shop tư vấn rất chuyên nghiệp!' },
];

const ALL_REVIEWS = [...reviews, ...EXTRA_REVIEWS];

const AVG = (ALL_REVIEWS.reduce((s, r) => s + r.rating, 0) / ALL_REVIEWS.length).toFixed(1);
const DIST = [5, 4, 3, 2, 1].map((star) => ({
  star,
  count: ALL_REVIEWS.filter((r) => r.rating === star).length,
}));

function StarRow({ rating }) {
  return (
    <div className="dgp-stars">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} size={15} fill={s <= rating ? '#f59e0b' : 'none'} color={s <= rating ? '#f59e0b' : '#d1d5db'} />
      ))}
    </div>
  );
}

function DanhGiaPage() {
  return (
    <div className="danh-gia-page">
      <div className="danh-muc-hero">
        <span className="section-kicker"><Star size={14} style={{ color: '#f59e0b' }} /> Đánh giá</span>
        <h1>Khách hàng nói gì?</h1>
        <p>Trải nghiệm thực tế từ những người nuôi thú cưng</p>
      </div>

      <div className="dgp-inner">
        <div className="dgp-summary">
          <div className="dgp-avg">
            <span className="dgp-avg-num">{AVG}</span>
            <StarRow rating={5} />
            <span className="dgp-avg-sub">{ALL_REVIEWS.length} đánh giá</span>
          </div>
          <div className="dgp-dist">
            {DIST.map(({ star, count }) => (
              <div key={star} className="dgp-dist-row">
                <span>{star} ★</span>
                <div className="dgp-dist-bar-wrap">
                  <div
                    className="dgp-dist-bar"
                    style={{ width: `${Math.round((count / ALL_REVIEWS.length) * 100)}%` }}
                  />
                </div>
                <span className="dgp-dist-count">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="dgp-grid">
          {ALL_REVIEWS.map((r) => (
            <article key={r.id} className="dgp-card">
              <div className="dgp-card-top">
                <div className="dgp-avatar">{r.name.charAt(0)}</div>
                <div>
                  <strong>{r.name}</strong>
                  <span className="dgp-role">{r.role}</span>
                </div>
                <StarRow rating={r.rating} />
              </div>
              <p className="dgp-content">"{r.content}"</p>
              <div className="dgp-helpful">
                <ThumbsUp size={13} /> Hữu ích
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

export default memo(DanhGiaPage);
