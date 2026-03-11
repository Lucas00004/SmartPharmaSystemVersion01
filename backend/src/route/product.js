const express = require('express');
const router = express.Router();
const Middleware = require('../middleware/authMiddleware');
const productController = require('../controller/productController');

// CREATE
router.post('/', productController.create);

// READ
router.get('/', productController.read);

// UPDATE
router.put('/:id', productController.update);

// DELETE
router.delete('/:id', productController.delete);

module.exports = router;