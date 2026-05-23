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

function buildCategoryTree(records) {
  const map = new Map();
  const roots = [];

  records.forEach((cat) => {
    const id = String(cat._id || cat.id);
    map.set(id, {
      id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      image: cat.image || '',
      sort_order: cat.sortOrder || 0,
      parent_id: cat.parent ? String(cat.parent) : null,
      is_active: cat.isActive !== false,
      show_in_menu: true,
      show_in_homepage: true,
      children: []
    });
  });

  map.forEach((node) => {
    if (node.parent_id && map.has(node.parent_id)) {
      map.get(node.parent_id).children.push(node);
    } else {
      roots.push(node);
    }
  });

  // Ensure children follow sort_order ascending like frontend expects
  const sortNodes = (list) => {
    list.sort((a, b) => a.sort_order - b.sort_order);
    list.forEach((child) => sortNodes(child.children));
    return list;
  };

  return sortNodes(roots);
}

async function getCategoryTree(_req, res) {
  try {
    const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1 }).lean();
    const tree = buildCategoryTree(categories);
    res.json({ success: true, data: tree });
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
  getCategoryTree,
  getFeaturedProducts,
  getRelatedProducts
};
