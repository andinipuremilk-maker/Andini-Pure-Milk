'use client';
import { useState, useEffect } from 'react';
import { useResponsivePagination } from '../../../lib/useResponsivePagination';

const ROLE_CONFIG = {
  admin: {
    label: 'ADMIN UTAMA',
    badgeColor: '#5a321c',
    badgeBg: '#f8f3ee',
    icon: '👑',
    accessScope: 'Full Control (Dashboard, Transaksi, Produk, Laporan, Manajemen Akun)'
  },
  kasir: {
    label: 'KASIR (POS)',
    badgeColor: '#7c4a2d',
    badgeBg: '#f8f3ee',
    icon: '💵',
    accessScope: 'Operasional POS Kasir, Transaksi Penjualan, Penerbitan Struk'
  },
  barista: {
    label: 'BARISTA / PERACIK',
    badgeColor: '#b45309',
    badgeBg: '#fef3c7',
    icon: '🥛',
    accessScope: 'Peracikan Minuman Susu & STMJ Rempah'
  },
  staff: {
    label: 'STAFF OPERASIONAL',
    badgeColor: '#4338ca',
    badgeBg: '#e0e7ff',
    icon: '📦',
    accessScope: 'Gudang & Perlengkapan Operasional Outlet'
  },
  kurir: {
    label: 'KURIR / DRIVER',
    badgeColor: '#0369a1',
    badgeBg: '#e0f2fe',
    icon: '🛵',
    accessScope: 'Pengantaran Pesanan Ritel & Titip Jual (Reseller)'
  }
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
      confirmText: isDeactivating ? 'YA, NONAKTIFKAN' : 'YA, AKTIFKAN',
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, letterSpacing: '0.5px' }}>
            MANAJEMEN AKUN
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', margin: '0.35rem 0 0 0', fontSize: '0.85rem' }}>
            Pusat registrasi, hak akses peran (Admin / Kasir), dan reset kredensial sistem Andini Pure Milk
          </p>
        </div>
        <button 
          onClick={openCreateModal} 
          className="btn-chocolate" 
          style={{ padding: '0.65rem 1.15rem', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}
        >
          <span>+</span>
          <span>BUAT AKUN BARU</span>
        </button>
      </div>

      {/* Security Info Callout (Explaining that public register is removed) */}
      <div style={{
        padding: '0.85rem 1.15rem',
        borderRadius: '6px',
        backgroundColor: 'var(--color-chocolate-light)',
        borderLeft: '4px solid var(--color-chocolate)',
        border: '1px solid var(--color-chocolate-border)',
        marginBottom: '1.5rem',
        fontSize: '0.8125rem',
        lineHeight: 1.5,
        color: '#4e2a14'
      }}>
        <strong style={{ color: 'var(--color-chocolate)' }}>🔒 Pendaftaran Akun Terpusat:</strong> Halaman registrasi publik telah dinonaktifkan demi keamanan operasional gerai. Seluruh pembuatan kredensial kasir dan penugasan admin hanya dapat dilakukan langsung oleh Administrator melalui halaman ini.
      </div>

      {/* Summary Metrics */}
      <div className="responsive-stats-grid" style={{ marginBottom: '1.5rem' }}>
        <StatCard title="TOTAL AKUN TERDAFTAR" value={`${stats.total} Akun`} subtitle={`${stats.aktif} Akun Status Aktif`} />
        <StatCard title="AKUN ADMIN (OWNER)" value={`${stats.admin} Akun`} subtitle="Akses penuh manajemen & laporan" />
        <StatCard title="AKUN KASIR (POS)" value={`${stats.kasir} Kasir`} subtitle="Akses transaksi penjualan di gerai" />
        <StatCard title="AKUN NONAKTIF / DIBEKUKAN" value={`${stats.nonaktif} Akun`} subtitle="Akses login ditangguhkan" />
      </div>

      {/* Filter & Search Bar */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.25rem' }}>
        <div className="responsive-filter-bar">
          {/* Search Input */}
          <div style={{ flex: 2, minWidth: '180px' }}>
            <input 
              type="text" 
              className="input-field"
              placeholder="🔍 Cari username atau nama pengguna..." 
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
              <option value="ALL">-- SEMUA PERAN / ROLE --</option>
              <option value="admin">Admin Utama</option>
              <option value="kasir">Kasir POS</option>
              <option value="barista">Barista / Peracik</option>
              <option value="staff">Staff Operasional</option>
              <option value="kurir">Kurir / Driver</option>
            </select>
          </div>

          {/* Filter Status */}
          <div style={{ flex: 1, minWidth: '150px' }}>
            <select 
              className="input-field"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{ padding: '0.65rem 0.85rem', fontSize: '0.875rem' }}
            >
              <option value="ALL">-- SEMUA STATUS LOGIN --</option>
              <option value="ACTIVE">Aktif (Dapat Login)</option>
              <option value="INACTIVE">Nonaktif (Dibekukan)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Accounts Data Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', minWidth: '720px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-bg-dark)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', textAlign: 'left', fontSize: '0.6875rem', letterSpacing: '0.5px' }}>
                <th style={{ padding: '0.85rem 1rem', width: '45px' }}>NO</th>
                <th style={{ padding: '0.85rem 1rem' }}>PENGGUNA & PERAN</th>
                <th style={{ padding: '0.85rem 1rem' }}>USERNAME LOGIN</th>
                <th style={{ padding: '0.85rem 1rem' }}>HAK AKSES SISTEM</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>STATUS LOGIN</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right', width: '200px' }}>AKSI KREDENSIAL</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-text-secondary)' }}>
                    Memuat data akun...
                  </td>
                </tr>
              ) : accounts.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-text-secondary)' }}>
                    Tidak ada akun yang sesuai dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                paginatedAccounts.map((acc, idx) => {
                  const roleConfig = ROLE_CONFIG[acc.role] || {
                    label: acc.role.toUpperCase(),
                    badgeColor: '#374151',
                    badgeBg: '#f3f4f6',
                    icon: '👤',
                    accessScope: 'Akses Standar'
                  };
                  const isPrimaryAdmin = acc.id === 'u1' || acc.username === 'admin';

                  return (
                    <tr key={acc.id} style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: !acc.is_active ? 'rgba(0,0,0,0.02)' : 'transparent' }}>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--color-text-secondary)', fontWeight: 700 }}>
                        {currentPage * ITEMS_PER_PAGE + idx + 1}
                      </td>

                      {/* User & Role */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <div style={{ 
                            width: '32px', 
                            height: '32px', 
                            borderRadius: '50%', 
                            backgroundColor: roleConfig.badgeBg, 
                            color: roleConfig.badgeColor, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            fontSize: '14px',
                            fontWeight: 800,
                            flexShrink: 0
                          }}>
                            {roleConfig.icon}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: 'var(--color-text-primary)', fontSize: '0.875rem' }}>
                              {acc.nama}
                            </div>
                            <span style={{ 
                              display: 'inline-block', 
                              padding: '0.15rem 0.45rem', 
                              borderRadius: '3px', 
                              fontSize: '0.6875rem', 
                              fontWeight: 700, 
                              backgroundColor: roleConfig.badgeBg, 
                              color: roleConfig.badgeColor,
                              marginTop: '2px'
                            }}>
                              {roleConfig.label}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Username */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.875rem' }}>
                          @{acc.username}
                        </div>
                        <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-secondary)' }}>
                          Dibuat: {acc.tanggal_masuk}
                        </span>
                      </td>

                      {/* Access Scope */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block', lineHeight: 1.3 }}>
                          {roleConfig.accessScope}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                        <span style={{ 
                          display: 'inline-block', 
                          padding: '0.2rem 0.55rem', 
                          borderRadius: '12px', 
                          fontSize: '0.6875rem', 
                          fontWeight: 800, 
                          backgroundColor: acc.is_active ? '#dcfce7' : '#fee2e2', 
                          color: acc.is_active ? '#15803d' : '#b91c1c' 
                        }}>
                          {acc.is_active ? '● AKTIF' : '○ NONAKTIF'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.45rem' }}>
                          <button 
                            onClick={() => openEditModal(acc)}
                            className="btn-secondary" 
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', fontWeight: 700 }}
                            title="Reset password atau ubah hak akses"
                          >
                            UBAH / RESET
                          </button>

                          {!isPrimaryAdmin && (
                            <button 
                              onClick={() => handleToggleStatus(acc)}
                              style={{ 
                                padding: '0.35rem 0.65rem', 
                                fontSize: '0.75rem', 
                                fontWeight: 700,
                                borderRadius: '4px',
                                border: '1px solid var(--color-border)',
                                backgroundColor: 'transparent',
                                color: acc.is_active ? 'var(--color-error)' : '#15803d',
                                cursor: 'pointer'
                              }}
                              title={acc.is_active ? 'Bekukan akun' : 'Aktifkan kembali akun'}
                            >
                              {acc.is_active ? 'BEKUKAN' : 'AKTIFKAN'}
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
              Menampilkan {accounts.length === 0 ? 0 : currentPage * ITEMS_PER_PAGE + 1} - {Math.min((currentPage + 1) * ITEMS_PER_PAGE, accounts.length)} dari {accounts.length} akun &bull; Halaman {currentPage + 1} dari {totalPages}
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

      {/* MODAL: Buat Akun Baru / Ubah & Reset Password */}
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
          <div className="card modal-content" style={{ width: '100%', maxWidth: '460px', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
                  {editItem ? 'UBAH / RESET KREDENSIAL AKUN' : 'BUAT AKUN BARU'}
                </h2>
                <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-secondary)' }}>
                  {editItem ? `Mengelola akun @${editItem.username}` : 'Registrasi akun pengguna resmi oleh Administrator'}
                </span>
              </div>
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

            <form onSubmit={handleSaveAccount}>
              {/* Nama Lengkap */}
              <div style={{ marginBottom: '0.85rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--color-text-secondary)' }}>
                  NAMA LENGKAP PENGGUNA *
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
                    placeholder="contoh: kasir_siti"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().trim() })}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', fontSize: '0.8125rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--color-text-secondary)' }}>
                    PERAN / HAK AKSES *
                  </label>
                  <select 
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    disabled={editItem?.id === 'u1' || editItem?.username === 'admin'}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', fontSize: '0.8125rem', borderRadius: '4px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-light)' }}
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
              <div style={{ marginBottom: '0.85rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--color-text-secondary)' }}>
                  {editItem ? 'RESET PASSWORD BARU (Kosongkan jika tidak diubah)' : 'PASSWORD LOGIN *'}
                </label>
                <input 
                  type="password" 
                  required={!editItem}
                  placeholder={editItem ? 'Masukkan password baru bila ingin mereset...' : 'Password login akun'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', fontSize: '0.8125rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                />
              </div>

              {/* Konfirmasi Password */}
              {(!editItem || formData.password) && (
                <div style={{ marginBottom: '0.85rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--color-text-secondary)' }}>
                    ULANGI PASSWORD *
                  </label>
                  <input 
                    type="password" 
                    required={Boolean(!editItem || formData.password)}
                    placeholder="Ketik ulang password untuk konfirmasi"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', fontSize: '0.8125rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                  />
                </div>
              )}

              {/* Status Akun (saat Edit) */}
              {editItem && (
                <div style={{ marginBottom: '1.25rem', padding: '0.75rem', backgroundColor: 'var(--color-bg-dark)', borderRadius: '4px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 700 }}>
                    <input 
                      type="checkbox" 
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      disabled={editItem.id === 'u1' || editItem.username === 'admin'}
                    />
                    <span>Akun Aktif (Dapat Mengakses & Login ke Sistem)</span>
                  </label>
                  {(editItem.id === 'u1' || editItem.username === 'admin') && (
                    <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-secondary)', display: 'block', marginTop: '2px' }}>
                      * Akun Admin Utama tidak boleh dinonaktifkan demi integritas sistem.
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
                  {processing ? 'MEMPROSES...' : (editItem ? 'SIMPAN PERUBAHAN' : 'BUAT AKUN')}
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
