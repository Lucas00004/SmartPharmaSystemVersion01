const db = require('../config/db');

const userHistoryController = {
    // 1. LẤY LỊCH SỬ MUA HÀNG
    getHistoryByUserId: async (req, res) => {
        try {
            const userId = req.session.user.id;
            const query = `
                SELECT uh.*, p.product_name 
                FROM user_history uh
                JOIN product p ON uh.product_id = p.product_id
                WHERE uh.user_id = ?
                ORDER BY uh.date DESC
            `;
            const [history] = await db.query(query, [userId]);
            res.status(200).json(history);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // 2. XỬ LÝ MUA HÀNG THEO PRODUCT_NAME (DÒ TÌM NHIỀU ID & TRỪ FEFO)
    createPurchase: async (req, res) => {
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // Lấy unit_name thay vì unit_id từ dữ liệu user gửi lên
            const { product_name, unit_name, quantity, address, total_price, payment } = req.body;
            const user_id = req.session.user.id;
            let amountToSubtract = parseInt(quantity);

            // BƯỚC 1: Tìm tất cả product_id có chung product_name
            const [products] = await connection.query(
                'SELECT product_id FROM product WHERE product_name = ?',
                [product_name]
            );

            if (products.length === 0) {
                await connection.rollback();
                return res.status(404).json({ message: "Không tìm thấy sản phẩm có tên này!" });
            }

            const productIds = products.map(p => p.product_id);

            // BƯỚC 2: Tìm tất cả các lô thuộc danh sách productIds, sắp xếp theo ngày hết hạn gần nhất (FEFO)
            const [batches] = await connection.query(
                `SELECT batch_detail_id, product_id, quantity as stock, expiry_date 
                 FROM product_batch_detail 
                 WHERE product_id IN (?) AND quantity > 0 
                 ORDER BY expiry_date ASC`,
                [productIds]
            );

            // Kiểm tra tổng số lượng tồn kho của tất cả các lô
            const totalStock = batches.reduce((sum, b) => sum + b.stock, 0);
            if (totalStock < amountToSubtract) {
                await connection.rollback();
                return res.status(400).json({ message: `Tổng kho không đủ! Hiện còn: ${totalStock} ${unit_name}` });
            }

            // Mảng để lưu lại các lô bị trừ
            let trackingPurchases = [];

            // BƯỚC 3: Trừ dần số lượng vào từng lô theo nguyên tắc FEFO
            for (let batch of batches) {
                if (amountToSubtract <= 0) break;

                let take = Math.min(batch.stock, amountToSubtract);
                
                await connection.query(
                    'UPDATE product_batch_detail SET quantity = quantity - ? WHERE batch_detail_id = ?',
                    [take, batch.batch_detail_id]
                );

                trackingPurchases.push({
                    product_id: batch.product_id,
                    quantity: take
                });

                amountToSubtract -= take;
            }

            // BƯỚC 4: Lưu vào user_history
            // Sử dụng trường unit_name thay vì unit_id như thiết kế DB mới của bạn
            // Vẫn giữ nguyên logic lưu product_id của lô đầu tiên được "chạm" vào
            await connection.query(
                `INSERT INTO user_history 
                (user_id, product_id, unit_name, quantity, address, total_price, payment, date) 
                VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
                // ĐÃ THÊM user_id VÀO ĐẦU MẢNG
                [user_id, trackingPurchases[0].product_id, unit_name, quantity, address, total_price, payment]
            );

            await connection.commit();
            res.status(201).json({ 
                message: "Mua hàng thành công!",
                details: "Đã trừ kho thành công dựa trên ngày hết hạn." 
            });

        } catch (error) {
            await connection.rollback();
            console.error("Lỗi mua hàng:", error);
            res.status(500).json({ error: "Đã xảy ra lỗi trong quá trình xử lý đơn hàng." });
        } finally {
            // Luôn release connection dù thành công hay lỗi
            connection.release();
        }
    },

    // 3. LẤY TOÀN BỘ LỊCH SỬ BÁN HÀNG ONLINE (DÀNH CHO STAFF/ADMIN)
    getAllUser_History: async (req, res) => {
        try {
            const query = `
                SELECT 
                    uh.user_history_id,
                    uh.quantity,
                    uh.unit_name,
                    uh.address,
                    uh.total_price,
                    uh.payment,
                    uh.date,
                    u.username,
                    p.product_name 
                FROM user_history uh
                JOIN user u ON uh.user_id = u.user_id
                JOIN product p ON uh.product_id = p.product_id
                ORDER BY uh.date DESC
            `;
            const [history] = await db.query(query);
            
            res.status(200).json(history);
        } catch (error) {
            console.error("Lỗi lấy toàn bộ lịch sử bán hàng online:", error);
            res.status(500).json({ error: "Đã xảy ra lỗi khi lấy danh sách lịch sử bán hàng." });
        }
    }
};

module.exports = userHistoryController;