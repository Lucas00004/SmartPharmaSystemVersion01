const express = require('express');
const router = express.Router();
const Middleware = require('../middleware/authMiddleware');
const productController = require('../controller/productController');


// READ
router.get('/', Middleware.verifyLogin, productController.getAllProduct);

// UPDATE - Thêm upload.single('image')
router.put('/:id',Middleware.verifyLogin,  productController.updateProduct);

// DELETE
router.delete('/:id', Middleware.verifyLogin, productController.deleteProduct);

module.exports = router;