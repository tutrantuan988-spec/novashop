const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const userController = require('../controllers/userController');

router.get('/profile', authenticate, userController.getProfile);
router.patch('/profile', authenticate, userController.updateProfile);
router.get('/wishlist', authenticate, userController.getWishlist);
router.post('/wishlist', authenticate, userController.toggleWishlist);

module.exports = router;
