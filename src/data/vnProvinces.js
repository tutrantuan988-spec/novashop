/**
 * VN Administrative Divisions (P13) - minimal dataset.
 *
 * Để gọn, chỉ chứa các tỉnh/thành phố lớn + quận/huyện chính + ward mẫu.
 * Production: thay bằng full dataset từ https://github.com/madnh/hanhchinhvn (free) hoặc
 * https://provinces.open-api.vn
 */

export const VN_PROVINCES = [
  {
    code: 'HN',
    name: 'Hà Nội',
    districts: [
      { code: 'BD', name: 'Ba Đình', wards: ['Phúc Xá', 'Trúc Bạch', 'Vĩnh Phúc', 'Cống Vị', 'Liễu Giai', 'Nguyễn Trung Trực', 'Quán Thánh', 'Ngọc Hà', 'Điện Biên', 'Đội Cấn', 'Ngọc Khánh', 'Kim Mã', 'Giảng Võ', 'Thành Công'] },
      { code: 'HK', name: 'Hoàn Kiếm', wards: ['Phúc Tân', 'Đồng Xuân', 'Hàng Mã', 'Hàng Buồm', 'Hàng Đào', 'Hàng Bồ', 'Cửa Đông', 'Lý Thái Tổ', 'Hàng Bạc', 'Hàng Gai', 'Chương Dương', 'Hàng Trống', 'Cửa Nam', 'Hàng Bông', 'Tràng Tiền', 'Trần Hưng Đạo', 'Phan Chu Trinh', 'Hàng Bài'] },
      { code: 'TX', name: 'Tây Hồ', wards: ['Phú Thượng', 'Nhật Tân', 'Tứ Liên', 'Quảng An', 'Xuân La', 'Yên Phụ', 'Bưởi', 'Thụy Khuê'] },
      { code: 'LB', name: 'Long Biên', wards: ['Thượng Thanh', 'Ngọc Thụy', 'Giang Biên', 'Đức Giang', 'Việt Hưng', 'Gia Thụy', 'Ngọc Lâm', 'Phúc Lợi'] },
      { code: 'CG', name: 'Cầu Giấy', wards: ['Nghĩa Đô', 'Nghĩa Tân', 'Mai Dịch', 'Dịch Vọng', 'Dịch Vọng Hậu', 'Quan Hoa', 'Yên Hòa', 'Trung Hòa'] },
      { code: 'DD', name: 'Đống Đa', wards: ['Cát Linh', 'Văn Miếu', 'Quốc Tử Giám', 'Láng Thượng', 'Ô Chợ Dừa', 'Văn Chương', 'Hàng Bột', 'Láng Hạ', 'Khâm Thiên', 'Thổ Quan', 'Nam Đồng', 'Trung Phụng', 'Quang Trung'] },
      { code: 'HBT', name: 'Hai Bà Trưng', wards: ['Nguyễn Du', 'Bạch Đằng', 'Bùi Thị Xuân', 'Bách Khoa', 'Cầu Dền', 'Đống Mác', 'Đồng Nhân'] },
      { code: 'HM', name: 'Hoàng Mai', wards: ['Hoàng Liệt', 'Định Công', 'Đại Kim', 'Yên Sở', 'Thịnh Liệt', 'Tương Mai'] },
      { code: 'TXh', name: 'Thanh Xuân', wards: ['Hạ Đình', 'Thanh Xuân Bắc', 'Thanh Xuân Nam', 'Kim Giang', 'Khương Trung', 'Khương Mai'] },
      { code: 'HDg', name: 'Hà Đông', wards: ['Mộ Lao', 'Văn Quán', 'Vạn Phúc', 'Quang Trung', 'Phúc La'] }
    ]
  },
  {
    code: 'HCM',
    name: 'TP. Hồ Chí Minh',
    districts: [
      { code: 'Q1', name: 'Quận 1', wards: ['Tân Định', 'Đa Kao', 'Bến Nghé', 'Bến Thành', 'Nguyễn Thái Bình', 'Phạm Ngũ Lão', 'Cầu Ông Lãnh', 'Cô Giang', 'Nguyễn Cư Trinh', 'Cầu Kho'] },
      { code: 'Q2', name: 'TP. Thủ Đức', wards: ['Thảo Điền', 'An Phú', 'Bình An', 'Thủ Thiêm', 'An Khánh', 'Bình Khánh'] },
      { code: 'Q3', name: 'Quận 3', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14'] },
      { code: 'Q4', name: 'Quận 4', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 6', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 13', 'Phường 14', 'Phường 15', 'Phường 16', 'Phường 18'] },
      { code: 'Q5', name: 'Quận 5', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15'] },
      { code: 'Q7', name: 'Quận 7', wards: ['Tân Thuận Đông', 'Tân Thuận Tây', 'Tân Kiểng', 'Tân Hưng', 'Bình Thuận', 'Tân Quy', 'Phú Thuận', 'Tân Phú', 'Tân Phong', 'Phú Mỹ'] },
      { code: 'BT', name: 'Bình Thạnh', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15', 'Phường 17', 'Phường 19', 'Phường 21', 'Phường 22', 'Phường 24', 'Phường 25', 'Phường 26', 'Phường 27', 'Phường 28'] },
      { code: 'GV', name: 'Gò Vấp', wards: ['Phường 1', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15', 'Phường 16', 'Phường 17'] },
      { code: 'TB', name: 'Tân Bình', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15'] },
      { code: 'PN', name: 'Phú Nhuận', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 13', 'Phường 15', 'Phường 17'] }
    ]
  },
  {
    code: 'DN',
    name: 'Đà Nẵng',
    districts: [
      { code: 'HC', name: 'Hải Châu', wards: ['Thanh Bình', 'Thuận Phước', 'Thạch Thang', 'Hải Châu I', 'Hải Châu II', 'Phước Ninh', 'Hòa Thuận Tây', 'Hòa Thuận Đông', 'Nam Dương', 'Bình Hiên', 'Bình Thuận', 'Hòa Cường Bắc', 'Hòa Cường Nam'] },
      { code: 'TK', name: 'Thanh Khê', wards: ['Tam Thuận', 'Thanh Khê Đông', 'Thanh Khê Tây', 'Xuân Hà', 'Tân Chính', 'Chính Gián', 'Vĩnh Trung', 'Thạc Gián', 'An Khê', 'Hòa Khê'] },
      { code: 'ST', name: 'Sơn Trà', wards: ['Thọ Quang', 'Nại Hiên Đông', 'Mân Thái', 'An Hải Bắc', 'Phước Mỹ', 'An Hải Tây', 'An Hải Đông'] },
      { code: 'NHS', name: 'Ngũ Hành Sơn', wards: ['Mỹ An', 'Khuê Mỹ', 'Hòa Quý', 'Hòa Hải'] },
      { code: 'LC', name: 'Liên Chiểu', wards: ['Hòa Hiệp Bắc', 'Hòa Hiệp Nam', 'Hòa Khánh Bắc', 'Hòa Khánh Nam', 'Hòa Minh'] },
      { code: 'CL', name: 'Cẩm Lệ', wards: ['Khuê Trung', 'Hòa Phát', 'Hòa An', 'Hòa Thọ Tây', 'Hòa Thọ Đông', 'Hòa Xuân'] }
    ]
  },
  {
    code: 'HP',
    name: 'Hải Phòng',
    districts: [
      { code: 'HB', name: 'Hồng Bàng', wards: ['Quán Toan', 'Hùng Vương', 'Sở Dầu', 'Thượng Lý', 'Hạ Lý', 'Minh Khai', 'Trại Chuối'] },
      { code: 'NG', name: 'Ngô Quyền', wards: ['Máy Chai', 'Máy Tơ', 'Vạn Mỹ', 'Cầu Tre', 'Lạc Viên', 'Lương Khánh Thiện', 'Cầu Đất', 'Gia Viên', 'Đông Khê', 'Đằng Giang', 'Lạch Tray', 'Đổng Quốc Bình'] },
      { code: 'LCh', name: 'Lê Chân', wards: ['Cát Dài', 'An Biên', 'An Dương', 'Trần Nguyên Hãn', 'Hồ Nam', 'Trại Cau', 'Dư Hàng', 'Hàng Kênh', 'Đông Hải', 'Niệm Nghĩa', 'Nghĩa Xá', 'Kênh Dương', 'Vĩnh Niệm'] }
    ]
  },
  {
    code: 'CT',
    name: 'Cần Thơ',
    districts: [
      { code: 'NK', name: 'Ninh Kiều', wards: ['Cái Khế', 'An Hòa', 'Thới Bình', 'An Nghiệp', 'An Cư', 'Tân An', 'An Phú', 'Xuân Khánh', 'Hưng Lợi', 'An Khánh', 'An Bình'] },
      { code: 'BT', name: 'Bình Thủy', wards: ['Bình Thủy', 'Trà An', 'Trà Nóc', 'Thới An Đông', 'An Thới', 'Bùi Hữu Nghĩa', 'Long Hòa', 'Long Tuyền'] }
    ]
  }
];

export function getProvinces() {
  return VN_PROVINCES.map((p) => ({ code: p.code, name: p.name }));
}

export function getDistricts(provinceCode) {
  const p = VN_PROVINCES.find((x) => x.code === provinceCode);
  return p ? p.districts.map((d) => ({ code: d.code, name: d.name })) : [];
}

export function getWards(provinceCode, districtCode) {
  const p = VN_PROVINCES.find((x) => x.code === provinceCode);
  if (!p) return [];
  const d = p.districts.find((x) => x.code === districtCode);
  return d ? d.wards.map((w) => ({ code: w, name: w })) : [];
}
