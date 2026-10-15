'use client';
import { useState, useEffect } from 'react';

export default function ProdukPage() {
  const [produk, setProduk] = useState([]);
  const [kategori, setKategori] = useState([]);
  const [loading, setLoading] = useState(true);

  // Product Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [processing, setProcessing] = useState(false);

  // Category Modal State
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [showArchived, setShowArchived] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const ITEMS_PER_PAGE = 7;

  useEffect(() => {
    setCurrentPage(0);
  }, [searchQuery, selectedCategory, showArchived]);

  // Custom Alert / Confirm Modal
  const [confirmModal, setConfirmModal] = useState({
    visible: false,
    title: '',
    message: '',
    confirmText: 'YA, PROSES',
    confirmVariant: 'danger',
    onConfirm: null
  });

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/produk?include_archived=true').then(r => r.json()),
      fetch('/api/kategori').then(r => r.json())
    ]).then(([p, k]) => {
      setProduk(Array.isArray(p) ? p : []);
      setKategori(Array.isArray(k) ? k : []);
      setLoading(false);
    });
  };

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      fetch('/api/produk?include_archived=true').then(r => r.json()),
      fetch('/api/kategori').then(r => r.json())
    ]).then(([p, k]) => {
      if (isMounted) {
        setProduk(Array.isArray(p) ? p : []);
        setKategori(Array.isArray(k) ? k : []);
        setLoading(false);
      }
    });
    return () => { isMounted = false; };
  }, []);

  const openProductModal = (item = null) => {
    setEditItem(item);
    setFormData(
      item 
        ? { ...item } 
        : { nama: '', sku: '', harga_jual: '', harga_modal: '', stok: 100, kategori_id: kategori[0]?.id || '' }
    );
    setModalVisible(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setProcessing(true);
    
    const method = editItem ? 'PUT' : 'POST';
    const payload = { 
      ...formData, 
      harga_jual: parseInt(formData.harga_jual, 10) || 0,
      harga_modal: parseInt(formData.harga_modal, 10) || 0,
      stok: parseInt(formData.stok, 10) || 0
    };

    try {
      const res = await fetch('/api/produk', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to save product');
      
      setModalVisible(false);
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setProcessing(true);

    try {
      const res = await fetch('/api/kategori', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama: newCatName.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan kategori');

      setNewCatName('');
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const requestDeleteCategory = (cat) => {
    setConfirmModal({
      visible: true,
      title: 'HAPUS KATEGORI',
      message: `Apakah Anda yakin ingin menghapus kategori "${cat.nama}"?`,
      confirmText: 'HAPUS KATEGORI',
      confirmVariant: 'danger',
      onConfirm: async () => {
        setProcessing(true);
        try {
          const res = await fetch(`/api/kategori?id=${cat.id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error('Gagal menghapus kategori');
          loadData();
        } catch (err) {
          alert(err.message);
        } finally {
          setProcessing(false);
        }
      }
    });
  };

  const requestToggleArchive = (item) => {
    const isArchived = item.is_active === false;
    const actionText = isArchived ? 'mengaktifkan kembali' : 'mengarsipkan';
    setConfirmModal({
      visible: true,
      title: isArchived ? 'KONFIRMASI BUKA ARSIP' : 'KONFIRMASI ARSIP PRODUK',
      message: `Apakah Anda yakin ingin ${actionText} produk "${item.nama}"?`,
      confirmText: isArchived ? 'BUKA ARSIP' : 'ARSIPKAN PRODUK',
      confirmVariant: 'primary',
      onConfirm: () => executeToggleArchive(item)
    });
  };

  const executeToggleArchive = async (item) => {
    const isArchived = item.is_active === false;
    setLoading(true);
    try {
      const res = await fetch('/api/produk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, is_active: isArchived ? true : false })
      });
      if (!res.ok) throw new Error('Gagal memperbarui status');
      loadData();
    } catch (err) {
      alert(err.message);
      setLoading(false);
    }
  };

  const requestDeleteProduct = (item) => {
    setConfirmModal({
      visible: true,
      title: 'KONFIRMASI HAPUS PERMANEN',
      message: `Apakah Anda yakin ingin menghapus produk "${item.nama}" secara permanen? Data yang telah dihapus tidak dapat dikembalikan.`,
      confirmText: 'HAPUS PERMANEN',
      confirmVariant: 'danger',
      onConfirm: async () => {
        setProcessing(true);
        try {
          const res = await fetch(`/api/produk?id=${item.id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error('Gagal menghapus produk');
          setModalVisible(false);
          loadData();
        } catch (err) {
          alert(err.message);
        } finally {
          setProcessing(false);
        }
      }
    });
  };

  // Filter products
  const filteredProducts = produk.filter(p => {
    const matchSearch = !searchQuery || 
      p.nama.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchCat = selectedCategory === 'ALL' || p.kategori_id === selectedCategory;
    const matchArchived = showArchived ? p.is_active === false : p.is_active !== false;
    return matchSearch && matchCat && matchArchived;
  });

  const paginatedData = filteredProducts.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

  return (
    <div className="admin-page-container">
      
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '0.5px', margin: 0 }}>KATALOG PRODUK</h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: '0.2rem 0 0 0', fontWeight: 600 }}>Kelola master produk, harga, dan kategori</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button 
            className="btn-chocolate" 
            onClick={() => openProductModal()}
            style={{ padding: '0.65rem 1rem', fontSize: '0.8125rem' }}
          >
            + PRODUK
          </button>
          <button 
            className="btn-secondary" 
            onClick={() => setCategoryModalVisible(true)}
            style={{ padding: '0.65rem 1rem', fontSize: '0.8125rem' }}
          >
            + KATEGORI
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="responsive-filter-bar" style={{ marginBottom: '1.25rem' }}>
        <div style={{ flex: 2, minWidth: '160px' }}>
          <input 
            type="text" 
            className="input-field" 
            placeholder="🔍 Cari produk / SKU..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ padding: '0.65rem 0.85rem', fontSize: '0.875rem' }}
          />
        </div>
        <div style={{ flex: 1, minWidth: '150px' }}>
          <select 
            className="input-field"
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            style={{ padding: '0.65rem 0.85rem', fontSize: '0.875rem' }}
          >
            <option value="ALL">-- SEMUA KATEGORI --</option>
            {kategori.map(k => (
              <option key={k.id} value={k.id}>{k.nama}</option>
            ))}
          </select>
        </div>
        
        <button 
          className={showArchived ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setShowArchived(!showArchived)}
          style={{ padding: '0.65rem 0.85rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
        >
          {showArchived ? 'PRODUK ARSIP' : 'ARSIP'}
        </button>

        {(searchQuery || selectedCategory !== 'ALL') && (
          <button 
            className="btn-secondary" 
            onClick={() => { setSearchQuery(''); setSelectedCategory('ALL'); }}
            style={{ padding: '0.65rem 0.85rem', fontSize: '0.75rem' }}
          >
            RESET
          </button>
        )}
      </div>

      {/* Table Section */}
      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', fontWeight: 700 }}>MEMUAT KATALOG PRODUK...</div>
      ) : (
        <div className="table-responsive">
          <table style={{ width: '100%', minWidth: '620px', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)', backgroundColor: 'var(--color-bg-dark)', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--color-text-secondary)', fontSize: '0.6875rem', letterSpacing: '1px' }}>NAMA PRODUK</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--color-text-secondary)', fontSize: '0.6875rem', letterSpacing: '1px' }}>SKU</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--color-text-secondary)', fontSize: '0.6875rem', letterSpacing: '1px' }}>HARGA JUAL</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--color-text-secondary)', fontSize: '0.6875rem', letterSpacing: '1px', textAlign: 'center' }}>STOK</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--color-text-secondary)', fontSize: '0.6875rem', letterSpacing: '1px', textAlign: 'right' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>{item.nama}</td>
                  <td style={{ padding: '0.85rem 1rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>{item.sku}</td>
                  <td style={{ padding: '0.85rem 1rem', color: 'var(--color-chocolate)', fontWeight: 800 }}>Rp {item.harga_jual?.toLocaleString('id-ID')}</td>
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'center', fontWeight: 700 }}>{item.stok ?? 100}</td>
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button onClick={() => openProductModal(item)} style={{ fontWeight: 700, marginRight: '0.75rem', fontSize: '0.75rem', cursor: 'pointer', padding: '0.2rem 0.4rem', border: '1px solid var(--color-border)', borderRadius: '3px' }}>EDIT</button>
                    <button 
                      onClick={() => requestToggleArchive(item)} 
                      style={{ fontWeight: 700, color: item.is_active === false ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', fontSize: '0.75rem', cursor: 'pointer', padding: '0.2rem 0.4rem', border: '1px solid var(--color-border)', borderRadius: '3px' }}
                    >
                      {item.is_active === false ? 'BUKA ARSIP' : 'ARSIP'}
                    </button>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--color-text-secondary)', fontWeight: 700 }}>
                    Tidak ada produk ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {filteredProducts.length > ITEMS_PER_PAGE && (
            <div className="responsive-pagination">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))} 
                disabled={currentPage === 0}
                className="btn-secondary"
                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
              >
                &larr; SEBELUMNYA
              </button>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                HALAMAN {currentPage + 1} DARI {totalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))} 
                disabled={currentPage >= totalPages - 1}
                className="btn-secondary"
                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
              >
                SELANJUTNYA &rarr;
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal Product */}
      {modalVisible && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem', letterSpacing: '1px' }}>
              {editItem ? 'EDIT PRODUK' : 'TAMBAH PRODUK BARU'}
            </h2>
            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '1px' }}>NAMA PRODUK</label>
                <input required className="input-field" value={formData.nama || ''} onChange={e => setFormData({...formData, nama: e.target.value})} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '1px' }}>SKU</label>
                <input required className="input-field" value={formData.sku || ''} onChange={e => setFormData({...formData, sku: e.target.value})} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '1px' }}>HARGA JUAL (RP)</label>
                <input required type="number" className="input-field" value={formData.harga_jual || ''} onChange={e => setFormData({...formData, harga_jual: e.target.value})} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '1px' }}>JUMLAH (STOK)</label>
                <input required type="number" className="input-field" value={formData.stok ?? ''} onChange={e => setFormData({...formData, stok: e.target.value})} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '1px' }}>KATEGORI</label>
                <select required className="input-field" value={formData.kategori_id || ''} onChange={e => setFormData({...formData, kategori_id: e.target.value})}>
                  <option value="">Pilih Kategori...</option>
                  {kategori.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', alignItems: 'center' }}>
                {editItem && (
                  <button 
                    type="button" 
                    className="btn-danger"
                    style={{ flex: 1 }}
                    onClick={() => requestDeleteProduct(editItem)}
                    disabled={processing}
                  >
                    HAPUS
                  </button>
                )}
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setModalVisible(false)} disabled={processing}>BATAL</button>
                <button type="submit" className="btn-chocolate" style={{ flex: 1 }} disabled={processing}>{processing ? 'MEMPROSES...' : 'SIMPAN'}</button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Modal Management Kategori */}
      {categoryModalVisible && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '520px', width: '90%' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '1px', margin: 0 }}>KELOLA KATEGORI PRODUK</h2>
              <button 
                onClick={() => setCategoryModalVisible(false)} 
                style={{ fontSize: '1.25rem', fontWeight: 800, cursor: 'pointer', background: 'none', border: 'none' }}
              >
                &times;
              </button>
            </div>

            {/* Form Tambah Kategori */}
            <form onSubmit={handleSaveCategory} style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '1px' }}>TAMBAH KATEGORI BARU</label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Nama Kategori Baru..." 
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  required
                />
                <button type="submit" className="btn-primary" style={{ padding: '0.85rem 1.25rem', whiteSpace: 'nowrap' }} disabled={processing}>
                  + TAMBAH
                </button>
              </div>
            </form>

            {/* Daftar Kategori */}
            <h3 style={{ fontSize: '0.875rem', fontWeight: 800, marginBottom: '0.75rem', letterSpacing: '1px' }}>DAFTAR KATEGORI SAAT INI</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '220px', overflowY: 'auto' }}>
              {kategori.map(cat => (
                <div key={cat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', border: '1px solid var(--color-border)', borderRadius: '4px', backgroundColor: 'var(--color-bg-dark)' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{cat.nama}</span>
                  <button 
                    type="button" 
                    onClick={() => requestDeleteCategory(cat)}
                    style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-error)', cursor: 'pointer' }}
                  >
                    HAPUS
                  </button>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="btn-secondary" onClick={() => setCategoryModalVisible(false)} style={{ padding: '0.75rem 1.5rem' }}>
                SELESAI
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Theme Confirmation Alert Modal */}
      {confirmModal.visible && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="card" style={{ width: '100%', maxWidth: '440px', padding: '2rem', backgroundColor: 'var(--color-bg-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <span style={{ 
                padding: '0.25rem 0.5rem', 
                fontSize: '0.75rem', 
                fontWeight: 800, 
                letterSpacing: '1px',
                border: confirmModal.confirmVariant === 'danger' ? '1px solid var(--color-error)' : '1px solid var(--color-text-primary)',
                color: confirmModal.confirmVariant === 'danger' ? 'var(--color-error)' : 'var(--color-text-primary)',
                borderRadius: '4px' 
              }}>
                {confirmModal.confirmVariant === 'danger' ? 'PERHATIAN' : 'KONFIRMASI'}
              </span>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, letterSpacing: '0.5px' }}>{confirmModal.title}</h3>
            </div>
            
            <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: '2rem' }}>
              {confirmModal.message}
            </p>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                type="button" 
                className="btn-secondary" 
                style={{ flex: 1, padding: '0.85rem' }}
                onClick={() => setConfirmModal({ ...confirmModal, visible: false })}
                disabled={processing}
              >
                BATAL
              </button>
              <button 
                type="button" 
                className={confirmModal.confirmVariant === 'danger' ? 'btn-danger' : 'btn-primary'}
                style={{ flex: 1, padding: '0.85rem' }}
                onClick={async () => {
                  if (confirmModal.onConfirm) await confirmModal.onConfirm();
                  setConfirmModal({ ...confirmModal, visible: false });
                }}
                disabled={processing}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
