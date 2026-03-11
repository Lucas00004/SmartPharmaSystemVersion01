const db = require('../config/db');

const productController = {

    // 1. CREATE PRODUCT
    create: async (req, res) => {
        try {

            const {
                product_code,
                product_name,
                category_id,
                unit,
                purchase_price,
                selling_price,
                quantity,
                expiry_date,
                image,
                description
            } = req.body;

            const sql = `
                INSERT INTO product
                (product_code, product_name, category_id, unit, purchase_price, selling_price, quantity, expiry_date, image, description, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
            `;

            const [result] = await db.query(sql, [
                product_code,
                product_name,
                category_id,
                unit,
                purchase_price,
                selling_price,
                quantity || 0,
                expiry_date,
                image,
                description
            ]);

            res.status(201).json({
                message: "Thêm sản phẩm thành công!",
                product_id: result.insertId
            });

        } catch (error) {

            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({
                    message: "Mã sản phẩm đã tồn tại!"
                });
            }

            res.status(500).json({ error: error.message });
        }
    },


    // 2. READ PRODUCT
    read: async (req, res) => {
        try {

            const sql = `
                SELECT p.*, c.category_name
                FROM product p
                LEFT JOIN product_category c
                ON p.category_id = c.category_id
                WHERE p.status = 1
                ORDER BY p.created_at DESC
            `;

            const [rows] = await db.query(sql);

            res.status(200).json(rows);

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },


    // 3. UPDATE PRODUCT
    update: async (req, res) => {
        try {

            const { id } = req.params;

            const {
                product_code,
                product_name,
                category_id,
                unit,
                purchase_price,
                selling_price,
                quantity,
                expiry_date,
                image,
                description
            } = req.body;

            const sql = `
                UPDATE product SET
                    product_code = ?,
                    product_name = ?,
                    category_id = ?,
                    unit = ?,
                    purchase_price = ?,
                    selling_price = ?,
                    quantity = ?,
                    expiry_date = ?,
                    image = ?,
                    description = ?
                WHERE product_id = ?
            `;

            const [result] = await db.query(sql, [
                product_code,
                product_name,
                category_id,
                unit,
                purchase_price,
                selling_price,
                quantity,
                expiry_date,
                image,
                description,
                id
            ]);

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Không tìm thấy sản phẩm!"
                });
            }

            res.status(200).json({
                message: "Cập nhật sản phẩm thành công!"
            });

        } catch (error) {

            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({
                    message: "Mã sản phẩm đã tồn tại!"
                });
            }

            res.status(500).json({ error: error.message });
        }
    },


    // 4. DELETE PRODUCT (soft delete)
    delete: async (req, res) => {
        try {

            const { id } = req.params;

            const sql = `
                UPDATE product
                SET status = 0
                WHERE product_id = ?
            `;

            const [result] = await db.query(sql, [id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Sản phẩm không tồn tại!"
                });
            }

            res.status(200).json({
                message: "Đã ngừng bán sản phẩm!"
            });

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

};

module.exports = productController;