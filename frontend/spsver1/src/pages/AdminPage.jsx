import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import Chatbot from '../components/Chatbot';
import './AdminPage.css';

const AdminPage = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [categoriesMap, setCategoriesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // STATE ĐIỀU HƯỚNG TAB: 'products' HOẶC 'history'
  const [activeTab, setActiveTab] = useState('products');

  // STATE LỊCH SỬ MUA HÀNG (DỮ LIỆU MẪU - Đợi ráp API)
  const [purchaseHistory, setPurchaseHistory] = useState([
    { 
      user_history_id: 1, 
      customer_name: 'Nguyễn Văn A', 
      product_name: 'Panadol Extra', 
      unit_name: 'Hộp', 
      quantity: 5, 
      date: '2026-04-01 08:30:00', 
      address: '123 Lý Thường Kiệt, Q.10, TP.HCM', 
      payment: 'Tiền mặt' 
    }
  ]);

  // STATE CHO FORM THÊM/SỬA
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    product_code: '', product_name: '', category_id: '', unit_id: '',
    purchase_price: '', selling_price: '', expiry_date: '',
    image: '', description: '', active_ingredient: '', manufacturer: '',
    packing_style: '', storage_condition: ''
  });

  const toggleChat = () => setIsChatOpen(!isChatOpen);

  const API_BASE =
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_BACKEND_URL)
      ? import.meta.env.VITE_BACKEND_URL
      : 'http://localhost:5000';

  // ================= TÁCH ĐỘC LẬP TỪNG API =================
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null); // Xóa lỗi cũ
    try {
      let currentMap = {};

      // 1. TẢI DANH MỤC TRƯỚC (Độc lập)
      try {
        const catRes = await fetch(`${API_BASE}/api/product_category`, { method: 'GET', credentials: 'include', headers: { Accept: 'application/json' } });
        if (catRes.ok) {
          const catJson = await catRes.json();
          const catList = Array.isArray(catJson) ? catJson : catJson.data || [];
          
          catList.forEach((c) => {
            const id = c.category_id ?? c.id;
            const name = c.category_name ?? c.name ?? '';
            const desc = c.description ?? '';
            if (id != null) currentMap[id] = { name, description: desc };
          });
          setCategoriesMap(currentMap);
        } else {
          const errMsg = await catRes.json().catch(() => ({}));
          console.error("Lỗi API Danh mục (Status: " + catRes.status + "):", errMsg);
        }
      } catch (err) {
        console.error("Lỗi khi tải API Danh mục:", err.message);
      }

      // 2. TẢI SẢN PHẨM SAU (Độc lập)
      try {
        const prodRes = await fetch(`${API_BASE}/api/product`, { method: 'GET', credentials: 'include', headers: { Accept: 'application/json' } });
        if (prodRes.ok) {
          const prodJson = await prodRes.json();
          const prodList = Array.isArray(prodJson) ? prodJson : prodJson.data || [];
          
          const normalized = prodList.map((p) => {
            const product_id = p.product_id ?? p.id ?? null;
            const category_id = p.category_id ?? p.category ?? null;
            const cat = currentMap[category_id] || {};
            
            return {
              ...p,
              product_id,
              category_name: cat.name ?? (p.category_name ?? ''),
              expiry_date: p.expiry_date ? new Date(p.expiry_date).toISOString().split('T')[0] : '',
              displayImage: p.image 
                ? (p.image.startsWith('http') ? p.image : `${API_BASE}/uploads/${p.image}`) 
                : null
            };
          });
          setProducts(normalized);
        } else {
          const errMsg = await prodRes.json().catch(() => ({}));
          setError(`Lỗi tải sản phẩm (${prodRes.status}): ${errMsg.message || 'Unknown error'}`);
          setProducts([]);
        }
      } catch (err) {
        console.error("Lỗi khi tải API Sản phẩm:", err.message);
        setError(`Lỗi kết nối: ${err.message}`);
        setProducts([]);
      }

    } finally {
      setLoading(false);
    }
  }, [API_BASE]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const createExplosion = (el, color = '#ff5c5c', count = 12) => {
    if (!el) return;
    el.style.position = el.style.position || 'relative';
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'btn-particle';
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6;
      const distance = 60 + Math.random() * 60;
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance;
      const rot = Math.floor(Math.random() * 360);
      p.style.setProperty('--dx', `${dx}px`);
      p.style.setProperty('--dy', `${dy}px`);
      p.style.setProperty('--rot', `${rot}deg`);
      p.style.background = color;
      el.appendChild(p);
      p.addEventListener('animationend', () => p.remove(), { once: true });
    }
  };

  const handleDeleteClick = async (productId, e) => {
    const btn = e.currentTarget;

    try {
      const response = await fetch(`${API_BASE}/api/product/${productId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      });
      if (response.ok) {
        createExplosion(btn, '#ff6b6b', 14);
        btn.classList.add('btn-exploding');
        
        setTimeout(() => {
          setProducts((prev) => prev.filter((p) => p.product_id !== productId));
          btn.classList.remove('btn-exploding');
        }, 520);
      } else {
        const result = await response.json();
        alert(result.message || "Xóa sản phẩm thất bại!");
      }
    } catch (error) {
      console.error("Lỗi xóa sản phẩm:", error);
      alert("Đã xảy ra lỗi kết nối!");
    }
  };

  const openModal = (product = null) => {
    setImagePreview(null);
    if (product) {
      setEditingId(product.product_id);
      setFormData({
        product_code: product.product_code || '',
        product_name: product.product_name || '',
        category_id: product.category_id || '',
        unit_id: product.unit_id || '',
        purchase_price: product.purchase_price || '',
        selling_price: product.selling_price || '',
        expiry_date: product.expiry_date || '',
        image: product.image || '',
        description: product.description || '',
        active_ingredient: product.active_ingredient || '',
        manufacturer: product.manufacturer || '',
        packing_style: product.packing_style || '',
        storage_condition: product.storage_condition || ''
      });
      if (product.displayImage) setImagePreview(product.displayImage);
    } else {
      setEditingId(null);
      setFormData({
        product_code: '', product_name: '', category_id: '', unit_id: '', 
        purchase_price: '', selling_price: '', expiry_date: '',
        image: '', description: '', active_ingredient: '', manufacturer: '',
        packing_style: '', storage_condition: ''
      });
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach(key => {
      const value = formData[key] === null || formData[key] === undefined ? '' : formData[key];
      data.append(key, value);
    });

    const url = editingId ? `${API_BASE}/api/product/${editingId}` : `${API_BASE}/api/product`;
    const method = editingId ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        body: data,
        credentials: 'include'
      });
      
      const result = await response.json();
      if (response.ok || response.status === 201) {
        setShowModal(false);
        fetchAll();
      } else {
        alert(result.message || "Có lỗi xảy ra");
      }
    } catch (error) {
      console.error("Lỗi khi lưu sản phẩm:", error);
      alert("Đã xảy ra lỗi kết nối!");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="admin-body">
      <Sidebar toggleChat={toggleChat} activePage="qlhh" />
      
      <div className="main-admin">
        {/* HEADER VÀ TAB ĐIỀU HƯỚNG */}
        <div className="header-row">
          <div>
            <h1 className="page-title">Hàng hóa & Giao dịch</h1>
            {error && (
              <div style={{ 
                background: '#fee', 
                color: '#c33', 
                padding: '10px', 
                borderRadius: '4px', 
                marginBottom: '10px',
                fontSize: '14px'
              }}>
                ⚠️ {error}
              </div>
            )}
            <div className="tabs-container">
              <button 
                className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
                onClick={() => setActiveTab('products')}
              >
                Danh mục hàng hóa
              </button>
              <button 
                className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => setActiveTab('history')}
              >
                Lịch sử mua hàng
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <button className="refresh-btn" onClick={fetchAll}>
              <i className="fa fa-sync-alt"></i> Làm mới
            </button>
            {activeTab === 'products' && (
              <button className="add-btn" onClick={() => openModal()}>+ Thêm sản phẩm</button>
            )}
          </div>
        </div>

        {/* NỘI DUNG: TAB DANH MỤC HÀNG HÓA */}
        {activeTab === 'products' && (
          <div className="table-wrap">
            <table className="products-table">
              <thead>
                <tr>
                  <th>Ảnh</th><th>Mã</th><th>Tên</th><th>Danh mục</th><th>Đơn vị</th>
                  <th>Giá nhập</th><th>Giá bán</th><th>Số lượng</th><th>Hạn dùng</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {products.length > 0 ? products.map((p) => (
                  <tr key={p.product_id}>
                    <td className="cell-center">
                      <img className="product-img" src={p.displayImage || '/placeholder.png'} alt="" />
                    </td>
                    <td>{p.product_code}</td>
                    <td>{p.product_name}</td>
                    <td>{p.category_name}</td>
                    <td>{p.unit}</td>
                    <td>{Number(p.purchase_price).toLocaleString()}</td>
                    <td>{Number(p.selling_price).toLocaleString()}</td>
                    <td>{p.quantity}</td>
                    <td>{p.expiry_date}</td>
                    <td>
                      <button className="action-btn edit" onClick={() => openModal(p)}>🔧 Sửa</button>
                      <button className="action-btn delete" onClick={(e) => handleDeleteClick(p.product_id, e)}>🗑 Xóa</button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="10" style={{textAlign: "center", padding: "20px"}}>Chưa có sản phẩm nào</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* NỘI DUNG: TAB LỊCH SỬ MUA HÀNG */}
        {activeTab === 'history' && (
          <div className="table-wrap">
            <table className="products-table">
              <thead>
                <tr>
                  <th>Mã GD</th>
                  <th>Khách hàng</th>
                  <th>Sản phẩm</th>
                  <th>Đơn vị</th>
                  <th className="cell-center">Số lượng</th>
                  <th>Ngày mua</th>
                  <th>Địa chỉ giao hàng</th>
                  <th>Thanh toán</th>
                </tr>
              </thead>
              <tbody>
                {purchaseHistory.map((item) => (
                  <tr key={item.user_history_id}>
                    <td><strong>#{item.user_history_id}</strong></td>
                    <td style={{ color: 'var(--primary-blue)', fontWeight: '500' }}>{item.customer_name}</td>
                    <td>{item.product_name}</td>
                    <td>{item.unit_name}</td>
                    <td className="cell-center"><strong>{item.quantity}</strong></td>
                    <td>{item.date}</td>
                    <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.address}>
                      {item.address}
                    </td>
                    <td>
                      <span className={`status-badge ${item.payment === 'Tiền mặt' ? 'warning' : 'success'}`}>
                        {item.payment}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      <Chatbot isOpen={isChatOpen} toggleChat={toggleChat} />

      {/* MODAL THÊM / SỬA SẢN PHẨM */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingId ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleSave} className="product-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Danh mục:</label>
                  <select 
                    name="category_id" 
                    value={formData.category_id} 
                    onChange={handleInputChange} 
                    required 
                  >
                    <option value="">-- Chọn danh mục --</option>
                    {Object.entries(categoriesMap).map(([id, cat]) => (
                      <option key={id} value={id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Mã SP:</label>
                  <input type="text" name="product_code" value={formData.product_code} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Tên SP:</label>
                  <input type="text" name="product_name" value={formData.product_name} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Đơn vị:</label>
                  <input type="text" name="unit" value={formData.unit} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Giá nhập:</label>
                  <input type="number" name="purchase_price" value={formData.purchase_price} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Giá bán:</label>
                  <input type="number" name="selling_price" value={formData.selling_price} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Số lượng:</label>
                  <input type="number" name="quantity" value={formData.quantity} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Hạn dùng:</label>
                  <input type="date" name="expiry_date" value={formData.expiry_date} onChange={handleInputChange} />
                </div>
                <div className="form-group full-width">
                  <label>Hình ảnh sản phẩm:</label>
                  <div className="upload-section">
                    <input type="file" accept="image/*" onChange={handleFileChange} />
                    <p style={{ fontSize: '12px', color: '#666', margin: '5px 0' }}>Hoặc dán link ảnh:</p>
                    <input type="text" name="image" value={typeof formData.image === 'string' ? formData.image : ''} 
                           onChange={handleInputChange} placeholder="https://..." />
                  </div>
                  {imagePreview && (
                    <div className="preview-container">
                      <img src={imagePreview} alt="Preview" className="img-preview-rect" />
                    </div>
                  )}
                </div>
                <div className="form-group full-width">
                  <label>Mô tả:</label>
                  <textarea name="description" value={formData.description} onChange={handleInputChange} rows="2"></textarea>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn-submit">{editingId ? "Cập nhật" : "Lưu sản phẩm"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;