const authRouter = require('./auth');
const productRouter = require('./product');
const history_importRouter = require('./history_import');
const product_categoryRouter = require('./product_category');
const dashboardRouter = require('./dashboard');

function route(app) {
    // Sau này có thêm route sản phẩm, hóa đơn... thì thêm vào đây
    app.use('/api/auth', authRouter);
    app.use('/api/product', productRouter);
    app.use('/api/product_category', product_categoryRouter);
    app.use('/api/history_import', history_importRouter);
    app.use('/api/dashboard', dashboardRouter);
    
}

module.exports = route;