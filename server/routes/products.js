const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

router.get('/', productController.getProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/categories', productController.getCategories);
router.get('/categories/tree', productController.getCategoryTree);
router.get('/:slug/related', productController.getRelatedProducts);
router.get('/:slug', productController.getProductBySlug);

module.exports = router;
