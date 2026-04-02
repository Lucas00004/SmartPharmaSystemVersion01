const express = require('express');
const router = express.Router();
const Middleware = require('../middleware/authMiddleware');
const productController = require('../controller/productController');
const upload = require('../middleware/upload'); // 1. Import middleware upload bạn đã tạo

// CREATE - Thêm upload.single('image') - Chỉ Admin mới được thêm
// 'image' phải trùng với tên field bạn gửi từ FormData ở Frontend

// READ
router.get('/', Middleware.verifyLogin, productController.getAllProduct);

// UPDATE - Thêm upload.single('image')
router.put('/:id',Middleware.verifyLogin, upload.single('image'), productController.updateProduct);

// DELETE
router.delete('/:id', Middleware.verifyLogin, productController.deleteProduct);

module.exports = router;