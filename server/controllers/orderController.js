const Order = require('../models/Order');
const Product = require('../models/Product');

function generateOrderCode() {
  const prefix = 'TD';
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}${ts}${rand}`;
}

async function createOrder(req, res) {
  try {
    const { items, shippingAddress, paymentMethod, note, coupon, shippingFee = 30000 } = req.body;
    if (!items || !items.length) return res.status(400).json({ success: false, error: 'Items required' });

    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId).lean();
      if (!product) return res.status(400).json({ success: false, error: `Product ${item.productId} not found` });
      const lineTotal = product.price * item.quantity;
      subtotal += lineTotal;
      orderItems.push({
        product: product._id,
        name: product.name,
        image: product.image,
        price: product.price,
        quantity: item.quantity,
        total: lineTotal
      });
    }

    const discount = coupon ? 0 : 0; // TODO: validate coupon
    const total = subtotal + shippingFee - discount;

    const order = await Order.create({
      orderCode: generateOrderCode(),
      user: req.user._id,
      items: orderItems,
      subtotal,
      shippingFee,
      discount,
      total,
      coupon: coupon || '',
      paymentMethod,
      shippingAddress,
      note: note || '',
      timeline: [{ status: 'pending', note: 'Đơn hàng đã được tạo', createdAt: new Date() }]
    });

    // Update sold count
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, { $inc: { sold: item.quantity, stock: -item.quantity } });
    }

    res.status(201).json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

async function getMyOrders(req, res) {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const filter = { user: req.user._id };
    if (status) filter.status = status;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .populate('items.product', 'name slug image')
        .lean(),
      Order.countDocuments(filter)
    ]);

    res.json({ success: true, data: orders, pagination: { page: Number(page), limit: Number(limit), total } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

async function getOrderByCode(req, res) {
  try {
    const order = await Order.findOne({ orderCode: req.params.code, user: req.user._id })
      .populate('items.product', 'name slug image')
      .lean();
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = { createOrder, getMyOrders, getOrderByCode };
