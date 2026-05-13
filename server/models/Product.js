const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, index: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  brand: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  oldPrice: { type: Number, default: 0, min: 0 },
  stock: { type: Number, required: true, min: 0, default: 0 },
  sku: { type: String, required: true, unique: true },
  description: { type: String, default: '' },
  shortDescription: { type: String, default: '' },
  images: [{ type: String }],
  image: { type: String, default: '' },
  badge: { type: String, default: '' },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },
  weight: { type: String, default: '' },
  size: { type: String, default: '' },
  suitable: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  tags: [{ type: String }],
  views: { type: Number, default: 0 },
  sold: { type: Number, default: 0 }
}, { timestamps: true });

productSchema.index({ slug: 1, isActive: 1 });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ price: 1 });
productSchema.index({ name: 'text', description: 'text', brand: 'text' });
productSchema.index({ isFeatured: 1, rating: -1 });

module.exports = mongoose.model('Product', productSchema);
