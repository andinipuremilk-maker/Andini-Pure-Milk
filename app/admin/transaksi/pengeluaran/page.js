'use client';
import { useState, useEffect } from 'react';
import { useResponsivePagination } from '../../../../lib/useResponsivePagination';
import {
  IconSearch,
  IconCalendar,
  IconPlus,
  IconTrash,
  IconReceipt,
  IconUser,
  IconBanknote,
  IconQrCode,
  IconCreditCard,
  IconX,
  IconAlertCircle,
  IconRefresh
} from '../../../../components/ui/icons';

function MetricCard({ title, value, subtitle, highlightColor }) {
  return (
    <div className="panel" style={{ padding: '1rem 1.15rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{title}</span>
      <p className="tabular" style={{ fontSize: '1.25rem', fontWeight: 800, whiteSpace: 'nowrap', margin: 0, color: highlightColor || 'var(--text-primary)' }}>{value}</p>
      {subtitle && <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.25rem', margin: 0, whiteSpace: 'nowrap' }}>{subtitle}</p>}
    </div>
  );
}

export default function PengeluaranPage() {
  const [pengeluaran, setPengeluaran] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Responsive Pagination (5 di Mobile, 8 di Tablet, 12 di Desktop)
  const ITEMS_PER_PAGE = useResponsivePagination(5, 8, 12);
  const [currentPage, setCurrentPage] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedMethod, setSelectedMethod] = useState('ALL');
  const [dateRangeType, setDateRangeType] = useState('today'); // 'today' | 'week' | 'month' | 'year' | 'custom' | 'ALL'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Debounce search input (350ms) to avoid lagging API requests
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Expense Modal State
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [savingExpense, setSavingExpense] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    kategori: 'Operasional',
    deskripsi: '',
    nominal: '',
    metode_bayar: 'tunai',
    pj: 'Admin'
  });

  const [deleteConfirmExpense, setDeleteConfirmExpense] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const expCategories = [
    'Operasional',
    'Bahan Baku & Perlengkapan',
    'Transport & Logistik',
    'Gaji & Bonus',
    'Lain-lain'
  ];

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

    let url = '/api/pengeluaran?';
    if (selectedCategory && selectedCategory !== 'ALL') url += `kategori=${encodeURIComponent(selectedCategory)}&`;
    if (selectedMethod && selectedMethod !== 'ALL') url += `metode_bayar=${encodeURIComponent(selectedMethod)}&`;
    if (debouncedSearch) url += `search=${encodeURIComponent(debouncedSearch)}&`;
    if (start && end) url += `start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&`;

    fetch(url)
      .then(r => r.json())
      .then(data => {
        if (isMounted) {
          setPengeluaran(Array.isArray(data) ? data : []);
          setLoading(false);
          setCurrentPage(0);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [selectedCategory, selectedMethod, debouncedSearch, dateRangeType, startDate, endDate, refreshKey]);

  const handleSaveExpense = async (e) => {
    e.preventDefault();
    if (!expenseForm.nominal || Number(expenseForm.nominal) <= 0) {
      alert('Masukkan nominal pengeluaran yang valid.');
      return;
    }

    setSavingExpense(true);
    try {
      const res = await fetch('/api/pengeluaran', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseForm)
      });
      if (res.ok) {
        setShowExpenseModal(false);
        setExpenseForm({
          kategori: 'Operasional',
          deskripsi: '',
          nominal: '',
          metode_bayar: 'tunai',
          pj: 'Admin'
        });
        setRefreshKey(prev => prev + 1);
      } else {
        alert('Gagal menyimpan data pengeluaran.');
      }
    } catch (err) {
      alert('Terjadi kesalahan jaringan.');
    } finally {
      setSavingExpense(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    try {
      const res = await fetch(`/api/pengeluaran?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDeleteConfirmExpense(null);
        setRefreshKey(prev => prev + 1);
      } else {
        alert('Gagal menghapus pengeluaran.');
      }
    } catch (err) {
      alert('Terjadi kesalahan jaringan.');
    }
  };

  // Calculations for metric summary
  const totalPengeluaran = pengeluaran.reduce((acc, e) => acc + (e.nominal || 0), 0);
  const totalCatatan = pengeluaran.length;
  const avgPengeluaran = totalCatatan > 0 ? Math.round(totalPengeluaran / totalCatatan) : 0;

  const paginatedData = pengeluaran.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(pengeluaran.length / ITEMS_PER_PAGE);

  return (
    <div className="admin-page-container">
      
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>Transaksi Pengeluaran</h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>Pencatatan biaya harian, bahan baku, logistik, dan beban toko</p>
        </div>
        <button 
          type="button"
          className="btn-primary" 
          onClick={() => setShowExpenseModal(true)}
          style={{ padding: '0.55rem 1rem', fontSize: '0.8125rem' }}
        >
          <IconPlus size={15} />
          <span>Catat Pengeluaran</span>
        </button>
      </div>

      {/* Metrics Summary */}
      <div className="responsive-stats-grid" style={{ marginBottom: '1.25rem' }}>
        <MetricCard 
          title="Total Pengeluaran" 
          value={`Rp ${totalPengeluaran.toLocaleString('id-ID')}`} 
          highlightColor="var(--status-danger)"
          subtitle="Akumulasi beban biaya pada periode terpilih"
        />
        <MetricCard 
          title="Rata-rata Pengeluaran" 
          value={`Rp ${avgPengeluaran.toLocaleString('id-ID')}`} 
          subtitle="Rata-rata per catatan transaksi"
        />
        <MetricCard 
          title="Volume Pengeluaran" 
          value={`${totalCatatan} Catatan`} 
          subtitle={totalCatatan > 0 ? `${expCategories.length} kategori biaya aktif` : 'Belum ada catatan biaya'}
        />
      </div>

      {/* Search & Filter Bar */}
      <div className="card" style={{ marginBottom: '1.25rem', padding: '1rem' }}>
        <div className="responsive-filter-bar">
          
          <div style={{ flex: 2, minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, marginBottom: '0.35rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Pencarian</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                className="input-field" 
                placeholder="Cari No. TRX, deskripsi, atau PJ..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: '2.1rem', fontSize: '0.8125rem' }}
              />
              <div style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', display: 'flex', pointerEvents: 'none' }}>
                <IconSearch size={14} />
              </div>
            </div>
          </div>

          <div style={{ flex: 1.2, minWidth: '170px' }}>
            <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, marginBottom: '0.35rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Kategori</label>
            <select 
              className="input-field"
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              style={{ fontSize: '0.8125rem' }}
            >
              <option value="ALL">Semua Kategori</option>
              {expCategories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1, minWidth: '140px' }}>
            <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, marginBottom: '0.35rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Metode Bayar</label>
            <select 
              className="input-field"
              value={selectedMethod}
              onChange={e => setSelectedMethod(e.target.value)}
              style={{ fontSize: '0.8125rem' }}
            >
              <option value="ALL">Semua Metode</option>
              <option value="tunai">Tunai</option>
              <option value="qris">QRIS</option>
              <option value="transfer">Transfer</option>
            </select>
          </div>

          <div style={{ flex: 1, minWidth: '130px' }}>
            <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, marginBottom: '0.35rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Periode</label>
            <select 
              className="input-field"
              value={dateRangeType}
              onChange={e => setDateRangeType(e.target.value)}
              style={{ fontSize: '0.8125rem' }}
            >
              <option value="ALL">Semua Waktu</option>
              <option value="today">Hari Ini</option>
              <option value="week">Minggu Ini</option>
              <option value="month">Bulan Ini</option>
              <option value="year">Tahun Ini</option>
              <option value="custom">Kustom Tanggal</option>
            </select>
          </div>

          {dateRangeType === 'custom' && (
            <>
              <div style={{ flex: 1, minWidth: '140px' }}>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, marginBottom: '0.35rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Dari Tanggal</label>
                <input 
                  type="date" 
                  className="input-field" 
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  style={{ fontSize: '0.8125rem' }}
                />
              </div>

              <div style={{ flex: 1, minWidth: '140px' }}>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, marginBottom: '0.35rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Sampai Tanggal</label>
                <input 
                  type="date" 
                  className="input-field" 
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  style={{ fontSize: '0.8125rem' }}
                />
              </div>
            </>
          )}

          {(search || selectedCategory !== 'ALL' || selectedMethod !== 'ALL' || dateRangeType !== 'today') && (
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => {
                  setSearch('');
                  setSelectedCategory('ALL');
                  setSelectedMethod('ALL');
                  setDateRangeType('today');
                  setStartDate('');
                  setEndDate('');
                }}
                style={{ padding: '0.55rem 0.95rem', fontSize: '0.75rem' }}
              >
                <IconRefresh size={13} />
                <span>Reset Filter</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Expenses Table */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Memuat data pengeluaran...</div>
      ) : (
        <div className="table-responsive">
          <table style={{ width: '100%', minWidth: '780px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--surface-subtle)' }}>
                <th style={{ padding: '0.65rem 0.85rem', fontWeight: 600, fontSize: '0.6875rem', letterSpacing: '0.04em', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>NO. TRANSAKSI</th>
                <th style={{ padding: '0.65rem 0.85rem', fontWeight: 600, fontSize: '0.6875rem', letterSpacing: '0.04em', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>WAKTU & TANGGAL</th>
                <th style={{ padding: '0.65rem 0.85rem', fontWeight: 600, fontSize: '0.6875rem', letterSpacing: '0.04em', color: 'var(--text-secondary)', minWidth: '200px' }}>KATEGORI & DESKRIPSI</th>
                <th style={{ padding: '0.65rem 0.85rem', fontWeight: 600, fontSize: '0.6875rem', letterSpacing: '0.04em', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>PENANGGUNG JAWAB</th>
                <th style={{ padding: '0.65rem 0.85rem', fontWeight: 600, fontSize: '0.6875rem', letterSpacing: '0.04em', color: 'var(--text-secondary)', textAlign: 'right', whiteSpace: 'nowrap' }}>NOMINAL</th>
                <th style={{ padding: '0.65rem 0.85rem', fontWeight: 600, fontSize: '0.6875rem', letterSpacing: '0.04em', color: 'var(--text-secondary)', textAlign: 'center', whiteSpace: 'nowrap' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((item) => {
                const dt = new Date(item.tanggal);
                const formattedDate = `${dt.toLocaleDateString('id-ID')} ${dt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;

                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background-color 0.15s ease' }}>
                    
                    {/* No. Transaksi */}
                    <td style={{ padding: '0.75rem 0.85rem', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <span className="font-mono" style={{ 
                        fontWeight: 600, 
                        fontSize: '0.75rem', 
                        backgroundColor: 'var(--surface-subtle)', 
                        padding: '0.2rem 0.45rem', 
                        borderRadius: 'var(--radius-sm)', 
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-primary)'
                      }}>
                        {item.no_transaksi || item.id}
                      </span>
                    </td>

                    {/* Waktu & Tanggal */}
                    <td style={{ padding: '0.75rem 0.85rem', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <span className="tabular" style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.8125rem' }}>
                        {formattedDate}
                      </span>
                    </td>

                    {/* Category & Description */}
                    <td style={{ padding: '0.75rem 0.85rem', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                        <span className="badge-neutral" style={{ fontSize: '0.6875rem', padding: '0.1rem 0.45rem' }}>
                          {item.kategori}
                        </span>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {item.deskripsi || 'Pengeluaran Operasional'}
                        </span>
                      </div>
                    </td>

                    {/* PJ */}
                    <td style={{ padding: '0.75rem 0.85rem', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                        <IconUser size={13} style={{ color: 'var(--text-tertiary)' }} />
                        <span>{item.pj || 'Admin'}</span>
                      </span>
                    </td>

                    {/* Nominal & Metode */}
                    <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <div className="tabular" style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--status-danger)' }}>
                        - Rp {item.nominal?.toLocaleString('id-ID')}
                      </div>
                      <span className="badge-neutral" style={{ fontSize: '0.65rem', textTransform: 'uppercase', marginTop: '0.2rem', padding: '0.1rem 0.4rem' }}>
                        {item.metode_bayar === 'tunai' && <IconBanknote size={11} style={{ marginRight: '0.2rem' }} />}
                        {item.metode_bayar === 'qris' && <IconQrCode size={11} style={{ marginRight: '0.2rem' }} />}
                        {item.metode_bayar === 'transfer' && <IconCreditCard size={11} style={{ marginRight: '0.2rem' }} />}
                        {item.metode_bayar || 'TUNAI'}
                      </span>
                    </td>

                    {/* Aksi */}
                    <td style={{ padding: '0.75rem 0.85rem', textAlign: 'center', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <button 
                        type="button"
                        onClick={() => setDeleteConfirmExpense(item)}
                        className="btn-secondary"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', color: 'var(--status-danger)', borderColor: 'var(--border-subtle)' }}
                        title="Hapus Pengeluaran"
                      >
                        <IconTrash size={13} />
                        <span>Hapus</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
              {pengeluaran.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Tidak ada catatan pengeluaran ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {pengeluaran.length > ITEMS_PER_PAGE && (
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
                Menampilkan {pengeluaran.length === 0 ? 0 : currentPage * ITEMS_PER_PAGE + 1} - {Math.min((currentPage + 1) * ITEMS_PER_PAGE, pengeluaran.length)} dari {pengeluaran.length} data &bull; Halaman {currentPage + 1} dari {totalPages}
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

      {/* Modal Catat Pengeluaran Baru */}
      {showExpenseModal && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '480px', width: '92%', padding: '1.5rem' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem' }}>
              <div>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>Catat Pengeluaran</h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>Masukkan rincian biaya atau beban operasional toko</p>
              </div>
              <button 
                type="button"
                onClick={() => setShowExpenseModal(false)} 
                style={{ color: 'var(--text-secondary)', padding: '0.35rem', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center' }}
                aria-label="Tutup modal"
              >
                <IconX size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveExpense}>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, marginBottom: '0.35rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Kategori Pengeluaran</label>
                <select 
                  className="input-field"
                  value={expenseForm.kategori}
                  onChange={e => setExpenseForm({ ...expenseForm, kategori: e.target.value })}
                >
                  {expCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, marginBottom: '0.35rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Nominal Pengeluaran (Rp)</label>
                <input 
                  type="number" 
                  className="input-field tabular" 
                  placeholder="Contoh: 25000"
                  value={expenseForm.nominal}
                  onChange={e => setExpenseForm({ ...expenseForm, nominal: e.target.value })}
                  required
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, marginBottom: '0.35rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Deskripsi / Keterangan</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Contoh: Beli Es Batu 5 Plastik & Sedotan"
                  value={expenseForm.deskripsi}
                  onChange={e => setExpenseForm({ ...expenseForm, deskripsi: e.target.value })}
                  required
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, marginBottom: '0.35rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Metode Pembayaran</label>
                <select 
                  className="input-field"
                  value={expenseForm.metode_bayar}
                  onChange={e => setExpenseForm({ ...expenseForm, metode_bayar: e.target.value })}
                >
                  <option value="tunai">Tunai</option>
                  <option value="qris">QRIS</option>
                  <option value="transfer">Transfer Bank</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, marginBottom: '0.35rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Penanggung Jawab (PJ)</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={expenseForm.pj}
                  onChange={e => setExpenseForm({ ...expenseForm, pj: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  style={{ flex: 1, padding: '0.65rem' }} 
                  onClick={() => setShowExpenseModal(false)}
                  disabled={savingExpense}
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  style={{ flex: 1.3, padding: '0.65rem' }}
                  disabled={savingExpense}
                >
                  {savingExpense ? 'Menyimpan...' : 'Simpan Pengeluaran'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Delete Expense Confirmation Modal */}
      {deleteConfirmExpense && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content" style={{ maxWidth: '420px', width: '92%', textAlign: 'center', padding: '1.5rem' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'var(--status-danger-bg)', border: '1px solid var(--status-danger-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: 'var(--status-danger)' }}>
              <IconAlertCircle size={24} />
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Hapus Pengeluaran?</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Apakah Anda yakin ingin menghapus catatan <strong className="font-mono" style={{ color: 'var(--text-primary)' }}>{deleteConfirmExpense.no_transaksi || deleteConfirmExpense.id}</strong> ({deleteConfirmExpense.deskripsi}) bernilai <strong className="tabular" style={{ color: 'var(--status-danger)' }}>Rp {deleteConfirmExpense.nominal?.toLocaleString('id-ID')}</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                type="button"
                className="btn-secondary" 
                style={{ flex: 1, padding: '0.65rem' }} 
                onClick={() => setDeleteConfirmExpense(null)}
              >
                Batal
              </button>
              <button 
                type="button"
                className="btn-danger" 
                style={{ flex: 1, padding: '0.65rem' }}
                onClick={() => handleDeleteExpense(deleteConfirmExpense.id)}
              >
                <IconTrash size={15} style={{ marginRight: '0.35rem' }} /> Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
