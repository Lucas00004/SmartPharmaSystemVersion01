const db = require('../config/db');
const fs = require('fs');
const path = require('path');

// Hàm hỗ trợ xóa file ảnh trong thư mục uploads
const deleteFile = (fileName) => {
    if (fileName) {
        const filePath = path.join(__dirname, '../uploads/', fileName);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
};

// Hàm kiểm tra xác thực Admin
const checkAdmin = (req) => {
    return req.session && req.session.user && req.session.user.role === 'admin';
};

const productController = {

    // 1. CREATE PRODUCT
    create: async (req, res) => {
        try {
            // Kiểm tra xác thực Admin
            if (!checkAdmin(req)) {
                if (req.file) deleteFile(req.file.filename);
                return res.status(403).json({ message: "Chỉ Admin mới có thể thêm sản phẩm!" });
            }

            const {
                product_code,
                product_name,
                category_id,
                unit_id,
                purchase_price,
                selling_price,
                expiry_date,
                description,
                active_ingredient,
                manufacturer,
                packing_style,
                storage_condition
            } = req.body;

            // Ưu tiên file từ máy tính (multer), nếu không có thì lấy link từ body
            const image = req.file ? req.file.filename : req.body.image;

            const sql = `
                INSERT INTO product
                (product_code, product_name, category_id, unit_id, purchase_price, selling_price, 
                 expiry_date, image, description, active_ingredient, manufacturer, 
                 packing_style, storage_condition)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const [result] = await db.query(sql, [
                product_code,
                product_name,
                category_id || null,
                unit_id || null,
                purchase_price || 0,
                selling_price || 0,
                expiry_date || null,
                image,
                description,
                active_ingredient || null,
                manufacturer || null,
                packing_style || null,
                storage_condition || null
            ]);

            const newProductId = result.insertId;

            res.status(201).json({
                message: "Thêm sản phẩm thành công!",
                product_id: newProductId
            });

        } catch (error) {
            // Nếu lưu DB lỗi mà đã lỡ upload ảnh thì xóa ảnh đó đi để dọn rác
            if (req.file) deleteFile(req.file.filename);

            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ message: "Mã sản phẩm đã tồn tại!" });
            }
            res.status(500).json({ error: error.message });
        }
    },

    // 2. READ PRODUCT
    read: async (req, res) => {
        try {
            console.log("🔍 API GET /api/product được gọi");
            const sql = `
                SELECT p.*, c.category_name, u.unit_name
                FROM product p
                LEFT JOIN product_category c ON p.category_id = c.category_id
                LEFT JOIN unit u ON p.unit_id = u.unit_id
                ORDER BY p.created_at DESC
            `;
            console.log("📝 SQL Query:", sql);
            const [rows] = await db.query(sql);
            console.log("✅ Lấy được", rows.length, "sản phẩm");
            res.status(200).json(rows);
        } catch (error) {
            console.error("❌ Lỗi trong READ product:", error.message);
            console.error("📋 Stack:", error.stack);
            res.status(500).json({ error: error.message });
        }
    },

    // 3. UPDATE PRODUCT
    update: async (req, res) => {
        try {
            // Kiểm tra xác thực Admin
            if (!checkAdmin(req)) {
                if (req.file) deleteFile(req.file.filename);
                return res.status(403).json({ message: "Chỉ Admin mới có thể sửa sản phẩm!" });
            }

            const { id } = req.params;
            const {
                product_code,
                product_name,
                category_id,
                unit_id,
                purchase_price,
                selling_price,
                expiry_date,
                description,
                active_ingredient,
                manufacturer,
                packing_style,
                storage_condition
            } = req.body;

            // Bước A: Lấy thông tin sản phẩm cũ để biết tên file ảnh cũ
            const [oldProduct] = await db.query("SELECT image FROM product WHERE product_id = ?", [id]);
            const oldImageName = oldProduct.length > 0 ? oldProduct[0].image : null;

            // Bước B: Xác định ảnh mới
            let finalImage = req.body.image; // Mặc định dùng lại link/tên cũ từ body
            if (req.file) {
                finalImage = req.file.filename; // Nếu có file mới, dùng file mới
                
                // Nếu ảnh cũ là một file (không phải link web) thì xóa file cũ đi cho nhẹ máy
                if (oldImageName && !oldImageName.startsWith('http')) {
                    deleteFile(oldImageName);
                }
            }

            const sql = `
                UPDATE product SET
                    product_code = ?,
                    product_name = ?,
                    category_id = ?,
                    unit_id = ?,
                    purchase_price = ?,
                    selling_price = ?,
                    expiry_date = ?,
                    image = ?,
                    description = ?,
                    active_ingredient = ?,
                    manufacturer = ?,
                    packing_style = ?,
                    storage_condition = ?
                WHERE product_id = ?
            `;

            const [result] = await db.query(sql, [
                product_code,
                product_name,
                category_id || null,
                unit_id || null,
                purchase_price || 0,
                selling_price || 0,
                expiry_date || null,
                finalImage,
                description,
                active_ingredient || null,
                manufacturer || null,
                packing_style || null,
                storage_condition || null,
                id
            ]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Không tìm thấy sản phẩm!" });
            }

            res.status(200).json({ message: "Cập nhật sản phẩm thành công!" });

        } catch (error) {
            if (req.file) deleteFile(req.file.filename);
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ message: "Mã sản phẩm đã tồn tại!" });
            }
            res.status(500).json({ error: error.message });
        }
    },

    // 4. DELETE PRODUCT (Hard delete)
    delete: async (req, res) => {
        try {
            // Kiểm tra xác thực Admin
            if (!checkAdmin(req)) {
                return res.status(403).json({ message: "Chỉ Admin mới có thể xóa sản phẩm!" });
            }

            const { id } = req.params;
            
            // Bước 1: Lấy tên file ảnh để chuẩn bị xóa ảnh khỏi ổ cứng
            const [productRows] = await db.query("SELECT image FROM product WHERE product_id = ?", [id]);
            if (productRows.length === 0) {
                return res.status(404).json({ message: "Sản phẩm không tồn tại!" });
            }
            const imageName = productRows[0].image;

            // Bước 2: Xóa record khỏi database (Hard delete)
            const sql = `DELETE FROM product WHERE product_id = ?`;
            const [result] = await db.query(sql, [id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Sản phẩm không tồn tại!" });
            }

            // Bước 3: Chỉ xóa ảnh khi database đã được xóa thành công và file không phải là URL ngoài
            if (imageName && !imageName.startsWith('http')) {
                deleteFile(imageName);
            }

            res.status(200).json({ message: "Đã xóa sản phẩm thành công!" });
        } catch (error) {
            // Nếu có lỗi ràng buộc khoá ngoại, trả về lỗi báo cho FE
            if (error.code === 'ER_ROW_IS_REFERENCED_2') {
                return res.status(400).json({ message: "Không thể xóa do sản phẩm đã phát sinh lịch sử xuất/nhập kho!" });
            }
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = productController;
