'use client';
import { useState, useEffect } from 'react';
import { useResponsivePagination } from '../../../lib/useResponsivePagination';

const ROLE_LABELS = {
  admin: { label: 'Admin Utama', badgeColor: '#5a321c', badgeBg: '#f8f3ee', icon: '👑' },
  kasir: { label: 'Kasir POS', badgeColor: '#7c4a2d', badgeBg: '#f8f3ee', icon: '💵' },
  barista: { label: 'Barista / Peracik', badgeColor: '#a26744', badgeBg: '#faf5f0', icon: '🥛' },
  staff: { label: 'Staff Operasional', badgeColor: '#0a0a0a', badgeBg: '#f4f4f5', icon: '📦' },
  kurir: { label: 'Kurir / Driver', badgeColor: '#693d24', badgeBg: '#f8f3ee', icon: '🛵' },
};

function StatCard({ title, value, subtitle }) {
  return (
    <div className="card" style={{ padding: '1rem 1.15rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderLeft: '4px solid var(--color-chocolate)', backgroundColor: '#ffffff' }}>
      <h3 style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--color-text-secondary)', marginBottom: '0.35rem', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
        {title}
      </h3>
      <p style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0, overflowWrap: 'break-word', color: 'var(--color-chocolate)' }}>
        {value}
      </p>
      {subtitle && (
        <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
          {subtitle}
        </span>
      )}
    </div>
  );
}

export default function KaryawanPage() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ total: 0, aktif: 0, kasir: 0, admin: 0, operasional: 0 });
  const [loading, setLoading] = useState(true);

  // Responsive Pagination (5 di Mobile, 8 di Tablet, 12 di Desktop)
  const ITEMS_PER_PAGE = useResponsivePagination(5, 8, 12);
  const [currentPage, setCurrentPage] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({
    nama: '',
    username: '',
    password: '',
    role: 'kasir',
    shift: 'Shift 1 (08:00 - 16:00)',
    is_active: true
  });
  const [processing, setProcessing] = useState(false);
  const [formError, setFormError] = useState('');

  // Confirmation Modal
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
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (selectedRole !== 'ALL') params.set('role', selectedRole);
    if (selectedStatus !== 'ALL') params.set('status', selectedStatus);

    fetch(`/api/karyawan?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        setUsers(data.users || []);
        if (data.stats) setStats(data.stats);
        setLoading(false);
      })
      .catch(() => {
        setUsers([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    setCurrentPage(0);
    loadData();
  }, [searchQuery, selectedRole, selectedStatus]);

  const openAddModal = () => {
    setEditItem(null);
    setFormData({
      nama: '',
      username: '',
      password: '',
      role: 'kasir',
      shift: 'Shift 1 (08:00 - 16:00)',
      is_active: true
    });
    setFormError('');
    setModalVisible(true);
  };

  const openEditModal = (user) => {
    setEditItem(user);
    setFormData({
      id: user.id,
      nama: user.nama,
      username: user.username,
      password: '', // Blank unless admin wants to update password
      role: user.role,
      shift: user.shift || 'Shift 1 (08:00 - 16:00)',
      is_active: user.is_active
    });
    setFormError('');
    setModalVisible(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');
    setProcessing(true);

    const method = editItem ? 'PUT' : 'POST';
    const payload = { ...formData };

    try {
      const res = await fetch('/api/karyawan', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Terjadi kesalahan saat menyimpan data');
      }

      setModalVisible(false);
      loadData();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const toggleStatus = (user) => {
    const isDeactivating = user.is_active;
    setConfirmModal({
      visible: true,
      title: isDeactivating ? 'Nonaktifkan Akun Karyawan?' : 'Aktifkan Kembali Karyawan?',
      message: isDeactivating 
        ? `Akun "${user.nama}" (@${user.username}) tidak akan dapat login ke sistem kasir/admin setelah dinonaktifkan.`
        : `Akun "${user.nama}" (@${user.username}) akan dapat kembali mengakses sistem.`,
      confirmText: isDeactivating ? 'YA, NONAKTIFKAN' : 'YA, AKTIFKAN',
      confirmVariant: isDeactivating ? 'danger' : 'primary',
      onConfirm: async () => {
        try {
          const res = await fetch('/api/karyawan', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: user.id,
              is_active: !user.is_active
            })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Gagal mengubah status');
          loadData();
        } catch (err) {
          alert(err.message);
        } finally {
          setConfirmModal(prev => ({ ...prev, visible: false }));
        }
      }
    });
  };

  const paginatedUsers = users.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(users.length / ITEMS_PER_PAGE);

  return (
    <div className="admin-page-container">
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, letterSpacing: '0.5px' }}>
            MANAJEMEN KARYAWAN
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', margin: '0.35rem 0 0 0', fontSize: '0.85rem' }}>
            Kelola data staf, hak akses, kontak, dan jadwal shift tim Andini Pure Milk
          </p>
        </div>
        <button 
          onClick={openAddModal} 
          className="btn-chocolate" 
          style={{ padding: '0.65rem 1.15rem', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}
        >
          <span>+</span>
          <span>TAMBAH KARYAWAN</span>
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="responsive-stats-grid" style={{ marginBottom: '1.5rem' }}>
        <StatCard title="TOTAL KARYAWAN" value={`${stats.total} Orang`} subtitle={`${stats.aktif} Berstatus Aktif`} />
        <StatCard title="KASIR OUTLET (POS)" value={`${stats.kasir} Kasir`} subtitle="Bertugas melayani transaksi" />
        <StatCard title="ADMIN & MANAJER" value={`${stats.admin} Akun`} subtitle="Akses kontrol & pelaporan" />
        <StatCard title="TIM OPERASIONAL" value={`${stats.operasional} Staf`} subtitle="Barista, staf gudang, & kurir" />
      </div>

      {/* Filter & Search Bar */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.25rem' }}>
        <div className="responsive-filter-bar">
          {/* Search Input */}
          <div style={{ flex: 2, minWidth: '180px' }}>
            <input 
              type="text" 
              className="input-field"
              placeholder="🔍 Cari nama, username, telp..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: '0.65rem 0.85rem', fontSize: '0.875rem' }}
            />
          </div>

          {/* Filter Role */}
          <div style={{ flex: 1, minWidth: '150px' }}>
            <select 
              className="input-field"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              style={{ padding: '0.65rem 0.85rem', fontSize: '0.875rem' }}
            >
              <option value="ALL">-- SEMUA JABATAN --</option>
              <option value="admin">Admin Utama</option>
              <option value="kasir">Kasir Outlet (POS)</option>
              <option value="barista">Barista / Peracik Susu</option>
              <option value="staff">Staff Operasional / Gudang</option>
              <option value="kurir">Kurir / Driver Pengantaran</option>
            </select>
          </div>

          {/* Filter Status */}
          <div style={{ flex: 1, minWidth: '140px' }}>
            <select 
              className="input-field"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{ padding: '0.65rem 0.85rem', fontSize: '0.875rem' }}
            >
              <option value="ALL">-- SEMUA STATUS --</option>
              <option value="ACTIVE">Aktif Saja</option>
              <option value="INACTIVE">Nonaktif Saja</option>
            </select>
          </div>
        </div>
      </div>

      {/* Karyawan Data Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', minWidth: '700px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-bg-dark)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', textAlign: 'left', fontSize: '0.6875rem', letterSpacing: '0.5px' }}>
                <th style={{ padding: '0.85rem 1rem', width: '50px' }}>NO</th>
                <th style={{ padding: '0.85rem 1rem' }}>NAMA & JABATAN</th>
                <th style={{ padding: '0.85rem 1rem' }}>USERNAME / AKSES</th>
                <th style={{ padding: '0.85rem 1rem' }}>SHIFT KERJA</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>STATUS</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right', width: '180px' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-text-secondary)' }}>
                    Memuat data karyawan...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-text-secondary)' }}>
                    Tidak ada data karyawan yang sesuai filter.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u, idx) => {
                  const roleMeta = ROLE_LABELS[u.role] || { label: u.role, badgeColor: '#374151', badgeBg: '#f3f4f6', icon: '👤' };
                  const isPrimaryAdmin = u.id === 'u1' || u.username === 'admin';

                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: !u.is_active ? 'rgba(0,0,0,0.02)' : 'transparent' }}>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--color-text-secondary)', fontWeight: 700 }}>
                        {(currentPage * ITEMS_PER_PAGE) + idx + 1}
                      </td>
                      
                      {/* Name & Role */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <div style={{ 
                            width: '34px', 
                            height: '34px', 
                            borderRadius: '50%', 
                            backgroundColor: roleMeta.badgeBg, 
                            color: roleMeta.badgeColor, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            fontSize: '14px',
                            fontWeight: 800,
                            flexShrink: 0
                          }}>
                            {roleMeta.icon}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: 'var(--color-text-primary)', fontSize: '0.875rem' }}>
                              {u.nama}
                            </div>
                            <span style={{ 
                              display: 'inline-block', 
                              padding: '0.15rem 0.45rem', 
                              borderRadius: '3px', 
                              fontSize: '0.6875rem', 
                              fontWeight: 700, 
                              backgroundColor: roleMeta.badgeBg, 
                              color: roleMeta.badgeColor,
                              marginTop: '2px'
                            }}>
                              {roleMeta.label}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Username */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.8125rem' }}>
                          @{u.username}
                        </div>
                        <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-secondary)' }}>
                          Terdaftar: {u.tanggal_masuk}
                        </span>
                      </td>

                      {/* Shift Kerja */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                          ⏰ {u.shift || '-'}
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                        <span style={{ 
                          display: 'inline-block', 
                          padding: '0.2rem 0.55rem', 
                          borderRadius: '12px', 
                          fontSize: '0.6875rem', 
                          fontWeight: 800, 
                          backgroundColor: u.is_active ? '#dcfce7' : '#fee2e2', 
                          color: u.is_active ? '#15803d' : '#b91c1c' 
                        }}>
                          {u.is_active ? '● AKTIF' : '○ NONAKTIF'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.45rem' }}>
                          <button 
                            onClick={() => openEditModal(u)}
                            className="btn-secondary" 
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', fontWeight: 700 }}
                            title="Edit data karyawan"
                          >
                            UBAH
                          </button>
                          
                          {!isPrimaryAdmin && (
                            <button 
                              onClick={() => toggleStatus(u)}
                              style={{ 
                                padding: '0.35rem 0.65rem', 
                                fontSize: '0.75rem', 
                                fontWeight: 700,
                                borderRadius: '4px',
                                border: '1px solid var(--color-border)',
                                backgroundColor: 'transparent',
                                color: u.is_active ? 'var(--color-error)' : '#15803d',
                                cursor: 'pointer'
                              }}
                              title={u.is_active ? 'Nonaktifkan akun karyawan' : 'Aktifkan kembali akun karyawan'}
                            >
                              {u.is_active ? 'NONAKTIF' : 'AKTIFKAN'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {users.length > ITEMS_PER_PAGE && (
          <div className="responsive-pagination" style={{ padding: '0.85rem 1rem', borderTop: '1px solid var(--color-border)' }}>
            <button 
              onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))} 
              disabled={currentPage === 0}
              className="btn-secondary"
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.8125rem' }}
            >
              &larr; SEBELUMNYA
            </button>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-secondary)', textAlign: 'center' }}>
              Menampilkan {users.length === 0 ? 0 : currentPage * ITEMS_PER_PAGE + 1} - {Math.min((currentPage + 1) * ITEMS_PER_PAGE, users.length)} dari {users.length} karyawan &bull; Halaman {currentPage + 1} dari {totalPages}
            </span>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))} 
              disabled={currentPage >= totalPages - 1}
              className="btn-secondary"
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.8125rem' }}
            >
              SELANJUTNYA &rarr;
            </button>
          </div>
        )}
      </div>

      {/* MODAL: Tambah / Edit Karyawan */}
      {modalVisible && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', 
          backdropFilter: 'blur(3px)',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 10000,
          padding: '1rem'
        }}>
          <div className="card modal-content" style={{ width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
                {editItem ? 'UBAH DATA KARYAWAN' : 'TAMBAH KARYAWAN BARU'}
              </h2>
              <button 
                onClick={() => setModalVisible(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', fontWeight: 800 }}
              >
                &times;
              </button>
            </div>

            {formError && (
              <div style={{ padding: '0.65rem 0.85rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '4px', fontSize: '0.8125rem', marginBottom: '1rem', fontWeight: 600 }}>
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleSave}>
              {/* Nama Lengkap */}
              <div style={{ marginBottom: '0.85rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--color-text-secondary)' }}>
                  NAMA LENGKAP *
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="Contoh: Siti Rahma"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', fontSize: '0.8125rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                />
              </div>

              {/* Username & Role (Grid 2 Kolom) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--color-text-secondary)' }}>
                    USERNAME LOGIN *
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="contoh: siti_kasir"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', fontSize: '0.8125rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--color-text-secondary)' }}>
                    JABATAN / ROLE *
                  </label>
                  <select 
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', fontSize: '0.8125rem', borderRadius: '4px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-light)' }}
                  >
                    <option value="kasir">Kasir POS</option>
                    <option value="barista">Barista / Peracik</option>
                    <option value="staff">Staff Operasional</option>
                    <option value="kurir">Kurir / Driver</option>
                    <option value="admin">Admin Utama</option>
                  </select>
                </div>
              </div>

              {/* Password */}
              <div style={{ marginBottom: '0.85rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--color-text-secondary)' }}>
                  PASSWORD {editItem ? '(Kosongkan jika tidak ingin diubah)' : '*'}
                </label>
                <input 
                  type="password" 
                  required={!editItem}
                  placeholder={editItem ? 'Masukkan password baru...' : 'Password login akun'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', fontSize: '0.8125rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                />
              </div>

              {/* Shift Kerja */}
              <div style={{ marginBottom: '0.85rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--color-text-secondary)' }}>
                  SHIFT KERJA
                </label>
                <input 
                  type="text" 
                  placeholder="Shift 1 / Shift 2 / Full Time"
                  value={formData.shift}
                  onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', fontSize: '0.8125rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                />
              </div>

              {/* Status Akun */}
              {editItem && (
                <div style={{ marginBottom: '1.25rem', padding: '0.75rem', backgroundColor: 'var(--color-bg-dark)', borderRadius: '4px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 700 }}>
                    <input 
                      type="checkbox" 
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      disabled={editItem.id === 'u1' || editItem.username === 'admin'}
                    />
                    <span>Akun Aktif (Dapat Login ke Sistem)</span>
                  </label>
                  {(editItem.id === 'u1' || editItem.username === 'admin') && (
                    <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-secondary)', display: 'block', marginTop: '2px' }}>
                      * Akun Admin Utama tidak dapat dinonaktifkan.
                    </span>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '1.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                <button 
                  type="button" 
                  onClick={() => setModalVisible(false)}
                  className="btn-secondary"
                  disabled={processing}
                  style={{ padding: '0.55rem 1rem', fontSize: '0.8125rem' }}
                >
                  BATAL
                </button>
                <button 
                  type="submit" 
                  className="btn-chocolate"
                  disabled={processing}
                  style={{ padding: '0.55rem 1.25rem', fontSize: '0.8125rem' }}
                >
                  {processing ? 'MENYIMPAN...' : (editItem ? 'SIMPAN PERUBAHAN' : 'TAMBAH KARYAWAN')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      {confirmModal.visible && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', 
          backdropFilter: 'blur(3px)',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 10001,
          padding: '1rem'
        }}>
          <div className="card modal-content" style={{ width: '100%', maxWidth: '420px', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>
              {confirmModal.title}
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              {confirmModal.message}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
              <button 
                onClick={() => setConfirmModal(prev => ({ ...prev, visible: false }))}
                className="btn-secondary"
                style={{ padding: '0.5rem 0.85rem', fontSize: '0.75rem' }}
              >
                BATAL
              </button>
              <button 
                onClick={confirmModal.onConfirm}
                className={confirmModal.confirmVariant === 'danger' ? 'btn-danger' : 'btn-primary'}
                style={{ 
                  padding: '0.5rem 1rem', 
                  fontSize: '0.75rem',
                  backgroundColor: confirmModal.confirmVariant === 'danger' ? 'var(--color-error)' : 'var(--color-text-primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  fontWeight: 800,
                  cursor: 'pointer'
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
