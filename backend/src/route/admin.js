const router = require('express').Router();
const adminController = require('../controller/adminController');
const auth = require('../middleware/authMiddleware');


// 🔹 GET ALL USERS (Manager only)
router.get('/', auth.verifyLogin, auth.verifyAdmin, adminController.getAllUsers);

//CREATE STAFF
router.post('/staff', auth.verifyLogin, auth.verifyAdmin, adminController.createStaff);

//UPDATE Role
router.put('/role', auth.verifyLogin, auth.verifyAdmin, adminController.updateRole);



module.exports = router;