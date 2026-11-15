'use client';
import { useState, useEffect } from 'react';
import { useResponsivePagination } from '../../../lib/useResponsivePagination';
import {
  IconSearch,
  IconPlus,
  IconEdit,
  IconTrash,
  IconStore,
  IconMapPin,
  IconUser,
  IconX,
  IconAlertCircle,
  IconCheck,
  IconRefresh
} from '../../../components/ui/icons';

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

export default function BoothManagementPage() {
  const [booths, setBooths] = useState([]);
  const [loading, setLoading] = useState(true);

  // Responsive Pagination
  const ITEMS_PER_PAGE = useResponsivePagination(5, 8, 12);
  const [currentPage, setCurrentPage] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({
    nama: '',
    lokasi: '',
    penanggung_jawab: '',
    is_active: true
  });
  const [processing, setProcessing] = useState(false);
  const [formError, setFormError] = useState('');

  // Confirmation Modal
  const [confirmModal, setConfirmModal] = useState({
    visible: false,
    title: '',
    message: '',
    confirmText: 'YA, HAPUS',
    confirmVariant: 'danger',
    onConfirm: null
  });

  const loadData = () => {
    setLoading(true);
    fetch('/api/booth')
      .then(res => res.json())
      .then(data => {
        setBooths(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Gagal memuat daftar booth:', err);
        setBooths([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter booths
  const filteredBooths = booths.filter(b => {
    const matchSearch =
      b.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.lokasi && b.lokasi.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (b.penanggung_jawab && b.penanggung_jawab.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchStatus =
      selectedStatus === 'ALL' ||
      (selectedStatus === 'ACTIVE' && b.is_active !== false) ||
      (selectedStatus === 'INACTIVE' && b.is_active === false);

    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filteredBooths.length / ITEMS_PER_PAGE) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages - 1);
  const currentBooths = filteredBooths.slice(
    safeCurrentPage * ITEMS_PER_PAGE,
    (safeCurrentPage + 1) * ITEMS_PER_PAGE
  );

  // KPI Calculations
  const totalCount = booths.length;
  const activeCount = booths.filter(b => b.is_active !== false).length;
  const inactiveCount = totalCount - activeCount;

  // Open Modal Tambah
  const handleOpenAdd = () => {
    setEditItem(null);
    setFormData({
      nama: '',
      lokasi: '',
      penanggung_jawab: '',
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
      lokasi: item.lokasi || '',
      penanggung_jawab: item.penanggung_jawab || '',
      is_active: item.is_active !== false
    });
    setFormError('');
    setModalVisible(true);
  };

  // Submit Add / Edit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nama.trim()) {
      setFormError('Nama gerai / booth wajib diisi.');
      return;
    }

    setProcessing(true);
    setFormError('');

    try {
      const url = '/api/booth';
      const method = editItem ? 'PUT' : 'POST';
      const payload = editItem ? { id: editItem.id, ...formData } : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setFormError(data.error || 'Terjadi kesalahan saat menyimpan data booth.');
        setProcessing(false);
        return;
      }

      setModalVisible(false);
      setProcessing(false);
      loadData();
    } catch (err) {
      setFormError('Terjadi kesalahan jaringan.');
      setProcessing(false);
    }
  };

  // Delete Booth
  const handleDeleteClick = (item) => {
    setConfirmModal({
      visible: true,
      title: 'Hapus Gerai / Booth',
      message: `Apakah Anda yakin ingin menghapus "${item.nama}"? Aksi ini tidak dapat dibatalkan.`,
      confirmText: 'YA, HAPUS',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/booth?id=${item.id}`, { method: 'DELETE' });
          const data = await res.json();
          if (res.ok && !data.error) {
            setConfirmModal(prev => ({ ...prev, visible: false }));
            loadData();
          } else {
            alert(data.error || 'Gagal menghapus booth.');
          }
        } catch (e) {
          alert('Terjadi kesalahan koneksi.');
        }
      }
    });
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Kelola Booth Penjualan
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
            Daftar titik gerai resmi dan lokasi operasional kasir Andini Pure Milk
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            onClick={loadData}
            className="btn btn-secondary"
            style={{ padding: '0.45rem 0.65rem' }}
            title="Muat Ulang"
          >
            <IconRefresh size={15} />
          </button>
          <button
            onClick={handleOpenAdd}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.9rem', fontSize: '0.8125rem', fontWeight: 600 }}
          >
            <IconPlus size={15} />
            <span>TAMBAH BOOTH</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
        <StatCard
          title="Total Gerai Terdaftar"
          value={totalCount}
          subtitle="Semua titik penjualan Andini"
        />
        <StatCard
          title="Gerai Aktif Beroperasi"
          value={activeCount}
          subtitle="Tersedia di login & POS kasir"
        />
        <StatCard
          title="Gerai Non-Aktif / Event"
          value={inactiveCount}
          subtitle="Gerai off atau musiman"
        />
      </div>

      {/* Panel Tabel & Filter */}
      <div className="panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: '260px', maxWidth: '480px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type="text"
                placeholder="Cari nama booth, alamat, atau PIC..."
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(0);
                }}
                className="input"
                style={{ width: '100%', paddingLeft: '2.25rem', fontSize: '0.8125rem', height: '36px' }}
              />
              <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }}>
                <IconSearch size={15} />
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={selectedStatus}
              onChange={e => {
                setSelectedStatus(e.target.value);
                setCurrentPage(0);
              }}
              className="input"
              style={{ fontSize: '0.8125rem', height: '36px', padding: '0 0.65rem' }}
            >
              <option value="ALL">Semua Status</option>
              <option value="ACTIVE">Aktif Saja</option>
              <option value="INACTIVE">Nonaktif Saja</option>
            </select>
          </div>
        </div>

        {/* Tabel Data */}
        <div style={{ overflowX: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--surface-sunken)', borderBottom: '1px solid var(--border-subtle)' }}>
                <th style={{ padding: '0.65rem 0.85rem', width: '50px', fontWeight: 600, color: 'var(--text-secondary)' }}>NO</th>
                <th style={{ padding: '0.65rem 0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>NAMA GERAI / BOOTH</th>
                <th style={{ padding: '0.65rem 0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>LOKASI / ALAMAT</th>
                <th style={{ padding: '0.65rem 0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>PENANGGUNG JAWAB (PIC)</th>
                <th style={{ padding: '0.65rem 0.85rem', fontWeight: 600, color: 'var(--text-secondary)', width: '110px' }}>STATUS</th>
                <th style={{ padding: '0.65rem 0.85rem', fontWeight: 600, color: 'var(--text-secondary)', width: '120px', textAlign: 'right' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Memuat daftar booth...
                  </td>
                </tr>
              ) : currentBooths.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Tidak ada booth yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                currentBooths.map((item, idx) => {
                  const globalIdx = safeCurrentPage * ITEMS_PER_PAGE + idx + 1;
                  const isActive = item.is_active !== false;

                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        backgroundColor: idx % 2 === 1 ? 'var(--surface-sunken)' : 'transparent'
                      }}
                    >
                      <td className="tabular" style={{ padding: '0.75rem 0.85rem', color: 'var(--text-tertiary)' }}>
                        {globalIdx}
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                          <span style={{ color: 'var(--terracotta)', display: 'flex' }}>
                            <IconStore size={16} />
                          </span>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {item.nama}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem', color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <IconMapPin size={13} style={{ color: 'var(--text-tertiary)' }} />
                          <span>{item.lokasi || '-'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem', color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <IconUser size={13} style={{ color: 'var(--text-tertiary)' }} />
                          <span>{item.penanggung_jawab || '-'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem' }}>
                        <span
                          className={`badge ${isActive ? 'badge-forest' : 'badge-neutral'}`}
                          style={{ fontSize: '0.6875rem', padding: '0.18rem 0.5rem', borderRadius: 'var(--radius-sm)' }}
                        >
                          {isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="btn btn-secondary"
                            style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}
                            title="Edit Booth"
                          >
                            <IconEdit size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(item)}
                            className="btn btn-secondary"
                            style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem', color: 'var(--status-danger)' }}
                            title="Hapus Booth"
                          >
                            <IconTrash size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Menampilkan {safeCurrentPage * ITEMS_PER_PAGE + 1} - {Math.min((safeCurrentPage + 1) * ITEMS_PER_PAGE, filteredBooths.length)} dari {filteredBooths.length} booth
            </span>
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              <button
                disabled={safeCurrentPage === 0}
                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                className="btn btn-secondary"
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
              >
                Sebelumnya
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i)}
                  className={`btn ${safeCurrentPage === i ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', minWidth: '30px' }}
                >
                  {i + 1}
                </button>
              ))}
              <button
                disabled={safeCurrentPage >= totalPages - 1}
                onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                className="btn btn-secondary"
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
              >
                Berikutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Tambah / Edit Booth */}
      {modalVisible && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="panel" style={{ width: '100%', maxWidth: '480px', padding: 0, overflow: 'hidden' }}>
            {/* Modal Header */}
            <div style={{
              padding: '1rem 1.25rem',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'var(--surface-sunken)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <IconStore size={18} style={{ color: 'var(--terracotta)' }} />
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  {editItem ? 'Edit Data Booth' : 'Tambah Booth Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalVisible(false)}
                style={{ border: 'none', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
              >
                <IconX size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {formError && (
                <div style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--status-danger-bg)',
                  border: '1px solid var(--status-danger-border)',
                  color: 'var(--status-danger)',
                  fontSize: '0.78125rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem'
                }}>
                  <IconAlertCircle size={15} />
                  <span>{formError}</span>
                </div>
              )}

              {/* Nama Booth */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  NAMA BOOTH / GERAI *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Booth 6 - Pasar Rogojampi"
                  value={formData.nama}
                  onChange={e => setFormData({ ...formData, nama: e.target.value })}
                  className="input"
                  style={{ width: '100%', fontSize: '0.8125rem' }}
                  required
                />
              </div>

              {/* Lokasi / Alamat */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  LOKASI / ALAMAT OPERASIONAL
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Jl. Diponegoro Depan RTH"
                  value={formData.lokasi}
                  onChange={e => setFormData({ ...formData, lokasi: e.target.value })}
                  className="input"
                  style={{ width: '100%', fontSize: '0.8125rem' }}
                />
              </div>

              {/* Penanggung Jawab */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  PENANGGUNG JAWAB (PIC)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Siti Rahma / Tim Lapangan"
                  value={formData.penanggung_jawab}
                  onChange={e => setFormData({ ...formData, penanggung_jawab: e.target.value })}
                  className="input"
                  style={{ width: '100%', fontSize: '0.8125rem' }}
                />
              </div>

              {/* Status Aktif */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', paddingTop: '0.25rem' }}>
                <input
                  type="checkbox"
                  id="booth_is_active"
                  checked={formData.is_active}
                  onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                  style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                />
                <label htmlFor="booth_is_active" style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-primary)', cursor: 'pointer' }}>
                  Aktifkan gerai ini untuk login kasir dan transaksi penjualan
                </label>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setModalVisible(false)}
                  className="btn btn-secondary"
                  style={{ padding: '0.5rem 0.9rem', fontSize: '0.8125rem' }}
                  disabled={processing}
                >
                  BATAL
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '0.5rem 1.15rem', fontSize: '0.8125rem', fontWeight: 600 }}
                  disabled={processing}
                >
                  {processing ? 'MENYIMPAN...' : editItem ? 'SIMPAN PERUBAHAN' : 'TAMBAHKAN BOOTH'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.visible && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1100,
          padding: '1rem'
        }}>
          <div className="panel" style={{ width: '100%', maxWidth: '420px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem', color: 'var(--status-danger)' }}>
              <IconAlertCircle size={20} />
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                {confirmModal.title}
              </h3>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0 0 1.25rem 0', lineHeight: 1.5 }}>
              {confirmModal.message}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setConfirmModal(prev => ({ ...prev, visible: false }))}
                className="btn btn-secondary"
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.8125rem' }}
              >
                BATAL
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="btn btn-primary"
                style={{
                  padding: '0.45rem 1rem',
                  fontSize: '0.8125rem',
                  backgroundColor: 'var(--status-danger)',
                  borderColor: 'var(--status-danger)'
                }}
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
