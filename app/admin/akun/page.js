'use client';
import { useState, useEffect } from 'react';
import { useResponsivePagination } from '../../../lib/useResponsivePagination';
import {
  IconSearch,
  IconPlus,
  IconEdit,
  IconKey,
  IconShield,
  IconReceipt,
  IconMilk,
  IconPackage,
  IconTruck,
  IconUser,
  IconX,
  IconAlertCircle,
  IconRefresh
} from '../../../components/ui/icons';

const ROLE_CONFIG = {
  admin: {
    label: 'ADMIN UTAMA',
    badgeClass: 'badge-chocolate',
    Icon: IconShield,
    accessScope: 'Full Control (Dashboard, Transaksi, Produk, Laporan, Manajemen Akun)'
  },
  kasir: {
    label: 'KASIR (POS)',
    badgeClass: 'badge-chocolate',
    Icon: IconReceipt,
    accessScope: 'Operasional POS Kasir, Transaksi Penjualan, Penerbitan Struk'
  },
  barista: {
    label: 'BARISTA / PERACIK',
    badgeClass: 'badge-neutral',
    Icon: IconMilk,
    accessScope: 'Peracikan Minuman Susu & STMJ Rempah'
  },
  staff: {
    label: 'STAFF OPERASIONAL',
    badgeClass: 'badge-neutral',
    Icon: IconPackage,
    accessScope: 'Gudang & Perlengkapan Operasional Outlet'
  },
  kurir: {
    label: 'KURIR / DRIVER',
    badgeClass: 'badge-neutral',
    Icon: IconTruck,
    accessScope: 'Pengantaran Pesanan Ritel & Titip Jual (Reseller)'
  }
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

export default function ManajemenAkunPage() {
  const [accounts, setAccounts] = useState([]);
  const [stats, setStats] = useState({ total: 0, admin: 0, kasir: 0, aktif: 0, nonaktif: 0 });
  const [loading, setLoading] = useState(true);

  // Pagination Responsive
  const ITEMS_PER_PAGE = useResponsivePagination(5, 8, 12);
  const [currentPage, setCurrentPage] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modal Create Account
  const [modalVisible, setModalVisible] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({
    nama: '',
    username: '',
    password: '',
    confirmPassword: '',
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

    fetch(`/api/akun?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        setAccounts(data.accounts || []);
        if (data.stats) setStats(data.stats);
        setLoading(false);
      })
      .catch(() => {
        setAccounts([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    setCurrentPage(0);
    loadData();
  }, [searchQuery, selectedRole, selectedStatus]);

  const openCreateModal = () => {
    setEditItem(null);
    setFormData({
      nama: '',
      username: '',
      password: '',
      confirmPassword: '',
      role: 'kasir',
      shift: 'Shift 1 (08:00 - 16:00)',
      is_active: true
    });
    setFormError('');
    setModalVisible(true);
  };

  const openEditModal = (acc) => {
    setEditItem(acc);
    setFormData({
      id: acc.id,
      nama: acc.nama,
      username: acc.username,
      password: '',
      confirmPassword: '',
      role: acc.role,
      shift: acc.shift || 'Standar',
      is_active: acc.is_active
    });
    setFormError('');
    setModalVisible(true);
  };

  const handleSaveAccount = async (e) => {
    e.preventDefault();
    setFormError('');

    // Validation
    if (!editItem) {
      if (!formData.password || formData.password.length < 3) {
        setFormError('Password minimal 3 karakter.');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setFormError('Konfirmasi password tidak cocok dengan password yang dimasukkan.');
        return;
      }
    } else {
      if (formData.password && formData.password !== formData.confirmPassword) {
        setFormError('Konfirmasi password baru tidak cocok.');
        return;
      }
    }

    setProcessing(true);

    const method = editItem ? 'PUT' : 'POST';
    const payload = { ...formData };

    try {
      const res = await fetch('/api/akun', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Terjadi kesalahan saat memproses akun');
      }

      setModalVisible(false);
      loadData();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleStatus = (acc) => {
    const isDeactivating = acc.is_active;
    setConfirmModal({
      visible: true,
      title: isDeactivating ? 'Bekukan / Nonaktifkan Akun?' : 'Aktifkan Kembali Akun?',
      message: isDeactivating
        ? `Akun "${acc.nama}" (@${acc.username}) tidak akan dapat lagi masuk ke sistem kasir/admin setelah dinonaktifkan.`
        : `Akun "${acc.nama}" (@${acc.username}) akan dipulihkan dan dapat kembali mengakses sistem.`,
      confirmText: isDeactivating ? 'Ya, Bekukan' : 'Ya, Aktifkan',
      confirmVariant: isDeactivating ? 'danger' : 'primary',
      onConfirm: async () => {
        try {
          const res = await fetch('/api/akun', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: acc.id,
              is_active: !acc.is_active
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

  const totalPages = Math.ceil(accounts.length / ITEMS_PER_PAGE) || 1;
  const paginatedAccounts = accounts.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  return (
    <div className="admin-page-container">
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Manajemen Akun
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.2rem 0 0 0', fontSize: '0.75rem' }}>
            Pusat registrasi, hak akses peran, dan reset kredensial sistem Andini Pure Milk
          </p>
        </div>
        <button 
          type="button"
          onClick={openCreateModal} 
          className="btn-primary" 
          style={{ padding: '0.55rem 1rem', fontSize: '0.8125rem' }}
        >
          <IconPlus size={15} />
          <span>Buat Akun Baru</span>
        </button>
      </div>

      {/* Security Info Callout */}
      <div style={{
        padding: '0.85rem 1rem',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--surface-subtle)',
        border: '1px solid var(--border-subtle)',
        marginBottom: '1.25rem',
        fontSize: '0.8125rem',
        lineHeight: 1.5,
        color: 'var(--text-secondary)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.65rem'
      }}>
        <div style={{ color: 'var(--accent-primary)', flexShrink: 0 }}>
          <IconKey size={16} />
        </div>
        <div>
          <strong style={{ color: 'var(--text-primary)' }}>Pendaftaran Akun Terpusat:</strong> Halaman registrasi publik dinonaktifkan demi keamanan operasional gerai. Seluruh kredensial akun kasir dan staf hanya dapat diterbitkan oleh Administrator.
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="responsive-stats-grid" style={{ marginBottom: '1.25rem' }}>
        <StatCard title="Total Akun Terdaftar" value={`${stats.total} Akun`} subtitle={`${stats.aktif} berstatus aktif`} />
        <StatCard title="Akun Admin (Owner)" value={`${stats.admin} Akun`} subtitle="Akses penuh manajemen & laporan" />
        <StatCard title="Akun Kasir (POS)" value={`${stats.kasir} Kasir`} subtitle="Akses transaksi penjualan di gerai" />
        <StatCard title="Akun Dibekukan" value={`${stats.nonaktif} Akun`} subtitle="Akses login ditangguhkan" />
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
                placeholder="Cari username atau nama pengguna..." 
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
            <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, marginBottom: '0.35rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Peran / Role</label>
            <select 
              className="input-field"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              style={{ fontSize: '0.8125rem' }}
            >
              <option value="ALL">Semua Peran / Role</option>
              <option value="admin">Admin Utama</option>
              <option value="kasir">Kasir POS</option>
              <option value="barista">Barista / Peracik</option>
              <option value="staff">Staff Operasional</option>
              <option value="kurir">Kurir / Driver</option>
            </select>
          </div>

          {/* Filter Status */}
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, marginBottom: '0.35rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Status Login</label>
            <select 
              className="input-field"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{ fontSize: '0.8125rem' }}
            >
              <option value="ALL">Semua Status Login</option>
              <option value="ACTIVE">Aktif Saja</option>
              <option value="INACTIVE">Nonaktif / Dibekukan</option>
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

      {/* Accounts Data Table */}
      <div className="table-responsive">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', minWidth: '720px', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--surface-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
              <th style={{ padding: '0.65rem 0.85rem', width: '45px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.6875rem', letterSpacing: '0.04em' }}>NO</th>
              <th style={{ padding: '0.65rem 0.85rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.6875rem', letterSpacing: '0.04em' }}>PENGGUNA & PERAN</th>
              <th style={{ padding: '0.65rem 0.85rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.6875rem', letterSpacing: '0.04em' }}>USERNAME LOGIN</th>
              <th style={{ padding: '0.65rem 0.85rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.6875rem', letterSpacing: '0.04em' }}>HAK AKSES SISTEM</th>
              <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.6875rem', letterSpacing: '0.04em' }}>STATUS LOGIN</th>
              <th style={{ padding: '0.65rem 0.85rem', textAlign: 'right', width: '180px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.6875rem', letterSpacing: '0.04em' }}>AKSI KREDENSIAL</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                  Memuat data akun...
                </td>
              </tr>
            ) : accounts.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                  Tidak ada akun yang sesuai dengan kriteria pencarian.
                </td>
              </tr>
            ) : (
              paginatedAccounts.map((acc, idx) => {
                const roleConfig = ROLE_CONFIG[acc.role] || {
                  label: acc.role.toUpperCase(),
                  badgeClass: 'badge-neutral',
                  Icon: IconUser,
                  accessScope: 'Akses Standar'
                };
                const RoleIcon = roleConfig.Icon || IconUser;
                const isPrimaryAdmin = acc.id === 'u1' || acc.username === 'admin';

                return (
                  <tr key={acc.id} style={{ borderBottom: '1px solid var(--border-subtle)', opacity: !acc.is_active ? 0.65 : 1, transition: 'background-color 0.15s ease' }}>
                    <td className="tabular" style={{ padding: '0.75rem 0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                      {currentPage * ITEMS_PER_PAGE + idx + 1}
                    </td>

                    {/* User & Role */}
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
                            {acc.nama}
                          </div>
                          <span className={roleConfig.badgeClass} style={{ fontSize: '0.65rem', marginTop: '0.15rem' }}>
                            {roleConfig.label}
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
                        @{acc.username}
                      </span>
                      {acc.tanggal_masuk && (
                        <div className="tabular" style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                          Dibuat: {acc.tanggal_masuk}
                        </div>
                      )}
                    </td>

                    {/* Access Scope */}
                    <td style={{ padding: '0.75rem 0.85rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', lineHeight: 1.4 }}>
                        {roleConfig.accessScope}
                      </span>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '0.75rem 0.85rem', textAlign: 'center' }}>
                      <span className={acc.is_active ? 'badge-success' : 'badge-neutral'} style={{ fontSize: '0.65rem' }}>
                        {acc.is_active ? '● Aktif' : '○ Nonaktif'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                        <button 
                          type="button"
                          onClick={() => openEditModal(acc)}
                          className="btn-secondary" 
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                          title="Reset password atau ubah hak akses"
                        >
                          <IconKey size={13} />
                          <span>Ubah / Reset</span>
                        </button>

                        {!isPrimaryAdmin && (
                          <button 
                            type="button"
                            onClick={() => handleToggleStatus(acc)}
                            className="btn-secondary"
                            style={{ 
                              padding: '0.35rem 0.65rem', 
                              fontSize: '0.75rem',
                              color: acc.is_active ? 'var(--status-danger)' : 'var(--status-success)',
                              borderColor: 'var(--border-subtle)'
                            }}
                            title={acc.is_active ? 'Bekukan akun' : 'Aktifkan kembali akun'}
                          >
                            {acc.is_active ? 'Bekukan' : 'Aktifkan'}
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
      {accounts.length > ITEMS_PER_PAGE && (
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
            Menampilkan {accounts.length === 0 ? 0 : currentPage * ITEMS_PER_PAGE + 1} - {Math.min((currentPage + 1) * ITEMS_PER_PAGE, accounts.length)} dari {accounts.length} akun &bull; Halaman {currentPage + 1} dari {totalPages}
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

      {/* MODAL: Buat Akun Baru / Ubah & Reset Password */}
      {modalVisible && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '460px', width: '92%', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem' }}>
              <div>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>
                  {editItem ? 'Ubah / Reset Kredensial Akun' : 'Buat Akun Baru'}
                </h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
                  {editItem ? `Mengelola akun @${editItem.username}` : 'Registrasi akun pengguna resmi oleh Administrator'}
                </p>
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

            <form onSubmit={handleSaveAccount} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Nama Lengkap */}
              <div>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, marginBottom: '0.35rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                  Nama Lengkap Pengguna *
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
                    placeholder="contoh: kasir_siti"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().trim() })}
                    className="input-field font-mono"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, marginBottom: '0.35rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                    Peran / Hak Akses *
                  </label>
                  <select 
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    disabled={editItem?.id === 'u1' || editItem?.username === 'admin'}
                    className="input-field"
                  >
                    <option value="kasir">Kasir POS (Gerai)</option>
                    <option value="admin">Admin Utama (Owner)</option>
                    <option value="barista">Barista / Peracik</option>
                    <option value="staff">Staff Operasional</option>
                    <option value="kurir">Kurir / Driver</option>
                  </select>
                </div>
              </div>

              {/* Password */}
              <div>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, marginBottom: '0.35rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                  {editItem ? 'Reset Password Baru (Kosongkan jika tidak diubah)' : 'Password Login *'}
                </label>
                <input 
                  type="password" 
                  required={!editItem}
                  placeholder={editItem ? 'Masukkan password baru bila ingin mereset...' : 'Password login akun'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input-field"
                />
              </div>

              {/* Konfirmasi Password */}
              {(!editItem || formData.password) && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, marginBottom: '0.35rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                    Ulangi Password *
                  </label>
                  <input 
                    type="password" 
                    required={Boolean(!editItem || formData.password)}
                    placeholder="Ketik ulang password untuk konfirmasi"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="input-field"
                  />
                </div>
              )}

              {/* Status Akun (saat Edit) */}
              {editItem && (
                <div style={{ padding: '0.75rem', backgroundColor: 'var(--surface-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600 }}>
                    <input 
                      type="checkbox" 
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      disabled={editItem.id === 'u1' || editItem.username === 'admin'}
                    />
                    <span>Akun Aktif (Dapat Mengakses & Login ke Sistem)</span>
                  </label>
                  {(editItem.id === 'u1' || editItem.username === 'admin') && (
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', display: 'block', marginTop: '0.2rem' }}>
                      * Akun Admin Utama tidak boleh dinonaktifkan demi integritas sistem.
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
                  {processing ? 'Memproses...' : (editItem ? 'Simpan Perubahan' : 'Buat Akun')}
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
