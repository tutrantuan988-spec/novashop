const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Review = require('../models/Review');

async function getDashboardStats(req, res) {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const [
      totalOrders,
      todayOrders,
      monthOrders,
      totalRevenue,
      monthRevenue,
      totalProducts,
      totalUsers,
      lowStock,
      recentOrders
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: startOfDay } }),
      Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Order.aggregate([{ $match: { paymentStatus: 'paid' } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
      Order.aggregate([{ $match: { createdAt: { $gte: startOfMonth }, paymentStatus: 'paid' } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
      Product.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: true }),
      Product.find({ stock: { $lte: 10 }, isActive: true }).select('name stock sku').limit(10).lean(),
      Order.find().sort({ createdAt: -1 }).limit(10).populate('user', 'name email').populate('items.product', 'name image').lean()
    ]);

    res.json({
      success: true,
      data: {
        totalOrders,
        todayOrders,
        monthOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        monthRevenue: monthRevenue[0]?.total || 0,
        totalProducts,
        totalUsers,
        lowStock,
        recentOrders
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

async function getOrders(req, res) {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { orderCode: { $regex: search, $options: 'i' } },
        { 'shippingAddress.phone': { $regex: search, $options: 'i' } }
      ];
    }
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .populate('user', 'name email')
        .populate('items.product', 'name image')
        .lean(),
      Order.countDocuments(filter)
    ]);
    res.json({ success: true, data: orders, pagination: { page: Number(page), limit: Number(limit), total } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

async function updateOrderStatus(req, res) {
  try {
    const { status, note } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        status,
        $push: { timeline: { status, note: note || '', createdAt: new Date() } }
      },
      { new: true }
    ).lean();
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

async function createProduct(req, res) {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

async function updateProduct(req, res) {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).lean();
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

async function deleteProduct(req, res) {
  try {
    await Product.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Product deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getDashboardStats,
  getOrders,
  updateOrderStatus,
  createProduct,
  updateProduct,
  deleteProduct
};
