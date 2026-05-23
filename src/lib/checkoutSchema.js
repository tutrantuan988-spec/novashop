import { z } from 'zod';

export const checkoutSchema = z.object({
  fullName: z.string().min(2, 'Họ tên ít nhất 2 ký tự').max(100),
  email: z.string().email('Email không hợp lệ').min(1, 'Vui lòng nhập email'),
  phone: z.string().regex(/^(0|\+84)[0-9]{8,9}$/, 'Số điện thoại không hợp lệ (vd: 0901234567)'),
  address: z.string().min(5, 'Địa chỉ ít nhất 5 ký tự').max(255),
  city: z.string().min(2, 'Vui lòng chọn tỉnh/thành phố').max(100),
  district: z.string().min(2, 'Vui lòng chọn quận/huyện').max(100),
  ward: z.string().min(2, 'Vui lòng chọn phường/xã').max(100),
  note: z.string().max(500).optional(),
  payment: z.enum(['cod', 'bank', 'momo', 'vnpay', 'stripe'])
});
