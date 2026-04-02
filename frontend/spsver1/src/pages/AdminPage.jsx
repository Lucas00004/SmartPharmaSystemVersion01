import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom'; // Thêm import này
import Sidebar from '../components/Sidebar';
import Chatbot from '../components/Chatbot';
import './AdminPage.css';

const AdminPage = () => {
  const location = useLocation(); // Khởi tạo useLocation để lấy đường dẫn hiện tại

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [categoriesMap, setCategoriesMap] = useState({});
  const [unitsList, setUnitsList] = useState([]);
  const [unitsMap, setUnitsMap] = useState({});
  const [suppliersList, setSuppliersList] = useState([]); 
  
  const [importBatches, setImportBatches] = useState([]);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [editingBatchId, setEditingBatchId] = useState(null);
  
  const [batchFormData, setBatchFormData] = useState({
    batch_number: '',
    supplier_id: '',
    total_price: 0,
    products: [] 
  });

  // ==========================================
  // --- STATE MỚI: MODAL THÊM SẢN PHẨM LÔ HÀNG ---
  // ==========================================
  const [showBatchProductModal, setShowBatchProductModal] = useState(false);
  const [batchProductFormData, setBatchProductFormData] = useState({
    product_code: '',
    product_name: '',
    category_id: '',
    unit_id: '',
    import_price: '',
    quantity: '',
    selling_price: '',
    manufacture_date: '',
    expiry_date: '',
    active_ingredient: '',
    storage_condition: ''
  });

  // ==========================================
  // --- STATE MỚI: QUẢN LÝ XUẤT KHO ---
  // ==========================================
  const [exportTickets, setExportTickets] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormData, setExportFormData] = useState({
    customer: '',
    note: '',
    products: []
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mặc định tab sẽ dựa theo URL ở useEffect bên dưới
  const [activeTab, setActiveTab] = useState('products');

  // --- THÊM MỚI: Tự động đổi tab khi bấm từ Sidebar ---
  useEffect(() => {
    if (location.pathname === '/qlnhapkho') {
      setActiveTab('import');
    } else if (location.pathname === '/qlxuatkho') {
      setActiveTab('export');
    } else if (location.pathname === '/qlhh') {
      // Khi vào trang hàng hóa, hiển thị tab danh mục hàng hóa (hoặc giữ lại history nếu đang mở)
      if (activeTab === 'import' || activeTab === 'export') {
         setActiveTab('products');
      }
    }
  }, [location.pathname]);
  // ----------------------------------------------------

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

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [formData, setFormData] = useState({
    product_code: '', product_name: '', category_id: '', unit_id: '',
    selling_price: '', image: '', description: '', active_ingredient: '', 
    storage_condition: ''
  });

  const toggleChat = () => setIsChatOpen(!isChatOpen);

  const API_BASE =
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_BACKEND_URL)
      ? import.meta.env.VITE_BACKEND_URL
      : 'http://localhost:5000';

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let currentMap = {};

      try {
        const catRes = await fetch(`${API_BASE}/api/product_category`, { method: 'GET', credentials: 'include', headers: { Accept: 'application/json' } });
        if (catRes.ok) {
          const catJson = await catRes.json();
          const catList = Array.isArray(catJson) ? catJson : catJson.data || [];
          catList.forEach((c) => {
            const id = c.category_id ?? c.id;
            const name = c.category_name ?? c.name ?? '';
            if (id != null) currentMap[id] = { name, description: c.description ?? '' };
          });
          setCategoriesMap(currentMap);
        }
      } catch (err) { console.error("Lỗi API Danh mục:", err.message); }

      let currentUnitMap = {};
      try {
        const unitRes = await fetch(`${API_BASE}/api/unit`, { method: 'GET', credentials: 'include', headers: { Accept: 'application/json' } });
        if (unitRes.ok) {
          const unitJson = await unitRes.json();
          const unitList = Array.isArray(unitJson) ? unitJson : unitJson.data || [];
          unitList.forEach((u) => { currentUnitMap[u.unit_id] = u.unit_name; });
          setUnitsMap(currentUnitMap);
          setUnitsList(unitList);
        }
      } catch (err) { console.error("Lỗi API Đơn vị tính:", err.message); }

      try {
        const supRes = await fetch(`${API_BASE}/api/supplier`, { method: 'GET', credentials: 'include', headers: { Accept: 'application/json' } });
        if (supRes.ok) {
          const supJson = await supRes.json();
          setSuppliersList(Array.isArray(supJson) ? supJson : supJson.data || []);
        }
      } catch (err) { console.error("Lỗi API Nhà cung cấp:", err.message); }

      try {
        const prodRes = await fetch(`${API_BASE}/api/product`, { method: 'GET', credentials: 'include', headers: { Accept: 'application/json' } });
        if (prodRes.ok) {
          const prodJson = await prodRes.json();
          const prodList = Array.isArray(prodJson) ? prodJson : prodJson.data || [];
          const normalized = prodList.map((p) => ({
            ...p,
            product_id: p.product_id ?? p.id ?? null,
            category_name: p.category_name || '',
            unit_name: p.unit_name || '',
            displayImage: p.image ? (p.image.startsWith('http') ? p.image : `${API_BASE}/uploads/${p.image}`) : null
          }));
          setProducts(normalized);
        }
      } catch (err) { console.error("Lỗi kết nối:", err.message); }

      try {
        const batchRes = await fetch(`${API_BASE}/api/import_batch`, { method: 'GET', credentials: 'include', headers: { Accept: 'application/json' } });
        if (batchRes.ok) {
          const batchJson = await batchRes.json();
          setImportBatches(Array.isArray(batchJson) ? batchJson : batchJson.data || []);
        }
      } catch (err) { console.error("Lỗi API Phiếu Nhập:", err.message); }

      // 3. FETCH XUẤT KHO: Lấy danh sách phiếu đã xuất
      try {
        const resExport = await fetch(`${API_BASE}/api/export`, { credentials: 'include' });
        if (resExport.ok) {
          const json = await resExport.json();
          setExportTickets(json.data || []);
        }
      } catch (err) { console.error("Lỗi API Phiếu Xuất:", err.message); }

      // 4. FETCH XUẤT KHO: Lấy SP sẵn có trong kho để chọn khi tạo phiếu mới
      try {
        const resAvail = await fetch(`${API_BASE}/api/export/available`, { credentials: 'include' });
        if (resAvail.ok) {
          const json = await resAvail.json();
          setAvailableProducts(json.data || []);
        }
      } catch (err) { console.error("Lỗi API Sản phẩm Xuất:", err.message); }

    } finally {
      setLoading(false);
    }
  }, [API_BASE]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    const total = batchFormData.products.reduce((sum, item) => {
      const price = Number(item.import_price) || 0;
      const qty = Number(item.quantity) || 0;
      return sum + (price * qty);
    }, 0);
    setBatchFormData(prev => ({ ...prev, total_price: total }));
  }, [batchFormData.products]);

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

  const handleEdit = (product) => {
    setImagePreview(null);
    setEditingId(product.product_id);
    setFormData({
      product_code: product.product_code || '',
      product_name: product.product_name || '',
      category_id: product.category_id || '',
      unit_id: product.unit_id || '',
      selling_price: product.selling_price || '',
      image: product.image || '',
      description: product.description || '',
      active_ingredient: product.active_ingredient || '',
      storage_condition: product.storage_condition || ''
    });
    if (product.displayImage) setImagePreview(product.displayImage);
    setShowModal(true);
  };

  const handleAddNew = () => {
    setImagePreview(null);
    setEditingId(null);
    setFormData({
      product_code: '', product_name: '', category_id: '', unit_id: '',
      selling_price: '', image: '', description: '', active_ingredient: '', 
      storage_condition: ''
    });
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };


  // === LOGIC MỚI: QUẢN LÝ NHẬP KHO ===
  const handleAddBatchProductRow = () => {
    // Mở modal thay vì thêm trực tiếp
    setBatchProductFormData({
      product_code: '',
      product_name: '',
      category_id: '',
      unit_id: '',
      import_price: '',
      quantity: '',
      selling_price: '',
      manufacture_date: '',
      expiry_date: '',
      active_ingredient: '',
      storage_condition: ''
    });
    setShowBatchProductModal(true);
  };

  const handleBatchProductModalInputChange = (e) => {
    const { name, value } = e.target;
    setBatchProductFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveBatchProduct = () => {
    // Validate required fields
    if (!batchProductFormData.product_code.trim() || !batchProductFormData.product_name.trim() || !batchProductFormData.unit_id) {
      alert('Vui lòng nhập: Mã SP, Tên SP và Đơn vị');
      return;
    }

    // Thêm sản phẩm vào mảng
    setBatchFormData(prev => ({
      ...prev,
      products: [...prev.products, batchProductFormData]
    }));

    // Đóng modal
    setShowBatchProductModal(false);
  };

  const handleRemoveBatchProductRow = (index) => {
    setBatchFormData(prev => {
      const newProducts = [...prev.products];
      newProducts.splice(index, 1);
      return { ...prev, products: newProducts };
    });
  };

  const handleBatchProductChange = (index, e) => {
    const { name, value } = e.target;
    setBatchFormData(prev => {
      const newProducts = [...prev.products];
      newProducts[index] = { ...newProducts[index], [name]: value };
      return { ...prev, products: newProducts };
    });
  };

  const handleBatchInputChange = (e) => {
    const { name, value } = e.target;
    setBatchFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddNewBatch = () => {
    setEditingBatchId(null);
    setBatchFormData({
      batch_number: '', supplier_id: '', total_price: 0,
      products: [{ 
        product_code: '', product_name: '', category_id: '', unit_id: '',
        selling_price: '', image: '', description: '', active_ingredient: '', 
        storage_condition: '', manufacture_date: '', expiry_date: '', import_price: '', quantity: ''
      }]
    });
    setShowBatchModal(true);
  };

  const handleEditBatch = async (batch) => {
    setEditingBatchId(batch.batch_id);
    try {
      const res = await fetch(`${API_BASE}/api/import_batch/${batch.batch_id}`, { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        const details = json.data || [];
        setBatchFormData({
          batch_number: batch.batch_number || '',
          supplier_id: batch.supplier_id || '',
          total_price: batch.total_price || 0,
          products: details.map(d => ({
            batch_detail_id: d.batch_detail_id, 
            product_id: d.product_id,           
            product_code: d.product_code || '',
            product_name: d.product_name || '',
            category_id: d.category_id || '',
            unit_id: d.unit_id || '',
            selling_price: d.selling_price || '',
            image: d.image || '',
            description: d.description || '',
            active_ingredient: d.active_ingredient || '',
            storage_condition: d.storage_condition || '',
            manufacture_date: d.manufacture_date ? d.manufacture_date.split('T')[0] : '', 
            expiry_date: d.expiry_date ? d.expiry_date.split('T')[0] : '',
            import_price: d.import_price || '',
            quantity: d.quantity || ''
          }))
        });
        setShowBatchModal(true);
      }
    } catch (err) {
      alert("Lỗi khi tải chi tiết phiếu nhập!");
    }
  };

  const handleSaveBatch = async (e) => {
    e.preventDefault();
    if (batchFormData.products.length === 0) {
      alert("Phải có ít nhất 1 sản phẩm trong phiếu nhập!");
      return;
    }
    const payload = {
      ...batchFormData,
      user_id: 1 
    };

    const url = editingBatchId ? `${API_BASE}/api/import_batch/${editingBatchId}` : `${API_BASE}/api/import_batch`;
    const method = editingBatchId ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      const result = await response.json();
      if (response.ok || response.status === 201) {
        setShowBatchModal(false);
        fetchAll(); 
        alert(editingBatchId ? "Cập nhật phiếu nhập thành công!" : "Tạo phiếu nhập kho thành công!");
      } else {
        alert(result.message || result.error || "Có lỗi xảy ra khi lưu phiếu nhập");
      }
    } catch (error) {
      alert("Đã xảy ra lỗi kết nối khi lưu phiếu nhập!");
    }
  };

  const handleDeleteBatch = async (batchId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa phiếu nhập này? Mọi sản phẩm trong lô sẽ bị xóa!")) return;
    try {
      const response = await fetch(`${API_BASE}/api/import_batch/${batchId}`, {
        method: 'DELETE', credentials: 'include', headers: { 'Accept': 'application/json' }
      });
      if (response.ok) {
        alert("Đã xóa phiếu nhập thành công!");
        fetchAll();
      } else {
        const result = await response.json();
        alert(result.message || "Xóa thất bại!");
      }
    } catch (error) {
      alert("Đã xảy ra lỗi kết nối khi xóa!");
    }
  };

  // ==========================================
  // --- LOGIC XỬ LÝ XUẤT KHO ---
  // ==========================================
  
  const handleAddNewExport = () => {
    setExportFormData({
      customer: '',
      note: '',
      products: []
    });
    setShowExportModal(true);
  };

  const handleAddExportRow = () => {
    setExportFormData(prev => ({
      ...prev,
      products: [...prev.products, { product_id: '', export_quantity: 1, export_price: 0, unit_id: '', max_qty: 0 }]
    }));
  };

  const handleExportProductChange = (index, productId) => {
    const selectedProd = availableProducts.find(p => p.product_id === parseInt(productId));
    if (!selectedProd) return;

    setExportFormData(prev => {
      const newProds = [...prev.products];
      newProds[index] = {
        ...newProds[index],
        product_id: selectedProd.product_id,
        product_name: selectedProd.product_name,
        unit_id: selectedProd.unit_id,
        unit_name: selectedProd.unit_name,
        max_qty: selectedProd.total_available,
        export_price: 0
      };
      return { ...prev, products: newProds };
    });
  };

  const handleExportInputChange = (index, field, value) => {
    setExportFormData(prev => {
      const newProds = [...prev.products];
      newProds[index][field] = value;
      return { ...prev, products: newProds };
    });
  };

  const handleSaveExport = async (e) => {
    e.preventDefault();
    if (exportFormData.products.length === 0) return alert("Vui lòng chọn ít nhất 1 sản phẩm");

    const payload = {
      ...exportFormData,
      user_id: 1
    };

    try {
      const res = await fetch(`${API_BASE}/api/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      const result = await res.json();
      if (res.ok) {
        alert("Xuất kho thành công!");
        setShowExportModal(false);
        fetchAll();
      } else {
        alert(result.message || "Lỗi khi xuất kho");
      }
    } catch (err) { alert("Lỗi kết nối server"); }
  };

  const handleDeleteExport = async (id) => {
    if (!window.confirm("Bạn có chắc muốn hủy phiếu xuất này? Số lượng sẽ được hoàn lại kho!")) return;
    try {
      const res = await fetch(`${API_BASE}/api/export/${id}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) { fetchAll(); alert("Đã hủy phiếu xuất"); }
    } catch (err) { alert("Lỗi khi xóa"); }
  };

  // Xác định prop gửi xuống Sidebar để làm sáng menu (đồng bộ với URL)
  const currentSidebarPage = location.pathname === '/qlnhapkho' ? 'qlnhapkho' : (location.pathname === '/qlxuatkho' ? 'qlxuatkho' : 'qlhh');

  return (
    <div className="admin-body">
      {/* TRUYỀN prop currentSidebarPage XUỐNG ĐỂ SÁNG ĐÚNG MENU */}
      <Sidebar toggleChat={toggleChat} activePage={currentSidebarPage} />
      
      <div className="main-admin">
        <div className="header-row">
          <div>
            <h1 className="page-title">Hàng hóa & Giao dịch</h1>
            {error && <div style={{ background: '#fee', color: '#c33', padding: '10px', borderRadius: '4px', marginBottom: '10px', fontSize: '14px' }}>⚠️ {error}</div>}
            <div className="tabs-container">
              
              {/* Nếu đang ở trang Hàng hóa (/qlhh) mới hiện ra Tab Hàng Hoá và Lịch sử */}
              {location.pathname === '/qlhh' && (
                <>
                  <button className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>
                    Danh mục hàng hóa
                  </button>
                  <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
                    Lịch sử mua hàng
                  </button>
                </>
              )}

              {/* Nếu đang ở trang Quản lý nhập kho (/qlnhapkho) thì chỉ hiện mỗi tab này (hoặc 1 chữ đại diện cho trang) */}
              {location.pathname === '/qlnhapkho' && (
                <button className="tab-btn active">
                   Danh sách Phiếu nhập kho
                </button>
              )}

              {/* Nếu đang ở trang Quản lý xuất kho (/qlxuatkho) */}
              {location.pathname === '/qlxuatkho' && (
                <button className="tab-btn active">
                   Danh sách Phiếu xuất kho
                </button>
              )}

            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <button className="refresh-btn" onClick={fetchAll}>
              <i className="fa fa-sync-alt"></i> Làm mới
            </button>
            {activeTab === 'import' && (
              <button className="add-btn" onClick={handleAddNewBatch}>+ Tạo Phiếu Nhập Kho</button>
            )}
            {activeTab === 'export' && (
              <button className="add-btn" onClick={handleAddNewExport}>+ Tạo Phiếu Xuất</button>
            )}
          </div>
        </div>

        {/* TAB SẢN PHẨM */}
        {activeTab === 'products' && (
          <div className="table-wrap">
            <table className="products-table">
              <thead>
                <tr>
                  <th>ẢNH</th><th>TÊN</th><th>DANH MỤC</th><th>ĐƠN VỊ</th><th>GIÁ BÁN</th><th>THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.product_id}>
                    <td>
                      {p.image ? (
                        <img src={p.image} alt={p.product_name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} onError={(e) => e.target.style.display = 'none'} />
                      ) : (<span style={{color: '#999', fontSize: '12px'}}>Không có ảnh</span>)}
                    </td>
                    <td>{p.product_name}</td>
                    <td>{p.category_name || 'N/A'}</td>
                    <td>{p.unit_name || 'N/A'}</td>
                    <td>{Number(p.selling_price || 0).toLocaleString()} VNĐ</td>
                    <td>
                      <button onClick={() => handleEdit(p)} className="btn-edit">Sửa</button>
                      <button onClick={(e) => handleDeleteClick(p.product_id, e)} className="btn-delete">Xóa</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB QUẢN LÝ NHẬP KHO */}
        {activeTab === 'import' && (
          <div className="table-wrap">
            <table className="products-table">
              <thead>
                <tr>
                  <th>MÃ PHIẾU</th>
                  <th>NHÀ CUNG CẤP</th>
                  <th>TỔNG TIỀN</th>
                  <th>NGƯỜI TẠO</th>
                  <th>NGÀY TẠO</th>
                  <th>THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {importBatches.length > 0 ? importBatches.map((b) => (
                  <tr key={b.batch_id}>
                    <td><strong>{b.batch_number}</strong></td>
                    <td>{b.supplier_name || 'N/A'}</td>
                    <td style={{ color: '#d9534f', fontWeight: 'bold' }}>{Number(b.total_price || 0).toLocaleString()} VNĐ</td>
                    <td>{b.creator_name || 'N/A'}</td>
                    <td>{new Date(b.create_date).toLocaleString('vi-VN')}</td>
                    <td>
                      <button onClick={() => handleEditBatch(b)} className="btn-edit">Chi tiết / Sửa</button>
                      <button onClick={() => handleDeleteBatch(b.batch_id)} className="btn-delete">Xóa</button>
                    </td>
                  </tr>
                )) : <tr><td colSpan="6" style={{textAlign: 'center'}}>Chưa có phiếu nhập kho nào.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB LỊCH SỬ MUA HÀNG */}
        {activeTab === 'history' && (
           <div className="table-wrap">
             <table className="products-table">
               {/* Nội dung bảng lịch sử mua hàng */}
             </table>
           </div>
        )}

        {/* TAB QUẢN LÝ XUẤT KHO */}
        {activeTab === 'export' && (
          <div className="table-wrap">
            <table className="products-table">
              <thead>
                <tr>
                  <th>MÃ PHIẾU</th>
                  <th>KHÁCH HÀNG</th>
                  <th>TỔNG GIÁ TRỊ</th>
                  <th>NGƯỜI XUẤT</th>
                  <th>NGÀY XUẤT</th>
                  <th>THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {exportTickets.map(t => (
                  <tr key={t.ticket_id}>
                    <td><strong>PX-{t.ticket_id}</strong></td>
                    <td>{t.customer || 'Khách lẻ'}</td>
                    <td style={{color: '#28a745', fontWeight: 'bold'}}>{Number(t.total_price).toLocaleString()} VNĐ</td>
                    <td>{t.full_name}</td>
                    <td>{new Date(t.created_at).toLocaleString('vi-VN')}</td>
                    <td>
                      <button onClick={() => handleDeleteExport(t.ticket_id)} className="btn-delete">Hủy phiếu</button>
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
                  <select 
                    name="unit_id" 
                    value={formData.unit_id} 
                    onChange={handleInputChange} 
                    required
                  >
                    <option value="">-- Chọn đơn vị --</option>
                    {unitsList.map((u) => (
                      <option key={u.unit_id} value={u.unit_id}>{u.unit_name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Giá bán:</label>
                  <input type="number" name="selling_price" value={formData.selling_price} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Hoạt chất:</label>
                  <input type="text" name="active_ingredient" value={formData.active_ingredient} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Bảo quản:</label>
                  <input type="text" name="storage_condition" value={formData.storage_condition} onChange={handleInputChange} />
                </div>
                <div className="form-group full-width">
                  <label>Mô tả:</label>
                  <textarea name="description" value={formData.description} onChange={handleInputChange} rows="2"></textarea>
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
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className="btn-submit">{editingId ? "Cập nhật" : "Lưu sản phẩm"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL THÊM / SỬA PHIẾU NHẬP KHO */}
      {showBatchModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '90%', maxWidth: '1200px' }}>
            <div className="modal-header">
              <h2>{editingBatchId ? `Cập nhật Phiếu Nhập: ${batchFormData.batch_number}` : "Tạo Phiếu Nhập Kho Mới"}</h2>
              <button className="close-btn" onClick={() => setShowBatchModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleSaveBatch} className="product-form">
              {/* Thông tin chung của phiếu */}
              <div className="form-grid" style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #eee' }}>
                <div className="form-group">
                  <label>Mã Lô/Phiếu nhập:</label>
                  <input type="text" name="batch_number" value={batchFormData.batch_number} onChange={handleBatchInputChange} placeholder="VD: PN2026-04..." required />
                </div>
                <div className="form-group">
                  <label>Nhà cung cấp:</label>
                  <select name="supplier_id" value={batchFormData.supplier_id} onChange={handleBatchInputChange}>
                    <option value="">-- Chọn Nhà cung cấp --</option>
                    {suppliersList.map(s => <option key={s.supplier_id} value={s.supplier_id}>{s.supplier_name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Tổng giá trị phiếu (Tự động tính):</label>
                  <input type="text" value={`${Number(batchFormData.total_price).toLocaleString()} VNĐ`} readOnly style={{ backgroundColor: '#f5f5f5', fontWeight: 'bold', color: '#d9534f' }} />
                </div>
              </div>

              {/* Danh sách sản phẩm nhập vào */}
              <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#333' }}>Chi tiết Sản phẩm nhập ({batchFormData.products.length})</h3>
                <button type="button" className="btn-edit" onClick={handleAddBatchProductRow} style={{ backgroundColor: '#ffc107', color: '#333', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}>+ Thêm dòng sản phẩm</button>
              </div>

              {/* Bảng hiển thị sản phẩm nhập */}
              <div style={{ overflowX: 'auto', paddingBottom: '10px', marginBottom: '20px', backgroundColor: '#f9f9f9', borderRadius: '4px', border: '1px solid #e8e8e8' }}>
                <table className="import-products-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                      <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600', color: '#333' }}>MÃ SP (*)</th>
                      <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600', color: '#333' }}>TÊN SẢN PHẨM (*)</th>
                      <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600', color: '#333' }}>DANH MỤC</th>
                      <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600', color: '#333' }}>ĐƠN VỊ (*)</th>
                      <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '600', color: '#333' }}>GIÁ NHẬP (VNĐ)</th>
                      <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '600', color: '#333' }}>SỐ LƯỢNG</th>
                      <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '600', color: '#333' }}>GIÁ BÁN (VNĐ)</th>
                      <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600', color: '#333' }}>NSX</th>
                      <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600', color: '#333' }}>HSD</th>
                      <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600', color: '#333' }}>HOẠT CHẤT</th>
                      <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600', color: '#333' }}>BẢO QUẢN</th>
                      <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600', color: '#333', width: '60px' }}>XÓA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batchFormData.products.length > 0 ? (
                      batchFormData.products.map((item, index) => (
                        <tr key={index} style={{ borderBottom: '1px solid #e8e8e8', backgroundColor: index % 2 === 0 ? '#fff' : '#fafafa' }}>
                          <td style={{ padding: '10px 8px' }}>
                            <input 
                              type="text" 
                              name="product_code" 
                              value={item.product_code} 
                              onChange={(e) => handleBatchProductChange(index, e)} 
                              required 
                              style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '3px', fontSize: '12px' }}
                            />
                          </td>
                          <td style={{ padding: '10px 8px' }}>
                            <input 
                              type="text" 
                              name="product_name" 
                              value={item.product_name} 
                              onChange={(e) => handleBatchProductChange(index, e)} 
                              required 
                              style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '3px', fontSize: '12px' }}
                            />
                          </td>
                          <td style={{ padding: '10px 8px' }}>
                            <select 
                              name="category_id" 
                              value={item.category_id} 
                              onChange={(e) => handleBatchProductChange(index, e)} 
                              style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '3px', fontSize: '12px' }}
                            >
                              <option value="">-- Chọn --</option>
                              {Object.entries(categoriesMap).map(([id, cat]) => <option key={id} value={id}>{cat.name}</option>)}
                            </select>
                          </td>
                          <td style={{ padding: '10px 8px' }}>
                            <select 
                              name="unit_id" 
                              value={item.unit_id} 
                              onChange={(e) => handleBatchProductChange(index, e)} 
                              required 
                              style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '3px', fontSize: '12px' }}
                            >
                              <option value="">-- Chọn --</option>
                              {unitsList.map((u) => <option key={u.unit_id} value={u.unit_id}>{u.unit_name}</option>)}
                            </select>
                          </td>
                          <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                            <input 
                              type="number" 
                              name="import_price" 
                              value={item.import_price} 
                              onChange={(e) => handleBatchProductChange(index, e)} 
                              min="0" 
                              style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '3px', fontSize: '12px', textAlign: 'right' }}
                            />
                          </td>
                          <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                            <input 
                              type="number" 
                              name="quantity" 
                              value={item.quantity} 
                              onChange={(e) => handleBatchProductChange(index, e)} 
                              min="1" 
                              required 
                              style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '3px', fontSize: '12px', textAlign: 'right' }}
                            />
                          </td>
                          <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                            <input 
                              type="number" 
                              name="selling_price" 
                              value={item.selling_price} 
                              onChange={(e) => handleBatchProductChange(index, e)} 
                              min="0" 
                              style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '3px', fontSize: '12px', textAlign: 'right' }}
                            />
                          </td>
                          <td style={{ padding: '10px 8px' }}>
                            <input 
                              type="date" 
                              name="manufacture_date" 
                              value={item.manufacture_date} 
                              onChange={(e) => handleBatchProductChange(index, e)} 
                              style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '3px', fontSize: '12px' }}
                            />
                          </td>
                          <td style={{ padding: '10px 8px' }}>
                            <input 
                              type="date" 
                              name="expiry_date" 
                              value={item.expiry_date} 
                              onChange={(e) => handleBatchProductChange(index, e)} 
                              style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '3px', fontSize: '12px' }}
                            />
                          </td>
                          <td style={{ padding: '10px 8px' }}>
                            <input 
                              type="text" 
                              name="active_ingredient" 
                              value={item.active_ingredient} 
                              onChange={(e) => handleBatchProductChange(index, e)} 
                              style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '3px', fontSize: '12px' }}
                            />
                          </td>
                          <td style={{ padding: '10px 8px' }}>
                            <input 
                              type="text" 
                              name="storage_condition" 
                              value={item.storage_condition} 
                              onChange={(e) => handleBatchProductChange(index, e)} 
                              style={{ width: '100%', padding: '6px', border: '1px solid #ddd', borderRadius: '3px', fontSize: '12px' }}
                            />
                          </td>
                          <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                            <button 
                              type="button" 
                              onClick={() => handleRemoveBatchProductRow(index)} 
                              style={{ background: 'transparent', color: '#ff4d4f', border: 'none', cursor: 'pointer', fontSize: '16px', padding: '0' }} 
                              title="Xóa dòng này"
                            >
                              ✖
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="12" style={{ padding: '20px', textAlign: 'center', color: '#999', fontStyle: 'italic' }}>
                          Chưa thêm sản phẩm nào. Nhấn "+ Thêm dòng sản phẩm" để bắt đầu
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="modal-actions" style={{ marginTop: '20px' }}>
                <button type="button" className="btn-cancel" onClick={() => setShowBatchModal(false)}>Hủy</button>
                <button type="submit" className="btn-submit">{editingBatchId ? "Cập nhật Phiếu Nhập" : "Lưu Phiếu Nhập"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================
          MODAL THÊM SẢN PHẨM LÔ HÀNG (NHẬP KHO)
          ============================================ */}
      {showBatchProductModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '90%', maxWidth: '900px' }}>
            <div className="modal-header">
              <h2>Sửa sản phẩm</h2>
              <button className="close-btn" onClick={() => setShowBatchProductModal(false)}>×</button>
            </div>

            <div className="product-form">
              <div className="form-grid">
                {/* Hàng 1 */}
                <div className="form-group">
                  <label>Danh mục:</label>
                  <select name="category_id" value={batchProductFormData.category_id} onChange={handleBatchProductModalInputChange}>
                    <option value="">-- Chọn danh mục --</option>
                    {Object.entries(categoriesMap).map(([id, cat]) => <option key={id} value={id}>{cat.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Mã SP:</label>
                  <input type="text" name="product_code" value={batchProductFormData.product_code} onChange={handleBatchProductModalInputChange} placeholder="VD: DHG-001" />
                </div>

                {/* Hàng 2 */}
                <div className="form-group">
                  <label>Tên SP:</label>
                  <input type="text" name="product_name" value={batchProductFormData.product_name} onChange={handleBatchProductModalInputChange} placeholder="Nhập tên sản phẩm" />
                </div>
                <div className="form-group">
                  <label>Đơn vị:</label>
                  <select name="unit_id" value={batchProductFormData.unit_id} onChange={handleBatchProductModalInputChange}>
                    <option value="">-- Chọn đơn vị --</option>
                    {unitsList.map((u) => <option key={u.unit_id} value={u.unit_id}>{u.unit_name}</option>)}
                  </select>
                </div>

                {/* Hàng 3 */}
                <div className="form-group">
                  <label>Giá bán:</label>
                  <input type="number" name="selling_price" value={batchProductFormData.selling_price} onChange={handleBatchProductModalInputChange} placeholder="Giá bán (VNĐ)" min="0" />
                </div>
                <div className="form-group">
                  <label>Hoạt chất:</label>
                  <input type="text" name="active_ingredient" value={batchProductFormData.active_ingredient} onChange={handleBatchProductModalInputChange} placeholder="VD: Paracetamol 500mg" />
                </div>

                {/* Hàng 4 */}
                <div className="form-group">
                  <label>Bảo quản:</label>
                  <input type="text" name="storage_condition" value={batchProductFormData.storage_condition} onChange={handleBatchProductModalInputChange} placeholder="VD: Dưới 30 độ C" />
                </div>

                {/* Hàng 5 */}
                <div className="form-group">
                  <label>Mô tả:</label>
                  <input type="text" name="description" value={batchProductFormData.description || ''} placeholder="Mô tả sản phẩm" readOnly />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowBatchProductModal(false)}>Hủy</button>
                <button type="button" className="btn-submit" onClick={handleSaveBatchProduct}>Cập nhật</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XUẤT KHO MỚI */}
      {showExportModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '80%', maxWidth: '1000px' }}>
            <div className="modal-header">
              <h2>Tạo Phiếu Xuất Kho (FEFO)</h2>
              <button className="close-btn" onClick={() => setShowExportModal(false)}>×</button>
            </div>
            <form onSubmit={handleSaveExport}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Tên khách hàng:</label>
                  <input type="text" value={exportFormData.customer} onChange={(e) => setExportFormData({...exportFormData, customer: e.target.value})} placeholder="Nhập tên khách..." />
                </div>
                <div className="form-group">
                  <label>Ghi chú:</label>
                  <input type="text" value={exportFormData.note} onChange={(e) => setExportFormData({...exportFormData, note: e.target.value})} />
                </div>
              </div>

              <div style={{ marginTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <h3>Danh sách sản phẩm xuất</h3>
                  <button type="button" className="btn-edit" onClick={handleAddExportRow}>+ Thêm sản phẩm</button>
                </div>
                <table className="products-table">
                  <thead>
                    <tr>
                      <th>Sản phẩm (Còn trong kho)</th>
                      <th>Số lượng xuất</th>
                      <th>Giá xuất (VNĐ)</th>
                      <th>Đơn vị</th>
                      <th>Xóa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exportFormData.products.map((item, index) => (
                      <tr key={index}>
                        <td>
                          <select 
                            value={item.product_id} 
                            onChange={(e) => handleExportProductChange(index, e.target.value)}
                            required
                            style={{ width: '100%' }}
                          >
                            <option value="">-- Chọn sản phẩm --</option>
                            {availableProducts.map(p => (
                              <option key={p.product_id} value={p.product_id}>
                                {p.product_name} (Kho: {p.total_available})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input 
                            type="number" 
                            min="1" 
                            max={item.max_qty} 
                            value={item.export_quantity} 
                            onChange={(e) => handleExportInputChange(index, 'export_quantity', e.target.value)}
                            required
                          />
                        </td>
                        <td>
                          <input 
                            type="number" 
                            value={item.export_price} 
                            onChange={(e) => handleExportInputChange(index, 'export_price', e.target.value)}
                            required
                          />
                        </td>
                        <td>{item.unit_name || '...'}</td>
                        <td>
                          <button type="button" onClick={() => {
                            const newP = [...exportFormData.products];
                            newP.splice(index, 1);
                            setExportFormData({...exportFormData, products: newP});
                          }}>✖</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowExportModal(false)}>Hủy</button>
                <button type="submit" className="btn-submit">Xác nhận xuất kho</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminPage;