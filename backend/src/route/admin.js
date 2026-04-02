const router = require('express').Router();
const adminController = require('../controller/adminController');
const auth = require('../middleware/authMiddleware');

router.get('/', auth.verifyLogin, auth.verifyAdmin, adminController.getAllUsers);

router.put('/role', auth.verifyLogin, auth.verifyAdmin, adminController.updateRole);

module.exports = router;