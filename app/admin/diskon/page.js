'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useResponsivePagination } from '../../../lib/useResponsivePagination';
import {
  IconSearch,
  IconPlus,
  IconEdit,
  IconTrash,
  IconTag,
  IconX,
  IconAlertCircle,
  IconCheck,
  IconRefresh,
  IconArrowRight,
  IconMilk
} from '../../../components/ui/icons';
import { statusDiskon } from '../../../lib/diskon';

const STATUS_LABEL = {
  aktif: 'Aktif',
  nonaktif: 'Non-Aktif',
  belum_mulai: 'Belum Mulai',
  kedaluwarsa: 'Kedaluwarsa'
};

const fmtTanggal = (t) => new Date(`${t}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

function StatCard({ title, value, subtitle }) {
  return (
    <div className="panel" style={{ padding: '1rem 1.15rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        {title}
      </span>
      <p className="tabular" style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, overflowWrap: 'break-word', color: 'var(--terracotta)' }}>
        {value}
      </p>
      {subtitle && (
        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          {subtitle}
        </span>
      )}
    </div>
  );
}

export default function DiskonManagementPage() {
  const router = useRouter();
  const [diskonList, setDiskonList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Responsive Pagination
  const ITEMS_PER_PAGE = useResponsivePagination(5, 8, 12);
  const [currentPage, setCurrentPage] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedTipe, setSelectedTipe] = useState('ALL');

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({
    nama: '',
    tipe: 'persen',
    nilai: '',
    keterangan: '',
    tanggal_mulai: '',
    tanggal_selesai: '',
    is_active: true
  });
  const [processing, setProcessing] = useState(false);
  const [formError, setFormError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Confirmation Modal
  const [confirmModal, setConfirmModal] = useState({
    visible: false,
    title: '',
    message: '',
    onConfirm: null
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/diskon');
      const data = await res.json();
      if (data && Array.isArray(data.diskon)) {
        setDiskonList(data.diskon);
      } else {
        setDiskonList([]);
      }
    } catch (err) {
      console.error('Gagal memuat data diskon:', err);
      setDiskonList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    // Role protection: only admin
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        router.push('/login?role=admin');
        return;
      }
      const user = JSON.parse(userStr);
      if (!user || user.role !== 'admin') {
        router.push('/login?role=admin');
        return;
      }
    } catch (e) {
      router.push('/login?role=admin');
      return;
    }

    loadData();
  }, [router]);

  // KPI Calculations
  const totalCount = diskonList.length;
  const activeCount = diskonList.filter(d => statusDiskon(d) === 'aktif').length;
  const persenCount = diskonList.filter(d => d.tipe === 'persen').length;
  const nominalCount = diskonList.filter(d => d.tipe === 'nominal').length;

  // Filter discounts
  const filteredDiskon = diskonList.filter(d => {
    const matchSearch =
      (d.nama && d.nama.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.keterangan && d.keterangan.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchStatus =
      selectedStatus === 'ALL' ||
      (selectedStatus === 'ACTIVE' && statusDiskon(d) === 'aktif') ||
      (selectedStatus === 'INACTIVE' && statusDiskon(d) !== 'aktif');

    const matchTipe =
      selectedTipe === 'ALL' ||
      d.tipe === selectedTipe;

    return matchSearch && matchStatus && matchTipe;
  });

  const totalPages = Math.ceil(filteredDiskon.length / ITEMS_PER_PAGE) || 1;
  const safeCurrentPage = Math.min(currentPage, Math.max(0, totalPages - 1));
  const currentDiskon = filteredDiskon.slice(
    safeCurrentPage * ITEMS_PER_PAGE,
    (safeCurrentPage + 1) * ITEMS_PER_PAGE
  );

  // Open Modal Tambah
  const handleOpenAdd = () => {
    setEditItem(null);
    setFormData({
      nama: '',
      tipe: 'persen',
      nilai: '',
      keterangan: '',
      tanggal_mulai: '',
      tanggal_selesai: '',
      is_active: true
    });
    setFormError('');
    setModalVisible(true);
  };

  // Open Modal Edit
  const handleOpenEdit = (item) => {
    setEditItem(item);
    setFormData({
      nama: item.nama || '',
      tipe: item.tipe || 'persen',
      nilai: item.nilai !== undefined ? String(item.nilai) : '',
      keterangan: item.keterangan || '',
      tanggal_mulai: item.tanggal_mulai || '',
      tanggal_selesai: item.tanggal_selesai || '',
      is_active: item.is_active !== false
    });
    setFormError('');
    setModalVisible(true);
  };

  // Toggle Active Status Langsung dari Tabel
  const handleToggleActive = async (item) => {
    try {
      const newActive = !item.is_active;
      const res = await fetch('/api/diskon', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          is_active: newActive
        })
      });
      if (res.ok) {
        setDiskonList(prev => prev.map(d => d.id === item.id ? { ...d, is_active: newActive } : d));
        showToast(`Promo "${item.nama}" berhasil di${newActive ? 'aktifkan' : 'nonaktifkan'}.`);
      } else {
        alert('Gagal mengubah status promo.');
      }
    } catch (e) {
      alert('Terjadi kesalahan jaringan.');
    }
  };

  // Submit Simpan (Add/Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    const nama = formData.nama.trim();
    const nilai = Number(formData.nilai);

    if (!nama) {
      setFormError('Nama promo / diskon tidak boleh kosong.');
      return;
    }
    if (isNaN(nilai) || nilai <= 0) {
      setFormError('Nilai diskon harus angka lebih dari 0.');
      return;
    }
    if (formData.tipe === 'persen' && nilai > 100) {
      setFormError('Diskon persentase maksimal 100%.');
      return;
    }

    try {
      setProcessing(true);
      setFormError('');

      if (editItem) {
        // Edit Existing
        const res = await fetch('/api/diskon', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editItem.id,
            nama,
            tipe: formData.tipe,
            nilai,
            keterangan: formData.keterangan.trim(),
            tanggal_mulai: formData.tanggal_mulai || null,
            tanggal_selesai: formData.tanggal_selesai || null,
            is_active: formData.is_active
          })
        });
        const result = await res.json();
        if (res.ok) {
          setDiskonList(prev => prev.map(d => d.id === editItem.id ? (result.diskon || { ...d, ...formData, nilai }) : d));
          setModalVisible(false);
          showToast(`Promo "${nama}" berhasil diperbarui.`);
        } else {
          setFormError(result.error || 'Gagal memperbarui promo.');
        }
      } else {
        // Create New
        const res = await fetch('/api/diskon', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nama,
            tipe: formData.tipe,
            nilai,
            keterangan: formData.keterangan.trim(),
            tanggal_mulai: formData.tanggal_mulai || null,
            tanggal_selesai: formData.tanggal_selesai || null,
            is_active: formData.is_active
          })
        });
        const result = await res.json();
        if (res.ok) {
          if (result.diskon) {
            setDiskonList(prev => [result.diskon, ...prev]);
          } else {
            loadData();
          }
          setModalVisible(false);
          showToast(`Promo "${nama}" berhasil ditambahkan.`);
        } else {
          setFormError(result.error || 'Gagal menambahkan promo.');
        }
      }
    } catch (err) {
      setFormError('Terjadi kesalahan jaringan.');
    } finally {
      setProcessing(false);
    }
  };

  // Delete Prompt
  const handlePromptDelete = (item) => {
    setConfirmModal({
      visible: true,
      title: 'Hapus Diskon / Promo',
      message: `Apakah Anda yakin ingin menghapus promo "${item.nama}"? Promo ini tidak akan dapat dipilih lagi di kasir.`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/diskon?id=${item.id}`, { method: 'DELETE' });
          if (res.ok) {
            setDiskonList(prev => prev.filter(d => d.id !== item.id));
            setConfirmModal({ visible: false, title: '', message: '', onConfirm: null });
            showToast(`Promo "${item.nama}" berhasil dihapus.`);
          } else {
            alert('Gagal menghapus promo.');
          }
        } catch (err) {
          alert('Terjadi kesalahan jaringan saat menghapus promo.');
        }
      }
    });
  };

  if (!mounted) return null;

  return (
    <div style={{ padding: '1.25rem', maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 2000,
          backgroundColor: 'var(--text-primary)',
          color: '#ffffff',
          padding: '0.75rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          fontSize: '0.8125rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          animation: 'fadeIn 0.2s ease'
        }}>
          <IconCheck size={16} style={{ color: 'var(--status-success)' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--accent-subtle)',
              color: 'var(--accent-primary)'
            }}>
              <IconTag size={16} />
            </span>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Diskon & Promo Penjualan
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: '0.78125rem', color: 'var(--text-secondary)' }}>
            Hanya Admin yang dapat membuat dan mengatur diskon. Kasir hanya dapat memilih promo yang aktif.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button
            type="button"
            onClick={() => router.push('/kasir')}
            className="btn-secondary"
            style={{ padding: '0.55rem 0.85rem', fontSize: '0.8125rem', fontWeight: 600, gap: '0.4rem' }}
          >
            <IconMilk size={14} />
            <span>Terminal Kasir</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="btn-primary"
            style={{ padding: '0.55rem 1rem', fontSize: '0.8125rem', fontWeight: 700, gap: '0.45rem' }}
          >
            <IconPlus size={15} />
            <span>Tambah Promo</span>
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
        <StatCard title="Total Diskon" value={totalCount} subtitle="Semua voucher & promo tersimpan" />
        <StatCard title="Promo Aktif" value={activeCount} subtitle="Tersedia di dropdown kasir" />
        <StatCard title="Tipe Persentase" value={persenCount} subtitle="Diskon berbasis % subtotal" />
        <StatCard title="Tipe Nominal" value={nominalCount} subtitle="Potongan langsung tunai (Rp)" />
      </div>

      {/* Filter and Search Panel */}
      <div className="panel" style={{ padding: '0.85rem 1rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', flex: 1, minWidth: '280px' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }}>
              <IconSearch size={14} />
            </span>
            <input
              type="text"
              placeholder="Cari nama atau keterangan promo..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(0); }}
              className="input-field"
              style={{ paddingLeft: '2rem', fontSize: '0.8125rem', width: '100%' }}
            />
          </div>

          {/* Filter Status */}
          <select
            value={selectedStatus}
            onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(0); }}
            className="input-field"
            style={{ fontSize: '0.8125rem', width: 'auto', padding: '0.45rem 0.75rem' }}
          >
            <option value="ALL">Semua Status</option>
            <option value="ACTIVE">Aktif Saja</option>
            <option value="INACTIVE">Non-Aktif</option>
          </select>

          {/* Filter Tipe */}
          <select
            value={selectedTipe}
            onChange={(e) => { setSelectedTipe(e.target.value); setCurrentPage(0); }}
            className="input-field"
            style={{ fontSize: '0.8125rem', width: 'auto', padding: '0.45rem 0.75rem' }}
          >
            <option value="ALL">Semua Tipe Diskon</option>
            <option value="persen">Persentase (%)</option>
            <option value="nominal">Nominal (Rp)</option>
          </select>
        </div>

        <button
          type="button"
          onClick={loadData}
          className="btn-ghost"
          style={{ padding: '0.45rem 0.65rem', fontSize: '0.78125rem', gap: '0.35rem' }}
          title="Segarkan data"
        >
          <IconRefresh size={14} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Table Panel */}
      <div className="panel" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Memuat daftar diskon & promo...
          </div>
        ) : filteredDiskon.length === 0 ? (
          <div style={{ padding: '3.5rem 1rem', textAlign: 'center' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--surface-sunken)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-tertiary)',
              marginBottom: '0.75rem'
            }}>
              <IconTag size={22} />
            </div>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: '0 0 0.35rem 0', color: 'var(--text-primary)' }}>
              Tidak ada data diskon ditemukan
            </h3>
            <p style={{ fontSize: '0.78125rem', color: 'var(--text-secondary)', margin: '0 0 1rem 0' }}>
              {searchQuery || selectedStatus !== 'ALL' || selectedTipe !== 'ALL'
                ? 'Coba ganti filter atau kata kunci pencarian Anda.'
                : 'Mulai buat diskon atau voucher promo pertama untuk kasir.'}
            </p>
            {(!searchQuery && selectedStatus === 'ALL' && selectedTipe === 'ALL') && (
              <button
                type="button"
                onClick={handleOpenAdd}
                className="btn-primary"
                style={{ fontSize: '0.8125rem', padding: '0.5rem 1rem' }}
              >
                + Tambah Promo Pertama
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--surface-sunken)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>NAMA PROMO</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>TIPE DISKON</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>NILAI POTONGAN</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>KETERANGAN</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>MASA BERLAKU</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700, textAlign: 'center' }}>STATUS DI KASIR</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 700, textAlign: 'right' }}>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {currentDiskon.map((item) => {
                  const isActive = item.is_active !== false;
                  const status = statusDiskon(item);
                  const isBerlaku = status === 'aktif';
                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        backgroundColor: isBerlaku ? 'transparent' : 'var(--surface-sunken)',
                        opacity: isBerlaku ? 1 : 0.75,
                        transition: 'background-color 0.15s ease'
                      }}
                    >
                      {/* Nama Promo */}
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--accent-subtle)',
                            color: 'var(--accent-primary)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <IconTag size={13} />
                          </span>
                          <div>
                            <span style={{ display: 'block', fontSize: '0.84rem' }}>{item.nama}</span>
                            <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>ID: {item.id}</span>
                          </div>
                        </div>
                      </td>

                      {/* Tipe Diskon */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        {item.tipe === 'persen' ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.2rem 0.55rem',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            backgroundColor: 'var(--accent-subtle)',
                            color: 'var(--accent-primary)',
                            border: '1px solid var(--accent-border)'
                          }}>
                            % Persentase
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.2rem 0.55rem',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            backgroundColor: 'var(--surface-sunken)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-subtle)'
                          }}>
                            Rp Nominal
                          </span>
                        )}
                      </td>

                      {/* Nilai Potongan */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span className="tabular" style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--terracotta)' }}>
                          {item.tipe === 'persen' ? `${item.nilai}%` : `Rp ${Number(item.nilai || 0).toLocaleString('id-ID')}`}
                        </span>
                      </td>

                      {/* Keterangan */}
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', maxWidth: '240px' }}>
                        {item.keterangan ? item.keterangan : <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Tanpa catatan khusus</span>}
                      </td>

                      {/* Masa Berlaku */}
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', fontSize: '0.78rem' }}>
                        {item.tanggal_mulai || item.tanggal_selesai
                          ? `${item.tanggal_mulai ? fmtTanggal(item.tanggal_mulai) : 'Sejak dibuat'} – ${item.tanggal_selesai ? fmtTanggal(item.tanggal_selesai) : 'Tanpa batas'}`
                          : <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Tanpa batas</span>}
                      </td>

                      {/* Status Toggle */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleToggleActive(item)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.25rem 0.65rem',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            border: '1px solid',
                            backgroundColor: isBerlaku ? 'var(--status-success-bg)' : 'var(--status-danger-bg)',
                            borderColor: isBerlaku ? 'var(--status-success-border)' : 'var(--status-danger-border)',
                            color: isBerlaku ? 'var(--status-success)' : 'var(--status-danger)'
                          }}
                          title={`Klik untuk ${isActive ? 'nonaktifkan' : 'aktifkan'}`}
                        >
                          <span style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: isBerlaku ? 'var(--status-success)' : 'var(--status-danger)'
                          }} />
                          <span>{STATUS_LABEL[status]}</span>
                        </button>
                      </td>

                      {/* Aksi */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="btn-ghost"
                            style={{ padding: '0.35rem', color: 'var(--text-secondary)' }}
                            title="Edit Promo"
                          >
                            <IconEdit size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePromptDelete(item)}
                            className="btn-ghost"
                            style={{ padding: '0.35rem', color: 'var(--status-danger)' }}
                            title="Hapus Promo"
                          >
                            <IconTrash size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {filteredDiskon.length > 0 && (
          <div style={{
            padding: '0.75rem 1rem',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)'
          }}>
            <span>
              Menampilkan {safeCurrentPage * ITEMS_PER_PAGE + 1} - {Math.min((safeCurrentPage + 1) * ITEMS_PER_PAGE, filteredDiskon.length)} dari {filteredDiskon.length} promo
            </span>
            <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
              <button
                type="button"
                className="btn-secondary"
                disabled={safeCurrentPage === 0}
                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                style={{ padding: '0.25rem 0.55rem', fontSize: '0.72rem' }}
              >
                Sebelumnya
              </button>
              <span style={{ fontWeight: 600, padding: '0 0.35rem' }}>
                {safeCurrentPage + 1} / {totalPages}
              </span>
              <button
                type="button"
                className="btn-secondary"
                disabled={safeCurrentPage >= totalPages - 1}
                onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                style={{ padding: '0.25rem 0.55rem', fontSize: '0.72rem' }}
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL TAMBAH / EDIT DISKON                                                */}
      {/* ========================================================================= */}
      {modalVisible && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '480px', width: '92%' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--accent-subtle)',
                  color: 'var(--accent-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <IconTag size={15} />
                </span>
                <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>
                  {editItem ? 'Edit Diskon / Promo' : 'Tambah Promo Baru'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setModalVisible(false)}
                className="btn-ghost"
                style={{ width: '32px', height: '32px', padding: 0 }}
                aria-label="Tutup"
              >
                <IconX size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Nama Promo */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                  Nama Promo / Diskon <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Contoh: Diskon Karyawan & Mitra"
                  value={formData.nama}
                  onChange={e => setFormData({ ...formData, nama: e.target.value })}
                  style={{ width: '100%', fontSize: '0.8125rem', padding: '0.55rem 0.75rem' }}
                  required
                />
              </div>

              {/* Tipe Diskon Selection */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                  Tipe Potongan
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, tipe: 'persen' })}
                    style={{
                      padding: '0.65rem 0.5rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid',
                      borderColor: formData.tipe === 'persen' ? 'var(--terracotta)' : 'var(--border-subtle)',
                      backgroundColor: formData.tipe === 'persen' ? 'var(--terracotta-subtle)' : 'var(--surface-card)',
                      color: formData.tipe === 'persen' ? 'var(--terracotta)' : 'var(--text-secondary)',
                      fontWeight: 700,
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.2rem'
                    }}
                  >
                    <span>Persentase (%)</span>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 500, opacity: 0.85 }}>Potongan persen dari subtotal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, tipe: 'nominal' })}
                    style={{
                      padding: '0.65rem 0.5rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid',
                      borderColor: formData.tipe === 'nominal' ? 'var(--terracotta)' : 'var(--border-subtle)',
                      backgroundColor: formData.tipe === 'nominal' ? 'var(--terracotta-subtle)' : 'var(--surface-card)',
                      color: formData.tipe === 'nominal' ? 'var(--terracotta)' : 'var(--text-secondary)',
                      fontWeight: 700,
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.2rem'
                    }}
                  >
                    <span>Nominal Tunai (Rp)</span>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 500, opacity: 0.85 }}>Potongan rupiah langsung</span>
                  </button>
                </div>
              </div>

              {/* Nilai Diskon */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                  {formData.tipe === 'persen' ? 'Besar Persentase (1 - 100%)' : 'Nominal Potongan (Rp)'} <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    min="1"
                    max={formData.tipe === 'persen' ? '100' : undefined}
                    step={formData.tipe === 'persen' ? '1' : '500'}
                    className="input-field"
                    placeholder={formData.tipe === 'persen' ? '15' : '5000'}
                    value={formData.nilai}
                    onChange={e => setFormData({ ...formData, nilai: e.target.value })}
                    style={{ width: '100%', fontSize: '0.875rem', fontWeight: 700, padding: '0.55rem 0.75rem', paddingRight: '3.5rem' }}
                    required
                  />
                  <span style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    color: 'var(--text-tertiary)'
                  }}>
                    {formData.tipe === 'persen' ? '%' : 'IDR'}
                  </span>
                </div>
              </div>

              {/* Masa Berlaku */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                  Masa Berlaku (Opsional)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--text-tertiary)', marginBottom: '0.2rem' }}>Mulai</span>
                    <input
                      type="date"
                      className="input-field"
                      value={formData.tanggal_mulai}
                      onChange={e => setFormData({ ...formData, tanggal_mulai: e.target.value })}
                    />
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--text-tertiary)', marginBottom: '0.2rem' }}>Berakhir (inklusif)</span>
                    <input
                      type="date"
                      className="input-field"
                      min={formData.tanggal_mulai || undefined}
                      value={formData.tanggal_selesai}
                      onChange={e => setFormData({ ...formData, tanggal_selesai: e.target.value })}
                    />
                  </div>
                </div>
                <p style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', marginTop: '0.3rem' }}>
                  Kosongkan untuk tanpa batas. Setelah tanggal berakhir, promo otomatis hilang dari kasir.
                </p>
              </div>

              {/* Keterangan */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                  Keterangan / Syarat Ketentuan (Opsional)
                </label>
                <textarea
                  className="input-field"
                  rows={2}
                  placeholder="Contoh: Khusus pembelian produk susu botol 1 Liter atau belanja min 50rb"
                  value={formData.keterangan}
                  onChange={e => setFormData({ ...formData, keterangan: e.target.value })}
                  style={{ width: '100%', fontSize: '0.8125rem', padding: '0.55rem 0.75rem', resize: 'vertical' }}
                />
              </div>

              {/* Status Aktif Checkbox */}
              <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="promo_is_active"
                  checked={formData.is_active}
                  onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--terracotta)', cursor: 'pointer' }}
                />
                <label htmlFor="promo_is_active" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}>
                  Aktifkan promo ini di kasir sekarang
                </label>
              </div>

              {/* Error Alert */}
              {formError && (
                <div style={{
                  padding: '0.55rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--status-danger-bg)',
                  border: '1px solid var(--status-danger-border)',
                  color: 'var(--status-danger)',
                  fontSize: '0.78125rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  marginBottom: '1rem'
                }}>
                  <IconAlertCircle size={15} />
                  <span>{formError}</span>
                </div>
              )}

              {/* Modal Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem' }}>
                <button
                  type="button"
                  onClick={() => setModalVisible(false)}
                  className="btn-secondary"
                  style={{ flex: 1, padding: '0.65rem' }}
                  disabled={processing}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1.5, padding: '0.65rem', fontWeight: 700 }}
                  disabled={processing}
                >
                  {processing ? 'Menyimpan...' : (editItem ? 'Simpan Perubahan' : 'Buat Promo')}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL KONFIRMASI HAPUS                                                    */}
      {/* ========================================================================= */}
      {confirmModal.visible && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content" style={{ maxWidth: '420px', width: '92%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--status-danger)' }}>
              <IconAlertCircle size={22} />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>{confirmModal.title}</h3>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 1.25rem 0' }}>
              {confirmModal.message}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setConfirmModal({ visible: false, title: '', message: '', onConfirm: null })}
                className="btn-secondary"
                style={{ padding: '0.55rem 0.85rem', fontSize: '0.8125rem' }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="btn-danger"
                style={{
                  padding: '0.55rem 1rem',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  backgroundColor: 'var(--status-danger)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer'
                }}
              >
                Hapus Promo
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
