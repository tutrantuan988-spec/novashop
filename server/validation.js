const { z } = require('zod');

const IdParam = z.string().min(1);

const CustomerSchema = z.object({
  name: z.string().min(1, 'Thiếu tên khách hàng').max(120),
  phone: z.string().min(1, 'Thiếu số điện thoại').max(20),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  address: z.string().min(1, 'Thiếu địa chỉ').max(500)
});

const OrderItemSchema = z.object({
  id: z.union([z.string(), z.number()]).transform((v) => String(v)),
  name: z.string().optional(),
  price: z.number().optional(),
  image: z.string().optional(),
  quantity: z.number().int().min(1, 'Số lượng tối thiểu là 1').max(999)
});

const OrderBody = z.object({
  order: z.object({
    customer: CustomerSchema,
    items: z.array(OrderItemSchema).min(1, 'Đơn hàng phải có ít nhất 1 sản phẩm'),
    paymentMethod: z.enum(['cod', 'bank', 'momo', 'stripe', 'vnpay']).default('cod'),
    shipping: z.number().min(0).default(0),
    coupon: z.string().max(50).optional().or(z.literal(''))
  })
});

const CheckoutSessionBody = z.object({
  items: z.array(OrderItemSchema).min(1),
  orderId: z.string().optional(),
  customerEmail: z.string().email().optional().or(z.literal(''))
});

const ProductBody = z.object({
  product: z.object({
    id: z.union([z.string(), z.number()]).optional(),
    name: z.string().min(1, 'Tên sản phẩm không được để trống').max(200),
    price: z.number().min(0, 'Giá không được âm'),
    originalPrice: z.number().min(0).optional(),
    category: z.string().max(60).optional(),
    image: z.string().max(1000).optional(),
    gallery: z.array(z.string().max(1000)).max(10).optional(),
    description: z.string().max(5000).optional(),
    stock: z.number().int().min(0).optional(),
    colors: z.array(z.string()).max(20).optional(),
    sizes: z.array(z.string()).max(20).optional(),
    featured: z.boolean().optional(),
    active: z.boolean().optional()
  })
});

const ProductPatch = z.object({
  patch: z.record(z.unknown())
});

const CouponBody = z.object({
  coupon: z.object({
    code: z.string().min(1, 'Thiếu mã coupon').max(50),
    type: z.enum(['percent', 'fixed', 'shipping']).default('percent'),
    value: z.number().min(0).default(0),
    minSubtotal: z.number().min(0).default(0),
    maxDiscount: z.number().min(0).default(0),
    usageLimit: z.number().int().min(0).default(0),
    usageCount: z.number().int().min(0).default(0),
    expiresAt: z.string().datetime().optional().or(z.literal('')).or(z.null()),
    active: z.boolean().default(true)
  })
});

const CouponPatch = z.object({
  patch: z.record(z.unknown())
});

const ValidateCouponBody = z.object({
  code: z.string().min(1, 'Vui lòng nhập mã').max(50),
  subtotal: z.number().min(0).default(0)
});

const ReviewBody = z.object({
  review: z.object({
    rating: z.number().int().min(1).max(5),
    title: z.string().max(120).optional(),
    content: z.string().max(1000).optional(),
    userEmail: z.string().email('Email không hợp lệ'),
    userName: z.string().min(1).max(80)
  })
});

const OrderStatusBody = z.object({
  status: z.enum(['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'])
});

const ShippingInfoBody = z.object({
  shippingInfo: z.object({
    carrier: z.string().max(100).optional(),
    trackingCode: z.string().max(200).optional(),
    estimatedDelivery: z.string().optional(),
    note: z.string().max(500).optional()
  })
});

const VnpayCreateBody = z.object({
  orderId: z.string().min(1)
});

const MomoCreateBody = z.object({
  orderId: z.string().min(1),
  amount: z.number().min(0),
  returnUrl: z.string().url().optional(),
  ipnUrl: z.string().url().optional()
});

const AnalyticsQuery = z.object({
  days: z.string().regex(/^\d+$/, 'days phải là số').optional()
});

const schemas = {
  OrderBody,
  CheckoutSessionBody,
  ProductBody,
  ProductPatch,
  CouponBody,
  CouponPatch,
  ValidateCouponBody,
  ReviewBody,
  OrderStatusBody,
  ShippingInfoBody,
  VnpayCreateBody,
  MomoCreateBody,
  AnalyticsQuery,
  IdParam
};

function validate(schema) {
  return (req, res, next) => {
    try {
      schema.parse(req.body);
      next();
    } catch (err) {
      if (err.errors) {
        const issues = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
        return res.status(400).json({ error: 'Dữ liệu không hợp lệ', issues });
      }
      return res.status(400).json({ error: 'Dữ liệu không hợp lệ' });
    }
  };
}

function validateQuery(schema) {
  return (req, res, next) => {
    try {
      schema.parse(req.query);
      next();
    } catch (err) {
      if (err.errors) {
        const issues = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
        return res.status(400).json({ error: 'Query không hợp lệ', issues });
      }
      return res.status(400).json({ error: 'Query không hợp lệ' });
    }
  };
}

module.exports = { schemas, validate, validateQuery };
