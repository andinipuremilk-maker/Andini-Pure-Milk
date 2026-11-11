'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconMilk, IconCart, IconShield, IconArrowRight, IconLogOut } from '../components/ui/icons';

export default function LandingPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const u = JSON.parse(userStr);
          if (u && u.role) return u;
        }
      } catch (e) {}
    }
    return null;
  });

  const handleLogout = () => {
    localStorage.removeItem('user');
    setCurrentUser(null);
    router.push('/login?role=kasir');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '2rem 1.25rem',
      backgroundColor: 'var(--surface-canvas)'
    }}>
      {/* Brand Card / Gateway */}
      <div style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: 'var(--surface-panel)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        padding: '2.5rem 2rem',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center'
      }}>
        {/* Emblem */}
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--accent-subtle)',
          border: '1px solid var(--accent-border)',
          color: 'var(--accent-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.25rem'
        }}>
          <IconMilk size={24} strokeWidth={1.75} />
        </div>

        {/* Title & Tagline */}
        <div style={{ marginBottom: '2rem' }}>
          <span style={{
            fontSize: '0.6875rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--text-secondary)',
            display: 'block',
            marginBottom: '0.25rem'
          }}>
            Point of Sale & Inventory
          </span>
          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'var(--text-primary)',
            margin: '0 0 0.5rem 0',
            lineHeight: 1.2
          }}>
            Andini Pure Milk
          </h1>
          <p style={{
            fontSize: '0.8125rem',
            color: 'var(--text-secondary)',
            margin: 0,
            lineHeight: 1.45
          }}>
            Susu murni segar, STMJ madu rempah & produk olahan susu khas Banyuwangi
          </p>
        </div>

        {/* Action Panel */}
        {currentUser ? (
          <div style={{
            width: '100%',
            backgroundColor: 'var(--surface-subtle)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block' }}>
                  Sesi Aktif
                </span>
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {currentUser.nama}
                </span>
              </div>
              <span className={currentUser.role === 'admin' ? 'badge-chocolate' : 'badge-neutral'} style={{ textTransform: 'capitalize' }}>
                {currentUser.role === 'admin' ? 'Administrator' : 'Kasir POS'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                className="btn-primary"
                style={{ width: '100%', padding: '0.7rem' }}
                onClick={() => router.push(currentUser.role === 'admin' ? '/admin/dashboard' : '/kasir')}
              >
                <span>Buka {currentUser.role === 'admin' ? 'Panel Admin' : 'Terminal Kasir'}</span>
                <IconArrowRight size={15} />
              </button>
              <button
                className="btn-secondary"
                style={{ width: '100%', padding: '0.65rem' }}
                onClick={handleLogout}
              >
                <IconLogOut size={14} />
                <span>Ganti Akun</span>
              </button>
            </div>
          </div>
        ) : (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              className="btn-primary"
              style={{
                width: '100%',
                padding: '0.8rem 1rem',
                fontSize: '0.875rem',
                justifyContent: 'space-between'
              }}
              onClick={() => router.push('/login?role=kasir')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <IconCart size={18} />
                <span style={{ fontWeight: 600 }}>Masuk sebagai Kasir</span>
              </div>
              <IconArrowRight size={16} />
            </button>

            <button
              className="btn-secondary"
              style={{
                width: '100%',
                padding: '0.8rem 1rem',
                fontSize: '0.875rem',
                justifyContent: 'space-between'
              }}
              onClick={() => router.push('/login?role=admin')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <IconShield size={18} />
                <span style={{ fontWeight: 600 }}>Masuk sebagai Admin</span>
              </div>
              <IconArrowRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div style={{
        marginTop: '1.5rem',
        fontSize: '0.75rem',
        color: 'var(--text-tertiary)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <span>Andini Pure Milk POS</span>
        <span>&bull;</span>
        <span>Sistem Operasional Terintegrasi</span>
      </div>
    </div>
  );
}
