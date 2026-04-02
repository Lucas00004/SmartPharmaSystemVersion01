// File: /service/ImportService.js
const pool = require('../config/database'); // Import kết nối CSDL của bạn

class ImportService {
    
    // Hàm xử lý tạo sản phẩm và nhập lô hàng cùng lúc
    static async importNewProductAndBatch(productData, batchData) {
        // 1. Lấy một connection từ Pool để bắt đầu Transaction
        const connection = await pool.getConnection();

        try {
            // 2. Bắt đầu Transaction
            await connection.beginTransaction();

            // 3. Insert dữ liệu vào bảng products
            // Giả định bảng có 2 trường cơ bản là name và sku
            const sqlInsertProduct = `INSERT INTO products (name, sku) VALUES (?, ?)`;
            const [productResult] = await connection.execute(sqlInsertProduct, [
                productData.name, 
                productData.sku
            ]);
            
            // Lấy ID của sản phẩm vừa được tạo
            const newProductId = productResult.insertId;

            // 4. Insert dữ liệu vào bảng product_batch kèm theo newProductId làm Khóa ngoại
            // Giả định bảng có import_price và quantity
            const sqlInsertBatch = `INSERT INTO product_batch (product_id, import_price, quantity) VALUES (?, ?, ?)`;
            const [batchResult] = await connection.execute(sqlInsertBatch, [
                newProductId, 
                batchData.importPrice, 
                batchData.quantity
            ]);

            // 5. Nếu mọi thứ thành công -> Xác nhận lưu vào CSDL (Commit)
            await connection.commit();

            // Trả về kết quả cho Controller
            return {
                message: 'Thành công',
                productId: newProductId,
                batchId: batchResult.insertId
            };

        } catch (error) {
            // 6. Nếu có LỖI ở bất kỳ dòng nào bên trên -> Hủy bỏ toàn bộ (Rollback)
            await connection.rollback();
            
            // Ném lỗi ra ngoài để Controller bắt được và báo về cho Frontend
            throw new Error(`Lỗi khi tạo đơn nhập: ${error.message}`);
            
        } finally {
            // 7. Luôn luôn giải phóng connection trả lại cho Pool dù thành công hay thất bại
            connection.release();
        }
    }
}

module.exports = ImportService;