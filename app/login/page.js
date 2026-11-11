'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  IconMilk, 
  IconCart, 
  IconShield, 
  IconStore, 
  IconArrowLeft, 
  IconPlus, 
  IconAlertCircle, 
  IconCheck, 
  IconX 
} from '../../components/ui/icons';

const DEFAULT_BOOTHS = [
  'Booth 1 - Gerai Utama (Pusat)',
  'Booth 2 - Alun-Alun Kota',
  'Booth 3 - Pantai Boom',
  'Booth 4 - Kampus & Sekolah',
  'Booth 5 - RTH Maron Genteng',
  'Booth Event / Bazar Keliling',
  'Lainnya (Kustom)'
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get('role');
  
  // Tab role dikelola via state reaktif agar UI berubah instan (default kasir)
  const [role, setRole] = useState(roleParam === 'admin' ? 'admin' : 'kasir');
  const isAdmin = role === 'admin';

  const [username, setUsername] = useState(role === 'admin' ? 'admin' : 'kasir');
  const [password, setPassword] = useState(role === 'admin' ? 'admin' : 'kasir');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Booth Penjualan State (Selalu Aktif & Wajib, Default Kosong "")
  const [selectedBooth, setSelectedBooth] = useState('');
  const [customBooth, setCustomBooth] = useState('');
  const [boothList, setBoothList] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedBooths = localStorage.getItem('andini_booths');
        if (savedBooths) {
          const parsed = JSON.parse(savedBooths);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (e) {}
    }
    return DEFAULT_BOOTHS;
  });
  const [showQuickAddBooth, setShowQuickAddBooth] = useState(false);
  const [newBoothInput, setNewBoothInput] = useState('');
  const [quickBoothError, setQuickBoothError] = useState('');

  // Switch tab kasir / admin
  const handleTabChange = (targetRole) => {
    setRole(targetRole);
    setUsername(targetRole);
    setPassword(targetRole);
    setError('');
    router.replace(`/login?role=${targetRole}`);
  };

  // Handle Tambah Booth Baru
  const handleAddNewBooth = () => {
    const trimmed = newBoothInput.trim();
    if (!trimmed) {
      setQuickBoothError('Nama booth tidak boleh kosong.');
      return;
    }
    setQuickBoothError('');
    setBoothList(prev => {
      const withoutCustom = prev.filter(b => b !== 'Lainnya (Kustom)');
      if (!withoutCustom.includes(trimmed)) {
        withoutCustom.push(trimmed);
      }
      const updated = [...withoutCustom, 'Lainnya (Kustom)'];
      try {
        localStorage.setItem('andini_booths', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    setSelectedBooth(trimmed);
    setNewBoothInput('');
    setShowQuickAddBooth(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validasi booth: Wajib memilih booth sebelum masuk!
    if (!selectedBooth || selectedBooth.trim() === '') {
      setError('Silakan pilih lokasi booth penjualan sebelum melanjutkan.');
      return;
    }

    if (!username.trim() || !password) {
      setError('Username dan password harus diisi.');
      return;
    }

    let effectiveBooth = selectedBooth;
    if (selectedBooth === 'Lainnya (Kustom)') {
      if (!customBooth.trim()) {
        setError('Silakan masukkan nama booth penjualan kustom Anda.');
        return;
      }
      effectiveBooth = customBooth.trim();
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password, role })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Gagal memproses autentikasi');
        setLoading(false);
        return;
      }

      // Simpan session termasuk lokasi booth kasir/admin
      const sessionUser = {
        ...data,
        booth: effectiveBooth
      };
      localStorage.setItem('user', JSON.stringify(sessionUser));

      if (data.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/kasir');
      }
    } catch (err) {
      setError('Gagal menghubungi server.');
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--surface-canvas)',
      color: 'var(--text-primary)'
    }}>
      {/* Top Header Bar */}
      <header style={{
        width: '100%',
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '1.25rem 1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxSizing: 'border-box'
      }}>
        <button
          onClick={() => router.push('/')}
          style={{
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            transition: 'color 0.15s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
        >
          <IconArrowLeft size={16} />
          <span>Kembali ke Beranda</span>
        </button>

        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>
          Andini Pure Milk POS
        </span>
      </header>

      {/* Main Login Form Container */}
      <main style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '1.5rem 1rem'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: 'var(--surface-panel)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-sm)',
          padding: '2rem 1.75rem'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--accent-subtle)',
              border: '1px solid var(--accent-border)',
              color: 'var(--accent-primary)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '0.85rem'
            }}>
              <IconMilk size={20} />
            </div>

            <h1 style={{
              fontSize: '1.375rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: '0 0 0.25rem 0',
              letterSpacing: '-0.02em'
            }}>
              Masuk ke Sistem
            </h1>
            <p style={{
              fontSize: '0.8125rem',
              color: 'var(--text-secondary)',
              margin: 0
            }}>
              Pilih peran dan gerai penugasan Anda
            </p>

            {/* Segmented Role Switcher */}
            <div style={{
              display: 'flex',
              padding: '3px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--surface-subtle)',
              border: '1px solid var(--border-subtle)',
              marginTop: '1.25rem'
            }}>
              <button
                type="button"
                onClick={() => handleTabChange('kasir')}
                style={{
                  flex: 1,
                  padding: '0.55rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  backgroundColor: !isAdmin ? 'var(--surface-panel)' : 'transparent',
                  color: !isAdmin ? 'var(--text-primary)' : 'var(--text-secondary)',
                  boxShadow: !isAdmin ? 'var(--shadow-xs)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <IconCart size={15} />
                <span>Kasir (POS)</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('admin')}
                style={{
                  flex: 1,
                  padding: '0.55rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  backgroundColor: isAdmin ? 'var(--surface-panel)' : 'transparent',
                  color: isAdmin ? 'var(--text-primary)' : 'var(--text-secondary)',
                  boxShadow: isAdmin ? 'var(--shadow-xs)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <IconShield size={15} />
                <span>Admin Panel</span>
              </button>
            </div>
          </div>

          {/* Alert Message */}
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.75rem 0.9rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.25rem',
              color: 'var(--status-danger)',
              fontSize: '0.8125rem',
              fontWeight: 500,
              backgroundColor: 'var(--status-danger-bg)',
              border: '1px solid var(--status-danger-border)',
              lineHeight: 1.4
            }}>
              <IconAlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Form Login */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Booth Penjualan (Selalu Muncul) */}
            <div style={{
              padding: '0.85rem',
              backgroundColor: 'var(--surface-subtle)',
              border: `1px solid ${!selectedBooth && error ? 'var(--status-danger-border)' : 'var(--border-subtle)'}`,
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.45rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}>
                  <IconStore size={14} />
                  <span>Lokasi Booth Penjualan</span>
                  <span style={{ color: 'var(--status-danger)' }}>*</span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setShowQuickAddBooth(!showQuickAddBooth);
                    setQuickBoothError('');
                  }}
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--accent-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  {showQuickAddBooth ? (
                    <>
                      <IconX size={13} />
                      <span>Tutup</span>
                    </>
                  ) : (
                    <>
                      <IconPlus size={13} />
                      <span>Tambah Baru</span>
                    </>
                  )}
                </button>
              </div>

              {/* Form Quick Add Booth Baru */}
              {showQuickAddBooth && (
                <div style={{
                  backgroundColor: 'var(--surface-panel)',
                  padding: '0.65rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  marginTop: '0.25rem',
                  boxShadow: 'var(--shadow-xs)'
                }}>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Daftarkan Nama Gerai / Booth Baru:
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Contoh: Booth 6 - Pasar Rogojampi"
                      value={newBoothInput}
                      onChange={e => setNewBoothInput(e.target.value)}
                      style={{ padding: '0.45rem 0.65rem', fontSize: '0.8125rem' }}
                    />
                    <button
                      type="button"
                      onClick={handleAddNewBooth}
                      disabled={!newBoothInput.trim()}
                      className="btn-primary"
                      style={{ padding: '0.45rem 0.85rem', fontSize: '0.75rem' }}
                    >
                      Simpan
                    </button>
                  </div>
                  {quickBoothError && (
                    <div style={{ color: 'var(--status-danger)', fontSize: '0.6875rem', marginTop: '0.3rem', fontWeight: 500 }}>
                      {quickBoothError}
                    </div>
                  )}
                </div>
              )}

              {/* Select Booth */}
              <select
                className="input-field"
                value={selectedBooth}
                onChange={e => {
                  const val = e.target.value;
                  if (val === '__ADD_NEW__') {
                    setShowQuickAddBooth(true);
                    setSelectedBooth('');
                  } else {
                    setSelectedBooth(val);
                    if (error) setError('');
                  }
                }}
                style={{
                  fontWeight: selectedBooth ? 600 : 400,
                  color: selectedBooth ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  backgroundColor: 'var(--surface-panel)'
                }}
              >
                <option value="">-- Pilih Booth Penjualan --</option>
                {boothList.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
                <option value="__ADD_NEW__">+ Daftarkan Booth Baru...</option>
              </select>

              {selectedBooth === 'Lainnya (Kustom)' && (
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ketik nama booth kustom Anda..."
                  value={customBooth}
                  onChange={e => setCustomBooth(e.target.value)}
                  style={{ marginTop: '0.35rem', fontSize: '0.8125rem' }}
                />
              )}

              {selectedBooth && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.6875rem', color: 'var(--status-success)', fontWeight: 600 }}>
                  <IconCheck size={13} />
                  <span>Gerai aktif: {selectedBooth}</span>
                </div>
              )}
            </div>

            {/* Username Input */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '0.35rem'
              }}>
                Username
              </label>
              <input
                type="text"
                className="input-field"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                required
              />
            </div>

            {/* Password Input */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '0.35rem'
              }}>
                Password
              </label>
              <input
                type="password"
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '0.875rem',
                marginTop: '0.25rem'
              }}
            >
              <span>{loading ? 'Memverifikasi...' : `Masuk sebagai ${role === 'admin' ? 'Administrator' : 'Kasir'}`}</span>
            </button>

            {/* Helper Note */}
            <div style={{
              padding: '0.6rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--surface-subtle)',
              border: '1px solid var(--border-subtle)',
              textAlign: 'center',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)'
            }}>
              Akun Default: <strong style={{ color: 'var(--text-primary)' }}>{role}</strong> &bull; Password: <strong style={{ color: 'var(--text-primary)' }}>{role}</strong>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ padding: '3rem', textAlign: 'center', fontWeight: 600, color: 'var(--text-secondary)' }}>Memuat Halaman Login...</div>}>
      <LoginForm />
    </Suspense>
  );
}
