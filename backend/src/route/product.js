const express = require('express');
const router = express.Router();
const Middleware = require('../middleware/authMiddleware');
const productController = require('../controller/productController');
const upload = require('../middleware/upload'); // 1. Import middleware upload bạn đã tạo

// CREATE - Thêm upload.single('image') - Chỉ Admin mới được thêm
// 'image' phải trùng với tên field bạn gửi từ FormData ở Frontend
router.post('/', upload.single('image'), productController.create);

// READ - Ai đã đăng nhập cũng có thể xem
router.get('/', Middleware.verifyLogin, productController.read);

// UPDATE - Thêm upload.single('image') - Chỉ Admin mới được sửa
router.put('/:id', upload.single('image'), productController.update);

// DELETE - Chỉ Admin mới được xóa
router.delete('/:id', productController.delete);

module.exports = router;