const User = require('../models/User');
const Product = require('../models/Product');

async function getProfile(req, res) {
  try {
    const user = await User.findById(req.user._id).select('-__v').lean();
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

async function updateProfile(req, res) {
  try {
    const { name, phone, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, avatar },
      { new: true, runValidators: true }
    ).select('-__v').lean();
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

async function getWishlist(req, res) {
  try {
    const user = await User.findById(req.user._id).populate('wishlist').lean();
    res.json({ success: true, data: user.wishlist || [] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

async function toggleWishlist(req, res) {
  try {
    const { productId } = req.body;
    const user = await User.findById(req.user._id);
    const idx = user.wishlist.findIndex((id) => id.toString() === productId);
    if (idx >= 0) user.wishlist.splice(idx, 1);
    else user.wishlist.push(productId);
    await user.save();
    res.json({ success: true, data: user.wishlist });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = { getProfile, updateProfile, getWishlist, toggleWishlist };
