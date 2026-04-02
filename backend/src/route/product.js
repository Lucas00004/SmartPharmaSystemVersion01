const express = require('express');
const router = express.Router();
const Middleware = require('../middleware/authMiddleware');
const productController = require('../controller/productController');

// API Tìm kiếm sản phẩm theo tên
router.get('/search', productController.searchProducts);

// READ PRODUCT (Dành cho User nhìn - Aggregation theo tên)
router.get('/', Middleware.verifyLogin, productController.getAllProduct);

// UPDATE PRODUCT
router.put('/:id',Middleware.verifyLogin,  productController.updateProduct);

// DELETE PRODUCT
router.delete('/:id', Middleware.verifyLogin, productController.deleteProduct);

module.exports = router;