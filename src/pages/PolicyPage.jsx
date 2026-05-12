import { memo, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, HelpCircle, LockKeyhole, PackageCheck, RefreshCcw, ShieldCheck, Truck } from 'lucide-react';
import SEO from '../components/SEO';
import SITE from '../config/site-config';

function getPages(site) {
  return {
  'doi-tra': {
    title: 'Chính sách đổi trả',
    icon: RefreshCcw,
    description: `Quy định đổi trả sản phẩm tại ${site.name}.`,
    sections: [
      ['Thời hạn đổi trả', 'Khách hàng có thể yêu cầu đổi trả trong vòng 7 ngày kể từ khi nhận hàng nếu sản phẩm lỗi kỹ thuật, giao sai mẫu, sai kích thước hoặc không đúng mô tả.'],
      ['Điều kiện sản phẩm', 'Sản phẩm cần còn nguyên tem, nhãn, hộp, phụ kiện kèm theo và chưa qua sử dụng ngoài mục đích kiểm tra ban đầu.'],
      ['Quy trình xử lý', `Gửi yêu cầu qua email hoặc hotline kèm mã đơn hàng, hình ảnh/video lỗi. ${site.name} phản hồi trong 24 giờ làm việc.`]
    ]
  },
  'van-chuyen': {
    title: 'Chính sách vận chuyển',
    icon: Truck,
    description: 'Thông tin giao hàng, phí vận chuyển và thời gian nhận hàng.',
    sections: [
      ['Phạm vi giao hàng', `${site.name} hỗ trợ giao hàng toàn quốc thông qua các đối tác vận chuyển phù hợp theo từng khu vực.`],
      ['Thời gian giao hàng', 'Nội thành thường từ 1-2 ngày làm việc. Tỉnh/thành khác từ 2-5 ngày làm việc tùy địa chỉ nhận hàng.'],
      ['Phí vận chuyển', 'Phí vận chuyển hiển thị tại bước thanh toán. Một số đơn hàng đủ điều kiện sẽ được miễn phí vận chuyển.']
    ]
  },
  'bao-mat': {
    title: 'Chính sách bảo mật',
    icon: LockKeyhole,
    description: `Cách ${site.name} thu thập, sử dụng và bảo vệ dữ liệu khách hàng.`,
    sections: [
      ['Thông tin thu thập', `${site.name} thu thập thông tin cần thiết để xử lý đơn hàng như họ tên, email, số điện thoại, địa chỉ giao hàng và lịch sử mua hàng.`],
      ['Mục đích sử dụng', 'Dữ liệu dùng để xác nhận đơn, giao hàng, chăm sóc khách hàng, xử lý thanh toán và cải thiện trải nghiệm mua sắm.'],
      ['Bảo vệ dữ liệu', `${site.name} không bán dữ liệu cá nhân cho bên thứ ba. Thông tin thanh toán thẻ được xử lý bảo mật qua Stripe.`]
    ]
  },
  'dieu-khoan': {
    title: 'Điều khoản sử dụng',
    icon: ShieldCheck,
    description: `Điều khoản khi sử dụng website và dịch vụ ${site.name}.`,
    sections: [
      ['Tài khoản', 'Người dùng chịu trách nhiệm bảo mật thông tin đăng nhập và các hoạt động phát sinh từ tài khoản của mình.'],
      ['Đơn hàng', `${site.name} có quyền xác minh, điều chỉnh hoặc hủy đơn trong trường hợp thông tin không chính xác, lỗi giá, hết hàng hoặc có dấu hiệu gian lận.`],
      ['Thanh toán', 'Các giao dịch thẻ quốc tế được xử lý bởi Stripe. Khách hàng cần đảm bảo thông tin thanh toán hợp lệ.']
    ]
  },
  'faq': {
    title: 'Câu hỏi thường gặp',
    icon: HelpCircle,
    description: `Giải đáp các câu hỏi phổ biến khi mua hàng tại ${site.name}.`,
    sections: [
      ['Làm sao để đặt hàng?', 'Chọn sản phẩm, thêm vào giỏ, điền thông tin giao hàng và chọn phương thức thanh toán phù hợp.'],
      ['Tôi có thể thanh toán bằng gì?', `${site.name} hỗ trợ COD, chuyển khoản ngân hàng, ví điện tử và thẻ quốc tế qua Stripe.`],
      ['Làm sao theo dõi đơn hàng?', 'Đăng nhập tài khoản và vào trang Tài khoản để xem lịch sử, trạng thái đơn hàng.']
    ]
  },
  'lien-he': {
    title: 'Liên hệ',
    icon: PackageCheck,
    description: `Thông tin hỗ trợ khách hàng ${site.name}.`,
    sections: [
      ['Hotline', `${site.phone} — hỗ trợ từ 8:00 đến 21:00 mỗi ngày.`],
      ['Email', `${site.email} — phản hồi trong vòng 24 giờ làm việc.`],
      ['Địa chỉ', `${site.address}.`]
    ]
  }
};
}

function PolicyPage() {
  const { slug } = useParams();
  const pages = getPages(SITE);
  const page = pages[slug] || pages.faq;
  const Icon = page.icon;

  useEffect(() => {
    document.title = `${page.title} - ${SITE.name}`;
    window.scrollTo({ top: 0 });
  }, [page.title]);

  return (
    <section className="section policy-page">
      <SEO title={`${page.title} - ${SITE.name}`} description={page.description} />
      <Link to="/" className="back-link"><ArrowLeft size={16} aria-hidden /> Về trang chủ</Link>
      <div className="policy-hero">
        <div className="policy-icon"><Icon size={32} aria-hidden /></div>
        <div>
          <span className="section-kicker">{SITE.name}</span>
          <h1>{page.title}</h1>
          <p>{page.description}</p>
        </div>
      </div>
      <div className="policy-content card-box">
        {page.sections.map(([heading, body]) => (
          <article key={heading}>
            <h2>{heading}</h2>
            <p>{body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default memo(PolicyPage);
