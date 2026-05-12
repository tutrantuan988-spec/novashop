import { memo, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BadgeCheck, Loader2 } from 'lucide-react';
import SEO from '../components/SEO';
import SITE from '../config/site-config';
import { getOrderSummaryApi } from '../services/api';
import { formatVND } from '../utils/format';

function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = `Thanh toán thành công - ${SITE.name}`;
    if (!orderId) {
      setLoading(false);
      return;
    }
    let attempts = 0;
    const fetchOrder = () => {
      getOrderSummaryApi(orderId)
        .then((data) => {
          setOrder(data);
          if (data.paymentStatus !== 'paid' && attempts < 3) {
            attempts += 1;
            setTimeout(fetchOrder, 1500);
          } else {
            setLoading(false);
          }
        })
        .catch(() => setLoading(false));
    };
    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <section className="section order-success">
        <Loader2 className="spinner" size={40} />
        <p>Đang xác nhận thanh toán...</p>
      </section>
    );
  }

  if (!order) {
    return (
      <section className="section order-success">
        <h1>Không tìm thấy đơn hàng</h1>
        <p>Mã đơn hàng không hợp lệ hoặc đã bị xóa.</p>
        <Link to="/" className="primary-button">Về trang chủ</Link>
      </section>
    );
  }

  return (
    <section className="section order-success">
      <div className="success-card">
        <BadgeCheck size={64} aria-hidden />
        <h1>Thanh toán thành công!</h1>
        <p>Mã đơn hàng: <strong>{String(order.id).slice(-8).toUpperCase()}</strong></p>
        <p>Tổng giá trị: <strong>{formatVND(order.total)}</strong></p>
        <p>Trạng thái: <strong>{order.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Đang xử lý'}</strong></p>
        <p>Chúng tôi sẽ xử lý và giao hàng trong 24-48 giờ.</p>
        <div className="success-actions">
          <Link to="/" className="primary-button">Tiếp tục mua sắm</Link>
        </div>
      </div>
    </section>
  );
}

export default memo(PaymentSuccessPage);
