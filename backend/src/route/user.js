const express = require('express');
const router = express.Router();
const Middleware = require('../middleware/authMiddleware');
const user = require('../controller/userController');

// 🔹 GET ALL USERS (Lấy danh sách tất cả người dùng)
router.get('/',Middleware.verifyLogin, user.getAllUsers);

// 🔹 GET USER BY ID (Lấy thông tin người dùng theo ID)
router.get('/:id', Middleware.verifyLogin, user.getUserById);

// 🔹 CREATE USER (Thêm mới người dùng)
router.post('/', Middleware.verifyLogin, user.createUser);

// 🔹 UPDATE USER (Cập nhật thông tin người dùng)
router.put('/:id', Middleware.verifyLogin, user.updateUser);

// 🔹 DELETE USER (Xóa người dùng)
router.delete('/:id', Middleware.verifyLogin, user.deleteUser);

module.exports = router;