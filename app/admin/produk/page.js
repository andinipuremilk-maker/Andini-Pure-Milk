'use client';
import { useState, useEffect } from 'react';
import { useResponsivePagination } from '../../../lib/useResponsivePagination';
import {
  IconSearch,
  IconPlus,
  IconTag,
  IconArchive,
  IconEdit,
  IconTrash,
  IconX,
  IconAlertCircle,
  IconRefresh,
  IconImage,
  IconMilk
} from '../../../components/ui/icons';

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

  // Responsive Pagination (5 di Mobile, 8 di Tablet, 12 di Desktop)
  const ITEMS_PER_PAGE = useResponsivePagination(5, 8, 12);
  const [currentPage, setCurrentPage] = useState(0);

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
        ? { 
            ...item, 
            harga_jual: item.harga_jual ?? '',
            harga_modal: item.harga_modal ?? '',
            stok: item.stok ?? 100,
            image_url: item.image_url || ''
          } 
        : { 
            nama: '', 
            sku: '', 
            harga_jual: '', 
            harga_modal: '', 
            stok: 100, 
            kategori_id: kategori[0]?.id || '', 
            image_url: ''
          }
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
      
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan produk');
      
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
      title: 'Hapus Kategori',
      message: `Apakah Anda yakin ingin menghapus kategori "${cat.nama}"? Produk yang terkait akan tetap tersimpan namun kehilangan relasi kategorinya.`,
      confirmText: 'Hapus Kategori',
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
      title: isArchived ? 'Buka Arsip Produk' : 'Arsipkan Produk',
      message: `Apakah Anda yakin ingin ${actionText} produk "${item.nama}"? ${!isArchived ? 'Produk yang diarsipkan tidak akan muncul di katalog kasir.' : 'Produk akan kembali aktif dan dapat dijual di kasir.'}`,
      confirmText: isArchived ? 'Buka Arsip' : 'Arsipkan Produk',
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
      title: 'Hapus Permanen Produk',
      message: `Apakah Anda yakin ingin menghapus produk "${item.nama}" secara permanen? Data yang telah dihapus tidak dapat dikembalikan.`,
      confirmText: 'Hapus Permanen',
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

  // Map category id to name helper
  const categoryMap = kategori.reduce((acc, k) => {
    acc[k.id] = k.nama;
    return acc;
  }, {});

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>Katalog Produk</h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>Kelola master produk, harga, persediaan stok, dan kategori</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button 
            type="button"
            className="btn-secondary" 
            onClick={() => setCategoryModalVisible(true)}
            style={{ padding: '0.55rem 0.95rem', fontSize: '0.8125rem' }}
          >
            <IconTag size={15} />
            <span>Kelola Kategori ({kategori.length})</span>
          </button>
          <button 
            type="button"
            className="btn-primary" 
            onClick={() => openProductModal()}
            style={{ padding: '0.55rem 1rem', fontSize: '0.8125rem' }}
          >
            <IconPlus size={15} />
            <span>Tambah Produk</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ marginBottom: '1.25rem', padding: '1rem' }}>
        <div className="responsive-filter-bar">
          
          <div style={{ flex: 2, minWidth: '180px' }}>
            <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, marginBottom: '0.35rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Pencarian</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                className="input-field" 
                placeholder="Cari nama produk atau kode SKU..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2.1rem', fontSize: '0.8125rem' }}
              />
              <div style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', display: 'flex', pointerEvents: 'none' }}>
                <IconSearch size={14} />
              </div>
            </div>
          </div>

          <div style={{ flex: 1.2, minWidth: '160px' }}>
            <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, marginBottom: '0.35rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Kategori</label>
            <select 
              className="input-field"
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              style={{ fontSize: '0.8125rem' }}
            >
              <option value="ALL">Semua Kategori</option>
              {kategori.map(k => (
                <option key={k.id} value={k.id}>{k.nama}</option>
              ))}
            </select>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
            <button 
              type="button"
              className={showArchived ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setShowArchived(!showArchived)}
              style={{ padding: '0.55rem 0.95rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
            >
              <IconArchive size={13} />
              <span>{showArchived ? 'Tampilkan Aktif' : 'Lihat Arsip'}</span>
            </button>

            {(searchQuery || selectedCategory !== 'ALL' || showArchived) && (
              <button 
                type="button"
                className="btn-secondary" 
                onClick={() => { setSearchQuery(''); setSelectedCategory('ALL'); setShowArchived(false); }}
                style={{ padding: '0.55rem 0.85rem', fontSize: '0.75rem' }}
              >
                <IconRefresh size={13} />
                <span>Reset</span>
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Table Section */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Memuat katalog produk...</div>
      ) : (
        <div className="table-responsive">
          <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--surface-subtle)' }}>
                <th style={{ padding: '0.65rem 0.85rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.6875rem', letterSpacing: '0.04em' }}>NAMA PRODUK</th>
                <th style={{ padding: '0.65rem 0.85rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.6875rem', letterSpacing: '0.04em' }}>SKU</th>
                <th style={{ padding: '0.65rem 0.85rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.6875rem', letterSpacing: '0.04em', textAlign: 'right' }}>HARGA JUAL</th>
                <th style={{ padding: '0.65rem 0.85rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.6875rem', letterSpacing: '0.04em', textAlign: 'center' }}>STOK</th>
                <th style={{ padding: '0.65rem 0.85rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.6875rem', letterSpacing: '0.04em', textAlign: 'center' }}>STATUS</th>
                <th style={{ padding: '0.65rem 0.85rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.6875rem', letterSpacing: '0.04em', textAlign: 'right' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map(item => {
                const isArchived = item.is_active === false;
                const catName = categoryMap[item.kategori_id];

                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border-subtle)', opacity: isArchived ? 0.65 : 1, transition: 'background-color 0.15s ease' }}>
                    
                    {/* Nama & Kategori */}
                    <td style={{ padding: '0.75rem 0.85rem', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div style={{ 
                          width: '36px', 
                          height: '36px', 
                          borderRadius: 'var(--radius-sm)', 
                          backgroundColor: 'var(--surface-subtle)', 
                          border: '1px solid var(--border-subtle)', 
                          overflow: 'hidden', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {item.image_url ? (
                            <img 
                              src={item.image_url} 
                              alt={item.nama} 
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              loading="lazy"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          ) : (
                            <IconMilk size={16} style={{ color: 'var(--text-tertiary)' }} />
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span>{item.nama}</span>
                            {catName?.toLowerCase().includes('susu') && (
                              <span className="badge-chocolate" style={{ fontSize: '0.625rem', padding: '0.05rem 0.35rem', borderRadius: 'var(--radius-sm)' }}>
                                Botol Kecil & Besar
                              </span>
                            )}
                          </div>
                          {catName && (
                            <span className="badge-neutral" style={{ fontSize: '0.65rem', marginTop: '0.15rem', padding: '0.05rem 0.4rem' }}>
                              {catName}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* SKU */}
                    <td style={{ padding: '0.75rem 0.85rem', verticalAlign: 'middle' }}>
                      <span className="font-mono" style={{ 
                        fontWeight: 600, 
                        fontSize: '0.75rem', 
                        backgroundColor: 'var(--surface-subtle)', 
                        padding: '0.2rem 0.45rem', 
                        borderRadius: 'var(--radius-sm)', 
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-primary)'
                      }}>
                        {item.sku || '-'}
                      </span>
                    </td>

                    {/* Harga Jual */}
                    <td className="tabular" style={{ padding: '0.75rem 0.85rem', textAlign: 'right', verticalAlign: 'middle' }}>
                      <div style={{ fontWeight: 700, color: 'var(--terracotta)', fontSize: '0.875rem' }}>
                        Rp {Number(item.harga_jual || 0).toLocaleString('id-ID')}
                      </div>
                      {catName?.toLowerCase().includes('susu') && (
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', display: 'block', marginTop: '0.1rem' }}>
                          Status: Kecil & Besar
                        </span>
                      )}
                    </td>

                    {/* Stok */}
                    <td className="tabular" style={{ padding: '0.75rem 0.85rem', textAlign: 'center', verticalAlign: 'middle' }}>
                      <span style={{ 
                        fontWeight: 600,
                        color: (item.stok ?? 100) <= 10 ? 'var(--status-danger)' : 'var(--text-primary)'
                      }}>
                        {item.stok ?? 100}
                      </span>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '0.75rem 0.85rem', textAlign: 'center', verticalAlign: 'middle' }}>
                      {isArchived ? (
                        <span className="badge-neutral" style={{ fontSize: '0.65rem' }}>Arsip</span>
                      ) : (
                        <span className="badge-success" style={{ fontSize: '0.65rem' }}>Aktif</span>
                      )}
                    </td>

                    {/* Aksi */}
                    <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <button 
                          type="button"
                          onClick={() => openProductModal(item)} 
                          className="btn-secondary"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                          title="Edit Produk"
                        >
                          <IconEdit size={13} />
                          <span>Edit</span>
                        </button>
                        <button 
                          type="button"
                          onClick={() => requestToggleArchive(item)} 
                          className="btn-secondary"
                          style={{ 
                            padding: '0.35rem 0.65rem', 
                            fontSize: '0.75rem',
                            color: isArchived ? 'var(--text-primary)' : 'var(--text-secondary)'
                          }}
                          title={isArchived ? 'Aktifkan Produk' : 'Arsipkan Produk'}
                        >
                          <IconArchive size={13} />
                          <span>{isArchived ? 'Buka' : 'Arsip'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Tidak ada produk ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {filteredProducts.length > ITEMS_PER_PAGE && (
            <div className="responsive-pagination" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <button 
                type="button"
                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))} 
                disabled={currentPage === 0}
                className="btn-secondary"
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.8125rem' }}
              >
                &larr; Sebelumnya
              </button>
              <span className="tabular" style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', textAlign: 'center' }}>
                Menampilkan {filteredProducts.length === 0 ? 0 : currentPage * ITEMS_PER_PAGE + 1} - {Math.min((currentPage + 1) * ITEMS_PER_PAGE, filteredProducts.length)} dari {filteredProducts.length} data &bull; Halaman {currentPage + 1} dari {totalPages}
              </span>
              <button 
                type="button"
                onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))} 
                disabled={currentPage >= totalPages - 1}
                className="btn-secondary"
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.8125rem' }}
              >
                Selanjutnya &rarr;
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal Tambah / Edit Produk */}
      {modalVisible && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '480px', width: '92%', padding: '1.5rem' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem' }}>
              <div>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>
                  {editItem ? 'Edit Produk' : 'Tambah Produk Baru'}
                </h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>Lengkapi rincian informasi katalog produk</p>
              </div>
              <button 
                type="button"
                onClick={() => setModalVisible(false)}
                style={{ color: 'var(--text-secondary)', padding: '0.35rem', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center' }}
                aria-label="Tutup modal"
              >
                <IconX size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, marginBottom: '0.35rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Nama Produk</label>
                <input required className="input-field" placeholder="Contoh: Susu Murni Original 1L" value={formData.nama || ''} onChange={e => setFormData({...formData, nama: e.target.value})} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, marginBottom: '0.35rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Kode SKU</label>
                <input required className="input-field font-mono" placeholder="Contoh: APM-SUSU-ORI" value={formData.sku || ''} onChange={e => setFormData({...formData, sku: e.target.value})} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, marginBottom: '0.35rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Kategori</label>
                <select required className="input-field" value={formData.kategori_id || ''} onChange={e => setFormData({...formData, kategori_id: e.target.value})}>
                  <option value="">Pilih Kategori...</option>
                  {kategori.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
                </select>
              </div>

              {/* Info Kemasan Otomatis untuk Kategori Susu */}
              {categoryMap[formData.kategori_id]?.toLowerCase().includes('susu') && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.65rem 0.85rem', backgroundColor: 'var(--surface-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <IconMilk size={18} style={{ color: 'var(--terracotta)', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    <strong>Kategori Susu:</strong> Kasir otomatis menampilkan pilihan kemasan <strong>Botol Kecil (250ml)</strong> dan <strong>Botol Besar (1L)</strong> sebagai status tanpa perlu input harga terpisah.
                  </span>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, marginBottom: '0.35rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Harga Jual (Rp)</label>
                  <input required type="number" className="input-field tabular" placeholder="15000" value={formData.harga_jual || ''} onChange={e => setFormData({...formData, harga_jual: e.target.value})} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, marginBottom: '0.35rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Harga Modal (Rp)</label>
                  <input type="number" className="input-field tabular" placeholder="10000" value={formData.harga_modal || ''} onChange={e => setFormData({...formData, harga_modal: e.target.value})} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, marginBottom: '0.35rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Stok Persediaan</label>
                <input required type="number" className="input-field tabular" placeholder="100" value={formData.stok ?? ''} onChange={e => setFormData({...formData, stok: e.target.value})} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, marginBottom: '0.35rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Foto Produk (Khusus Admin)</label>
                {formData.image_url ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.55rem', backgroundColor: 'var(--surface-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <img 
                      src={formData.image_url} 
                      alt="Preview Foto" 
                      style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        Foto Terpasang
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setFormData({ ...formData, image_url: '' })}
                        style={{ fontSize: '0.6875rem', color: 'var(--status-danger)', fontWeight: 600, marginTop: '0.15rem', cursor: 'pointer' }}
                      >
                        Hapus / Ganti Foto
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="Tempel tautan URL gambar (https://...)..." 
                      value={formData.image_url || ''} 
                      onChange={e => setFormData({ ...formData, image_url: e.target.value })} 
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <label className="btn-secondary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', cursor: 'pointer' }}>
                        <IconImage size={13} />
                        <span>Pilih File Gambar</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          style={{ display: 'none' }} 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 2 * 1024 * 1024) {
                                alert('Ukuran foto maksimal 2MB.');
                                return;
                              }
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                setFormData({ ...formData, image_url: event.target.result });
                              };
                              reader.readAsDataURL(file);
                            }
                          }} 
                        />
                      </label>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>Maks. 2MB atau gunakan URL</span>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem', alignItems: 'center' }}>
                {editItem && (
                  <button 
                    type="button" 
                    className="btn-danger"
                    style={{ padding: '0.65rem 0.85rem' }}
                    onClick={() => requestDeleteProduct(editItem)}
                    disabled={processing}
                  >
                    <IconTrash size={14} />
                    <span>Hapus</span>
                  </button>
                )}
                <button type="button" className="btn-secondary" style={{ flex: 1, padding: '0.65rem' }} onClick={() => setModalVisible(false)} disabled={processing}>Batal</button>
                <button type="submit" className="btn-primary" style={{ flex: 1.3, padding: '0.65rem' }} disabled={processing}>{processing ? 'Menyimpan...' : 'Simpan Produk'}</button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Modal Management Kategori */}
      {categoryModalVisible && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '480px', width: '92%', padding: '1.5rem' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem' }}>
              <div>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>Kelola Kategori Produk</h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>Tambah kategori baru atau hapus yang tidak digunakan</p>
              </div>
              <button 
                type="button"
                onClick={() => setCategoryModalVisible(false)} 
                style={{ color: 'var(--text-secondary)', padding: '0.35rem', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center' }}
                aria-label="Tutup modal"
              >
                <IconX size={18} />
              </button>
            </div>

            {/* Form Tambah Kategori */}
            <form onSubmit={handleSaveCategory} style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, marginBottom: '0.35rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Tambah Kategori Baru</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Nama kategori baru..." 
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  required
                />
                <button type="submit" className="btn-primary" style={{ padding: '0.55rem 1rem', whiteSpace: 'nowrap' }} disabled={processing}>
                  <IconPlus size={14} />
                  <span>Tambah</span>
                </button>
              </div>
            </form>

            {/* Daftar Kategori */}
            <h3 style={{ fontSize: '0.6875rem', fontWeight: 600, marginBottom: '0.5rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Daftar Kategori ({kategori.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '220px', overflowY: 'auto' }}>
              {kategori.map(cat => (
                <div key={cat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.55rem 0.85rem', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--surface-subtle)' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-primary)' }}>{cat.nama}</span>
                  <button 
                    type="button" 
                    onClick={() => requestDeleteCategory(cat)}
                    className="btn-secondary"
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem', color: 'var(--status-danger)', borderColor: 'var(--border-subtle)' }}
                    title="Hapus Kategori"
                  >
                    <IconTrash size={12} />
                    <span>Hapus</span>
                  </button>
                </div>
              ))}
              {kategori.length === 0 && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', textAlign: 'center', padding: '1rem' }}>Belum ada kategori.</p>
              )}
            </div>

            <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="btn-secondary" onClick={() => setCategoryModalVisible(false)} style={{ padding: '0.55rem 1.25rem' }}>
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Theme Confirmation Alert Modal */}
      {confirmModal.visible && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content" style={{ maxWidth: '420px', width: '92%', textAlign: 'center', padding: '1.5rem' }}>
            <div style={{ 
              width: '44px', 
              height: '44px', 
              borderRadius: '50%', 
              backgroundColor: confirmModal.confirmVariant === 'danger' ? 'var(--status-danger-bg)' : 'var(--accent-subtle)', 
              border: `1px solid ${confirmModal.confirmVariant === 'danger' ? 'var(--status-danger-border)' : 'var(--accent-border)'}`, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 1rem', 
              color: confirmModal.confirmVariant === 'danger' ? 'var(--status-danger)' : 'var(--accent-primary)' 
            }}>
              <IconAlertCircle size={24} />
            </div>

            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{confirmModal.title}</h3>
            
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              {confirmModal.message}
            </p>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                type="button" 
                className="btn-secondary" 
                style={{ flex: 1, padding: '0.65rem' }}
                onClick={() => setConfirmModal({ ...confirmModal, visible: false })}
                disabled={processing}
              >
                Batal
              </button>
              <button 
                type="button" 
                className={confirmModal.confirmVariant === 'danger' ? 'btn-danger' : 'btn-primary'}
                style={{ flex: 1, padding: '0.65rem' }}
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
