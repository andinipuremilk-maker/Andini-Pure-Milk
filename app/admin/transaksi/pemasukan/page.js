'use client';
import { useState, useEffect } from 'react';
import { useResponsivePagination } from '../../../../lib/useResponsivePagination';

function MetricCard({ title, value, subtitle }) {
  return (
    <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderLeft: '4px solid var(--color-chocolate)', backgroundColor: '#ffffff' }}>
      <h3 style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--color-text-secondary)', marginBottom: '0.35rem', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{title}</h3>
      <p style={{ fontSize: '1.25rem', fontWeight: 900, whiteSpace: 'nowrap', margin: 0, color: 'var(--color-chocolate)' }}>{value}</p>
      {subtitle && <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem', whiteSpace: 'nowrap' }}>{subtitle}</p>}
    </div>
  );
}

export default function PemasukanPage() {
  const [transaksi, setTransaksi] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Responsive Pagination (5 di Mobile, 8 di Tablet, 12 di Desktop)
  const ITEMS_PER_PAGE = useResponsivePagination(5, 8, 12);
  const [currentPage, setCurrentPage] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedSeller, setSelectedSeller] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedMethod, setSelectedMethod] = useState('ALL');
  const [dateRangeType, setDateRangeType] = useState('today'); // 'today' | 'week' | 'month' | 'custom' | 'ALL'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [kategoriList, setKategoriList] = useState([]);

  // Selected item for Detail Modal
  const [selectedTx, setSelectedTx] = useState(null);

  // Sellers State & Management
  const [sellers, setSellers] = useState([]);
  const [loadingSellers, setLoadingSellers] = useState(false);
  const [showSellerModal, setShowSellerModal] = useState(false);
  const [newSellerName, setNewSellerName] = useState('');
  const [sellerActionLoading, setSellerActionLoading] = useState(false);
  const [sellerError, setSellerError] = useState('');
  const [deleteConfirmSeller, setDeleteConfirmSeller] = useState(null);

  const loadSellers = async () => {
    try {
      setLoadingSellers(true);
      const res = await fetch('/api/sellers');
      const data = await res.json();
      if (data.sellers) setSellers(data.sellers);
    } catch (err) {
      console.error('Gagal memuat sellers:', err);
    } finally {
      setLoadingSellers(false);
    }
  };

  const handleAddSeller = async (e) => {
    e.preventDefault();
    if (!newSellerName.trim()) return;
    try {
      setSellerActionLoading(true);
      setSellerError('');
      const res = await fetch('/api/sellers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama: newSellerName.trim() })
      });
      const result = await res.json();
      if (res.ok) {
        setNewSellerName('');
        loadSellers();
      } else {
        setSellerError(result.error || 'Gagal menambahkan mitra.');
      }
    } catch (err) {
      setSellerError('Terjadi kesalahan jaringan.');
    } finally {
      setSellerActionLoading(false);
    }
  };

  const handleDeleteSeller = async (sellerItem) => {
    try {
      setSellerActionLoading(true);
      setSellerError('');
      const res = await fetch(`/api/sellers?id=${sellerItem.id}&nama=${encodeURIComponent(sellerItem.nama)}`, { method: 'DELETE' });
      const result = await res.json();
      if (res.ok) {
        setDeleteConfirmSeller(null);
        loadSellers();
      } else {
        setSellerError(result.error || 'Gagal menghapus mitra.');
      }
    } catch (err) {
      setSellerError('Terjadi kesalahan jaringan.');
    } finally {
      setSellerActionLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetch('/api/kategori')
      .then(r => r.json())
      .then(data => {
        if (isMounted && Array.isArray(data)) setKategoriList(data);
      });
    loadSellers();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    let isMounted = true;
    let start, end;

    if (dateRangeType === 'today') {
      const now = new Date();
      const tStart = new Date(now);
      tStart.setHours(0, 0, 0, 0);
      const tEnd = new Date(now);
      tEnd.setHours(23, 59, 59, 999);
      start = tStart.toISOString();
      end = tEnd.toISOString();
    } else if (dateRangeType === 'week') {
      const now = new Date();
      const wStart = new Date(now);
      wStart.setDate(now.getDate() - 7);
      wStart.setHours(0, 0, 0, 0);
      const wEnd = new Date(now);
      wEnd.setHours(23, 59, 59, 999);
      start = wStart.toISOString();
      end = wEnd.toISOString();
    } else if (dateRangeType === 'month') {
      const now = new Date();
      const mStart = new Date(now.getFullYear(), now.getMonth(), 1);
      mStart.setHours(0, 0, 0, 0);
      const mEnd = new Date(now);
      mEnd.setHours(23, 59, 59, 999);
      start = mStart.toISOString();
      end = mEnd.toISOString();
    } else if (dateRangeType === 'year') {
      const now = new Date();
      const yStart = new Date(now.getFullYear(), 0, 1);
      yStart.setHours(0, 0, 0, 0);
      const yEnd = new Date(now);
      yEnd.setHours(23, 59, 59, 999);
      start = yStart.toISOString();
      end = yEnd.toISOString();
    } else if (dateRangeType === 'custom') {
      if (startDate && endDate) {
        const cStart = new Date(startDate);
        cStart.setHours(0, 0, 0, 0);
        const cEnd = new Date(endDate);
        cEnd.setHours(23, 59, 59, 999);
        start = cStart.toISOString();
        end = cEnd.toISOString();
      }
    }

    let url = '/api/transaksi?';
    const params = new URLSearchParams();
    if (selectedMethod !== 'ALL') params.append('metode', selectedMethod);
    if (selectedSeller !== 'ALL') params.append('seller', selectedSeller);
    if (start && end) {
      params.append('start', start);
      params.append('end', end);
    }

    fetch(url + params.toString())
      .then(r => r.json())
      .then(data => {
        if (isMounted) {
          setTransaksi(Array.isArray(data) ? data : []);
          setLoading(false);
          setCurrentPage(0);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [selectedMethod, selectedSeller, dateRangeType, startDate, endDate]);

  const filteredTransaksi = transaksi.filter(t => {
    let matchSearch = true;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchSeller = t.seller && t.seller.toLowerCase().includes(q);
      const matchNo = t.no_transaksi && t.no_transaksi.toLowerCase().includes(q);
      const matchProd = t.items && t.items.some(it => it.nama_produk && it.nama_produk.toLowerCase().includes(q));
      matchSearch = matchSeller || matchNo || matchProd;
    }

    let matchCategory = true;
    if (selectedCategory !== 'ALL') {
      matchCategory = t.items && t.items.some(it => it.kategori_id === selectedCategory);
    }

    return matchSearch && matchCategory;
  });

  const totalSetor = filteredTransaksi.reduce((sum, t) => sum + (t.total || 0), 0);
  const totalLaba = filteredTransaksi.reduce((sum, t) => sum + (t.laba_kotor || 0), 0);
  const totalCount = filteredTransaksi.length;

  const paginatedData = filteredTransaksi.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(filteredTransaksi.length / ITEMS_PER_PAGE);

  const sellersList = ['ALL', ...sellers.map(s => s.nama)];

  return (
    <div className="admin-page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '0.5px', margin: 0 }}>TRANSAKSI PEMASUKAN</h1>
        <button 
          type="button"
          onClick={() => { setShowSellerModal(true); setSellerError(''); setNewSellerName(''); }}
          className="btn-secondary"
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            padding: '0.55rem 1rem', 
            fontSize: '0.8125rem', 
            fontWeight: 700,
            borderColor: 'var(--color-chocolate)',
            color: 'var(--color-chocolate)',
            backgroundColor: '#ffffff'
          }}
        >
          <span>🤝</span>
          <span>KELOLA MITRA ({sellers.length})</span>
        </button>
      </div>

      {/* Metrics Summary */}
      <div className="responsive-stats-grid" style={{ marginBottom: '1.5rem' }}>
        <MetricCard title="TOTAL SETOR (PENJUALAN)" value={`Rp ${totalSetor.toLocaleString('id-ID')}`} />
        <MetricCard 
          title="TOTAL LABA (PROFIT)" 
          value={`Rp ${totalLaba.toLocaleString('id-ID')}`} 
          subtitle={`Margin: ${totalSetor > 0 ? Math.round((totalLaba / totalSetor) * 100) : 0}%`} 
        />
        <MetricCard title="TOTAL TRANSAKSI" value={`${totalCount} Trx`} />
      </div>

      {/* Search & Filter Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div className="responsive-filter-bar">
          
          <div style={{ flex: 2, minWidth: '180px' }}>
            <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, marginBottom: '0.35rem', letterSpacing: '0.5px' }}>PENCARIAN (MITRA / PRODUK / NO. TRX)</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Ketik nama Mitra, Produk, atau No. TRX..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: '0.65rem 0.85rem', fontSize: '0.875rem' }}
            />
          </div>

          <div style={{ flex: 1, minWidth: '160px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '1px' }}>FILTER SELLER / MITRA</label>
            <select 
              className="input-field"
              value={selectedSeller}
              onChange={e => setSelectedSeller(e.target.value)}
            >
              {sellersList.map(s => <option key={s} value={s}>{s === 'ALL' ? '-- SEMUA SELLER --' : s}</option>)}
            </select>
          </div>

          <div style={{ flex: 1, minWidth: '160px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '1px' }}>FILTER PRODUK</label>
            <select 
              className="input-field"
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
            >
              <option value="ALL">-- SEMUA PRODUK --</option>
              {kategoriList.map(k => (
                <option key={k.id} value={k.id}>{k.nama}</option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1, minWidth: '160px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '1px' }}>METODE PEMBAYARAN</label>
            <select 
              className="input-field"
              value={selectedMethod}
              onChange={e => setSelectedMethod(e.target.value)}
            >
              <option value="ALL">-- SEMUA METODE --</option>
              <option value="tunai">TUNAI</option>
              <option value="qris">QRIS</option>
              <option value="transfer">TRANSFER</option>
            </select>
          </div>

          <div style={{ flex: 1, minWidth: '160px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '1px' }}>PERIODE TANGGAL</label>
            <select 
              className="input-field"
              value={dateRangeType}
              onChange={e => setDateRangeType(e.target.value)}
            >
              <option value="ALL">-- SEMUA TANGGAL --</option>
              <option value="today">HARI INI</option>
              <option value="week">MINGGU INI</option>
              <option value="month">BULAN INI</option>
              <option value="year">TAHUN INI</option>
              <option value="custom">KUSTOM TANGGAL</option>
            </select>
          </div>

          {dateRangeType === 'custom' && (
            <>
              <div style={{ flex: 1, minWidth: '150px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '1px' }}>DARI TANGGAL</label>
                <input 
                  type="date" 
                  className="input-field" 
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                />
              </div>

              <div style={{ flex: 1, minWidth: '150px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '1px' }}>SAMPAI TANGGAL</label>
                <input 
                  type="date" 
                  className="input-field" 
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                />
              </div>
            </>
          )}

          {(search || selectedSeller !== 'ALL' || selectedCategory !== 'ALL' || selectedMethod !== 'ALL' || dateRangeType !== 'today') && (
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={() => {
                setSearch('');
                setSelectedSeller('ALL');
                setSelectedCategory('ALL');
                setSelectedMethod('ALL');
                setDateRangeType('today');
                setStartDate('');
                setEndDate('');
              }}
              style={{ padding: '0.85rem 1.25rem' }}
            >
              RESET FILTER
            </button>
          )}
        </div>
      </div>

      {/* Transactions Data Table */}
      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', fontWeight: 700 }}>MEMUAT TRANSAKSI PEMASUKAN...</div>
      ) : (
        <div className="table-responsive">
          <table style={{ width: '100%', minWidth: '780px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)', backgroundColor: 'var(--color-bg-dark)' }}>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 800, fontSize: '0.6875rem', letterSpacing: '1px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>NO. TRANSAKSI</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 800, fontSize: '0.6875rem', letterSpacing: '1px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>WAKTU & TANGGAL</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 800, fontSize: '0.6875rem', letterSpacing: '1px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>SELLER / MITRA</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 800, fontSize: '0.6875rem', letterSpacing: '1px', color: 'var(--color-text-secondary)' }}>RINGKASAN PRODUK</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 800, fontSize: '0.6875rem', letterSpacing: '1px', color: 'var(--color-text-secondary)', textAlign: 'right', whiteSpace: 'nowrap' }}>TOTAL SETOR</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 800, fontSize: '0.6875rem', letterSpacing: '1px', color: 'var(--color-text-secondary)', textAlign: 'center', whiteSpace: 'nowrap' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((item) => {
                const dt = new Date(item.tanggal);
                const formattedDate = `${dt.toLocaleDateString('id-ID')} ${dt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
                
                let produkSummary = '-';
                if (item.items && item.items.length > 0) {
                  const firstItem = item.items[0];
                  const countOther = item.items.length - 1;
                  produkSummary = `${firstItem.nama_produk} (${firstItem.qty}x)${countOther > 0 ? ` +${countOther} lainnya` : ''}`;
                }

                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '0.85rem 1rem', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <span style={{ 
                        fontFamily: 'monospace', 
                        fontWeight: 700, 
                        fontSize: '0.75rem', 
                        backgroundColor: 'var(--color-bg-dark)', 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '4px', 
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-primary)'
                      }}>
                        {item.no_transaksi || item.id}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.8125rem', color: 'var(--color-text-secondary)', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>{formattedDate}</td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700, fontSize: '0.8125rem', verticalAlign: 'middle' }}>
                      <span style={{ backgroundColor: 'var(--color-bg-dark)', padding: '0.35rem 0.65rem', borderRadius: '4px', border: '1px solid var(--color-border)', display: 'inline-block', whiteSpace: 'nowrap' }}>
                        {item.seller || 'Umum / Retail'}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.8125rem', fontWeight: 600, verticalAlign: 'middle' }}>
                      {produkSummary}
                      {item.keterangan && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-chocolate)', fontStyle: 'italic', marginTop: '0.25rem' }}>
                          📝 {item.keterangan}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.9375rem' }}>Rp {item.total?.toLocaleString('id-ID')}</div>
                      <span style={{ fontSize: '0.6875rem', fontWeight: 800, border: '1px solid var(--color-border)', padding: '0.1rem 0.4rem', borderRadius: '3px', backgroundColor: 'var(--color-bg-dark)', textTransform: 'uppercase', display: 'inline-block', marginTop: '0.2rem' }}>
                        {item.metode_bayar || 'TUNAI'}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'center', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <button 
                        type="button"
                        onClick={() => setSelectedTx(item)}
                        className="btn-secondary"
                        style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem', fontWeight: 700 }}
                      >
                        DETAIL
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredTransaksi.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                    Tidak ada transaksi pemasukan ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {filteredTransaksi.length > ITEMS_PER_PAGE && (
            <div className="responsive-pagination">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))} 
                disabled={currentPage === 0}
                className="btn-secondary" 
                style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}
              >
                &larr; SEBELUMNYA
              </button>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-secondary)', textAlign: 'center' }}>
                Menampilkan {filteredTransaksi.length === 0 ? 0 : currentPage * ITEMS_PER_PAGE + 1} - {Math.min((currentPage + 1) * ITEMS_PER_PAGE, filteredTransaksi.length)} dari {filteredTransaksi.length} data &bull; Halaman {currentPage + 1} dari {totalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))} 
                disabled={currentPage >= totalPages - 1}
                className="btn-secondary" 
                style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}
              >
                SELANJUTNYA &rarr;
              </button>
            </div>
          )}
        </div>
      )}

      {/* Transaction Detail Modal */}
      {selectedTx && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px', width: '92%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '1px', margin: 0 }}>DETAIL TRANSAKSI PEMASUKAN</h2>
              <button 
                onClick={() => setSelectedTx(null)}
                style={{ fontSize: '1.25rem', fontWeight: 800, cursor: 'pointer', background: 'none', border: 'none' }}
              >
                &times;
              </button>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.875rem', margin: '0.25rem 0' }}>
                <strong>No. Transaksi:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 700, backgroundColor: 'var(--color-bg-dark)', padding: '0.15rem 0.4rem', borderRadius: '3px', border: '1px solid var(--color-border)' }}>{selectedTx.no_transaksi || selectedTx.id}</span>
              </p>
              <p style={{ fontSize: '0.875rem', margin: '0.25rem 0' }}><strong>Waktu:</strong> {new Date(selectedTx.tanggal).toLocaleString('id-ID')}</p>
              <p style={{ fontSize: '0.875rem', margin: '0.25rem 0' }}><strong>Seller / Mitra:</strong> {selectedTx.seller || 'Umum / Retail'}</p>
              <p style={{ fontSize: '0.875rem', margin: '0.25rem 0', textTransform: 'uppercase' }}><strong>Metode Bayar:</strong> {selectedTx.metode_bayar}</p>
              {selectedTx.keterangan && (
                <p style={{ fontSize: '0.875rem', margin: '0.4rem 0 0.25rem 0', padding: '0.5rem 0.75rem', backgroundColor: 'var(--color-bg-dark)', borderRadius: '4px', borderLeft: '3px solid var(--color-chocolate)' }}>
                  <strong style={{ color: 'var(--color-chocolate)' }}>Keterangan:</strong> {selectedTx.keterangan}
                </p>
              )}
              
              <div className="modal-stat-breakdown" style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--color-bg-dark)', borderRadius: '6px' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', letterSpacing: '0.5px' }}>TOTAL SETOR</span>
                  <strong style={{ fontSize: '0.9375rem' }}>Rp {selectedTx.total?.toLocaleString('id-ID')}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', letterSpacing: '0.5px' }}>MODAL (HPP)</span>
                  <strong style={{ fontSize: '0.9375rem', color: 'var(--color-text-secondary)' }}>
                    Rp {(selectedTx.total_modal || 0).toLocaleString('id-ID')}
                  </strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', letterSpacing: '0.5px' }}>TOTAL LABA</span>
                  <strong style={{ fontSize: '0.9375rem', color: 'var(--color-text-primary)' }}>
                    Rp {(selectedTx.total_laba || (selectedTx.total - (selectedTx.total_modal || 0))).toLocaleString('id-ID')}
                  </strong>
                </div>
              </div>
            </div>

            <h3 style={{ fontSize: '0.875rem', fontWeight: 800, marginBottom: '0.75rem', letterSpacing: '1px' }}>RINCIAN PRODUK</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: '0.5rem 0', fontSize: '0.75rem', fontWeight: 800 }}>PRODUK</th>
                  <th style={{ padding: '0.5rem 0', fontSize: '0.75rem', fontWeight: 800, textAlign: 'center' }}>QTY</th>
                  <th style={{ padding: '0.5rem 0', fontSize: '0.75rem', fontWeight: 800, textAlign: 'right' }}>HARGA</th>
                  <th style={{ padding: '0.5rem 0', fontSize: '0.75rem', fontWeight: 800, textAlign: 'right' }}>SUBTOTAL</th>
                </tr>
              </thead>
              <tbody>
                {selectedTx.items && selectedTx.items.map((it, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '0.5rem 0', fontSize: '0.8125rem' }}>{it.nama_produk}</td>
                    <td style={{ padding: '0.5rem 0', fontSize: '0.8125rem', textAlign: 'center' }}>{it.qty}</td>
                    <td style={{ padding: '0.5rem 0', fontSize: '0.8125rem', textAlign: 'right' }}>Rp {it.harga_satuan?.toLocaleString('id-ID')}</td>
                    <td style={{ padding: '0.5rem 0', fontSize: '0.8125rem', textAlign: 'right', fontWeight: 700 }}>Rp {it.subtotal?.toLocaleString('id-ID')}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                type="button"
                className="btn-secondary" 
                onClick={() => setSelectedTx(null)}
                style={{ padding: '0.75rem 1.5rem' }}
              >
                TUTUP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Kelola Mitra / Seller */}
      {showSellerModal && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '620px', width: '92%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>🤝 KELOLA MITRA KONSINYASI / SELLER</h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: '0.25rem 0 0 0' }}>Kelola daftar mitra, penitip, atau cabang reseller</p>
              </div>
              <button 
                type="button"
                onClick={() => setShowSellerModal(false)}
                style={{ fontSize: '1.25rem', fontWeight: 800, cursor: 'pointer', background: 'none', border: 'none' }}
              >
                &times;
              </button>
            </div>

            {/* Form Tambah Mitra Baru */}
            <form onSubmit={handleAddSeller} style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'var(--color-bg-dark)', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--color-text-primary)' }}>
                TAMBAH MITRA / SELLER BARU
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Ketik nama mitra baru (misal: BU ENI / SD BANYUWANGI)..."
                  value={newSellerName}
                  onChange={e => setNewSellerName(e.target.value)}
                  disabled={sellerActionLoading}
                  style={{ flex: 1, padding: '0.55rem 0.75rem', fontSize: '0.8125rem' }}
                />
                <button 
                  type="submit" 
                  className="btn-chocolate"
                  disabled={sellerActionLoading || !newSellerName.trim()}
                  style={{ padding: '0.55rem 1.15rem', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}
                >
                  {sellerActionLoading ? 'MENYIMPAN...' : '+ TAMBAH'}
                </button>
              </div>
              {sellerError && (
                <div style={{ color: 'var(--color-error)', fontSize: '0.75rem', marginTop: '0.5rem', fontWeight: 700 }}>
                  ⚠️ {sellerError}
                </div>
              )}
            </form>

            {/* List / Table Mitra */}
            <h3 style={{ fontSize: '0.8125rem', fontWeight: 800, marginBottom: '0.65rem', letterSpacing: '0.5px' }}>
              DAFTAR MITRA TERDAFTAR ({sellers.length})
            </h3>
            <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: '6px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-bg-dark)', borderBottom: '1px solid var(--color-border)', fontSize: '0.6875rem', color: 'var(--color-text-secondary)' }}>
                    <th style={{ padding: '0.6rem 0.85rem', width: '40px' }}>NO</th>
                    <th style={{ padding: '0.6rem 0.85rem' }}>NAMA MITRA / SELLER</th>
                    <th style={{ padding: '0.6rem 0.85rem', textAlign: 'right', width: '110px' }}>AKSI</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingSellers ? (
                    <tr>
                      <td colSpan="3" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Memuat data mitra...</td>
                    </tr>
                  ) : sellers.length === 0 ? (
                    <tr>
                      <td colSpan="3" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Belum ada mitra terdaftar.</td>
                    </tr>
                  ) : (
                    sellers.map((s, idx) => {
                      const isDefault = s.nama.toLowerCase() === 'umum / retail';
                      return (
                        <tr key={s.id || s.nama} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: '0.65rem 0.85rem', color: 'var(--color-text-secondary)', fontWeight: 700 }}>{idx + 1}</td>
                          <td style={{ padding: '0.65rem 0.85rem' }}>
                            <span style={{ fontWeight: 800, color: 'var(--color-text-primary)' }}>{s.nama}</span>
                            {isDefault && (
                              <span style={{ marginLeft: '0.5rem', fontSize: '0.65rem', backgroundColor: '#e0e7ff', color: '#3730a3', padding: '0.15rem 0.4rem', borderRadius: '3px', fontWeight: 800 }}>
                                DEFAULT
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '0.65rem 0.85rem', textAlign: 'right' }}>
                            {!isDefault ? (
                              <button 
                                type="button"
                                onClick={() => setDeleteConfirmSeller(s)}
                                className="btn-secondary"
                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
                              >
                                HAPUS
                              </button>
                            ) : (
                              <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>Terkunci</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
              <button 
                type="button" 
                onClick={() => setShowSellerModal(false)}
                className="btn-secondary"
                style={{ padding: '0.55rem 1.25rem', fontSize: '0.8125rem' }}
              >
                TUTUP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal Delete Seller */}
      {deleteConfirmSeller && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content" style={{ maxWidth: '420px', width: '90%', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem' }}>Hapus Mitra Konsinyasi?</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              Apakah Anda yakin ingin menghapus mitra <strong>"{deleteConfirmSeller.nama}"</strong>? Transaksi lama yang terkait tidak akan terhapus.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button 
                type="button"
                onClick={() => setDeleteConfirmSeller(null)}
                className="btn-secondary"
                style={{ flex: 1, padding: '0.6rem' }}
                disabled={sellerActionLoading}
              >
                BATAL
              </button>
              <button 
                type="button"
                onClick={() => handleDeleteSeller(deleteConfirmSeller)}
                className="btn-primary"
                style={{ flex: 1, padding: '0.6rem', backgroundColor: 'var(--color-error)', borderColor: 'var(--color-error)' }}
                disabled={sellerActionLoading}
              >
                {sellerActionLoading ? 'MENGHAPUS...' : 'YA, HAPUS'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
