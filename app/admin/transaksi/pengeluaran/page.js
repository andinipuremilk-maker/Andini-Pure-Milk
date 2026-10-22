'use client';
import { useState, useEffect } from 'react';
import { useResponsivePagination } from '../../../../lib/useResponsivePagination';

function MetricCard({ title, value, subtitle, highlightColor, borderColor = 'var(--color-chocolate)' }) {
  return (
    <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderLeft: `4px solid ${borderColor}`, backgroundColor: '#ffffff' }}>
      <h3 style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--color-text-secondary)', marginBottom: '0.35rem', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{title}</h3>
      <p style={{ fontSize: '1.25rem', fontWeight: 900, color: highlightColor || 'inherit', whiteSpace: 'nowrap', margin: 0 }}>{value}</p>
      {subtitle && <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem', whiteSpace: 'nowrap' }}>{subtitle}</p>}
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
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedMethod, setSelectedMethod] = useState('ALL');
  const [dateRangeType, setDateRangeType] = useState('today'); // 'today' | 'week' | 'month' | 'custom' | 'ALL'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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
    if (search) url += `search=${encodeURIComponent(search)}&`;
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
  }, [selectedCategory, selectedMethod, search, dateRangeType, startDate, endDate, refreshKey]);

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '0.5px', margin: 0 }}>PENGELUARAN OPERASIONAL</h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: '0.2rem 0 0 0', fontWeight: 600 }}>Pencatatan biaya harian, bahan baku, dan beban toko</p>
        </div>
        <button 
          className="btn-chocolate" 
          onClick={() => setShowExpenseModal(true)}
          style={{ padding: '0.65rem 1.15rem', fontSize: '0.8125rem' }}
        >
          + CATAT PENGELUARAN
        </button>
      </div>

      {/* Metrics Summary */}
      <div className="responsive-stats-grid" style={{ marginBottom: '1.5rem' }}>
        <MetricCard title="TOTAL PENGELUARAN" value={`Rp ${totalPengeluaran.toLocaleString('id-ID')}`} highlightColor="var(--color-error)" />
        <MetricCard title="RATA-RATA PENGELUARAN" value={`Rp ${avgPengeluaran.toLocaleString('id-ID')}`} />
        <MetricCard title="JUMLAH PENGELUARAN" value={`${totalCatatan} Catatan`} />
      </div>

      {/* Search & Filter Bar */}
      <div className="card" style={{ marginBottom: '2rem', padding: '1.25rem' }}>
        <div className="responsive-filter-bar">
          
          <div style={{ flex: 2, minWidth: '220px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '1px' }}>PENCARIAN (NO TRX / DESKRIPSI / PJ)</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Ketik No. TRX, deskripsi, atau PJ..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div style={{ flex: 1, minWidth: '180px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '1px' }}>KATEGORI PENGELUARAN</label>
            <select 
              className="input-field"
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
            >
              <option value="ALL">-- SEMUA KATEGORI --</option>
              {expCategories.map(c => (
                <option key={c} value={c}>{c}</option>
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

          {(search || selectedCategory !== 'ALL' || selectedMethod !== 'ALL' || dateRangeType !== 'today') && (
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
              style={{ padding: '0.85rem 1.25rem' }}
            >
              RESET FILTER
            </button>
          )}
        </div>
      </div>

      {/* Expenses Table */}
      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', fontWeight: 700 }}>MEMUAT DATA PENGELUARAN...</div>
      ) : (
        <div className="table-responsive">
          <table style={{ width: '100%', minWidth: '780px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)', backgroundColor: 'var(--color-bg-dark)' }}>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 800, fontSize: '0.6875rem', letterSpacing: '1px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>NO. TRANSAKSI</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 800, fontSize: '0.6875rem', letterSpacing: '1px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>WAKTU & TANGGAL</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 800, fontSize: '0.6875rem', letterSpacing: '1px', color: 'var(--color-text-secondary)', minWidth: '180px' }}>KATEGORI & DESKRIPSI</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 800, fontSize: '0.6875rem', letterSpacing: '1px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>PENANGGUNG JAWAB</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 800, fontSize: '0.6875rem', letterSpacing: '1px', color: 'var(--color-text-secondary)', textAlign: 'right', whiteSpace: 'nowrap' }}>NOMINAL</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 800, fontSize: '0.6875rem', letterSpacing: '1px', color: 'var(--color-text-secondary)', textAlign: 'center', whiteSpace: 'nowrap' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((item) => {
                const dt = new Date(item.tanggal);
                const formattedDate = `${dt.toLocaleDateString('id-ID')} ${dt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;

                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    
                    {/* No. Transaksi */}
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

                    {/* Waktu & Tanggal */}
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.8125rem', color: 'var(--color-text-secondary)', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <div style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{formattedDate}</div>
                    </td>

                    {/* Category & Description */}
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.8125rem', verticalAlign: 'middle' }}>
                      <span style={{ fontSize: '0.6875rem', fontWeight: 800, border: '1px solid var(--color-border)', padding: '0.1rem 0.4rem', borderRadius: '3px', backgroundColor: 'var(--color-bg-dark)', display: 'inline-block', marginRight: '0.5rem' }}>
                        {item.kategori}
                      </span>
                      <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{item.deskripsi || 'Pengeluaran Operasional'}</span>
                    </td>

                    {/* PJ */}
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700, fontSize: '0.8125rem', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <span style={{ backgroundColor: 'var(--color-bg-dark)', padding: '0.3rem 0.6rem', borderRadius: '4px', border: '1px solid var(--color-border)', display: 'inline-block' }}>
                        {item.pj || 'Admin'}
                      </span>
                    </td>

                    {/* Nominal & Metode */}
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.9375rem', color: 'var(--color-error)' }}>- Rp {item.nominal?.toLocaleString('id-ID')}</div>
                      <span style={{ fontSize: '0.6875rem', fontWeight: 800, border: '1px solid var(--color-border)', padding: '0.1rem 0.4rem', borderRadius: '3px', backgroundColor: 'var(--color-bg-dark)', textTransform: 'uppercase', display: 'inline-block', marginTop: '0.2rem' }}>
                        {item.metode_bayar || 'TUNAI'}
                      </span>
                    </td>

                    {/* Aksi */}
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'center', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <button 
                        type="button"
                        onClick={() => setDeleteConfirmExpense(item)}
                        className="btn-secondary"
                        style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
                      >
                        HAPUS
                      </button>
                    </td>
                  </tr>
                );
              })}
              {pengeluaran.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                    Tidak ada catatan pengeluaran ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {pengeluaran.length > ITEMS_PER_PAGE && (
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
                Menampilkan {pengeluaran.length === 0 ? 0 : currentPage * ITEMS_PER_PAGE + 1} - {Math.min((currentPage + 1) * ITEMS_PER_PAGE, pengeluaran.length)} dari {pengeluaran.length} data &bull; Halaman {currentPage + 1} dari {totalPages}
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

      {/* Modal Catat Pengeluaran Baru */}
      {showExpenseModal && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '500px', width: '90%' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '1px', margin: 0 }}>CATAT PENGELUARAN OPERASIONAL</h2>
              <button 
                onClick={() => setShowExpenseModal(false)} 
                style={{ fontSize: '1.25rem', fontWeight: 800, cursor: 'pointer', background: 'none', border: 'none' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveExpense}>
              
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '1px' }}>KATEGORI PENGELUARAN</label>
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

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '1px' }}>NOMINAL PENGELUARAN (RP)</label>
                <input 
                  type="number" 
                  className="input-field" 
                  placeholder="Contoh: 25000"
                  value={expenseForm.nominal}
                  onChange={e => setExpenseForm({ ...expenseForm, nominal: e.target.value })}
                  required
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '1px' }}>DESKRIPSI / KETERANGAN</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Contoh: Beli Es Batu 5 Plastik & Sedotan"
                  value={expenseForm.deskripsi}
                  onChange={e => setExpenseForm({ ...expenseForm, deskripsi: e.target.value })}
                  required
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '1px' }}>METODE PEMBAYARAN</label>
                <select 
                  className="input-field"
                  value={expenseForm.metode_bayar}
                  onChange={e => setExpenseForm({ ...expenseForm, metode_bayar: e.target.value })}
                >
                  <option value="tunai">TUNAI</option>
                  <option value="qris">QRIS</option>
                  <option value="transfer">TRANSFER</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '1px' }}>PENANGGUNG JAWAB (PJ)</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={expenseForm.pj}
                  onChange={e => setExpenseForm({ ...expenseForm, pj: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  style={{ flex: 1, padding: '0.85rem' }} 
                  onClick={() => setShowExpenseModal(false)}
                  disabled={savingExpense}
                >
                  BATAL
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  style={{ flex: 1, padding: '0.85rem' }}
                  disabled={savingExpense}
                >
                  {savingExpense ? 'MENYIMPAN...' : 'SIMPAN PENGELUARAN'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Delete Expense Confirmation Modal */}
      {deleteConfirmExpense && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content" style={{ maxWidth: '420px', width: '90%', textAlign: 'center' }}>
            <span style={{ display: 'inline-block', border: '1px solid var(--color-error)', color: 'var(--color-error)', fontSize: '0.75rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '4px', letterSpacing: '1px', marginBottom: '1rem' }}>
              PERHATIAN
            </span>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.75rem' }}>KONFIRMASI HAPUS PENGELUARAN</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: 1.4 }}>
              Apakah Anda yakin ingin menghapus catatan pengeluaran <strong style={{ color: 'var(--color-text-primary)' }}>{deleteConfirmExpense.no_transaksi} ({deleteConfirmExpense.deskripsi})</strong> bernilai <strong style={{ color: 'var(--color-error)' }}>Rp {deleteConfirmExpense.nominal?.toLocaleString('id-ID')}</strong>?
            </p>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                type="button"
                className="btn-secondary" 
                style={{ flex: 1, padding: '0.85rem' }} 
                onClick={() => setDeleteConfirmExpense(null)}
              >
                BATAL
              </button>
              <button 
                type="button"
                className="btn-primary" 
                style={{ flex: 1, padding: '0.85rem', backgroundColor: 'var(--color-error)', borderColor: 'var(--color-error)', color: '#ffffff' }}
                onClick={() => handleDeleteExpense(deleteConfirmExpense.id)}
              >
                HAPUS
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
