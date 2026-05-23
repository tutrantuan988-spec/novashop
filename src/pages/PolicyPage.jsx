import { memo, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, HelpCircle, LockKeyhole, PackageCheck, RefreshCcw, ShieldCheck, Truck, Mail, Phone, ChevronRight, MessageCircle, Wallet } from 'lucide-react';
import SEO from '../components/SEO';
import SITE from '../config/site-config';

const LAST_UPDATED = '15/05/2026';

function getPages(site) {
  return {
    freeship: {
      title: 'Freeship từ 300K',
      icon: Truck,
      description: `Ưu đãi giao hàng miễn phí của ${site.name} và điều kiện áp dụng.`,
      sections: [
        ['1. Điều kiện áp dụng', 'Đơn hàng từ 300.000đ sẽ được miễn phí vận chuyển toàn quốc (trừ hải đảo). Với đơn dưới ngưỡng, phí cố định 30.000đ.'],
        ['2. Khu vực hỗ trợ', `${site.name} giao hàng trên toàn quốc. Một số khu vực đặc biệt, đảo xa có thể phát sinh phụ phí và sẽ được CSKH báo trước khi xác nhận đơn.`],
        ['3. Lưu ý khi Freeship', 'Ưu đãi freeship không áp dụng cho Flash Sale hoặc chương trình có ghi chú riêng. Vui lòng kiểm tra phí ship ở bước thanh toán để chắc chắn thông tin.']
      ]
    },
    'dong-kiem': {
      title: 'Đồng kiểm khi nhận hàng',
      icon: ShieldCheck,
      description: 'Quy trình đồng kiểm giúp bạn yên tâm khi mở kiện hàng Lifestyle.',
      sections: [
        ['1. Quyền đồng kiểm', 'Bạn có quyền mở kiện kiểm tra ngoại quan và số lượng trước khi thanh toán. Nếu shipper từ chối, vui lòng liên hệ CSKH Lifestyle để được hỗ trợ.'],
        ['2. Khi nào nên quay video', 'Khuyến khích quay video lúc unbox để làm bằng chứng nếu sản phẩm lỗi hoặc sai mô tả.'],
        ['3. Trường hợp từ chối nhận', 'Nếu phát hiện hàng không đúng mô tả, bạn có thể từ chối nhận. Lifestyle sẽ hoàn tiền 100% với đơn đã thanh toán trước.']
      ]
    },
    'doi-tra': {
      title: 'Chính sách đổi trả',
      icon: RefreshCcw,
      description: `Quy định đổi trả sản phẩm tại ${site.name}.`,
      sections: [
        ['1. Thời hạn đổi trả', `Khách hàng có thể yêu cầu đổi trả trong vòng 7 ngày kể từ khi nhận hàng. Đối với các sản phẩm chưa mở bao bì, thời gian đổi trả có thể kéo dài đến 14 ngày. Sản phẩm đã mở bao bì chỉ được đổi trả nếu có lỗi từ nhà sản xuất.`],
        ['2. Điều kiện sản phẩm', `Sản phẩm cần còn nguyên tem, nhãn, hộp, thẻ bảo hành, quà tặng (nếu có) và chưa qua sử dụng ngoài mục đích kiểm tra ban đầu. Khách hàng vui lòng quay video quá trình mở hộp (unboxing) để làm bằng chứng khi có khiếu nại.`],
        ['3. Trường hợp được đổi trả', `- Sản phẩm bị lỗi do nhà sản xuất.\n- Hư hỏng trong quá trình vận chuyển.\n- Giao sai mẫu mã, sai kích thước hoặc không đúng mô tả trên website.\n- Hàng hết hạn sử dụng.`],
        ['4. Quy trình xử lý', `Bước 1: Khách hàng liên hệ qua hotline hoặc email CSKH kèm mã đơn hàng và hình ảnh/video chứng minh.\nBước 2: Bộ phận CSKH tiếp nhận và phản hồi trong 24-48 giờ làm việc.\nBước 3: Gửi trả hàng về kho của ${site.name}.\nBước 4: ${site.name} kiểm tra hàng hoàn và tiến hành gửi sản phẩm mới hoặc hoàn tiền theo thỏa thuận.`],
        ['5. Chi phí đổi trả', `Nếu lỗi thuộc về ${site.name} hoặc nhà sản xuất, chúng tôi sẽ chịu 100% phí vận chuyển 2 chiều. Nếu đổi do nhu cầu cá nhân, khách hàng sẽ chịu phí vận chuyển.`]
      ]
    },
    'van-chuyen': {
      title: 'Chính sách vận chuyển',
      icon: Truck,
      description: 'Thông tin giao hàng, phí vận chuyển và thời gian nhận hàng.',
      sections: [
        ['1. Đơn vị vận chuyển', `${site.name} hợp tác với các đơn vị vận chuyển uy tín như Giao Hàng Nhanh, Giao Hàng Tiết Kiệm, J&T Express và Viettel Post để đảm bảo hàng hóa đến tay bạn nhanh chóng và an toàn.`],
        ['2. Thời gian giao hàng dự kiến', `- Nội thành TP.HCM / Hà Nội: Giao hỏa tốc trong 2h hoặc giao tiêu chuẩn 1-2 ngày làm việc.\n- Các tỉnh/thành phố khác: 2-5 ngày làm việc.\n- Vùng sâu, vùng xa: 5-7 ngày làm việc.`],
        ['3. Phí vận chuyển', `Phí vận chuyển sẽ được tính tự động tại bước thanh toán dựa trên khối lượng và khoảng cách. Đơn hàng từ 500,000đ trở lên sẽ được miễn phí vận chuyển toàn quốc.`],
        ['4. Kiểm tra hàng', `Quý khách được quyền kiểm tra tình trạng ngoại quan của gói hàng trước khi thanh toán. Vui lòng quay video lúc mở kiện hàng để giải quyết các khiếu nại nếu có.`],
        ['5. Lưu ý đặc biệt', `Đối với sản phẩm dễ vỡ, thực phẩm chức năng và mỹ phẩm, chúng tôi sử dụng đóng gói đặc biệt để đảm bảo chất lượng sản phẩm trong quá trình vận chuyển.`]
      ]
    },
    'bao-mat': {
      title: 'Chính sách bảo mật',
      icon: LockKeyhole,
      description: `Cách ${site.name} thu thập, sử dụng và bảo vệ dữ liệu khách hàng.`,
      sections: [
        ['1. Mục đích thu thập thông tin', `Chúng tôi thu thập dữ liệu cá nhân của bạn (Tên, SĐT, Email, Địa chỉ) nhằm mục đích xử lý đơn hàng, liên hệ giao hàng, gửi thông tin khuyến mãi và hỗ trợ giải quyết khiếu nại.`],
        ['2. Phạm vi sử dụng thông tin', `Thông tin cá nhân chỉ được sử dụng nội bộ trong công ty. Chúng tôi có thể chia sẻ tên, địa chỉ và số điện thoại cho đối tác vận chuyển để phục vụ việc giao hàng.`],
        ['3. Thời gian lưu trữ', `Dữ liệu cá nhân của khách hàng sẽ được lưu trữ bảo mật trên hệ thống máy chủ của ${site.name} cho đến khi có yêu cầu hủy bỏ từ phía khách hàng.`],
        ['4. Cam kết bảo mật', `Chúng tôi cam kết không bán, chia sẻ hay trao đổi thông tin cá nhân của bạn cho bên thứ ba vì mục đích thương mại. Mọi thông tin giao dịch trực tuyến được bảo mật qua các cổng thanh toán uy tín (Stripe, VNPay, MoMo) và đáp ứng chuẩn PCI-DSS.`],
        ['5. Quyền lợi của khách hàng', `Bạn có quyền yêu cầu chúng tôi cập nhật, sửa đổi hoặc xóa thông tin cá nhân của bạn trên hệ thống bằng cách liên hệ bộ phận CSKH.`]
      ]
    },
    'dieu-khoan': {
      title: 'Điều khoản sử dụng',
      icon: ShieldCheck,
      description: `Điều khoản khi sử dụng website và dịch vụ ${site.name}.`,
      sections: [
        ['1. Chấp thuận điều khoản', `Khi truy cập và mua sắm tại ${site.name}, bạn mặc nhiên đồng ý với các điều khoản sử dụng được quy định tại đây. Chúng tôi có quyền thay đổi các điều khoản này vào bất kỳ lúc nào.`],
        ['2. Đăng ký tài khoản', `Người dùng cần cung cấp thông tin chính xác khi tạo tài khoản và tự chịu trách nhiệm bảo mật mật khẩu. Nếu phát hiện truy cập trái phép, vui lòng thông báo ngay cho chúng tôi.`],
        ['3. Chấp nhận và Hủy đơn hàng', `${site.name} có quyền từ chối hoặc hủy đơn hàng trong một số trường hợp như sai sót về giá cả, hết hàng, hoặc phát hiện dấu hiệu gian lận. Trong trường hợp này, nếu bạn đã thanh toán, chúng tôi sẽ hoàn tiền 100%.`],
        ['4. Bản quyền và Sở hữu trí tuệ', `Toàn bộ nội dung, hình ảnh, thiết kế, logo trên website đều thuộc bản quyền của ${site.name}. Nghiêm cấm sao chép, phân phối dưới mọi hình thức khi chưa có sự đồng ý bằng văn bản.`],
        ['5. Trách nhiệm sản phẩm', `${site.name} cam kết cung cấp sản phẩm chính hãng, có nguồn gốc rõ ràng. Tuy nhiên, chúng tôi không chịu trách nhiệm về các phản ứng dị ứng của khách hàng với thành phần sản phẩm. Vui lòng kiểm tra kỹ thành phần trước khi sử dụng.`]
      ]
    },
    'faq': {
      title: 'Câu hỏi thường gặp',
      icon: HelpCircle,
      description: `Giải đáp các câu hỏi phổ biến khi mua hàng tại ${site.name}.`,
      sections: [
        ['1. Tôi có cần tạo tài khoản để mua hàng không?', `Không bắt buộc. Tuy nhiên, chúng tôi khuyến khích bạn tạo tài khoản để tích lũy điểm thưởng, lưu địa chỉ giao hàng và theo dõi trạng thái đơn hàng dễ dàng hơn.`],
        ['2. Tôi có thể thanh toán bằng những hình thức nào?', `${site.name} hỗ trợ đa dạng phương thức: Thanh toán khi nhận hàng (COD), Chuyển khoản ngân hàng (VietQR), Ví MoMo, ZaloPay, VNPay, và Thẻ tín dụng/ghi nợ quốc tế qua Stripe.`],
        ['3. Làm thế nào để áp dụng mã giảm giá?', `Tại trang Giỏ hàng hoặc trang Thanh toán, bạn sẽ thấy ô "Nhập mã giảm giá/Coupon". Điền mã và nhấn "Áp dụng", hệ thống sẽ tự động trừ đi số tiền được giảm.`],
        ['4. Bao lâu tôi mới nhận được hàng?', `Tùy thuộc vào địa chỉ của bạn. Nội thành thường 1-2 ngày, ngoại thành 2-5 ngày làm việc. Bạn sẽ nhận được mã vận đơn qua email/Zalo để tra cứu lộ trình.`],
        ['5. Hàng bị lỗi trong quá trình giao, tôi phải làm sao?', `Vui lòng từ chối nhận hàng nếu vỏ hộp bị bẹp, rách nát nghiêm trọng, hoặc nếu đã nhận, hãy quay video lúc mở hộp. Liên hệ ngay qua Hotline để chúng tôi hỗ trợ đổi hàng mới.`],
        ['6. Sản phẩm có đảm bảo chất lượng không?', `Tất cả sản phẩm tại ${site.name} đều có nguồn gốc rõ ràng, được nhập khẩu chính ngạch hoặc phân phối bởi đại lý ủy quyền. Chúng tôi cam kết không bán hàng giả, hàng nhái, hàng hết hạn.`]
      ]
    },
    'lien-he': {
      title: 'Liên hệ',
      icon: PackageCheck,
      description: `Thông tin hỗ trợ khách hàng ${site.name}.`,
      sections: [
        ['Hotline Chăm sóc Khách hàng', `${SITE.phone} (Hoạt động từ 8:00 đến 22:00 tất cả các ngày trong tuần)`],
        ['Email Hỗ trợ', `${SITE.email} (Thời gian phản hồi thông thường trong vòng 1-2 giờ làm việc)`],
        ['Địa chỉ Văn phòng', `${SITE.address}`],
        ['Mã số thuế', `${SITE.taxId}`],
        ['Zalo OA', `Tìm kiếm Zalo: ${SITE.name} Store để được tư vấn nhanh nhất.`],
        ['Fanpage Facebook', `${SITE.name} - Mua sắm đa danh mục`]
      ]
    },
    'ho-tro-chat': {
      title: 'Hỗ trợ chat nhanh',
      icon: MessageCircle,
      description: `Các kênh giao tiếp trực tuyến của ${site.name} hoạt động 24/7.`,
      sections: [
        ['1. Zalo OA & Livechat', 'Zalo OA phản hồi trong 5 phút (8h – 22h). Livechat trên website có AI và nhân sự nối máy nếu cần.'],
        ['2. Hotline & Email', `Hotline ${SITE.phone} (8h – 20h). Email ${SITE.email} phản hồi trong 24h.`],
        ['3. Nguyên tắc hỗ trợ', 'Đội ngũ CSKH Lifestyle cam kết giải quyết vấn đề trong vòng 24h, ưu tiên các case khẩn qua hotline.']
      ]
    },
    'thanh-toan-cod': {
      title: 'Thanh toán COD',
      icon: Wallet,
      description: `Phương thức thanh toán khi nhận hàng của ${site.name}.`,
      sections: [
        ['1. Quy trình COD', 'Bạn thanh toán tiền mặt cho shipper sau khi kiểm tra ngoại quan kiện hàng. Không cần thẻ hay ví điện tử.'],
        ['2. Kết hợp ưu đãi', 'COD vẫn áp dụng được mã giảm giá, freeship và tích điểm như các phương thức khác.'],
        ['3. Lưu ý', 'Vui lòng chuẩn bị đủ tiền mặt, ký nhận rõ ràng để tránh tranh chấp. Các địa chỉ giao khó (cao ốc, khu công nghiệp) nên ghi chú cho shipper.']
      ]
    }
  };
}

function PolicyPage() {
  const { slug } = useParams();
  const pages = getPages(SITE);
  const page = pages[slug] || pages.faq;
  const Icon = page.icon;
  const [activeSection, setActiveSection] = useState(0);

  useEffect(() => {
    document.title = `${page.title} - ${SITE.name}`;
    window.scrollTo({ top: 0 });
    setActiveSection(0);
  }, [page.title, slug]);

  const handleTocClick = (index) => {
    setActiveSection(index);
    const articles = document.querySelectorAll('.policy-content article');
    if (articles[index]) {
      articles[index].scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="section policy-page">
      <SEO title={`${page.title} - ${SITE.name}`} description={page.description} />
      <div className="policy-breadcrumb">
        <Link to="/" className="policy-back-link">
          <ArrowLeft size={16} aria-hidden />
          <span>Về trang chủ</span>
        </Link>
      </div>
      <div className="policy-hero">
        <div className="policy-icon"><Icon size={32} aria-hidden /></div>
        <div>
          <span className="section-kicker">{SITE.name}</span>
          <h1>{page.title}</h1>
          <p>{page.description}</p>
          <span className="policy-updated">Cập nhật lần cuối: {LAST_UPDATED}</span>
        </div>
      </div>
      <div className="policy-layout">
        <aside className="policy-toc" aria-label="Mục lục">
          <h2>Mục lục</h2>
          <nav>
            <ul>
              {page.sections.map(([heading], index) => (
                <li key={index}>
                  <button
                    className={`policy-toc-link ${activeSection === index ? 'active' : ''}`}
                    onClick={() => handleTocClick(index)}
                    type="button"
                  >
                    <ChevronRight size={14} aria-hidden />
                    <span>{heading}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          <div className="policy-toc-contact">
            <h3>Cần hỗ trợ?</h3>
            <p>Nếu bạn có thắc mắc về chính sách này, vui lòng liên hệ:</p>
            <a href={`tel:${SITE.phone}`} className="policy-contact-link">
              <Phone size={14} aria-hidden />
              <span>{SITE.phone}</span>
            </a>
            <a href={`mailto:${SITE.email}`} className="policy-contact-link">
              <Mail size={14} aria-hidden />
              <span>{SITE.email}</span>
            </a>
          </div>
        </aside>
        <div className="policy-content card-box">
          {page.sections.map(([heading, body], index) => (
            <article key={heading} id={`section-${index}`}>
              <h2>{heading}</h2>
              {body.split('\n').map((line, i) => (
                line.startsWith('- ') ? (
                  <p key={i} className="policy-list-item">{line}</p>
                ) : (
                  <p key={i}>{line}</p>
                )
              ))}
            </article>
          ))}
          <div className="policy-content-footer">
            <p>
              Nếu bạn có bất kỳ câu hỏi nào về chính sách này, vui lòng liên hệ chúng tôi qua{' '}
              <a href={`mailto:${SITE.email}`}>{SITE.email}</a> hoặc gọi{' '}
              <a href={`tel:${SITE.phone}`}>{SITE.phone}</a>.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default memo(PolicyPage);
