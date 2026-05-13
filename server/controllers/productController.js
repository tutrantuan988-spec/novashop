const Product = require('../models/Product');
const Category = require('../models/Category');

const PUBLIC_SELECT = '-__v';

async function getProducts(req, res) {
  try {
    const { category, brand, minPrice, maxPrice, search, sort, page = 1, limit = 20, featured } = req.query;
    const filter = { isActive: true };

    if (category) {
      const cat = await Category.findOne({ slug: category });
      if (cat) filter.category = cat._id;
    }
    if (brand) filter.brand = brand;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (featured === 'true') filter.isFeatured = true;
    if (search) filter.$text = { $search: search };

    let query = Product.find(filter).select(PUBLIC_SELECT).populate('category', 'name slug');

    switch (sort) {
      case 'price-asc': query = query.sort({ price: 1 }); break;
      case 'price-desc': query = query.sort({ price: -1 }); break;
      case 'rating': query = query.sort({ rating: -1 }); break;
      case 'popular': query = query.sort({ sold: -1 }); break;
      case 'newest': query = query.sort({ createdAt: -1 }); break;
      default: query = query.sort({ isFeatured: -1, rating: -1 });
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      query.skip(skip).limit(Number(limit)).lean(),
      Product.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: products,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

async function getProductBySlug(req, res) {
  try {
    const product = await Product.findOne({ slug: req.params.slug, isActive: true })
      .select(PUBLIC_SELECT)
      .populate('category', 'name slug')
      .lean();
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

async function getCategories(req, res) {
  try {
    const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1 }).lean();
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

async function getFeaturedProducts(req, res) {
  try {
    const products = await Product.find({ isActive: true, isFeatured: true })
      .select(PUBLIC_SELECT)
      .sort({ rating: -1 })
      .limit(12)
      .lean();
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

async function getRelatedProducts(req, res) {
  try {
    const product = await Product.findOne({ slug: req.params.slug, isActive: true }).lean();
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
    const related = await Product.find({
      _id: { $ne: product._id },
      category: product.category,
      isActive: true
    }).select(PUBLIC_SELECT).limit(6).lean();
    res.json({ success: true, data: related });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getProducts,
  getProductBySlug,
  getCategories,
  getFeaturedProducts,
  getRelatedProducts
};
