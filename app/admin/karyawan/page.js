'use client';
import { useState, useEffect } from 'react';
import { useResponsivePagination } from '../../../lib/useResponsivePagination';
import {
  IconSearch,
  IconPlus,
  IconEdit,
  IconShield,
  IconReceipt,
  IconMilk,
  IconPackage,
  IconTruck,
  IconClock,
  IconUser,
  IconX,
  IconAlertCircle,
  IconRefresh
} from '../../../components/ui/icons';

const ROLE_LABELS = {
  admin: { label: 'Admin Utama', badgeClass: 'badge-chocolate', Icon: IconShield },
  kasir: { label: 'Kasir POS', badgeClass: 'badge-chocolate', Icon: IconReceipt },
  barista: { label: 'Barista / Peracik', badgeClass: 'badge-neutral', Icon: IconMilk },
  staff: { label: 'Staff Operasional', badgeClass: 'badge-neutral', Icon: IconPackage },
  kurir: { label: 'Kurir / Driver', badgeClass: 'badge-neutral', Icon: IconTruck },
};

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
      confirmText: isDeactivating ? 'Ya, Nonaktifkan' : 'Ya, Aktifkan',
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Manajemen Karyawan
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.2rem 0 0 0', fontSize: '0.75rem' }}>
            Kelola data staf, hak akses peran, dan jadwal shift tim Andini Pure Milk
          </p>
        </div>
        <button 
          type="button"
          onClick={openAddModal} 
          className="btn-primary" 
          style={{ padding: '0.55rem 1rem', fontSize: '0.8125rem' }}
        >
          <IconPlus size={15} />
          <span>Tambah Karyawan</span>
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="responsive-stats-grid" style={{ marginBottom: '1.25rem' }}>
        <StatCard title="Total Karyawan" value={`${stats.total} Orang`} subtitle={`${stats.aktif} berstatus aktif`} />
        <StatCard title="Kasir Outlet (POS)" value={`${stats.kasir} Kasir`} subtitle="Bertugas melayani transaksi" />
        <StatCard title="Admin & Manajer" value={`${stats.admin} Akun`} subtitle="Akses kontrol & pelaporan" />
        <StatCard title="Tim Operasional" value={`${stats.operasional} Staf`} subtitle="Barista, staf gudang, & kurir" />
      </div>

      {/* Filter & Search Bar */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.25rem' }}>
        <div className="responsive-filter-bar">
          {/* Search Input */}
          <div style={{ flex: 2, minWidth: '180px' }}>
            <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, marginBottom: '0.35rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Pencarian</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                className="input-field"
                placeholder="Cari nama, username, shift..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2.1rem', fontSize: '0.8125rem' }}
              />
              <div style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', display: 'flex', pointerEvents: 'none' }}>
                <IconSearch size={14} />
              </div>
            </div>
          </div>

          {/* Filter Role */}
          <div style={{ flex: 1.2, minWidth: '150px' }}>
            <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, marginBottom: '0.35rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Jabatan / Peran</label>
            <select 
              className="input-field"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              style={{ fontSize: '0.8125rem' }}
            >
              <option value="ALL">Semua Jabatan</option>
              <option value="admin">Admin Utama</option>
              <option value="kasir">Kasir Outlet (POS)</option>
              <option value="barista">Barista / Peracik Susu</option>
              <option value="staff">Staff Operasional / Gudang</option>
              <option value="kurir">Kurir / Driver Pengantaran</option>
            </select>
          </div>

          {/* Filter Status */}
          <div style={{ flex: 1, minWidth: '140px' }}>
            <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, marginBottom: '0.35rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Status Akun</label>
            <select 
              className="input-field"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{ fontSize: '0.8125rem' }}
            >
              <option value="ALL">Semua Status</option>
              <option value="ACTIVE">Aktif Saja</option>
              <option value="INACTIVE">Nonaktif Saja</option>
            </select>
          </div>

          {(searchQuery || selectedRole !== 'ALL' || selectedStatus !== 'ALL') && (
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button 
                type="button"
                className="btn-secondary" 
                onClick={() => { setSearchQuery(''); setSelectedRole('ALL'); setSelectedStatus('ALL'); }}
                style={{ padding: '0.55rem 0.85rem', fontSize: '0.75rem' }}
              >
                <IconRefresh size={13} />
                <span>Reset</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Karyawan Data Table */}
      <div className="table-responsive">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', minWidth: '700px', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--surface-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
              <th style={{ padding: '0.65rem 0.85rem', width: '45px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.6875rem', letterSpacing: '0.04em' }}>NO</th>
              <th style={{ padding: '0.65rem 0.85rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.6875rem', letterSpacing: '0.04em' }}>NAMA & JABATAN</th>
              <th style={{ padding: '0.65rem 0.85rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.6875rem', letterSpacing: '0.04em' }}>USERNAME LOGIN</th>
              <th style={{ padding: '0.65rem 0.85rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.6875rem', letterSpacing: '0.04em' }}>SHIFT KERJA</th>
              <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.6875rem', letterSpacing: '0.04em' }}>STATUS</th>
              <th style={{ padding: '0.65rem 0.85rem', textAlign: 'right', width: '160px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.6875rem', letterSpacing: '0.04em' }}>AKSI</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                  Memuat data karyawan...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                  Tidak ada data karyawan yang sesuai filter.
                </td>
              </tr>
            ) : (
              paginatedUsers.map((u, idx) => {
                const roleMeta = ROLE_LABELS[u.role] || { label: u.role, badgeClass: 'badge-neutral', Icon: IconUser };
                const RoleIcon = roleMeta.Icon || IconUser;
                const isPrimaryAdmin = u.id === 'u1' || u.username === 'admin';

                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border-subtle)', opacity: !u.is_active ? 0.65 : 1, transition: 'background-color 0.15s ease' }}>
                    <td className="tabular" style={{ padding: '0.75rem 0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                      {(currentPage * ITEMS_PER_PAGE) + idx + 1}
                    </td>
                    
                    {/* Name & Role */}
                    <td style={{ padding: '0.75rem 0.85rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div style={{ 
                          width: '32px', 
                          height: '32px', 
                          borderRadius: 'var(--radius-md)', 
                          backgroundColor: 'var(--surface-subtle)', 
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--accent-primary)', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <RoleIcon size={16} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.8125rem' }}>
                            {u.nama}
                          </div>
                          <span className={roleMeta.badgeClass} style={{ fontSize: '0.65rem', marginTop: '0.15rem' }}>
                            {roleMeta.label}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Username */}
                    <td style={{ padding: '0.75rem 0.85rem' }}>
                      <span className="font-mono" style={{ 
                        fontWeight: 600, 
                        fontSize: '0.75rem', 
                        backgroundColor: 'var(--surface-subtle)', 
                        padding: '0.2rem 0.45rem', 
                        borderRadius: 'var(--radius-sm)', 
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-primary)'
                      }}>
                        @{u.username}
                      </span>
                      {u.tanggal_masuk && (
                        <div className="tabular" style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                          Terdaftar: {u.tanggal_masuk}
                        </div>
                      )}
                    </td>

                    {/* Shift Kerja */}
                    <td style={{ padding: '0.75rem 0.85rem' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                        <IconClock size={12} style={{ color: 'var(--text-tertiary)' }} />
                        <span>{u.shift || '-'}</span>
                      </span>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '0.75rem 0.85rem', textAlign: 'center' }}>
                      <span className={u.is_active ? 'badge-success' : 'badge-neutral'} style={{ fontSize: '0.65rem' }}>
                        {u.is_active ? '● Aktif' : '○ Nonaktif'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                        <button 
                          type="button"
                          onClick={() => openEditModal(u)}
                          className="btn-secondary" 
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                          title="Edit data karyawan"
                        >
                          <IconEdit size={13} />
                          <span>Ubah</span>
                        </button>
                        
                        {!isPrimaryAdmin && (
                          <button 
                            type="button"
                            onClick={() => toggleStatus(u)}
                            className="btn-secondary"
                            style={{ 
                              padding: '0.35rem 0.65rem', 
                              fontSize: '0.75rem',
                              color: u.is_active ? 'var(--status-danger)' : 'var(--status-success)',
                              borderColor: 'var(--border-subtle)'
                            }}
                            title={u.is_active ? 'Nonaktifkan akun karyawan' : 'Aktifkan kembali akun karyawan'}
                          >
                            {u.is_active ? 'Nonaktifkan' : 'Aktifkan'}
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
            Menampilkan {users.length === 0 ? 0 : currentPage * ITEMS_PER_PAGE + 1} - {Math.min((currentPage + 1) * ITEMS_PER_PAGE, users.length)} dari {users.length} karyawan &bull; Halaman {currentPage + 1} dari {totalPages}
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

      {/* MODAL: Tambah / Edit Karyawan */}
      {modalVisible && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '480px', width: '92%', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem' }}>
              <div>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>
                  {editItem ? 'Ubah Data Karyawan' : 'Tambah Karyawan Baru'}
                </h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>Kelola kredensial login dan jadwal kerja tim</p>
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

            {formError && (
              <div style={{ padding: '0.65rem 0.85rem', backgroundColor: 'var(--status-danger-bg)', border: '1px solid var(--status-danger-border)', color: 'var(--status-danger)', borderRadius: 'var(--radius-md)', fontSize: '0.8125rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <IconAlertCircle size={15} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Nama Lengkap */}
              <div>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, marginBottom: '0.35rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                  Nama Lengkap *
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="Contoh: Siti Rahma"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="input-field"
                />
              </div>

              {/* Username & Role (Grid 2 Kolom) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, marginBottom: '0.35rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                    Username Login *
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="contoh: siti_kasir"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="input-field font-mono"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, marginBottom: '0.35rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                    Jabatan / Role *
                  </label>
                  <select 
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="input-field"
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
              <div>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, marginBottom: '0.35rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                  Password {editItem ? '(Kosongkan jika tidak ingin diubah)' : '*'}
                </label>
                <input 
                  type="password" 
                  required={!editItem}
                  placeholder={editItem ? 'Masukkan password baru...' : 'Password login akun'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input-field"
                />
              </div>

              {/* Shift Kerja */}
              <div>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, marginBottom: '0.35rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                  Shift Kerja
                </label>
                <input 
                  type="text" 
                  placeholder="Contoh: Shift 1 (08:00 - 16:00)"
                  value={formData.shift}
                  onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                  className="input-field"
                />
              </div>

              {/* Status Akun */}
              {editItem && (
                <div style={{ padding: '0.75rem', backgroundColor: 'var(--surface-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600 }}>
                    <input 
                      type="checkbox" 
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      disabled={editItem.id === 'u1' || editItem.username === 'admin'}
                    />
                    <span>Akun Aktif (Dapat Login ke Sistem)</span>
                  </label>
                  {(editItem.id === 'u1' || editItem.username === 'admin') && (
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', display: 'block', marginTop: '0.2rem' }}>
                      * Akun Admin Utama tidak dapat dinonaktifkan demi integritas sistem.
                    </span>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem' }}>
                <button 
                  type="button" 
                  onClick={() => setModalVisible(false)}
                  className="btn-secondary"
                  disabled={processing}
                  style={{ flex: 1, padding: '0.65rem' }}
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={processing}
                  style={{ flex: 1.3, padding: '0.65rem' }}
                >
                  {processing ? 'Menyimpan...' : (editItem ? 'Simpan Perubahan' : 'Tambah Karyawan')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL */}
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

            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              {confirmModal.title}
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              {confirmModal.message}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                type="button"
                onClick={() => setConfirmModal(prev => ({ ...prev, visible: false }))}
                className="btn-secondary"
                style={{ flex: 1, padding: '0.65rem' }}
              >
                Batal
              </button>
              <button 
                type="button"
                onClick={confirmModal.onConfirm}
                className={confirmModal.confirmVariant === 'danger' ? 'btn-danger' : 'btn-primary'}
                style={{ flex: 1, padding: '0.65rem' }}
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
