import { memo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import SEO from '../components/SEO';
import SITE from '../config/site-config';

const REASONS = {
  '01': 'Giao dịch chưa hoàn tất',
  '02': 'Giao dịch bị lỗi',
  '04': 'Giao dịch đảo (đã trừ tiền nhưng không nhận được)',
  '05': 'VNPay đang xử lý',
  '07': 'Giao dịch nghi ngờ gian lận',
  '09': 'Thẻ chưa đăng ký Internet Banking',
  '10': 'Xác thực sai quá 3 lần',
  '11': 'Hết hạn chờ thanh toán',
  '12': 'Thẻ bị khóa',
  '13': 'Sai mật khẩu OTP',
  '24': 'Khách hàng huỷ giao dịch',
  '51': 'Tài khoản không đủ số dư',
  '65': 'Tài khoản vượt hạn mức ngày',
  '75': 'Ngân hàng đang bảo trì',
  '79': 'Sai mã thanh toán quá nhiều lần',
  '99': 'Lỗi không xác định'
};

function PaymentFailedPage() {
  const [params] = useSearchParams();
  const orderId = params.get('orderId');
  const code = params.get('code');
  const reason = params.get('reason') || REASONS[code] || 'Thanh toán không thành công';

  useEffect(() => {
    document.title = `Thanh toán thất bại - ${SITE.name}`;
  }, []);

  return (
    <section className="section order-success">
      <div className="success-card error-card">
        <AlertTriangle size={64} aria-hidden />
        <h1>Thanh toán thất bại</h1>
        {orderId && <p>Mã đơn hàng: <strong>{String(orderId).slice(-8).toUpperCase()}</strong></p>}
        <p>{reason}</p>
        <p>Bạn có thể thử lại hoặc chọn phương thức thanh toán khác.</p>
        <div className="success-actions">
          <Link to="/thanh-toan" className="primary-button">Thử lại</Link>
          <Link to="/" className="secondary-button">Về trang chủ</Link>
        </div>
      </div>
    </section>
  );
}

export default memo(PaymentFailedPage);
