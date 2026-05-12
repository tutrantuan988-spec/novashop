import { useEffect, useState } from 'react';
import { Star, MessageSquare } from 'lucide-react';
import { listReviewsApi, createReviewApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

function StarRating({ value, onChange, readOnly = false, size = 18 }) {
  return (
    <div className={`star-rating ${readOnly ? 'read-only' : ''}`} role={readOnly ? undefined : 'radiogroup'}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={n <= value ? 'star filled' : 'star'}
          onClick={() => !readOnly && onChange?.(n)}
          aria-label={`${n} sao`}
          disabled={readOnly}
        >
          <Star size={size} fill={n <= value ? 'currentColor' : 'none'} />
        </button>
      ))}
    </div>
  );
}

function formatDate(value) {
  if (!value) return '';
  const ts = value.seconds ? value.seconds * 1000 : value._seconds ? value._seconds * 1000 : value;
  return new Date(ts).toLocaleDateString('vi-VN');
}

export default function ProductReviews({ productId }) {
  const { user } = useAuth();
  const toast = useToast();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ rating: 5, title: '', content: '' });

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    listReviewsApi(productId)
      .then((data) => setReviews(data))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, [productId]);

  const alreadyReviewed = user?.email && reviews.some(
    (r) => r.userEmail === String(user.email).toLowerCase()
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!user?.email) {
      toast.error('Vui lòng đăng nhập để đánh giá');
      return;
    }
    setSubmitting(true);
    try {
      await createReviewApi(productId, {
        rating: form.rating,
        title: form.title.trim(),
        content: form.content.trim(),
        userEmail: user.email,
        userName: user.name || user.email.split('@')[0]
      });
      const next = await listReviewsApi(productId);
      setReviews(next);
      setForm({ rating: 5, title: '', content: '' });
      toast.success('Cảm ơn bạn đã đánh giá!');
    } catch (err) {
      toast.error(err.message || 'Không thể gửi đánh giá');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="product-reviews">
      <header className="product-reviews-header">
        <h2><MessageSquare size={20} aria-hidden /> Đánh giá khách hàng</h2>
        <span>{reviews.length} đánh giá</span>
      </header>

      {!alreadyReviewed && user && (
        <form className="review-form" onSubmit={handleSubmit}>
          <label>
            <span>Số sao</span>
            <StarRating value={form.rating} onChange={(v) => setForm((f) => ({ ...f, rating: v }))} />
          </label>
          <label>
            <span>Tiêu đề</span>
            <input
              type="text"
              maxLength={120}
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Sản phẩm tuyệt vời"
            />
          </label>
          <label>
            <span>Nội dung</span>
            <textarea
              rows={4}
              maxLength={1000}
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              placeholder="Chia sẻ trải nghiệm của bạn..."
            />
          </label>
          <button type="submit" className="primary-button" disabled={submitting}>
            {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
          </button>
        </form>
      )}

      {!user && (
        <p className="review-login-hint">Đăng nhập để chia sẻ đánh giá của bạn về sản phẩm này.</p>
      )}

      {alreadyReviewed && (
        <p className="review-login-hint">Bạn đã đánh giá sản phẩm này. Cảm ơn!</p>
      )}

      <div className="review-list">
        {loading && <p>Đang tải đánh giá...</p>}
        {!loading && reviews.length === 0 && (
          <p className="review-empty">Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
        )}
        {reviews.map((review) => (
          <article key={review.id} className="review-item">
            <header>
              <strong>{review.userName}</strong>
              <StarRating value={review.rating} readOnly size={14} />
              <span className="review-date">{formatDate(review.createdAt)}</span>
            </header>
            {review.title && <h3>{review.title}</h3>}
            {review.content && <p>{review.content}</p>}
          </article>
        ))}
      </div>
    </section>
  );
}
