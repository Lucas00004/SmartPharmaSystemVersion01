const express = require('express');
const router = express.Router();
const Middleware = require('../middleware/authMiddleware');
const product_categoryController = require('../controller/product_categoryController');

// CREATE
router.post('/', product_categoryController.create);

// READ - Lấy tất cả danh mục sản phẩm
router.get('/', product_categoryController.read);

// UPDATE
router.put('/:id', product_categoryController.update);

// DELETE
router.delete('/:id', product_categoryController.delete);

module.exports = router;