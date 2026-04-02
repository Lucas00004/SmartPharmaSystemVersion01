import React, { useState, useEffect } from 'react';
import axios from "axios";
// Tạm tắt import Sidebar và Chatbot nếu bạn đang dùng Menu Sidebar tự viết bên dưới
// import Sidebar from "../components/Sidebar"; 
// import Chatbot from "../components/Chatbot";
import "./SystemAdminPage.css";

const SystemAdminPage = () => {
  const [activeTab, setActiveTab] = useState('catalog');

  // ================= STATE DỮ LIỆU TỪ DATABASE =================
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  
  // Tạm ẩn các biến chưa dùng để tránh lỗi cảnh báo "assigned a value but never used"
  // const [accounts, setAccounts] = useState([]);
  // const [loginHistory, setLoginHistory] = useState([]);
  // const [productHistory, setProductHistory] = useState([]);

  // ================= STATE CHO FORM THÊM/SỬA =================
  const [catForm, setCatForm] = useState({ id: null, name: '', desc: '' });
  const [unitForm, setUnitForm] = useState({ id: null, name: '' });

  // ĐỊA CHỈ BACKEND
  const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_BACKEND_URL) 
    ? import.meta.env.VITE_BACKEND_URL 
    : 'http://localhost:5000';

  // ================= LẤY DỮ LIỆU TỪ BACKEND =================
  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/product_category`, { withCredentials: true });
      setCategories(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu danh mục:', error);
    }
  };

  const fetchUnits = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/unit`, { withCredentials: true });
      setUnits(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu đơn vị:', error);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchUnits();
  }, []);

  // ================= HÀM XỬ LÝ DANH MỤC =================
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      if (catForm.id) {
        await axios.put(
          `${API_BASE}/api/product_category/${catForm.id}`,
          { category_name: catForm.name, description: catForm.desc },
          { withCredentials: true }
        );
      } else {
        await axios.post(
          `${API_BASE}/api/product_category`,
          { category_name: catForm.name, description: catForm.desc },
          { withCredentials: true }
        );
      }
      fetchCategories(); 
      setCatForm({ id: null, name: "", desc: "" });
    } catch (error) {
      console.error("Lỗi khi lưu danh mục:", error);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (window.confirm("Bạn có chắc muốn xóa danh mục này?")) {
      try {
        await axios.delete(`${API_BASE}/api/product_category/${id}`, { withCredentials: true });
        fetchCategories(); 
      } catch (error) {
        console.error("Lỗi khi xóa danh mục:", error);
      }
    }
  };

  const handleEditCategory = (cat) => setCatForm({
    id: cat.category_id || cat.id,
    name: cat.category_name || cat.name,
    desc: cat.description || cat.desc || ""
  });

  // ================= HÀM XỬ LÝ ĐƠN VỊ =================
  const handleSaveUnit = async (e) => {
    e.preventDefault();
    try {
      if (unitForm.id) {
        await axios.put(
          `${API_BASE}/api/unit/${unitForm.id}`,
          { unit_name: unitForm.name },
          { withCredentials: true }
        );
      } else {
        await axios.post(
          `${API_BASE}/api/unit`,
          { unit_name: unitForm.name },
          { withCredentials: true }
        );
      }
      fetchUnits();
      setUnitForm({ id: null, name: '' });
    } catch (error) {
      console.error("Lỗi khi lưu đơn vị:", error);
    }
  };

  const handleDeleteUnit = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa đơn vị này?')) {
      try {
        await axios.delete(`${API_BASE}/api/unit/${id}`, { withCredentials: true });
        fetchUnits();
      } catch (error) {
        console.error("Lỗi khi xóa đơn vị:", error);
      }
    }
  };

  const handleEditUnit = (unit) => setUnitForm({
    id: unit.unit_id || unit.id,
    name: unit.unit_name || unit.name
  });

  // ================= RENDER CÁC TAB =================
  return (
    <div className="admin-container">
      {/* SIDEBAR */}
      <div className="admin-sidebar">
        <h2><i className="fa-solid fa-rocket"></i> Admin Control</h2>
        <ul className="admin-menu">
          <li className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>
            <i className="fa-solid fa-chart-pie"></i> Bảng điều khiển
          </li>
          <li className={activeTab === 'accounts' ? 'active' : ''} onClick={() => setActiveTab('accounts')}>
            <i className="fa-solid fa-users-gear"></i> Quản lý Tài khoản
          </li>
          <li className={activeTab === 'catalog' ? 'active' : ''} onClick={() => setActiveTab('catalog')}>
            <i className="fa-solid fa-sitemap"></i> Danh mục & Đơn vị
          </li>
          <li className={activeTab === 'history_login' ? 'active' : ''} onClick={() => setActiveTab('history_login')}>
            <i className="fa-solid fa-arrow-right-to-bracket"></i> Lịch sử Đăng nhập
          </li>
          <li className={activeTab === 'history_product' ? 'active' : ''} onClick={() => setActiveTab('history_product')}>
            <i className="fa-solid fa-timeline"></i> Lịch sử Sản phẩm
          </li>
        </ul>
        <div className="logout-btn">
            <i className="fa-solid fa-arrow-right-from-bracket"></i> Đăng xuất
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="admin-content">
        
        {/* TAB: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="card">
            <h3>Thống kê nhanh</h3>
            <p>Tính năng đang phát triển...</p>
          </div>
        )}

        {/* TAB: TÀI KHOẢN */}
        {activeTab === 'accounts' && (
          <div className="card">
            <h3>Tài khoản người dùng</h3>
            <p>Tính năng đang phát triển...</p>
          </div>
        )}

        {/* TAB: DANH MỤC VÀ ĐƠN VỊ */}
        {activeTab === 'catalog' && (
          <div className="catalog-grid">
            
            {/* BẢNG 1: QUẢN LÝ DANH MỤC */}
            <div className="card">
              <h3>Quản lý Danh mục sản phẩm</h3>
              <form className="admin-form" onSubmit={handleSaveCategory}>
                <input 
                  type="text" 
                  placeholder="Tên danh mục"
                  value={catForm.name}
                  onChange={(e) => setCatForm({...catForm, name: e.target.value})}
                  required
                />
                <input 
                  type="text" 
                  placeholder="Mô tả"
                  value={catForm.desc}
                  onChange={(e) => setCatForm({...catForm, desc: e.target.value})}
                />
                <button type="submit" className="btn btn-primary">{catForm.id ? 'Cập nhật' : 'Thêm'}</button>
              </form>
              <table className="admin-table mt-3">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tên danh mục</th>
                    <th>Mô tả</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.length > 0 ? categories.map((cat, index) => {
                    const id = cat.category_id || cat.id;
                    const name = cat.category_name || cat.name;
                    const desc = cat.description || cat.desc;
                    return (
                      <tr key={id || index}>
                        <td>{id}</td>
                        <td><strong>{name}</strong></td>
                        <td>{desc}</td>
                        <td>
                          <div className="action-buttons">
                            <button onClick={() => handleEditCategory(cat)} className="btn btn-secondary btn-sm">Sửa</button>
                            <button onClick={() => handleDeleteCategory(id)} className="btn btn-danger btn-sm">Xóa</button>
                          </div>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr><td colSpan="4" style={{textAlign: "center"}}>Chưa có danh mục nào trong Database</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* BẢNG 2: QUẢN LÝ ĐƠN VỊ TÍNH */}
            <div className="card">
              <h3>Quản lý Đơn vị tính</h3>
              <form className="admin-form" onSubmit={handleSaveUnit}>
                <input 
                  type="text" 
                  placeholder="Tên đơn vị (Ví dụ: Hộp, Vỉ...)"
                  value={unitForm.name}
                  onChange={(e) => setUnitForm({...unitForm, name: e.target.value})}
                  required
                />
                <button type="submit" className="btn btn-primary">{unitForm.id ? 'Cập nhật' : 'Thêm'}</button>
              </form>
              <table className="admin-table mt-3">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tên Đơn vị</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {units.length > 0 ? units.map((unit, index) => {
                    const id = unit.unit_id || unit.id;
                    const name = unit.unit_name || unit.name;
                    return (
                      <tr key={id || index}>
                        <td>{id}</td>
                        <td><strong>{name}</strong></td>
                        <td>
                          <div className="action-buttons">
                            <button onClick={() => handleEditUnit(unit)} className="btn btn-secondary btn-sm">Sửa</button>
                            <button onClick={() => handleDeleteUnit(id)} className="btn btn-danger btn-sm">Xóa</button>
                          </div>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr><td colSpan="3" style={{textAlign: "center"}}>Chưa có đơn vị nào trong Database</td></tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* TAB: LỊCH SỬ ĐĂNG NHẬP */}
        {activeTab === 'history_login' && (
          <div className="card">
            <h3>Lịch sử đăng nhập</h3>
            <p>Tính năng đang phát triển...</p>
          </div>
        )}

        {/* TAB: LỊCH SỬ HỆ THỐNG */}
        {activeTab === 'history_product' && (
          <div className="card">
            <h3>Lịch sử thay đổi hệ thống</h3>
            <p>Tính năng đang phát triển...</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default SystemAdminPage;