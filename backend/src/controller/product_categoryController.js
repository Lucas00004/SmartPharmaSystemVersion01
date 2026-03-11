const db = require('../config/db');

const product_categoryController = {

    // 1️⃣ CREATE CATEGORY
    create: async (req, res) => {
        try {

            const { category_name, description } = req.body;

            const sql = `
                INSERT INTO product_category
                (category_name, description)
                VALUES (?, ?)
            `;

            const [result] = await db.query(sql, [
                category_name,
                description
            ]);

            res.status(201).json({
                message: "Thêm danh mục thành công!",
                category_id: result.insertId
            });

        } catch (error) {

            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({
                    message: "Tên danh mục đã tồn tại!"
                });
            }

            res.status(500).json({ error: error.message });
        }
    },


    // 2️⃣ READ CATEGORY
    read: async (req, res) => {
        try {

            const sql = `
                SELECT *
                FROM product_category
                ORDER BY category_id DESC
            `;

            const [rows] = await db.query(sql);

            res.status(200).json(rows);

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },


    // 3️⃣ UPDATE CATEGORY
    update: async (req, res) => {
        try {

            const { id } = req.params;
            const { category_name, description } = req.body;

            const sql = `
                UPDATE product_category
                SET category_name = ?, description = ?
                WHERE category_id = ?
            `;

            const [result] = await db.query(sql, [
                category_name,
                description,
                id
            ]);

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Không tìm thấy danh mục!"
                });
            }

            res.status(200).json({
                message: "Cập nhật danh mục thành công!"
            });

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },


    // 4️⃣ DELETE CATEGORY
    delete: async (req, res) => {
        try {

            const { id } = req.params;

            const sql = `
                DELETE FROM product_category
                WHERE category_id = ?
            `;

            const [result] = await db.query(sql, [id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Danh mục không tồn tại!"
                });
            }

            res.status(200).json({
                message: "Xóa danh mục thành công!"
            });

        } catch (error) {

            if (error.code === 'ER_ROW_IS_REFERENCED_2') {
                return res.status(400).json({
                    message: "Không thể xóa vì danh mục đang được sử dụng trong sản phẩm!"
                });
            }

            res.status(500).json({ error: error.message });
        }
    }

};

module.exports = product_categoryController;