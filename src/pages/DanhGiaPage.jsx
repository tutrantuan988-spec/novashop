import { memo } from 'react';
import { Star, ThumbsUp } from 'lucide-react';

const EXTRA_REVIEWS = [
  { id: 'r4', name: 'Minh Anh', role: 'Đã mua áo khoác', rating: 5, content: 'Áo khoác mua ở đây chất lượng không kém gì ngoài mall mà giá tốt hơn nhiều. Ship nhanh, đóng gói cẩn thận.' },
  { id: 'r5', name: 'Thu Hương', role: 'Mê công nghệ', rating: 5, content: 'Lần đầu mua tai nghe Bluetooth ở đây. Âm thanh cực tốt, pin trâu. Sẽ ủng hộ dài dài!' },
  { id: 'r6', name: 'Quốc Bảo', role: 'Đã mua đồ gia dụng', rating: 4, content: 'Bộ nồi inox mua về dùng rất thích, inox sáng bóng, nấu ăn ngon. Giao đúng hẹn, tư vấn nhiệt tình.' },
  { id: 'r7', name: 'Linh Chi', role: 'Mê sách', rating: 5, content: 'Sách ở đây giá tốt, đóng gói cẩn thận không móp góc. Đặt hôm nay nhận ngay hôm sau. Shop rất uy tín!' },
  { id: 'r8', name: 'Trọng Nghĩa', role: 'Đam mê thể thao', rating: 5, content: 'Giày chạy bộ giá hợp lý, mang êm chân, đúng size. Hài lòng 100%.' },
  { id: 'r9', name: 'Bảo Châu', role: 'Thích làm đẹp', rating: 5, content: 'Nước hoa chính hãng, mùi thơm lâu. Shop tư vấn rất chuyên nghiệp, chọn đúng mùi mình thích!' },
];

const BASE_REVIEWS = [
  { id: 'r1', name: 'Lan Anh', role: 'Khách hàng thân thiết', rating: 5, content: 'Sản phẩm chất lượng tuyệt vời, giao hàng siêu nhanh. Sẽ ủng hộ shop dài dài!' },
  { id: 'r2', name: 'Hoàng Minh', role: 'Đã mua 3 lần', rating: 4, content: 'Giá cả hợp lý, đóng gói cẩn thận. Shop tư vấn rất nhiệt tình.' },
  { id: 'r3', name: 'Thanh Thảo', role: 'Mua online lần đầu', rating: 5, content: 'Lần đầu mua hàng online nhưng rất yên tâm vì được kiểm tra hàng trước khi nhận.' },
];

const ALL_REVIEWS = [...BASE_REVIEWS, ...EXTRA_REVIEWS];

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
        <p>Trải nghiệm thực tế từ khách hàng đã mua sắm</p>
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
