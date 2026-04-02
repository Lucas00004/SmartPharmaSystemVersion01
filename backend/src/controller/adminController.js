const db = require('../config/db');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const { writeLog } = require('../util/history_activity');

const adminController = {

    // 🔹 GET ALL USERS
    getAllUsers: async (req, res) => {
        try {
            const [users] = await db.query(
                "SELECT user_id, username, full_name, role, created_at FROM user"
            );

            res.status(200).json(users);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // 🔹 CREATE STAFF
    createStaff: async (req, res) => {
        try {
            const { username, password, full_name } = req.body;

            // 1. Kiểm tra đầu vào
            if (!username || !password || !full_name) {
                return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin!" });
            }

            // 2. Kiểm tra trùng lặp username
            const [existingUser] = await db.execute('SELECT * FROM user WHERE username = ?', [username]);
            if (existingUser.length > 0) {
                return res.status(400).json({ message: "Tên đăng nhập đã tồn tại!" });
            }

            // 3. Mã hóa mật khẩu
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            // 4. Lưu vào Database
            const sql = `
                INSERT INTO user (username, password, full_name, role, created_at) 
                VALUES (?, ?, ?, 'staff', NOW())
            `;
            const [result] = await db.execute(sql, [username, hashedPassword, full_name]);
            const newStaffId = result.insertId;

            // 5. GHI LOG HOẠT ĐỘNG (Sử dụng Util)
            // action: 'CREATE', entity: 'user', entityId: ID của nhân viên mới
            await writeLog(req, 'CREATE', 'user', newStaffId, `Admin created staff account: ${username}`);

            return res.status(201).json({
                message: "Tạo tài khoản nhân viên thành công!",
                data: { user_id: newStaffId, username, full_name, role: 'staff' }
            });

        } catch (error) {
            console.error("Lỗi trong createStaff:", error);
            return res.status(500).json({ message: "Lỗi máy chủ nội bộ!" });
        }
    },

    // 🔹 UPDATE ROLE
    updateRole: async (req, res) => {
        try {
            const { user_id, role } = req.body;

            // 1. Kiểm tra dữ liệu
            if (!user_id || !role) {
                return res.status(400).json({ message: "Thiếu user_id hoặc role!" });
            }

            // Giới hạn các quyền được phép cập nhật
            const validRoles = ['admin', 'staff', 'user'];
            if (!validRoles.includes(role)) {
                return res.status(400).json({ message: "Role không hợp lệ!" });
            }

            // 2. Kiểm tra user có tồn tại không và lấy role cũ để ghi log
            const [users] = await db.query("SELECT username, role FROM user WHERE user_id = ?", [user_id]);
            if (users.length === 0) {
                return res.status(404).json({ message: "Người dùng không tồn tại!" });
            }
            const oldRole = users[0].role;
            const targetUsername = users[0].username;

            // 3. Cập nhật role mới
            await db.query("UPDATE user SET role = ? WHERE user_id = ?", [role, user_id]);

            // 4. GHI LOG HOẠT ĐỘNG (Sử dụng Util)
            // action: 'UPDATE_ROLE', entity: 'user', entityId: ID của người bị đổi quyền
            await writeLog(
                req, 
                'UPDATE_ROLE', 
                'user', 
                user_id, 
                `Changed role of ${targetUsername} from '${oldRole}' to '${role}'`
            );

            res.status(200).json({ message: `Cập nhật quyền của ${targetUsername} thành công!` });

        } catch (error) {
            console.error("Lỗi trong updateRole:", error);
            res.status(500).json({ error: error.message });
        }
    },
};

module.exports = adminController;


