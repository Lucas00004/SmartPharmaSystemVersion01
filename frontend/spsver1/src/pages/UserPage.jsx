import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './UserPage.css';
import viteLogo from '/vite.svg'; // Import the logo

// Component Modal (Dùng chung cho Đăng nhập và Giỏ hàng)
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <span className="close-btn" onClick={onClose}>&times;</span>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
};

// Component Main App
function UserPage() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);

  // ================= STATE DỮ LIỆU TỪ DATABASE =================
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  // ĐỊA CHỈ BACKEND
  const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_BACKEND_URL) 
    ? import.meta.env.VITE_BACKEND_URL 
    : 'http://localhost:5000';

  // ================= LẤY DỮ LIỆU TỪ BACKEND =================
  useEffect(() => {
    document.title = "PharmacyShop";

    const fetchData = async () => {
      try {
        // Lấy danh mục
        const catRes = await axios.get(`${API_BASE}/api/product_category`, { withCredentials: true });
        const catData = Array.isArray(catRes.data) ? catRes.data : catRes.data.data || [];
        setCategories(catData);

        // Lấy sản phẩm
        const prodRes = await axios.get(`${API_BASE}/api/product`, { withCredentials: true });
        const prodData = Array.isArray(prodRes.data) ? prodRes.data : prodRes.data.data || [];
        setProducts(prodData);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu từ Backend:", error);
      }
    };

    fetchData();
  }, [API_BASE]);

  // Hàm xử lý link ảnh sản phẩm
  const getImageUrl = (img) => {
    if (!img) return "https://via.placeholder.com/250x200.png?text=Chưa+có+ảnh";
    if (img.startsWith('http')) return img;
    return `${API_BASE}/uploads/${img}`; // Giả sử ảnh được lưu trong thư mục uploads của backend
  };

  // Hàm map category_id ra tên danh mục (đề phòng API product không trả về sẵn tên)
  const getCategoryName = (categoryId) => {
    const cat = categories.find(c => c.category_id === categoryId);
    return cat ? cat.category_name : "Khác";
  };

  return (
    <div>
      {/* HEADER */}
      <header>
        <a href="/user" className="logo-link">
          <img src={viteLogo} alt="Pharmacy Logo" className="logo-img" />
          <span>PharmacyShop</span>
        </a>

        <div style={{ position: 'relative' }}>
          <button className="category-menu-btn" onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}>
            <i className="fa-solid fa-bars"></i> Danh mục
          </button>

          {/* CATEGORY DROPDOWN TỪ DATABASE */}
          {isCategoryMenuOpen && (
            <div className="category-dropdown-menu">
              <div className="category-column">
                {categories.length > 0 ? categories.map((cat) => (
                  <a href={`#cat-${cat.category_id}`} className="category-item" key={cat.category_id}>
                    <i className="fa-solid fa-pills"></i> {cat.category_name}
                  </a>
                )) : (
                  <p style={{ padding: '10px' }}>Đang tải danh mục...</p>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="search-bar">
          <input type="text" placeholder="Tìm kiếm thuốc, triệu chứng, hoạt chất..." />
          <button><i className="fa-solid fa-magnifying-glass"></i></button>
        </div>

        <div className="actions">
          <button className="btn-action" onClick={() => setIsLoginOpen(true)}>
            <i className="fa-regular fa-user"></i> Đăng nhập
          </button>
          <button className="btn-action cart-btn" onClick={() => setIsCartOpen(true)}>
            <i className="fa-solid fa-cart-shopping"></i> Giỏ hàng
            <span className="cart-count">{cartCount}</span>
          </button>
        </div>
      </header>

      {/* BANNER */}
      <div className="banner">
        <div>
          <h1>Chăm sóc sức khỏe toàn diện</h1>
          <p>Thuốc chính hãng - Tư vấn tận tâm - Giao hàng siêu tốc 2h</p>
        </div>
      </div>

      {/* DANH SÁCH SẢN PHẨM TỪ DATABASE */}
      <main>
        <h2 className="section-title">Sản phẩm nổi bật</h2>
        <div className="product-grid">
          {products.length > 0 ? products.map((product) => (
            <div className="product-card" key={product.product_id}>
              <img 
                src={getImageUrl(product.image)} 
                alt={product.product_name} 
                className="product-img" 
              />
              <p className="product-category">
                {product.category_name || getCategoryName(product.category_id)}
              </p>
              <h3 className="product-name">{product.product_name}</h3>
              <p className="product-price">
                {Number(product.selling_price).toLocaleString('vi-VN')} đ
              </p>
              <button 
                className="btn-add-cart"
                onClick={() => setCartCount(cartCount + 1)}
              >
                Thêm vào giỏ
              </button>
            </div>
          )) : (
            <p style={{ textAlign: "center", width: "100%" }}>Đang tải sản phẩm...</p>
          )}
        </div>
      </main>

      {/* MODAL ĐĂNG NHẬP */}
      <Modal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} title="Đăng nhập">
        <form onSubmit={(e) => e.preventDefault()}>
          <div className="form-group">
            <input type="text" placeholder="Tên đăng nhập hoặc Email" />
          </div>
          <div className="form-group">
            <input type="password" placeholder="Mật khẩu" />
          </div>
          <button type="submit" className="btn-submit" onClick={() => setIsLoginOpen(false)}>
            Đăng nhập
          </button>
        </form>
      </Modal>

      {/* MODAL GIỎ HÀNG */}
      <Modal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} title="Giỏ hàng của bạn">
        <p style={{ textAlign: 'center', marginBottom: '20px' }}>
          Có <strong>{cartCount}</strong> sản phẩm trong giỏ hàng.
        </p>
        <button 
          className="btn-submit" 
          style={{ background: 'var(--secondary-color)' }}
          onClick={() => setIsCartOpen(false)}
        >
          Tiến hành thanh toán
        </button>
      </Modal>
    </div>
  );
}

export default UserPage;