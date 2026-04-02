const db = require('../config/db');
const { writeLog } = require('../util/history_activity');

const exportController = {

    // 1. Lấy các sản phẩm có sẵn trong kho (Gom nhóm để Staff chọn)
    getAvailableProduct: async (req, res) => {
        try {
            // ĐÃ SỬA: Join thêm bảng unit để lấy thông tin đơn vị tính cho FE hiển thị
            const query = `
                SELECT 
                    p.product_id, 
                    p.product_code, 
                    p.product_name, 
                    u.unit_id,
                    u.unit_name,
                    SUM(pb.quantity) AS total_available
                FROM product p
                JOIN product_batch pb ON p.product_id = pb.product_id
                LEFT JOIN unit u ON p.unit_id = u.unit_id
                WHERE pb.quantity > 0 AND pb.expiry_date >= CURDATE()
                GROUP BY p.product_id, u.unit_id, u.unit_name
                HAVING total_available > 0
            `;
            const [products] = await db.query(query);
            res.status(200).json({ success: true, data: products });
        } catch (error) {
            console.error("Lỗi getAvailableProduct:", error);
            res.status(500).json({ success: false, message: 'Lỗi server' });
        }
    },

    // 2. Hiện lịch sử các phiếu đã xuất
    getAllBatches: async (req, res) => {
        try {
            const query = `
                SELECT et.*, u.full_name, u.username 
                FROM export_ticket et
                JOIN user u ON et.user_id = u.user_id
                ORDER BY et.created_at DESC
            `;
            const [tickets] = await db.query(query);
            res.status(200).json({ success: true, data: tickets });
        } catch (error) {
            console.error("Lỗi getAllBatches:", error);
            res.status(500).json({ success: false, message: 'Lỗi server' });
        }
    },

    // 3. Tạo lô xuất mới - Có thể chọn nhiều sản phẩm 1 lần (Áp dụng thuật toán FEFO - Trừ lùi)
    createExportBatch: async (req, res) => {
        const { user_id, note, customer, products } = req.body;
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            let total_price = 0;
            for (const item of products) {
                total_price += item.export_quantity * item.export_price;
            }

            const [ticketResult] = await connection.query(
                `INSERT INTO export_ticket (total_price, note, customer, user_id) VALUES (?, ?, ?, ?)`,
                [total_price, note, customer, user_id]
            );
            const ticket_id = ticketResult.insertId;

            for (const item of products) {
                let remainingQuantityToExport = item.export_quantity;

                const [batches] = await connection.query(
                    `SELECT batch_id, quantity 
                     FROM product_batch 
                     WHERE product_id = ? AND quantity > 0 
                     ORDER BY expiry_date ASC`,
                    [item.product_id]
                );

                const totalInStock = batches.reduce((sum, b) => sum + b.quantity, 0);
                if (totalInStock < remainingQuantityToExport) {
                    throw new Error(`Sản phẩm ID ${item.product_id} không đủ số lượng trong kho.`);
                }

                for (const batch of batches) {
                    if (remainingQuantityToExport <= 0) break;

                    let quantityToTakeFromThisBatch = 0;

                    if (batch.quantity >= remainingQuantityToExport) {
                        quantityToTakeFromThisBatch = remainingQuantityToExport;
                        remainingQuantityToExport = 0;
                    } else {
                        quantityToTakeFromThisBatch = batch.quantity;
                        remainingQuantityToExport -= batch.quantity;
                    }

                    const newBatchQuantity = batch.quantity - quantityToTakeFromThisBatch;
                    await connection.query(
                        `UPDATE product_batch SET quantity = ? WHERE batch_id = ?`,
                        [newBatchQuantity, batch.batch_id]
                    );

                    // ĐÃ SỬA: Thêm unit_id vào câu lệnh INSERT chi tiết phiếu xuất
                    // Giả định Frontend sẽ gửi kèm unit_id trong từng item của mảng products
                    await connection.query(
                        `INSERT INTO export_ticket_detail (ticket_id, batch_id, export_quantity, export_price, unit_id) 
                         VALUES (?, ?, ?, ?, ?)`,
                        [ticket_id, batch.batch_id, quantityToTakeFromThisBatch, item.export_price, item.unit_id]
                    );
                }
            }

            await writeLog(req, 'CREATE', 'export_ticket', ticket_id, `Tạo phiếu xuất kho ID: ${ticket_id} cho khách hàng: ${customer || 'Khách lẻ'}`);

            await connection.commit();
            res.status(200).json({ success: true, message: 'Tạo phiếu xuất kho thành công!', ticket_id });

        } catch (error) {
            await connection.rollback();
            console.error("Lỗi createExportBatch:", error);
            res.status(400).json({ success: false, message: error.message || 'Lỗi khi tạo phiếu xuất' });
        } finally {
            connection.release();
        }
    },

    // 4. Cập nhật thông tin lô xuất
    updateExportBatch: async (req, res) => {
        const { id } = req.params;
        const { note, customer } = req.body;
        
        try {
            await db.query(
                `UPDATE export_ticket SET note = ?, customer = ? WHERE ticket_id = ?`, 
                [note, customer, id]
            );
            
            await writeLog(req, 'UPDATE', 'export_ticket', id, `Cập nhật thông tin cho phiếu xuất ID: ${id}`);

            res.status(200).json({ success: true, message: 'Cập nhật phiếu xuất thành công' });
        } catch (error) {
            console.error("Lỗi update:", error);
            res.status(500).json({ success: false, message: 'Lỗi server' });
        }
    },
    
    // 5. Xóa lô xuất (Hủy phiếu xuất)
    deleteExportBatch: async (req, res) => {
        const { id } = req.params;
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            const [details] = await connection.query(
                `SELECT batch_id, export_quantity FROM export_ticket_detail WHERE ticket_id = ?`,
                [id]
            );

            for (const detail of details) {
                await connection.query(
                    `UPDATE product_batch SET quantity = quantity + ? WHERE batch_id = ?`,
                    [detail.export_quantity, detail.batch_id]
                );
            }

            await connection.query(`DELETE FROM export_ticket WHERE ticket_id = ?`, [id]);

            await writeLog(req, 'DELETE', 'export_ticket', id, `Hủy phiếu xuất và hoàn kho ID: ${id}`);

            await connection.commit();
            res.status(200).json({ success: true, message: 'Hủy phiếu xuất và hoàn kho thành công' });

        } catch (error) {
            await connection.rollback();
            console.error("Lỗi delete:", error);
            res.status(500).json({ success: false, message: 'Lỗi server khi hủy phiếu' });
        } finally {
            connection.release();
        }
    },

};

module.exports = exportController;