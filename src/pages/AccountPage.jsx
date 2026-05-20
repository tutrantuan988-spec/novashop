import { memo, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Heart, Mail, MapPin, Package, ShoppingBag, Trash2, Truck, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SITE from '../config/site-config';
import { useProducts } from '../context/ProductsContext';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { listMyOrdersApi, listMyPgOrdersApi } from '../services/api';
import { formatVND } from '../utils/format';

const STATUS_LABEL = {
  pending: 'Chờ xác nhận',
  paid: 'Đã thanh toán',
  processing: 'Đang xử lý',
  shipped: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy'
};

const STATUS_CLASS = {
  pending: 'badge-pending',
  paid: 'badge-paid',
  processing: 'badge-processing',
  shipped: 'badge-shipped',
  delivered: 'badge-delivered',
  cancelled: 'badge-cancelled'
};

function transformPgOrder(o) {
  return {
    id: o.id,
    status: o.status || o.payment_status || 'pending',
    total: o.total || 0,
    createdAt: { seconds: Math.floor(new Date(o.created_at).getTime() / 1000) },
    items: (o.items || []).map(item => ({
      name: item.product_name,
      image: item.product_image,
      quantity: item.quantity,
      price: item.unit_price
    })),
    paymentMethod: o.payment_method,
    shippingInfo: null
  };
}

function AccountPage() {
  const { user } = useAuth();
  const { items: products } = useProducts();
  const { ids: wishlistIds, removeWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ordersError, setOrdersError] = useState(null);

  const wishlistProducts = products.filter((p) =>
    wishlistIds.some((id) => String(id) === String(p.id))
  );

  useEffect(() => {
    document.title = `Tài khoản của tôi - ${SITE.name}`;
    if (user?.email) {
      listMyPgOrdersApi()
        .then((res) => setOrders((res.data || []).map(transformPgOrder)))
        .catch(() => {
          listMyOrdersApi(user.email)
            .then((data) => setOrders(data))
            .catch(() => setOrdersError('Không tải được đơn hàng'));
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  if (!user) return <Navigate to="/" replace />;

  const totalSpent = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const completed = orders.filter((o) => ['delivered', 'paid'].includes(o.status)).length;

  return (
    <section className="section account-page">
      <div className="account-header">
        <div className="account-avatar">
          <UserIcon size={32} aria-hidden />
        </div>
        <div>
          <span className="section-kicker">Tài khoản của tôi</span>
          <h1>{user.name}</h1>
          <p><Mail size={14} aria-hidden /> {user.email}</p>
        </div>
      </div>

      <div className="account-stats">
        <div className="stat-card">
          <Package size={20} aria-hidden />
          <div>
            <strong>{orders.length}</strong>
            <span>Tổng đơn hàng</span>
          </div>
        </div>
        <div className="stat-card">
          <ShoppingBag size={20} aria-hidden />
          <div>
            <strong>{completed}</strong>
            <span>Đơn hoàn tất</span>
          </div>
        </div>
        <div className="stat-card">
          <MapPin size={20} aria-hidden />
          <div>
            <strong>{formatVND(totalSpent)}</strong>
            <span>Tổng chi tiêu</span>
          </div>
        </div>
      </div>

      <div className="card-box">
        <h2><Heart size={18} aria-hidden /> Sản phẩm yêu thích ({wishlistProducts.length})</h2>
        {wishlistProducts.length === 0 ? (
          <p className="empty-result">Bạn chưa có sản phẩm yêu thích nào. Bấm trái tim trên sản phẩm để lưu lại.</p>
        ) : (
          <div className="wishlist-grid">
            {wishlistProducts.map((p) => (
              <article key={p.id} className="wishlist-card">
                <Link to={`/san-pham/${p.slug}`}>
                  <img src={p.image} alt={p.name} loading="lazy" />
                </Link>
                <div className="wishlist-info">
                  <Link to={`/san-pham/${p.slug}`}><strong>{p.name}</strong></Link>
                  <span>{formatVND(p.price)}</span>
                </div>
                <div className="wishlist-actions">
                  <button type="button" className="primary-button small" onClick={() => addToCart(p)}>
                    <ShoppingBag size={14} aria-hidden /> Thêm giỏ
                  </button>
                  <button
                    type="button"
                    className="icon-button danger"
                    onClick={() => removeWishlist(p.id)}
                    aria-label={`Bỏ yêu thích ${p.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="card-box">
        <h2>Lịch sử đơn hàng</h2>
        {loading ? (
          <div className="account-skeleton">
            <div className="skeleton-row" />
            <div className="skeleton-row" />
            <div className="skeleton-row" />
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-result">
            <p>Bạn chưa có đơn hàng nào.</p>
            <Link to="/" className="primary-button">Mua sắm ngay</Link>
          </div>
        ) : (
          <div className="account-orders">
            {orders.map((o) => (
              <article key={o.id} className="account-order">
                <header>
                  <div>
                    <Link to={`/don-hang/${o.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <strong>Đơn #{String(o.id).slice(-8).toUpperCase()}</strong>
                    </Link>
                    <span className={`status-badge ${STATUS_CLASS[o.status] || ''}`}>
                      {STATUS_LABEL[o.status] || o.status}
                    </span>
                  </div>
                  <span className="order-date">
                    {o.createdAt?.seconds
                      ? new Date(o.createdAt.seconds * 1000).toLocaleDateString('vi-VN')
                      : ''}
                  </span>
                </header>
                <ul>
                  {(o.items || []).slice(0, 3).map((item, idx) => (
                    <li key={idx}>
                      <img src={item.image} alt={item.name} loading="lazy" />
                      <div>
                        <strong>{item.name}</strong>
                        <span>SL: {item.quantity}</span>
                      </div>
                      <span>{formatVND(item.price * item.quantity)}</span>
                    </li>
                  ))}
                </ul>
                {o.items?.length > 3 && (
                  <p className="more-items">+{o.items.length - 3} sản phẩm khác</p>
                )}
                {o.shippingInfo?.trackingCode && (
                  <div className="account-tracking">
                    <Truck size={16} aria-hidden />
                    <div>
                      <span>{o.shippingInfo.carrier || 'Đơn vị vận chuyển'}</span>
                      <strong>{o.shippingInfo.trackingCode}</strong>
                    </div>
                    {o.shippingInfo.trackingUrl && (
                      <a href={o.shippingInfo.trackingUrl} target="_blank" rel="noreferrer">Theo dõi</a>
                    )}
                  </div>
                )}
                <footer>
                  <span>Phương thức: <strong>{o.paymentMethod === 'stripe' ? 'Stripe' : (o.paymentMethod || '').toUpperCase()}</strong></span>
                  <span className="order-total">Tổng: <strong>{formatVND(o.total || 0)}</strong></span>
                </footer>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default memo(AccountPage);
