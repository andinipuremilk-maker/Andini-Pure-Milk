'use client';
import { useState, useEffect } from 'react';
import { useResponsivePagination } from '../../../../lib/useResponsivePagination';
import { fetchWithCache, invalidateCache } from '../../../../lib/clientCache';
import {
  IconSearch,
  IconStore,
  IconUser, IconUsers, IconFileText,
  IconReceipt,
  IconClock,
  IconCheck,
  IconTrash,
  IconCalendar,
  IconEdit,

  IconPlus,
  IconMinus,
  IconX,
  IconAlertCircle,
  IconBanknote,
  IconQrCode,
  IconCreditCard,
  IconTrendingUp
} from '../../../../components/ui/icons';

function MetricCard({ title, value, subtitle }) {
  return (
    <div className="panel" style={{ padding: '1rem 1.15rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{title}</span>
      <p className="tabular" style={{ fontSize: '1.25rem', fontWeight: 800, whiteSpace: 'nowrap', margin: 0, color: 'var(--terracotta)' }}>{value}</p>
      {subtitle && <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.25rem', margin: 0, whiteSpace: 'nowrap' }}>{subtitle}</p>}
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
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedSeller, setSelectedSeller] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedMethod, setSelectedMethod] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL'); // 'ALL' | 'selesai' | 'pending'
  const [dateRangeType, setDateRangeType] = useState('today'); // 'today' | 'week' | 'month' | 'custom' | 'ALL'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [kategoriList, setKategoriList] = useState([]);
  const [produkList, setProdukList] = useState([]);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Selected item for Detail Modal & Fitur Ubah Tanggal
  const [selectedTx, setSelectedTx] = useState(null);
  const [editDateInput, setEditDateInput] = useState('');
  const [savingDate, setSavingDate] = useState(false);
  const [saveDateSuccess, setSaveDateSuccess] = useState(false);

  // Modal Selesaikan Transaksi Pending dari Admin
  const [editingPendingTx, setEditingPendingTx] = useState(null);
  const [editPendingItems, setEditPendingItems] = useState([]);
  const [editPendingSeller, setEditPendingSeller] = useState('Umum / Retail');
  const [editPendingMetode, setEditPendingMetode] = useState('tunai');
  const [editPendingBayar, setEditPendingBayar] = useState(0);
  const [editPendingKeterangan, setEditPendingKeterangan] = useState('');
  const [savingPendingComplete, setSavingPendingComplete] = useState(false);

  // Modal Alert Pembatalan Transaksi Pending (Admin)
  const [deleteConfirmTx, setDeleteConfirmTx] = useState(null);
  const [deletingTxLoading, setDeletingTxLoading] = useState(false);

  // Sellers State & Management
  const [sellers, setSellers] = useState([]);
  const [loadingSellers, setLoadingSellers] = useState(false);
  const [showSellerModal, setShowSellerModal] = useState(false);
  const [newSellerName, setNewSellerName] = useState('');
  const [sellerActionLoading, setSellerActionLoading] = useState(false);
  const [sellerError, setSellerError] = useState('');
  const [deleteConfirmSeller, setDeleteConfirmSeller] = useState(null);

  const loadSellers = async (bypassCache = false) => {
    try {
      setLoadingSellers(true);
      if (bypassCache) invalidateCache('/api/sellers');
      const data = await fetchWithCache('/api/sellers', {}, 60000);
      if (data && data.sellers) setSellers(data.sellers);
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
        loadSellers(true);
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
        loadSellers(true);
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
    Promise.all([
      fetchWithCache('/api/kategori', {}, 60000).catch(() => []),
      fetchWithCache('/api/sellers', {}, 60000).catch(() => ({ sellers: [] })),
      fetch('/api/produk').then(r => r.json()).catch(() => [])
    ]).then(([katData, sellerData, prodData]) => {
      if (isMounted) {
        if (Array.isArray(katData)) setKategoriList(katData);
        if (sellerData && sellerData.sellers) setSellers(sellerData.sellers);
        if (Array.isArray(prodData)) setProdukList(prodData);
      }
    });
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
    if (selectedMethod !== 'ALL') {
      params.append('metode_bayar', selectedMethod);
      params.append('metode', selectedMethod);
    }
    if (selectedSeller !== 'ALL') params.append('seller', selectedSeller);
    if (selectedStatus !== 'ALL') params.append('status', selectedStatus);
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
  }, [selectedMethod, selectedSeller, selectedStatus, dateRangeType, startDate, endDate]);

  const filteredTransaksi = transaksi.filter(t => {
    let matchSearch = true;
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      const matchSeller = t.seller && t.seller.toLowerCase().includes(q);
      const matchNo = t.no_transaksi && t.no_transaksi.toLowerCase().includes(q);
      const matchProd = t.items && t.items.some(it => it.nama_produk && it.nama_produk.toLowerCase().includes(q));
      matchSearch = matchSeller || matchNo || matchProd;
    }

    let matchCategory = true;
    if (selectedCategory !== 'ALL') {
      matchCategory = t.items && t.items.some(it => it.kategori_id === selectedCategory);
    }

    let matchStatus = true;
    if (selectedStatus !== 'ALL') {
      matchStatus = (t.status || 'selesai').toLowerCase() === selectedStatus.toLowerCase();
    }

    return matchSearch && matchCategory && matchStatus;
  });

  // Hanya hitung omset & laba dari transaksi yang berstatus 'selesai'
  const completedTransactions = filteredTransaksi.filter(t => t.status !== 'pending');
  const pendingTransactions = filteredTransaksi.filter(t => t.status === 'pending');
  const totalSetor = completedTransactions.reduce((sum, t) => sum + (t.total || 0), 0);
  const totalLaba = completedTransactions.reduce((sum, t) => sum + (t.total_laba || t.laba_kotor || 0), 0);
  const totalCount = filteredTransaksi.length;
  const pendingCount = pendingTransactions.length;

  const paginatedData = filteredTransaksi.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(filteredTransaksi.length / ITEMS_PER_PAGE);

  const sellersList = ['ALL', ...sellers.map(s => s.nama)];

  // Handlers Detail Modal & Fitur Ubah Tanggal
  const handleOpenDetail = (item) => {
    setSelectedTx(item);
    setSaveDateSuccess(false);
    try {
      const d = new Date(item.tanggal);
      const offset = d.getTimezoneOffset() * 60000;
      const localIso = (new Date(d.getTime() - offset)).toISOString().slice(0, 16);
      setEditDateInput(localIso);
    } catch (e) {
      setEditDateInput('');
    }
  };

  const handleSaveDate = async () => {
    if (!selectedTx || !editDateInput) return;
    try {
      setSavingDate(true);
      setSaveDateSuccess(false);
      const targetIso = new Date(editDateInput).toISOString();
      const res = await fetch('/api/transaksi', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedTx.id, tanggal: targetIso })
      });
      if (res.ok) {
        setSelectedTx(prev => ({ ...prev, tanggal: targetIso }));
        setTransaksi(prev => prev.map(t => t.id === selectedTx.id ? { ...t, tanggal: targetIso } : t));
        setSaveDateSuccess(true);
        setTimeout(() => setSaveDateSuccess(false), 3000);
      } else {
        alert('Gagal mengubah tanggal transaksi.');
      }
    } catch (e) {
      alert('Terjadi kesalahan jaringan saat update tanggal.');
    } finally {
      setSavingDate(false);
    }
  };

  // Handlers Selesaikan Transaksi Pending dari Admin
  const handleStartCompletePending = (item) => {
    setEditingPendingTx(item);
    const initialItems = (item.items || []).map(it => ({
      produk_id: it.produk_id,
      nama: it.nama_produk || it.nama || 'Produk',
      qty: it.qty || 1,
      harga_satuan: it.harga_satuan || 0
    }));
    setEditPendingItems(initialItems);
    setEditPendingSeller(item.seller || 'Umum / Retail');
    setEditPendingMetode(item.metode_bayar || 'tunai');
    setEditPendingKeterangan(item.keterangan || '');
    const currentTotal = initialItems.reduce((sum, it) => sum + (it.qty * it.harga_satuan), 0);
    setEditPendingBayar(currentTotal);
  };

  const updatePendingQty = (idx, delta) => {
    setEditPendingItems(prev => prev.map((it, i) => i === idx ? { ...it, qty: Math.max(1, it.qty + delta) } : it));
  };

  const updatePendingPrice = (idx, newPrice) => {
    const val = Math.max(0, parseInt(newPrice) || 0);
    setEditPendingItems(prev => prev.map((it, i) => i === idx ? { ...it, harga_satuan: val } : it));
  };

  const handleFinishCompletePending = async () => {
    if (!editingPendingTx || editPendingItems.length === 0) return;
    setSavingPendingComplete(true);
    const computedTotal = editPendingItems.reduce((sum, it) => sum + (it.qty * it.harga_satuan), 0);
    const finalBayar = Number(editPendingBayar) || computedTotal;

    try {
      const res = await fetch('/api/transaksi', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingPendingTx.id,
          detailItems: editPendingItems,
          transaksiData: {
            total: computedTotal,
            bayar: finalBayar,
            metode_bayar: editPendingMetode,
            seller: editPendingSeller,
            keterangan: editPendingKeterangan.trim(),
            status: 'selesai'
          },
          status: 'selesai'
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setTransaksi(prev => prev.map(t => t.id === editingPendingTx.id ? { ...t, ...updated, status: 'selesai' } : t));
        if (selectedTx?.id === editingPendingTx.id) {
          setSelectedTx(prev => ({ ...prev, ...updated, status: 'selesai' }));
        }
        setEditingPendingTx(null);
        alert('Transaksi pending berhasil diselesaikan!');
      } else {
        alert('Gagal menyelesaikan transaksi.');
      }
    } catch (e) {
      alert('Terjadi kesalahan jaringan.');
    } finally {
      setSavingPendingComplete(false);
    }
  };

  const handleConfirmDeleteTx = async () => {
    if (!deleteConfirmTx) return;
    try {
      setDeletingTxLoading(true);
      const res = await fetch(`/api/transaksi?id=${deleteConfirmTx.id}`, { method: 'DELETE' });
      if (res.ok) {
        setTransaksi(prev => prev.filter(t => t.id !== deleteConfirmTx.id));
        if (selectedTx?.id === deleteConfirmTx.id) setSelectedTx(null);
        setDeleteConfirmTx(null);
      } else {
        alert('Gagal membatalkan transaksi.');
      }
    } catch (e) {
      alert('Terjadi kesalahan jaringan.');
    } finally {
      setDeletingTxLoading(false);
    }
  };

  return (
    <div className="admin-page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>Transaksi Pemasukan</h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>Riwayat transaksi penjualan gerai, ritel, dan mitra konsinyasi</p>
        </div>
        <button 
          type="button"
          onClick={() => { setShowSellerModal(true); setSellerError(''); setNewSellerName(''); }}
          className="btn-secondary"
          style={{ padding: '0.5rem 0.95rem', fontSize: '0.8125rem' }}
        >
          <IconStore size={15} />
          <span>Kelola Mitra ({sellers.length})</span>
        </button>
      </div>

      {/* Metrics Summary */}
      <div className="responsive-stats-grid" style={{ marginBottom: '1.25rem' }}>
        <MetricCard 
          title="Total Setor (Penjualan)" 
          value={`Rp ${totalSetor.toLocaleString('id-ID')}`} 
          subtitle={pendingCount > 0 ? `Belum termasuk ${pendingCount} trx pending` : undefined}
        />
        <MetricCard 
          title="Total Laba (Gross Profit)" 
          value={`Rp ${totalLaba.toLocaleString('id-ID')}`} 
          subtitle={`Margin Laba: ${totalSetor > 0 ? Math.round((totalLaba / totalSetor) * 100) : 0}%`} 
        />
        <MetricCard 
          title="Volume Transaksi" 
          value={`${totalCount} Trx`} 
          subtitle={pendingCount > 0 ? `${pendingCount} transaksi pending tertahan` : 'Semua transaksi selesai'}
        />
      </div>

      {/* Search & Filter Bar */}
      <div className="card" style={{ marginBottom: '1.25rem', padding: '1rem' }}>
        <div className="responsive-filter-bar">
          
          <div style={{ flex: 2, minWidth: '180px' }}>
            <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, marginBottom: '0.35rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Pencarian</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                className="input-field" 
                placeholder="Cari mitra, produk, atau no. transaksi..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: '2.1rem', fontSize: '0.8125rem' }}
              />
              <div style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', display: 'flex' }}>
                <IconSearch size={14} />
              </div>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: '140px' }}>
            <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, marginBottom: '0.35rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Status Transaksi</label>
            <select 
              className="input-field"
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              style={{ fontSize: '0.8125rem' }}
            >
              <option value="ALL">Semua Status</option>
              <option value="selesai">Selesai</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, marginBottom: '0.35rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Mitra / Penjual</label>
            <select 
              className="input-field"
              value={selectedSeller}
              onChange={e => setSelectedSeller(e.target.value)}
              style={{ fontSize: '0.8125rem' }}
            >
              {sellersList.map(s => <option key={s} value={s}>{s === 'ALL' ? 'Semua Mitra' : s}</option>)}
            </select>
          </div>

          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, marginBottom: '0.35rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Kategori Produk</label>
            <select 
              className="input-field"
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              style={{ fontSize: '0.8125rem' }}
            >
              <option value="ALL">Semua Kategori</option>
              {kategoriList.map(k => (
                <option key={k.id} value={k.id}>{k.nama}</option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1, minWidth: '130px' }}>
            <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, marginBottom: '0.35rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Metode Bayar</label>
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
            <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, marginBottom: '0.35rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Periode</label>
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
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, marginBottom: '0.35rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Dari Tanggal</label>
                <input 
                  type="date" 
                  className="input-field" 
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  style={{ fontSize: '0.8125rem' }}
                />
              </div>

              <div style={{ flex: 1, minWidth: '140px' }}>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, marginBottom: '0.35rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Sampai Tanggal</label>
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

          {(selectedSeller !== 'ALL' || selectedCategory !== 'ALL' || selectedMethod !== 'ALL' || selectedStatus !== 'ALL' || dateRangeType !== 'today' || search !== '') && (
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setSelectedSeller('ALL');
                  setSelectedCategory('ALL');
                  setSelectedMethod('ALL');
                  setSelectedStatus('ALL');
                  setDateRangeType('today');
                  setSearch('');
                  setStartDate('');
                  setEndDate('');
                }}
                style={{ padding: '0.55rem 0.95rem', fontSize: '0.75rem' }}
              >
                Reset Filter
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Transactions Data Table */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Memuat riwayat transaksi...</div>
      ) : (
        <div className="table-wrapper">
          <table style={{ width: '100%', minWidth: '820px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--surface-sunken)' }}>
                <th style={{ padding: '0.65rem 0.85rem', fontWeight: 600, fontSize: '0.6875rem', letterSpacing: '0.04em', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>NO. TRANSAKSI</th>
                <th style={{ padding: '0.65rem 0.85rem', fontWeight: 600, fontSize: '0.6875rem', letterSpacing: '0.04em', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>WAKTU</th>
                <th style={{ padding: '0.65rem 0.85rem', fontWeight: 600, fontSize: '0.6875rem', letterSpacing: '0.04em', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>KASIR</th>
                <th style={{ padding: '0.65rem 0.85rem', fontWeight: 600, fontSize: '0.6875rem', letterSpacing: '0.04em', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>MITRA / PELANGGAN</th>
                <th style={{ padding: '0.65rem 0.85rem', fontWeight: 600, fontSize: '0.6875rem', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>RINGKASAN ITEM</th>
                <th style={{ padding: '0.65rem 0.85rem', fontWeight: 600, fontSize: '0.6875rem', letterSpacing: '0.04em', color: 'var(--text-muted)', textAlign: 'right', whiteSpace: 'nowrap' }}>TOTAL SETOR</th>
                <th style={{ padding: '0.65rem 0.85rem', fontWeight: 600, fontSize: '0.6875rem', letterSpacing: '0.04em', color: 'var(--text-muted)', textAlign: 'center', whiteSpace: 'nowrap' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((item) => {
                const dt = new Date(item.tanggal);
                const formattedDate = `${dt.toLocaleDateString('id-ID')} ${dt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
                const isPending = item.status === 'pending';

                let produkSummary = '-';
                if (item.items && item.items.length > 0) {
                  const firstItem = item.items[0];
                  const countOther = item.items.length - 1;
                  produkSummary = `${firstItem.nama_produk || firstItem.nama} (${firstItem.qty}x)${countOther > 0 ? ` +${countOther} lainnya` : ''}`;
                }

                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: isPending ? 'var(--warning-subtle)' : 'transparent' }}>
                    
                    {/* No. Transaksi & Status Badge */}
                    <td style={{ padding: '0.75rem 0.85rem', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-start' }}>
                        <span className="tabular" style={{ 
                          fontFamily: 'monospace', 
                          fontWeight: 600, 
                          fontSize: '0.75rem', 
                          color: 'var(--text-primary)'
                        }}>
                          {item.no_transaksi || item.id}
                        </span>
                        <span className={isPending ? 'badge-warning' : 'badge-success'}>
                          {isPending ? (
                            <><IconClock size={10} /> Pending</>
                          ) : (
                            <><IconCheck size={10} /> Selesai</>
                          )}
                        </span>
                      </div>
                    </td>

                    <td className="tabular" style={{ padding: '0.75rem 0.85rem', fontSize: '0.75rem', color: 'var(--text-muted)', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      {formattedDate}
                    </td>
                    
                    <td style={{ padding: '0.75rem 0.85rem', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <span style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '0.3rem', 
                        fontWeight: 600, 
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)'
                      }}>
                        <IconUser size={13} color="var(--text-muted)" />
                        <span>{item.kasir || 'Kasir Gerai'}</span>
                      </span>
                    </td>

                    <td style={{ padding: '0.75rem 0.85rem', fontWeight: 600, fontSize: '0.75rem', verticalAlign: 'middle' }}>
                      <span style={{ backgroundColor: 'var(--surface-sunken)', padding: '0.2rem 0.45rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', display: 'inline-block', whiteSpace: 'nowrap' }}>
                        {item.seller || 'Umum'}
                      </span>
                    </td>

                    <td style={{ padding: '0.75rem 0.85rem', fontSize: '0.8125rem', verticalAlign: 'middle' }}>
                      <div style={{ fontWeight: 500 }}>{produkSummary}</div>
                      {item.keterangan && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.15rem' }}>
                          Catatan: {item.keterangan}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <div className="tabular" style={{ fontWeight: 700, fontSize: '0.875rem', color: isPending ? 'var(--warning)' : 'inherit' }}>
                        Rp {item.total?.toLocaleString('id-ID')}
                      </div>
                      <span style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'inline-block', marginTop: '0.15rem' }}>
                        {item.metode_bayar || 'Tunai'}
                      </span>
                    </td>

                    <td style={{ padding: '0.75rem 0.85rem', textAlign: 'center', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        {isPending && (
                          <button 
                            type="button"
                            onClick={() => handleStartCompletePending(item)}
                            className="btn-primary"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.72rem' }}
                          >
                            <IconEdit size={12} /> Selesaikan
                          </button>
                        )}
                        <button 
                          type="button"
                          onClick={() => handleOpenDetail(item)}
                          className="btn-secondary"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.72rem' }}
                        >
                          Detail
                        </button>
                        {isPending && (
                          <button 
                            type="button"
                            onClick={() => setDeleteConfirmTx(item)}
                            className="btn-danger"
                            style={{ padding: '0.35rem 0.45rem', fontSize: '0.72rem' }}
                            title="Batalkan transaksi pending"
                          >
                            <IconTrash size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredTransaksi.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Tidak ada transaksi pemasukan yang cocok dengan filter.
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
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.75rem' }}
              >
                &larr; Sebelumnya
              </button>
              <span className="tabular" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                Menampilkan {filteredTransaksi.length === 0 ? 0 : currentPage * ITEMS_PER_PAGE + 1} - {Math.min((currentPage + 1) * ITEMS_PER_PAGE, filteredTransaksi.length)} dari {filteredTransaksi.length} data &bull; Hal {currentPage + 1} / {totalPages}
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

      {/* ========================================================================= */}
      {/* 1. TRANSACTION DETAIL MODAL DENGAN FITUR UBAH TANGGAL                     */}
      {/* ========================================================================= */}
      {selectedTx && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '620px', width: '92%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '0.5px', margin: 0 }}>DETAIL TRANSAKSI PEMASUKAN</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.8125rem' }}>{selectedTx.no_transaksi || selectedTx.id}</span>
                  <span style={{ 
                    fontSize: '0.6875rem', 
                    fontWeight: 800, 
                    padding: '0.1rem 0.4rem', 
                    borderRadius: '3px',
                    backgroundColor: selectedTx.status === 'pending' ? '#fef3c7' : '#dcfce7',
                    color: selectedTx.status === 'pending' ? '#b45309' : '#15803d'
                  }}>
                    {selectedTx.status === 'pending' ? (<><IconAlertCircle className="inline-block" size={16}/> PENDING</>) : (<><IconCheck className="inline-block" size={16}/> SELESAI</>)}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedTx(null)} 
                style={{ fontSize: '1.35rem', fontWeight: 800, cursor: 'pointer', background: 'none', border: 'none' }}
              >
                &times;
              </button>
            </div>

            {/* Info Dasar */}
            <div style={{ marginBottom: '1.25rem' }}>
              <p style={{ fontSize: '0.875rem', margin: '0.25rem 0' }}>
                <strong>Kasir / PJ:</strong>{' '}
                <span style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '0.3rem',
                  backgroundColor: 'rgba(124, 74, 45, 0.08)',
                  color: 'var(--color-chocolate)',
                  padding: '0.15rem 0.45rem',
                  borderRadius: '4px',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  border: '1px solid rgba(124, 74, 45, 0.2)'
                }}>
                  <IconUser className="inline-block mr-1" size={16}/> {selectedTx.kasir || 'Kasir Gerai'}
                </span>
              </p>
              <p style={{ fontSize: '0.875rem', margin: '0.25rem 0' }}><strong>Seller / Mitra:</strong> {selectedTx.seller || 'Umum / Retail'}</p>
              <p style={{ fontSize: '0.875rem', margin: '0.25rem 0', textTransform: 'uppercase' }}><strong>Metode Bayar:</strong> {selectedTx.metode_bayar}</p>
              {selectedTx.keterangan && (
                <p style={{ fontSize: '0.875rem', margin: '0.4rem 0 0.25rem 0', padding: '0.5rem 0.75rem', backgroundColor: 'var(--color-bg-dark)', borderRadius: '4px', borderLeft: '3px solid var(--color-chocolate)' }}>
                  <strong style={{ color: 'var(--color-chocolate)' }}>Keterangan:</strong> {selectedTx.keterangan}
                </p>
              )}
            </div>

            {/* FITUR UBAH TANGGAL TRANSAKSI */}
            <div style={{ 
              marginBottom: '1.25rem', 
              padding: '0.85rem 1rem', 
              backgroundColor: '#eff6ff', 
              border: '1.5px solid #bfdbfe', 
              borderRadius: '6px' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', flexWrap: 'wrap', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1e40af' }}>
                  <IconCalendar className="inline-block mr-1" size={16}/> UBAH WAKTU & TANGGAL TRANSAKSI
                </label>
                <span style={{ fontSize: '0.7rem', color: '#3b82f6' }}>
                  Waktu Saat Ini: {new Date(selectedTx.tanggal).toLocaleString('id-ID')}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input 
                  type="datetime-local" 
                  className="input-field"
                  value={editDateInput}
                  onChange={e => setEditDateInput(e.target.value)}
                  style={{ flex: 1, padding: '0.45rem 0.65rem', fontSize: '0.8125rem', backgroundColor: '#ffffff' }}
                />
                <button 
                  type="button" 
                  className="btn-primary"
                  onClick={handleSaveDate}
                  disabled={savingDate || !editDateInput}
                  style={{ 
                    padding: '0.5rem 0.95rem', 
                    fontSize: '0.75rem', 
                    fontWeight: 800, 
                    whiteSpace: 'nowrap',
                    backgroundColor: '#2563eb',
                    borderColor: '#2563eb'
                  }}
                >
                  {savingDate ? 'MENYIMPAN...' : 'SIMPAN TANGGAL'}
                </button>
              </div>

              {saveDateSuccess && (
                <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: '#16a34a', fontWeight: 800 }}>
                  <IconCheck className="inline-block mr-1" size={16}/> Tanggal transaksi berhasil diperbarui dan tersimpan ke sistem!
                </div>
              )}
            </div>

            {/* Breakdown Finansial */}
            <div className="modal-stat-breakdown" style={{ marginBottom: '1.25rem', padding: '1rem', backgroundColor: 'var(--color-bg-dark)', borderRadius: '6px' }}>
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
                    <td style={{ padding: '0.5rem 0', fontSize: '0.8125rem' }}>{it.nama_produk || it.nama}</td>
                    <td style={{ padding: '0.5rem 0', fontSize: '0.8125rem', textAlign: 'center' }}>{it.qty}</td>
                    <td style={{ padding: '0.5rem 0', fontSize: '0.8125rem', textAlign: 'right' }}>Rp {it.harga_satuan?.toLocaleString('id-ID')}</td>
                    <td style={{ padding: '0.5rem 0', fontSize: '0.8125rem', textAlign: 'right', fontWeight: 700 }}>
                      Rp {((it.subtotal !== undefined ? it.subtotal : (it.qty * it.harga_satuan)) || 0).toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button 
                type="button"
                className="btn-secondary" 
                onClick={() => setSelectedTx(null)}
                style={{ padding: '0.65rem 1.25rem' }}
              >
                TUTUP
              </button>

              {selectedTx.status === 'pending' && (
                <>
                  <button 
                    type="button"
                    onClick={() => setDeleteConfirmTx(selectedTx)}
                    className="btn-secondary"
                    style={{ padding: '0.65rem 1rem', color: 'var(--color-error)', borderColor: 'var(--color-error)', fontWeight: 700 }}
                  >
                    <IconTrash className="inline-block mr-1" size={16}/> BATALKAN TRANSAKSI
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      handleStartCompletePending(selectedTx);
                      setSelectedTx(null);
                    }}
                    className="btn-chocolate"
                    style={{ padding: '0.65rem 1.25rem', backgroundColor: '#d97706', borderColor: '#d97706', fontWeight: 800 }}
                  >
                    <IconEdit className="inline-block mr-1" size={16}/> SELESAIKAN TRANSAKSI INI
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MODAL SELESAIKAN TRANSAKSI PENDING DARI PANEL ADMIN                    */}
      {/* ========================================================================= */}
      {editingPendingTx && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content" style={{ maxWidth: '640px', width: '92%', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                  <IconEdit className="inline-block mr-1" size={16}/> SELESAIKAN TRANSAKSI PENDING (ADMIN)
                </h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: '0.2rem 0 0 0' }}>
                  No. TRX: <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{editingPendingTx.no_transaksi}</span> &bull; Sesuaikan Qty dan Harga Satuan
                </p>
              </div>
              <button 
                onClick={() => setEditingPendingTx(null)} 
                style={{ fontSize: '1.35rem', fontWeight: 800, cursor: 'pointer', background: 'none', border: 'none' }}
              >
                &times;
              </button>
            </div>

            {/* List Produk yang Diedit */}
            <div style={{ border: '1px solid var(--color-border)', borderRadius: '6px', overflow: 'hidden', marginBottom: '1rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-bg-dark)', borderBottom: '1px solid var(--color-border)', fontSize: '0.7rem', color: 'var(--color-text-secondary)' }}>
                    <th style={{ padding: '0.5rem 0.65rem', textAlign: 'left' }}>PRODUK</th>
                    <th style={{ padding: '0.5rem 0.65rem', textAlign: 'center', width: '100px' }}>QTY</th>
                    <th style={{ padding: '0.5rem 0.65rem', textAlign: 'right', width: '120px' }}>HARGA (RP)</th>
                    <th style={{ padding: '0.5rem 0.65rem', textAlign: 'right', width: '110px' }}>SUBTOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {editPendingItems.map((it, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '0.55rem 0.65rem', fontWeight: 700 }}>{it.nama}</td>
                      <td style={{ padding: '0.55rem 0.65rem', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <button 
                            type="button" 
                            onClick={() => updatePendingQty(idx, -1)}
                            style={{ width: '24px', height: '24px', border: '1px solid var(--color-border)', borderRadius: '3px', cursor: 'pointer', fontWeight: 800 }}
                          >
                            -
                          </button>
                          <span style={{ width: '20px', textAlign: 'center', fontWeight: 800 }}>{it.qty}</span>
                          <button 
                            type="button" 
                            onClick={() => updatePendingQty(idx, 1)}
                            style={{ width: '24px', height: '24px', border: '1px solid var(--color-border)', borderRadius: '3px', cursor: 'pointer', fontWeight: 800 }}
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td style={{ padding: '0.55rem 0.65rem', textAlign: 'right' }}>
                        <input 
                          type="number" 
                          className="input-field"
                          value={it.harga_satuan}
                          onChange={e => updatePendingPrice(idx, e.target.value)}
                          style={{ width: '80px', padding: '0.25rem 0.4rem', fontSize: '0.8125rem', textAlign: 'right', fontWeight: 700 }}
                          min="0"
                        />
                      </td>
                      <td style={{ padding: '0.55rem 0.65rem', textAlign: 'right', fontWeight: 800 }}>
                        Rp {(it.qty * it.harga_satuan).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total Tagihan */}
            <div style={{ backgroundColor: 'var(--color-chocolate-light)', padding: '0.75rem 1rem', borderRadius: '6px', border: '1px solid var(--color-border)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 800 }}>TOTAL TAGIHAN:</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--color-chocolate)' }}>
                Rp {editPendingItems.reduce((s, it) => s + (it.qty * it.harga_satuan), 0).toLocaleString('id-ID')}
              </span>
            </div>

            {/* Pembayaran & Catatan */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>METODE BAYAR:</label>
                <select 
                  className="input-field"
                  value={editPendingMetode}
                  onChange={e => setEditPendingMetode(e.target.value)}
                  style={{ padding: '0.45rem 0.65rem', fontSize: '0.8125rem' }}
                >
                  <option value="tunai">TUNAI</option>
                  <option value="qris">QRIS</option>
                  <option value="transfer">TRANSFER</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>NOMINAL DIBAYAR (RP):</label>
                <input 
                  type="number"
                  className="input-field"
                  value={editPendingBayar}
                  onChange={e => setEditPendingBayar(Number(e.target.value) || 0)}
                  style={{ padding: '0.45rem 0.65rem', fontSize: '0.8125rem', fontWeight: 800 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>MITRA / SELLER:</label>
                <select 
                  className="input-field"
                  value={editPendingSeller}
                  onChange={e => setEditPendingSeller(e.target.value)}
                  style={{ padding: '0.45rem 0.65rem', fontSize: '0.8125rem' }}
                >
                  {sellersList.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>CATATAN PELUNASAN:</label>
                <input 
                  type="text" 
                  className="input-field"
                  value={editPendingKeterangan}
                  onChange={e => setEditPendingKeterangan(e.target.value)}
                  style={{ padding: '0.45rem 0.65rem', fontSize: '0.8125rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                type="button" 
                onClick={() => setEditingPendingTx(null)}
                disabled={savingPendingComplete}
                className="btn-secondary"
                style={{ flex: 1, padding: '0.65rem' }}
              >
                BATAL
              </button>
              <button 
                type="button" 
                onClick={handleFinishCompletePending}
                disabled={savingPendingComplete}
                className="btn-chocolate"
                style={{ flex: 1.5, padding: '0.65rem', fontWeight: 800 }}
              >
                {savingPendingComplete ? 'MEMPROSES...' : '✅ SELESAIKAN & SIMPAN'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MODAL KELOLA MITRA / SELLER                                             */}
      {/* ========================================================================= */}
      {showSellerModal && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '620px', width: '92%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}><IconUsers className="inline-block mr-1" size={16}/> KELOLA MITRA KONSINYASI / SELLER</h2>
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
              Apakah Anda yakin ingin menghapus mitra <strong>&quot;{deleteConfirmSeller.nama}&quot;</strong>? Transaksi lama yang terkait tidak akan terhapus.
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

      {/* Confirmation Modal Delete Pending Transaction */}
      {deleteConfirmTx && (
        <div className="modal-overlay" style={{ zIndex: 1300 }}>
          <div className="modal-content" style={{ maxWidth: '430px', width: '92%', textAlign: 'center', padding: '1.5rem', borderRadius: '8px' }}>
            <div style={{ 
              width: '54px', 
              height: '54px', 
              borderRadius: '50%', 
              backgroundColor: '#fee2e2', 
              color: '#dc2626', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '1.75rem', 
              margin: '0 auto 1rem auto',
              border: '2px solid #fecaca'
            }}>
              ⚠️
            </div>

            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 0.45rem 0' }}>
              Batalkan Transaksi Pending?
            </h3>

            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', margin: '0 0 1.25rem 0', lineHeight: 1.45 }}>
              Pesanan tertahan ini akan dibatalkan dan dihapus permanen dari antrean riwayat pemasukan.
            </p>

            <div style={{ 
              backgroundColor: 'var(--color-bg-dark)', 
              borderRadius: '6px', 
              padding: '0.85rem 1rem', 
              border: '1px solid var(--color-border)', 
              textAlign: 'left',
              marginBottom: '1.25rem',
              fontSize: '0.8125rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>No. Transaksi:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 800, backgroundColor: '#ffffff', padding: '0.1rem 0.4rem', borderRadius: '3px', border: '1px solid var(--color-border)' }}>
                  {deleteConfirmTx.no_transaksi || deleteConfirmTx.id}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Mitra:</span>
                <span style={{ fontWeight: 700 }}>{deleteConfirmTx.seller || 'Umum'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Total Tagihan:</span>
                <span style={{ fontWeight: 900, color: 'var(--color-chocolate)', fontSize: '0.9375rem' }}>
                  Rp {deleteConfirmTx.total?.toLocaleString('id-ID')}
                </span>
              </div>
              {deleteConfirmTx.keterangan && (
                <div style={{ borderTop: '1px dashed var(--color-border)', paddingTop: '0.35rem', marginTop: '0.35rem', fontSize: '0.75rem', color: '#b45309' }}>
                                      <IconFileText className="inline-block mr-1" size={16}/> <em>{deleteConfirmTx.keterangan}</em>
                </div>
              )}
            </div>

            <div style={{ 
              backgroundColor: '#fffbeb', 
              border: '1px solid #fde68a', 
              padding: '0.6rem 0.75rem', 
              borderRadius: '4px', 
              fontSize: '0.72rem', 
              color: '#92400e', 
              marginBottom: '1.5rem',
              textAlign: 'left'
            }}>
              ℹ️ <em>Stok produk gerai tetap aman dan tidak terpotong karena transaksi ini berstatus pending.</em>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                type="button" 
                onClick={() => setDeleteConfirmTx(null)}
                disabled={deletingTxLoading}
                className="btn-secondary"
                style={{ flex: 1, padding: '0.65rem', fontWeight: 700 }}
              >
                KEMBALI
              </button>
              <button 
                type="button" 
                onClick={handleConfirmDeleteTx}
                disabled={deletingTxLoading}
                className="btn-primary"
                style={{ 
                  flex: 1.3, 
                  padding: '0.65rem', 
                  backgroundColor: 'var(--color-error)', 
                  borderColor: 'var(--color-error)',
                  fontWeight: 800
                }}
              >
                {deletingTxLoading ? 'MENGHAPUS...' : <IconTrash className="inline-block mr-1" size={16}/> YA, HAPUS}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
