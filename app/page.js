'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr);
        if (u && u.role) {
          setCurrentUser(u);
        }
      }
    } catch (e) {}
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setCurrentUser(null);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'center', 
      alignItems: 'center', 
      padding: '1.5rem 1rem', 
      backgroundColor: '#ffffff',
      backgroundImage: 'radial-gradient(ellipse at 50% 0%, #f7f1eb 0%, #ffffff 65%)'
    }}>
      
      <div style={{ textAlign: 'center', marginBottom: '2.5rem', maxWidth: '100%' }}>
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center',
          gap: '0.4rem',
          border: '1.5px solid var(--color-chocolate-border)', 
          backgroundColor: 'var(--color-chocolate-light)',
          color: 'var(--color-chocolate)',
          padding: '0.3rem 0.85rem', 
          borderRadius: '9999px', 
          fontSize: '0.6875rem', 
          fontWeight: 800, 
          letterSpacing: '1.5px', 
          marginBottom: '1.25rem' 
        }}>
          <span>🥛</span>
          <span>POINT OF SALE & MANAJEMEN UMKM</span>
        </div>
        <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 3.75rem)', fontWeight: 900, letterSpacing: '2px', margin: 0, lineHeight: 1.05, color: '#0a0a0a' }}>
          ANDINI
        </h1>
        <h2 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.25rem)', fontWeight: 800, letterSpacing: '2px', marginTop: '0.2rem', marginBottom: '0.75rem', color: 'var(--color-chocolate)' }}>
          PURE MILK
        </h2>
        <p style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '1.5px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
          Susu Murni Segar &bull; STMJ Madu Rempah &bull; Pie Susu
        </p>
      </div>

      {currentUser ? (
        <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '2rem', textAlign: 'center', borderColor: 'var(--color-chocolate-border)' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem', fontWeight: 700 }}>
            SESI AKTIF: <strong style={{ color: 'var(--color-chocolate)' }}>{currentUser.nama} ({currentUser.role.toUpperCase()})</strong>
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '1.5rem' }}>
            <button 
              className="btn-chocolate" 
              style={{ padding: '1.15rem' }}
              onClick={() => router.push(currentUser.role === 'admin' ? '/admin/dashboard' : '/kasir')}
            >
              LANJUTKAN KE {currentUser.role === 'admin' ? 'ADMIN PANEL' : 'HALAMAN KASIR'} &rarr;
            </button>
            <button 
              className="btn-secondary" 
              style={{ padding: '0.85rem', borderColor: 'var(--color-border)' }}
              onClick={handleLogout}
            >
              KELUAR / GANTI AKUN
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '1rem', width: '100%', maxWidth: '420px', flexDirection: 'column' }}>
          <button 
            className="btn-chocolate" 
            style={{ padding: '1.15rem', fontSize: '0.9375rem', letterSpacing: '1px', display: 'flex', gap: '0.5rem' }}
            onClick={() => router.push('/login?role=kasir')}
          >
            <span>🛒</span>
            <span>MASUK SEBAGAI KASIR (POS)</span>
          </button>
          <button 
            className="btn-secondary" 
            style={{ padding: '1.15rem', fontSize: '0.9375rem', letterSpacing: '1px', display: 'flex', gap: '0.5rem', borderColor: 'var(--color-border)' }}
            onClick={() => router.push('/login?role=admin')}
          >
            <span>👑</span>
            <span>MASUK SEBAGAI ADMIN</span>
          </button>
        </div>
      )}

    </div>
  );
}
