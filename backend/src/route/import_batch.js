const express = require('express');
const router = express.Router();
const Middleware = require('../middleware/authMiddleware');
const import_batch = require('../controller/import_batchController');


router.get('/', Middleware.verifyLogin, import_batch.getAllBatches);
router.post('/', Middleware.verifyLogin, import_batch.createImportBatch);
router.put('/:id', Middleware.verifyLogin, import_batch.updateImportBatch);
router.delete('/:id', Middleware.verifyLogin, import_batch.deleteImportBatch);


module.exports = router;