/**
 * API v2 — PostgreSQL Commerce Core Client
 *
 * Bridges between PostgreSQL `/api` endpoints and the frontend's expected data format.
 * All functions return empty fallback when the API is unavailable.
 */

const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');

const CATEGORY_IMAGE_MAP = {
  'thoi-trang': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1000&q=85&cs=tinysrgb',
  'dien-tu': 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1000&q=85&cs=tinysrgb',
  'do-gia-dung': 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1000&q=85&cs=tinysrgb',
  'sach': 'https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?auto=format&fit=crop&w=1000&q=85&cs=tinysrgb',
  'suc-khoe-lam-dep': 'https://images.unsplash.com/photo-1508704019882-f9cf40e475b4?auto=format&fit=crop&w=1000&q=85&cs=tinysrgb',
  'the-thao': 'https://images.unsplash.com/photo-1483721310020-03333e577078?auto=format&fit=crop&w=1000&q=85&cs=tinysrgb'
};

const MOCK_CATEGORIES = [
  { id: 'cat-fashion', name: 'Thời trang', slug: 'thoi-trang', description: 'Váy, áo, quần, phụ kiện' },
  { id: 'cat-tech', name: 'Điện tử', slug: 'dien-tu', description: 'Tai nghe, điện thoại, laptop' },
  { id: 'cat-home', name: 'Gia dụng', slug: 'do-gia-dung', description: 'Bếp, phòng khách, phòng ngủ' },
  { id: 'cat-beauty', name: 'Làm đẹp', slug: 'suc-khoe-lam-dep', description: 'Skincare, makeup, nước hoa' },
  { id: 'cat-sport', name: 'Thể thao', slug: 'the-thao', description: 'Giày, đồ thể thao, yoga' },
  { id: 'cat-book', name: 'Sách & Văn phòng', slug: 'sach', description: 'Sách, bút, dụng cụ học tập' }
];

const MOCK_PRODUCTS = [
  // === THỜI TRANG ===
  {
    id: 'f-1',
    name: 'Áo khoác bomber nữ kaki Premium',
    price: 285000,
    oldPrice: 380000,
    category: 'Thời trang',
    slug: 'ao-khoac-bomber-nu',
    rating: 4.8,
    soldCount: 652,
    badge: 'Bán chạy',
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&q=80',
    description: 'Áo khoác bomber kaki phong cách thiết kế hiện đại, chất liệu kaki 2 lớp cao cấp dày dặn ấm áp. Thích hợp đi làm, đi chơi và phong cách trẻ trung năng động.',
    brand: 'Lifestyle Denim',
    attributes: [
      { key: 'Chất liệu', value: 'Vải kaki 2 lớp dày dặn cao cấp' },
      { key: 'Xuất xứ', value: 'Việt Nam' },
      { key: 'Kích cỡ', value: 'S, M, L, XL' },
      { key: 'Màu sắc', value: 'Xanh rêu, Đen bóng' }
    ]
  },
  {
    id: 'f-2',
    name: 'Váy midi hoa nhí dáng xòe voan tơ',
    price: 320000,
    oldPrice: 450000,
    category: 'Thời trang',
    slug: 'vay-midi-hoa-nhi',
    rating: 4.7,
    soldCount: 433,
    badge: 'Yêu thích',
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&q=80',
    description: 'Chiếc váy dáng dài voan tơ Hàn Quốc mềm mịn mát dịu. Họa tiết hoa nhí vintage tôn dáng, che khuyết điểm hoàn hảo, phù hợp dạo phố, đi du lịch.',
    brand: 'Hana Boutique',
    attributes: [
      { key: 'Chất liệu', value: 'Voan tơ lụa Hàn Quốc cao cấp' },
      { key: 'Xuất xứ', value: 'Nhập khẩu Hàn Quốc' },
      { key: 'Kích cỡ', value: 'Freesize (dưới 58kg)' },
      { key: 'Họa tiết', value: 'Hoa nhí nhạt nền kem sữa' }
    ]
  },
  {
    id: 'f-3',
    name: 'Áo thun oversize cotton 100% unisex',
    price: 150000,
    oldPrice: 200000,
    category: 'Thời trang',
    slug: 'ao-thun-oversize-unisex',
    rating: 4.6,
    soldCount: 981,
    badge: 'Mới về',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&q=80',
    description: 'Áo thun form rộng unisex chất cotton 100% dày mịn, thấm hút mồ hôi cực tốt. Thiết kế tối giản basic dễ dàng mix đồ cho cả nam và nữ.',
    brand: 'Basic Wear',
    attributes: [
      { key: 'Chất liệu', value: '100% Cotton hữu cơ (định lượng 250gsm)' },
      { key: 'Xuất xứ', value: 'Việt Nam' },
      { key: 'Kích cỡ', value: 'M, L, XL, XXL' },
      { key: 'Màu sắc', value: 'Trắng tinh khôi, Đen tuyền, Hồng sữa pastel' }
    ]
  },
  {
    id: 'f-4',
    name: 'Chân váy chữ A dáng lửng công sở',
    price: 275000,
    oldPrice: 350000,
    category: 'Thời trang',
    slug: 'chan-vay-chu-a-cong-so',
    rating: 4.7,
    soldCount: 512,
    badge: 'Đặc sắc',
    image: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=500&q=80',
    description: 'Chân váy dáng chữ A dài thướt tha thanh lịch với chất tuyết mưa bền đẹp. Thiết kế tôn dáng eo thon, tôn lên vẻ thanh lịch kín đáo nơi công sở.',
    brand: 'Office Chic',
    attributes: [
      { key: 'Chất liệu', value: 'Vải tuyết mưa cao cấp co giãn nhẹ' },
      { key: 'Xuất xứ', value: 'Việt Nam' },
      { key: 'Kích cỡ', value: 'S, M, L, XL' },
      { key: 'Màu sắc', value: 'Đen quyền lực, Nâu tây ấm áp' }
    ]
  },
  {
    id: 'f-5',
    name: 'Đầm xòe lụa satin cao cấp',
    price: 450000,
    oldPrice: 650000,
    category: 'Thời trang',
    slug: 'dam-xoe-lua-satin',
    rating: 4.9,
    soldCount: 152,
    badge: 'Cao cấp',
    image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=500&q=80',
    description: 'Thiết kế đầm lụa satin bóng bẩy quý phái, chất vải mát lịm mướt mịn. Đường may tinh tế, phù hợp cho các buổi tiệc tối sang trọng hay sự kiện đặc biệt.',
    brand: 'Luxe Silk',
    attributes: [
      { key: 'Chất liệu', value: 'Lụa satin tơ tằm bóng mượt' },
      { key: 'Xuất xứ', value: 'Việt Nam' },
      { key: 'Kích cỡ', value: 'S, M, L' },
      { key: 'Màu sắc', value: 'Đỏ mận, Đen tuyền, Vàng Champagne' }
    ]
  },
  {
    id: 'f-6',
    name: 'Mũ cói đi biển phong cách vintage',
    price: 120000,
    oldPrice: 180000,
    category: 'Thời trang',
    slug: 'mu-coi-di-bien-vintage',
    rating: 4.6,
    soldCount: 320,
    badge: 'Phụ kiện',
    image: 'https://images.unsplash.com/photo-1572426473040-7e8334460a8c?w=500&q=80',
    description: 'Mũ cói rộng vành đan tay thủ công tinh xảo kèm dây thắt nơ lụa mềm mại. Bảo vệ làn da tối đa dưới ánh nắng biển gay gắt, tạo nét chụp ảnh siêu cuốn hút.',
    brand: 'Tropical accessories',
    attributes: [
      { key: 'Chất liệu', value: 'Cói tự nhiên dẻo dai thân thiện môi trường' },
      { key: 'Xuất xứ', value: 'Đan tay Việt Nam thủ công' },
      { key: 'Kích thước', value: 'Đường kính vành 40cm, điều chỉnh vòng đầu' },
      { key: 'Thiết kế', value: 'Nơ lụa tháo rời phối ren' }
    ]
  },
  {
    id: 'f-7',
    name: 'Áo sơ mi lụa tơ tằm mềm mại',
    price: 380000,
    oldPrice: 500000,
    category: 'Thời trang',
    slug: 'ao-so-mi-lua-to-tam',
    rating: 4.8,
    soldCount: 220,
    badge: 'Công sở',
    image: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=500&q=80',
    description: 'Áo sơ mi cổ đức lụa tơ tằm cao cấp, bề mặt trơn lướt như nước cực mát da. Giúp phái đẹp tôn lên vẻ chuyên nghiệp, khí chất thanh tú chốn văn phòng.',
    brand: 'Lana Silk',
    attributes: [
      { key: 'Chất liệu', value: 'Lụa tơ tằm dệt mịn mát lạnh' },
      { key: 'Xuất xứ', value: 'Thượng Hải nhập khẩu' },
      { key: 'Kích cỡ', value: 'M, L, XL' },
      { key: 'Kiểu dáng', value: 'Cổ đức classic, tay dài bo chun nhẹ' }
    ]
  },
  {
    id: 'f-8',
    name: 'Kính râm gọng tròn thời thượng',
    price: 195000,
    oldPrice: 280000,
    category: 'Thời trang',
    slug: 'kinh-ram-gong-tron',
    rating: 4.7,
    soldCount: 450,
    badge: 'Chống UV',
    image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500&q=80',
    description: 'Kính mát thời trang gọng tròn mảnh tinh xảo, tròng kính phân cực chống tia UV400 bảo vệ mắt tuyệt đối dưới ánh nắng rực rỡ.',
    brand: 'EyeGlance',
    attributes: [
      { key: 'Chất liệu gọng', value: 'Hợp kim titan mạ tĩnh điện chống gỉ sét' },
      { key: 'Tròng kính', value: 'Polarized chống lóa, chống tia cực tím UV400' },
      { key: 'Xuất xứ', value: 'Chính hãng Đài Loan' },
      { key: 'Phụ kiện kèm theo', value: 'Hộp đựng bọc da sang trọng + Khăn lau micro-fiber' }
    ]
  },

  // === ĐIỆN TỬ ===
  {
    id: 'e-1',
    name: 'Tai nghe không dây chụp tai chống ồn ANC',
    price: 690000,
    oldPrice: 950000,
    category: 'Điện tử',
    slug: 'tai-nghe-bluetooth-anc',
    rating: 4.8,
    soldCount: 722,
    badge: 'Chống ồn',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80',
    description: 'Trải nghiệm âm thanh studio trung thực cao cùng công nghệ chống ồn chủ động ANC tiên tiến nhất. Đệm tai memory foam bọc da protein êm ái trọn ngày dài.',
    brand: 'Acoustic Sound',
    attributes: [
      { key: 'Kết nối', value: 'Bluetooth v5.3 hiện đại ổn định cao' },
      { key: 'Dung lượng pin', value: '40 giờ sử dụng liên tục (tắt ANC)' },
      { key: 'Công nghệ khử ồn', value: 'Active Noise Cancelling -40dB chủ động' },
      { key: 'Xuất xứ', value: 'Chính hãng USA' }
    ]
  },
  {
    id: 'e-2',
    name: 'Loa Bluetooth di động âm trầm ấm',
    price: 420000,
    oldPrice: 560000,
    category: 'Điện tử',
    slug: 'loa-mini-khong-day',
    rating: 4.5,
    soldCount: 390,
    badge: 'Bán chạy',
    image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&q=80',
    description: 'Thiết kế loa hình trụ tròn tinh xảo, chống va đập và màng rung cộng hưởng bass siêu trầm ấm dầy lực. Kết nối ghép đôi 2 loa TWS tạo âm thanh vòm đỉnh cao.',
    brand: 'SoundBlast',
    attributes: [
      { key: 'Công suất', value: '15W âm vòm 360 độ sống động' },
      { key: 'Kháng nước', value: 'Chuẩn IPX7 ngâm nước độ sâu 1m' },
      { key: 'Thời lượng pin', value: '12 giờ nghe nhạc liên tục' },
      { key: 'Xuất xứ', value: 'Nhập khẩu Singapore' }
    ]
  },
  {
    id: 'e-3',
    name: 'Chuột không dây công thái học Silent',
    price: 310000,
    oldPrice: 420000,
    category: 'Điện tử',
    slug: 'chuot-khong-day-ergonomic',
    rating: 4.6,
    soldCount: 458,
    badge: 'Cực êm',
    image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&q=80',
    description: 'Chuột không dây công thái học vừa vặn lòng bàn tay chống mỏi cổ tay tuyệt vời. Click chuột giảm 90% tiếng ồn, siêu nhạy mượt trên mọi bề mặt.',
    brand: 'LogiTech',
    attributes: [
      { key: 'Kết nối song song', value: 'Wireless USB 2.4Ghz & Bluetooth v5.0' },
      { key: 'Độ nhạy cảm biến', value: '4000 DPI điều chỉnh bằng nút bấm' },
      { key: 'Âm thanh click', value: 'Công nghệ Silent Click độc quyền siêu êm' },
      { key: 'Xuất xứ', value: 'Thụy Sĩ thương hiệu toàn cầu' }
    ]
  },
  {
    id: 'e-4',
    name: 'Bàn phím cơ không dây Compact 75%',
    price: 780000,
    oldPrice: 990000,
    category: 'Điện tử',
    slug: 'ban-phim-co-compact',
    rating: 4.7,
    soldCount: 287,
    badge: 'Hotswap',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&q=80',
    description: 'Bàn phím cơ bố cục 75% siêu gọn gàng tiết kiệm diện tích bàn làm việc. Hỗ trợ thay nóng switch hotswap, lót đệm gasket tiêu âm cho tiếng gõ cực kì đầm ấm.',
    brand: 'KeyStudio',
    attributes: [
      { key: 'Layout phím', value: '75% Compact gọn gàng, 82 phím' },
      { key: 'Switch cơ học', value: 'Linear Red Switch tháo lắp nóng hotswap' },
      { key: 'Đèn nền', value: 'Hệ thống LED RGB 16.8 triệu màu rực rỡ' },
      { key: 'Xuất xứ', value: 'Chính hãng Đài Loan' }
    ]
  },

  // === GIA DỤNG ===
  {
    id: 'h-1',
    name: 'Bộ nồi Inox cao cấp 5 đáy Kuchen',
    price: 799000,
    oldPrice: 1090000,
    category: 'Gia dụng',
    slug: 'bo-noi-inox-5-mon',
    rating: 4.7,
    soldCount: 365,
    badge: 'Đức',
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500&q=80',
    description: 'Trọn bộ 5 món nấu bếp tiện nghi chất liệu thép không gỉ inox 304 tiêu chuẩn y tế châu Âu cực kỳ an toàn cho sức khỏe. Đáy 5 lớp tỏa nhiệt đều chống cháy khét.',
    brand: 'Kuchen Cook',
    attributes: [
      { key: 'Chất liệu', value: 'Inox 304 chuẩn y khoa cao cấp' },
      { key: 'Trọn bộ gồm', value: '3 nồi nấu nắp kính cường lực, 1 quánh nấu sốt, 1 chảo chống dính sâu lòng' },
      { key: 'Loại bếp tương thích', value: 'Sử dụng hoàn hảo cho bếp từ, bếp hồng ngoại, ga' },
      { key: 'Xuất xứ', value: 'Cộng hòa Liên bang Đức' }
    ]
  },
  {
    id: 'h-2',
    name: 'Máy xay sinh tố cầm tay đa năng',
    price: 590000,
    oldPrice: 760000,
    category: 'Gia dụng',
    slug: 'may-xay-sinh-to-da-nang',
    rating: 4.6,
    soldCount: 412,
    badge: 'Tiện lợi',
    image: 'https://images.unsplash.com/photo-1578643463396-0997cb5328c1?w=500&q=80',
    description: 'Máy xay cầm tay gọn nhẹ, lưỡi dao thép siêu sắc băm nát mọi thực phẩm trong vài giây. Đi kèm cối xay thịt, cây đánh trứng tiện lợi cho người nội trợ.',
    brand: 'Philips',
    attributes: [
      { key: 'Công suất thực', value: '800W mạnh mẽ' },
      { key: 'Lưỡi dao', value: 'Thép không gỉ 4 cánh công nghệ ProBlend' },
      { key: 'Điều khiển', value: '2 tốc độ xay + 1 nút Turbo nhồi cực nhanh' },
      { key: 'Xuất xứ', value: 'Thương hiệu Hà Lan cao cấp' }
    ]
  },
  {
    id: 'h-3',
    name: 'Nồi chiên không dầu điện tử 6.5L',
    price: 1290000,
    oldPrice: 1650000,
    category: 'Gia dụng',
    slug: 'noi-chien-khong-dau-6l',
    rating: 4.8,
    soldCount: 288,
    badge: 'Giảm 50%',
    image: 'https://images.unsplash.com/photo-1621972750749-0fbb1abb7736?w=500&q=80',
    description: 'Công nghệ luồng khí nóng đối lưu 3D chiên nướng giòn rụm bên ngoài, mọng nước bên trong mà không cần dầu mỡ, giảm 85% mỡ thừa độc hại trong thức ăn.',
    brand: 'Tefal',
    attributes: [
      { key: 'Dung tích lòng nồi', value: '6.5 Lít thoải mái nướng nguyên con gà' },
      { key: 'Nhiệt độ tối đa', value: '80 - 200 độ C' },
      { key: 'Chế độ cài sẵn', value: '8 chương trình tự động thông minh' },
      { key: 'Xuất xứ', value: 'Chính hãng thương hiệu Pháp' }
    ]
  },
  {
    id: 'h-4',
    name: 'Bộ dao bếp chuyên nghiệp thép Nhật',
    price: 450000,
    oldPrice: 620000,
    category: 'Gia dụng',
    slug: 'bo-dao-bep-thep-nhat',
    rating: 4.5,
    soldCount: 233,
    badge: 'Cực bén',
    image: 'https://images.unsplash.com/photo-1593616562423-da1cb65df6eb?w=500&q=80',
    description: 'Bộ dao bếp được thợ rèn thủ công theo công thức kiếm Katana Nhật Bản, siêu sắc bén giữ cạnh cắt lâu dài. Gồm đầy đủ các loại dao từ thái, băm đến gọt.',
    brand: 'Katana',
    attributes: [
      { key: 'Chất liệu lưỡi', value: 'Thép carbon cao Damascus bền bỉ chống gỉ' },
      { key: 'Trọn bộ gồm', value: '5 dao bếp chuyên nghiệp + 1 kéo cắt xương + 1 khối cắm bằng gỗ sồi sang trọng' },
      { key: 'Cán dao', value: 'Gỗ pakka chống thấm nước cao cấp dễ cầm nắm' },
      { key: 'Xuất xứ', value: 'Nhật Bản thủ công tinh xảo' }
    ]
  },

  // === LÀM ĐẸP ===
  {
    id: 'b-1',
    name: 'Serum cấp ẩm phục hồi Hyaluronic Acid 2% + B5',
    price: 325000,
    oldPrice: 420000,
    category: 'Làm đẹp',
    slug: 'serum-cap-am-ha',
    rating: 4.8,
    soldCount: 540,
    badge: 'Chính hãng',
    image: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=500&q=80',
    description: 'Huyết thanh siêu cấp nước chứa tinh chất Hyaluronic Acid ngậm nước gấp 1000 lần trọng lượng của nó kết hợp cùng vitamin B5 giúp phục hồi làn da tổn thương hư tổn nhanh chóng.',
    brand: 'DermaLab',
    attributes: [
      { key: 'Dung tích', value: '30ml dạng vòi bóp vệ sinh' },
      { key: 'Loại da khuyên dùng', value: 'Phù hợp mọi loại da kể cả da dầu mụn mẫn đỏ' },
      { key: 'Thành phần nổi bật', value: 'Hyaluronic Acid tinh khiết cao phân tử, Vitamin B5 (Panthenol)' },
      { key: 'Xuất xứ', value: 'Sản xuất tại Pháp' }
    ]
  },
  {
    id: 'b-2',
    name: 'Kem chống nắng nâng tông SPF50+ PA++++',
    price: 260000,
    oldPrice: 330000,
    category: 'Làm đẹp',
    slug: 'kem-chong-nang-spf50',
    rating: 4.7,
    soldCount: 690,
    badge: 'Kiềm dầu',
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&q=80',
    description: 'Kem chống nắng phổ rộng vật lý lai hóa học bảo vệ da tối đa trước ánh nắng gay gắt. Lớp kết thúc khô ráo nâng tông hồng đào tự nhiên thay thế kem lót trang điểm.',
    brand: 'SunShield',
    attributes: [
      { key: 'Dung tích thực', value: '50ml dạng tuýp tiện dụng' },
      { key: 'Chỉ số bảo vệ', value: 'SPF50+ PA++++ chống tia UVA, UVB quang phổ rộng cực mạnh' },
      { key: 'Tính năng bổ sung', value: 'Nâng tông sáng hồng tự nhiên, kiềm dầu nhẹ mát dịu' },
      { key: 'Xuất xứ', value: 'Hàn Quốc công nghệ cao' }
    ]
  },
  {
    id: 'b-3',
    name: 'Nước hoa nữ Chanel hương cỏ ngọt ngào',
    price: 980000,
    oldPrice: 1280000,
    category: 'Làm đẹp',
    slug: 'nuoc-hoa-floral-50ml',
    rating: 4.6,
    soldCount: 190,
    badge: 'Quyến rũ',
    image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=500&q=80',
    description: 'Kiệt tác nước hoa hương hoa cỏ thanh thoát quyến rũ nồng nàn. Thích hợp cho những cô nàng theo đuổi phong cách sang trọng, kiêu sa lãng mạn đầy thu hút.',
    brand: 'Chanel Paris',
    attributes: [
      { key: 'Dung tích', value: '50ml dạng xịt phun sương mịn' },
      { key: 'Nốt hương chủ đạo', value: 'Hương đầu Cam Bergamot tươi mát, hương giữa Hoa Hồng Thổ Nhĩ Kỳ kiêu sa, hương cuối Xạ Hương trắng ngọt ngào quyến luyến' },
      { key: 'Thời gian lưu hương', value: 'Độ lưu hương lâu bền từ 8 đến 12 tiếng liên tục' },
      { key: 'Xuất xứ', value: 'Nhập khẩu chính hãng Pháp' }
    ]
  },
  {
    id: 'b-4',
    name: 'Son lì velvet mịn như nhung màu đỏ đất',
    price: 295000,
    oldPrice: 380000,
    category: 'Làm đẹp',
    slug: 'son-li-velvet',
    rating: 4.7,
    soldCount: 472,
    badge: 'Môi mướt',
    image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=500&q=80',
    description: 'Chất son xốp kem lì bám môi siêu mềm mướt không hề gây lộ vân môi hay khô môi bết dính. Màu đỏ đất thời thượng tôn lên nước da châu Á sáng hồng quyến rũ.',
    brand: 'LipChic',
    attributes: [
      { key: 'Trọng lượng', value: '3.8g thỏi son thiết kế tinh tế' },
      { key: 'Tông màu son', value: 'Màu đỏ đất kiêu kỳ cổ điển thời thượng' },
      { key: 'Chất son', value: 'Velvet Matte nhung lì mướt dưỡng ẩm' },
      { key: 'Xuất xứ', value: 'Hàn Quốc xu hướng trẻ trung' }
    ]
  },

  // === THỂ THAO ===
  {
    id: 's-1',
    name: 'Giày chạy bộ chuyên dụng Nike Air Pro',
    price: 1150000,
    oldPrice: 1490000,
    category: 'Thể thao',
    slug: 'giay-chay-bo-nhe',
    rating: 4.8,
    soldCount: 310,
    badge: 'Kháng chấn',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80',
    description: 'Trải nghiệm chạy bộ mượt mà êm ái cùng hệ thống đệm khí Air kháng chấn tối ưu bảo vệ gót chân và khớp gối hiệu quả. Vải dệt lưới thoáng khí tản nhiệt tốt.',
    brand: 'Nike Air Pro',
    attributes: [
      { key: 'Chất liệu đế', value: 'Cao su đệm khí nén chống mài mòn cực tốt' },
      { key: 'Thân giày', value: 'Vải mesh dệt sợi cao cấp siêu nhẹ co giãn mát chân' },
      { key: 'Bảng cỡ giày', value: '39, 40, 41, 42, 43 thoải mái lựa chọn' },
      { key: 'Xuất xứ', value: 'Chính hãng thương hiệu USA' }
    ]
  },
  {
    id: 's-2',
    name: 'Thảm tập Yoga định tuyến chống trượt TPE',
    price: 390000,
    oldPrice: 520000,
    category: 'Thể thao',
    slug: 'tham-yoga-chong-truot',
    rating: 4.6,
    soldCount: 260,
    badge: 'Định tuyến',
    image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500&q=80',
    description: 'Thảm tập Yoga chuyên nghiệp có vạch định tuyến căn chuẩn tư thế chuẩn xác. Cao su TPE tự nhiên đàn hồi êm ái, bám sàn cực chắc chắn không sợ trơn trượt.',
    brand: 'Liforme Yoga',
    attributes: [
      { key: 'Chất liệu thảm', value: 'Nhựa cao su đàn hồi TPE thân thiện bảo vệ môi trường' },
      { key: 'Độ dày thảm', value: '6mm độ dày vàng đạt tiêu chuẩn bảo vệ xương khớp' },
      { key: 'Đặc tính chống trượt', value: 'Bề mặt phủ vân nhám siêu bám bất chấp mồ hôi tay chân' },
      { key: 'Xuất xứ', value: 'Chính hãng Anh Quốc cao cấp' }
    ]
  },
  {
    id: 's-3',
    name: 'Áo thể thao dry-fit thoáng khí nam',
    price: 240000,
    oldPrice: 320000,
    category: 'Thể thao',
    slug: 'ao-the-thao-dry-fit',
    rating: 4.5,
    soldCount: 338,
    badge: 'Co giãn tốt',
    image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=500&q=80',
    description: 'Áo thun thể thao nam cao cấp với công nghệ sợi tản nhiệt Dry-Fit thoát mồ hôi siêu tốc giữ cơ thể luôn khô thoáng mát mẻ suốt buổi tập cường độ cao.',
    brand: 'UnderArmour',
    attributes: [
      { key: 'Chất liệu vải', value: 'Sợi tổng hợp polyester thể thao dệt siêu mỏng nhẹ' },
      { key: 'Cỡ áo', value: 'M, L, XL, XXL vừa vặn cơ thể' },
      { key: 'Độ co giãn', value: 'Sợi spandex co giãn 4 chiều vận động linh hoạt' },
      { key: 'Xuất xứ', value: 'Gia công xuất khẩu Việt Nam' }
    ]
  },
  {
    id: 's-4',
    name: 'Bình nước thể thao inox giữ nhiệt 1L',
    price: 185000,
    oldPrice: 250000,
    category: 'Thể thao',
    slug: 'binh-nuoc-the-thao-1l',
    rating: 4.5,
    soldCount: 205,
    badge: 'Giữ nhiệt',
    image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&q=80',
    description: 'Bình nước dung tích lớn 1000ml bọc lớp sơn sần tĩnh điện chống va đập xước sát. Công nghệ vách kép chân không giữ nước đá lạnh tê mát 24 giờ liên tục.',
    brand: 'HydroFlask',
    attributes: [
      { key: 'Dung tích thực', value: '1000ml thoải mái hoạt động cả buổi tập' },
      { key: 'Chất liệu bình', value: 'Thép không gỉ inox 316 cao cấp y khoa chống mài mòn' },
      { key: 'Khả năng giữ nhiệt', value: 'Giữ lạnh sâu 24 tiếng, giữ nóng 12 tiếng liên tục' },
      { key: 'Xuất xứ', value: 'Thương hiệu chính hãng USA' }
    ]
  },

  // === SÁCH ===
  {
    id: 'bk-1',
    name: 'Sách "Tư Duy Phản Biện" — Richard Paul',
    price: 168000,
    oldPrice: 220000,
    category: 'Sách & Văn phòng',
    slug: 'sach-tu-duy-phan-bien',
    rating: 4.8,
    soldCount: 290,
    badge: 'Bestseller',
    image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&q=80',
    description: 'Cuốn sách gối đầu giường giúp khai phóng trí tuệ, cải thiện tư duy logic giải quyết vấn đề hiệu quả dưới góc độ khoa học thực tế nhất. Một cuốn sách không thể bỏ qua của người trưởng thành.',
    brand: 'NXB Thế Giới',
    attributes: [
      { key: 'Tác giả', value: 'Richard Paul & Linda Elder giáo sư triết học hàng đầu' },
      { key: 'Số trang sách', value: '420 trang giấy cream Nhật bồi láng mịn chống mỏi mắt' },
      { key: 'Hình thức bìa', value: 'Bìa mềm tay gập cứng cáp cán vân nhám sang trọng' },
      { key: 'Dịch thuật', value: 'Dịch giả uy tín bản quyền độc quyền' }
    ]
  },
  {
    id: 'bk-2',
    name: 'Sổ tay kế hoạch Planner da Saffiano',
    price: 115000,
    oldPrice: 160000,
    category: 'Sách & Văn phòng',
    slug: 'so-tay-planner-2026',
    rating: 4.6,
    soldCount: 420,
    badge: 'NoteBook',
    image: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=500&q=80',
    description: 'Sổ tay lập kế hoạch công việc khoa học thiết lập mục tiêu hàng ngày. Bìa bọc da vân Saffiano nhân tạo chống nước xước mốc sờ cực sướng tay.',
    brand: 'NoteBook Premium',
    attributes: [
      { key: 'Chất liệu bìa sổ', value: 'Bọc da nhân tạo Saffiano ép vân tinh xảo' },
      { key: 'Khổ giấy sổ', value: 'Kích thước chuẩn A5 tiện lợi đút balo túi xách' },
      { key: 'Chất lượng giấy', value: 'Giấy kem Nhật 100gsm chống thấm nhòe mọi loại mực' },
      { key: 'Xuất xứ', value: 'Gia công xưởng da Việt Nam cao cấp' }
    ]
  },
  {
    id: 'bk-3',
    name: 'Bộ bút gel ký tên premium set 6 cây',
    price: 89000,
    oldPrice: 120000,
    category: 'Sách & Văn phòng',
    slug: 'but-gel-premium-set-6',
    rating: 4.5,
    soldCount: 518,
    badge: 'Mực êm',
    image: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=500&q=80',
    description: 'Bộ 6 thỏi bút mực nước đầu bi kim cực êm ái mượt mà, mực ra đều tắp ko lem nhòe giấy. Thích hợp dùng ký văn bản, viết lách sáng tạo học tập.',
    brand: 'Pentel',
    attributes: [
      { key: 'Kích thước ngòi', value: 'Đầu kim 0.5mm nét thanh mảnh tinh xảo' },
      { key: 'Màu mực trong bộ', value: 'Gồm 3 bút mực xanh, 2 bút mực đen, 1 bút mực đỏ' },
      { key: 'Đặc tính mực', value: 'Mực nước công nghệ mau khô, không bay màu theo thời gian' },
      { key: 'Xuất xứ', value: 'Nhật Bản thương hiệu bút viết số 1' }
    ]
  },
  {
    id: 'bk-4',
    name: 'Đèn bàn học LED chống cận thị Xiaomi',
    price: 355000,
    oldPrice: 460000,
    category: 'Sách & Văn phòng',
    slug: 'den-ban-hoc-chong-can',
    rating: 4.6,
    soldCount: 173,
    badge: 'Thông minh',
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&q=80',
    description: 'Đèn bàn học dải LED dọc dàn trải ánh sáng đều không gây bóng lóa nhức mắt mỏi mắt. Đèn có 3 dải màu ánh sáng chống cận tốt bảo vệ võng mạc tối đa cho con trẻ học bài.',
    brand: 'Xiaomi SmartHome',
    attributes: [
      { key: 'Công suất đèn', value: '10W công nghệ LED dải tỏa rộng cực tiết kiệm điện' },
      { key: 'Chế độ ánh sáng', value: '3 dải màu thông minh (Trắng mát học bài, vàng ấm thư giãn đọc sách, trung tính làm việc)' },
      { key: 'Bảo vệ thị lực', value: 'Bộ lọc ánh sáng xanh dịu chuẩn y khoa phòng chống cận thị tối đa' },
      { key: 'Xuất xứ', value: 'Chính hãng phân phối Xiaomi' }
    ]
  }
];

function mockCategoriesTree() {
  return MOCK_CATEGORIES.map((c, i) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    is_active: true,
    show_in_menu: true,
    display_order: i + 1
  }));
}

function mockProducts(filters = {}) {
  const q = String(filters.search || '').toLowerCase();
  const catSlug = String(filters.category_slug || '').toLowerCase();
  let list = [...MOCK_PRODUCTS];
  if (catSlug) {
    const mappedName = MOCK_CATEGORIES.find((c) => c.slug === catSlug)?.name;
    if (mappedName) list = list.filter((p) => p.category === mappedName);
  }
  if (q) list = list.filter((p) => `${p.name} ${p.category}`.toLowerCase().includes(q));
  if (filters.limit) list = list.slice(0, Number(filters.limit));
  return list;
}

function isLegacyPetProduct(product) {
  const text = `${product?.name || ''} ${product?.description || ''} ${product?.image || ''}`.toLowerCase();
  return [
    'mèo', 'meo', 'chó', 'cho', 'cún', 'pet', 'paw', 'me-o', 'royal canin', 'whiskas', 'nhà cây',
    'cat', 'dog', 'petcare', 'catsrang', 'nekko', 'fancy feast', 'orijen', 'pedigree', 'catree', 'me-o adult', 'kibble'
  ].some((k) => text.includes(k));
}

function shouldUseMockProducts(filters, products) {
  if (!products.length) return true;
  if (products.some(isLegacyPetProduct)) return true;

  const catSlug = String(filters.category_slug || '').toLowerCase();
  if (!catSlug) return false;

  const mappedName = MOCK_CATEGORIES.find((c) => c.slug === catSlug)?.name;
  if (!mappedName) return false;

  return products.some((p) => String(p.category || '').toLowerCase() !== mappedName.toLowerCase());
}

// ============================================================
//  Feature Detection
// ============================================================

/** Returns true if PostgreSQL backend is expected to be available */
export function isV2ApiConfigured() {
  return !!import.meta.env.VITE_API_URL || !import.meta.env.PROD;
}

// ============================================================
//  HTTP Helpers
// ============================================================

async function v2Request(path, options = {}) {
  try {
    const res = await fetch(`${API_BASE}/api${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers }
    });
    if (!res.ok) {
      if (res.status === 404) return null; // allow graceful mock fallback
      throw new Error(`API error (${res.status}): ${res.statusText}`);
    }
    return res.json();
  } catch (err) {
    if (err.name === 'TypeError') return null; // network error
    throw err;
  }
}

// ============================================================
//  Data Transformers
// ============================================================

function transformProduct(pgProduct) {
  const basePrice = Number(pgProduct.base_price) || Number(pgProduct.price) || 0;
  const salePrice = Number(pgProduct.sale_price) || Number(pgProduct.old_price) || Number(pgProduct.oldPrice) || 0;

  let totalStock = 0;
  let defaultVariant = null;
  let variants = [];

  if (pgProduct.variants && pgProduct.variants.length > 0) {
    variants = pgProduct.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      name: v.name_vi || v.name || '',
      price: Number(v.price) || 0,
      salePrice: Number(v.sale_price) || 0,
      image: v.image_url || v.image || '',
      stock: Number(v.stock_quantity) || 0,
      reserved: Number(v.reserved_quantity) || 0,
      isDefault: v.is_default === true,
      attributes: v.variant_attributes || []
    }));

    totalStock = variants.reduce((sum, v) => sum + v.stock, 0);
    defaultVariant = variants.find((v) => v.isDefault) || variants[0];
  }

  const effectivePrice = defaultVariant ? (defaultVariant.price || basePrice) : basePrice;
  const effectiveSalePrice = defaultVariant ? (defaultVariant.salePrice || salePrice) : salePrice;

  return {
    id: pgProduct.id,
    name: pgProduct.name_vi || pgProduct.name_en || pgProduct.name || '',
    category: pgProduct.category_name_vi || pgProduct.category || '',
    price: effectivePrice,
    oldPrice: effectiveSalePrice > effectivePrice ? effectiveSalePrice : undefined,
    stock: totalStock,
    badge: pgProduct.badge_vi || pgProduct.badge || '',
    image: pgProduct.image || pgProduct.primary_image_url || pgProduct.image_url || '',
    description: pgProduct.description_vi || pgProduct.description_en || pgProduct.description || '',
    slug: pgProduct.slug || '',
    rating: pgProduct.rating || 4.5,
    reviewCount: pgProduct.reviewCount || 0,
    brand: pgProduct.brand || '',
    weight: '',
    gallery: pgProduct.images
      ? (typeof pgProduct.images === 'string' ? JSON.parse(pgProduct.images) : pgProduct.images)
      : [pgProduct.image || pgProduct.primary_image_url || pgProduct.image_url],
    colors: [],
    sizes: [],
    attributes: pgProduct.attributes || [],
    variants,
    _pg: pgProduct
  };
}

function transformProducts(pgProducts) {
  return (pgProducts || [])
    .filter((p) => !isLegacyPetProduct(p))
    .map(transformProduct);
}

function transformCategory(pgCat) {
  return {
    id: pgCat.id,
    name: pgCat.name_vi || pgCat.name_en || '',
    slug: pgCat.slug || '',
    description: pgCat.description_vi || '',
    image: pgCat.image_url || '',
    parentId: pgCat.parent_id || null,
    displayOrder: pgCat.display_order || 0,
    isActive: pgCat.is_active !== false,
    showInMenu: pgCat.show_in_menu !== false,
    showInHomepage: pgCat.show_in_homepage || false,
    _pg: pgCat
  };
}

function transformCategories(pgCategories) {
  return (pgCategories || []).map(transformCategory);
}

// ============================================================
//  Category API
// ============================================================

let cachedCategories = null;

/** Fetch all categories */
export async function fetchCategories() {
  if (cachedCategories) return cachedCategories;

  const res = await v2Request('/categories');
  if (res?.data) {
    const cats = transformCategories(res.data);
    const nameList = cats
      .filter(c => c.isActive && c.showInMenu)
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map(c => c.name);
    cachedCategories = { raw: cats, names: ['Tất cả', ...nameList] };
    return cachedCategories;
  }

  return { raw: [], names: ['Tất cả'] };
}

/** Get category tree (hierarchical) */
export async function fetchCategoryTree() {
  const res = await v2Request('/categories/tree');
  if (res?.data) return res.data;
  return mockCategoriesTree();
}

/** Get category by slug */
export async function fetchCategoryBySlug(slug) {
  const res = await v2Request(`/categories/${encodeURIComponent(slug)}`);
  if (res?.data) return transformCategory(res.data);
  return null;
}

/** Resolve a Vietnamese name to category slug */
export async function resolveCategorySlug(displayName) {
  if (!displayName || displayName === 'Tất cả') return null;
  const cats = await fetchCategories();
  const found = cats.raw.find(c => c.name === displayName);
  return found?.slug || null;
}

// ============================================================
//  Product API
// ============================================================

/** Fetch all products with optional filters */
export async function fetchProducts(filters = {}) {
  const params = new URLSearchParams();
  if (filters.category_slug) params.set('category_slug', filters.category_slug);
  if (filters.category_name) {
    const slug = await resolveCategorySlug(filters.category_name);
    if (slug) params.set('category_slug', slug);
  }
  if (filters.search) params.set('search', filters.search);
  if (filters.min_price) params.set('min_price', filters.min_price);
  if (filters.max_price) params.set('max_price', filters.max_price);
  if (filters.is_featured) params.set('is_featured', 'true');
  if (filters.is_new) params.set('is_new', 'true');
  if (filters.is_bestseller) params.set('is_bestseller', 'true');
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.page) params.set('page', String(filters.page));
  if (filters.sort_by) params.set('sort_by', filters.sort_by);
  if (filters.sort_order) params.set('sort_order', filters.sort_order);

  const qs = params.toString();
  const res = await v2Request(`/products${qs ? `?${qs}` : ''}`);
  if (res?.data) {
    const products = transformProducts(res.data);
    return shouldUseMockProducts(filters, products) ? mockProducts(filters) : products;
  }

  return mockProducts(filters);
}

/** Fetch a single product by its slug */
export async function fetchProductBySlug(slug) {
  const res = await v2Request(`/products/${encodeURIComponent(slug)}?include_variants=true&include_attributes=true`);
  if (res?.data) return transformProduct(res.data);

  return MOCK_PRODUCTS.find((p) => p.slug === slug) || null;
}

/** Search products via PostgreSQL full-text search */
export async function searchProductsV2(query, filters = {}) {
  const params = new URLSearchParams();
  params.set('q', query);
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.page) params.set('page', String(filters.page));
  if (filters.min_price) params.set('min_price', String(filters.min_price));
  if (filters.max_price) params.set('max_price', String(filters.max_price));
  if (filters.sort_by) params.set('sort_by', filters.sort_by);
  if (filters.sort_order) params.set('sort_order', filters.sort_order);

  const qs = params.toString();
  const res = await v2Request(`/products/search?${qs}`);
  if (res?.data) {
    return {
      products: transformProducts(res.data),
      total: res.total || 0,
      page: res.page || 1,
      limit: res.limit || 20,
      totalPages: res.totalPages || 1
    };
  }

  return { products: [], total: 0, page: 1, limit: 20, totalPages: 1 };
}

/** Fetch featured products */
export async function fetchFeaturedProducts(limit = 10) {
  try {
    const res = await v2Request(`/products/featured?limit=${limit}`);
    if (res?.data) {
      const products = transformProducts(res.data);
      return products.length > 0 ? products : mockProducts({ limit });
    }
  } catch (err) {
    console.warn('Failed to fetch featured products, using mock:', err);
  }
  return mockProducts({ limit });
}

/** Fetch new products */
export async function fetchNewProducts(limit = 10) {
  try {
    const res = await v2Request(`/products/new?limit=${limit}`);
    if (res?.data) {
      const products = transformProducts(res.data);
      return products.length > 0 ? products : mockProducts({ limit });
    }
  } catch (err) {
    console.warn('Failed to fetch new products, using mock:', err);
  }
  return mockProducts({ limit });
}

/** Fetch best-selling products */
export async function fetchBestsellers(limit = 10, categoryId = null) {
  try {
    let url = `/products/bestsellers?limit=${limit}`;
    if (categoryId) url += `&category_id=${encodeURIComponent(categoryId)}`;
    const res = await v2Request(url);
    if (res?.data) {
      const products = transformProducts(res.data);
      return products.length > 0 ? products : mockProducts({ limit });
    }
  } catch (err) {
    console.warn('Failed to fetch bestsellers, using mock:', err);
  }
  return mockProducts({ limit });
}

/** Fetch related products (by same category) */
export async function fetchRelatedProducts(productId, limit = 6) {
  const res = await v2Request(`/products/${encodeURIComponent(productId)}/related?limit=${limit}`);
  if (res?.data) return transformProducts(res.data);
  return [];
}

// ============================================================
//  Admin CRUD API
// ============================================================

/** Create a product in PostgreSQL via admin API */
export async function createProductV2(data) {
  let categorySlug = data.category_slug || '';
  if (!categorySlug && data.category) {
    categorySlug = await resolveCategorySlug(data.category) || '';
  }

  const transformed = {
    name_vi: data.name,
    slug: data.slug || slugify(data.name) + '-' + Date.now(),
    base_price: Number(data.price) || 0,
    sale_price: Number(data.oldPrice) || 0,
    category_slug: categorySlug,
    brand: data.brand || '',
    primary_image_url: data.image || '',
    description_vi: data.description || '',
    is_active: true
  };

  const res = await v2Request('/admin/products', {
    method: 'POST',
    body: JSON.stringify({ product: transformed })
  });
  if (res?.data) return transformProduct(res.data);
  throw new Error('Failed to create product via PostgreSQL');
}

/** Update a product in PostgreSQL via admin API */
export async function updateProductV2(id, patch) {
  const transformed = {};
  if (patch.name !== undefined) transformed.name_vi = patch.name;
  if (patch.price !== undefined) transformed.base_price = Number(patch.price);
  if (patch.oldPrice !== undefined) transformed.sale_price = Number(patch.oldPrice);
  if (patch.stock !== undefined) transformed.stock = Number(patch.stock);
  if (patch.image !== undefined) transformed.primary_image_url = patch.image;
  if (patch.description !== undefined) transformed.description_vi = patch.description;
  if (patch.brand !== undefined) transformed.brand = patch.brand;
  if (patch.category !== undefined) transformed.category_slug = patch.category;

  const res = await v2Request(`/admin/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(transformed)
  });
  if (res?.data) return transformProduct(res.data);
  throw new Error('Failed to update product via PostgreSQL');
}

/** Delete a product from PostgreSQL via admin API */
export async function deleteProductV2(id) {
  const res = await v2Request(`/admin/products/${id}`, { method: 'DELETE' });
  if (res?.ok) return true;
  throw new Error('Failed to delete product via PostgreSQL');
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// ============================================================
//  Cache Control
// ============================================================

/** Invalidate the categories cache (useful after admin changes) */
export function invalidateCategoryCache() {
  cachedCategories = null;
}

export default {
  isV2ApiConfigured,
  fetchCategories,
  fetchCategoryTree,
  fetchCategoryBySlug,
  resolveCategorySlug,
  fetchProducts,
  fetchProductBySlug,
  searchProductsV2,
  fetchFeaturedProducts,
  fetchNewProducts,
  fetchBestsellers,
  fetchRelatedProducts,
  createProductV2,
  updateProductV2,
  deleteProductV2,
  invalidateCategoryCache
};
