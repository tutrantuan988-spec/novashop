const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, default: '' },
  content: { type: String, required: true },
  images: [{ type: String }],
  isVerified: { type: Boolean, default: false },
  helpful: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

reviewSchema.index({ product: 1, isActive: 1 });
reviewSchema.index({ user: 1 });
reviewSchema.index({ rating: -1 });

module.exports = mongoose.model('Review', reviewSchema);
