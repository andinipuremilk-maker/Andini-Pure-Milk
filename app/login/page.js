'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get('role');
  const role = (roleParam === 'admin' || roleParam === 'kasir') ? roleParam : 'kasir';

  const [username, setUsername] = useState(role === 'admin' ? 'admin' : 'kasir');
  const [password, setPassword] = useState(role === 'admin' ? 'admin' : 'kasir');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isAdmin = role === 'admin';

  useEffect(() => {
    setUsername(role === 'admin' ? 'admin' : 'kasir');
    setPassword(role === 'admin' ? 'admin' : 'kasir');
  }, [role]);

  // Auto-redirect if already logged in
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr);
        if (u && u.role === role) {
          router.push(isAdmin ? '/admin/dashboard' : '/kasir');
        }
      }
    } catch (e) {}
  }, [role, isAdmin, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('Username dan password harus diisi.');
      return;
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

      // Save session
      localStorage.setItem('user', JSON.stringify(data));

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

  const toggleRole = () => {
    const nextRole = isAdmin ? 'kasir' : 'admin';
    setError('');
    router.push(`/login?role=${nextRole}`);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      backgroundColor: isAdmin ? '#0f0f11' : '#ffffff',
      color: isAdmin ? '#f4f4f5' : '#18181b',
      fontFamily: 'inherit'
    }}>
      
      {/* Top Bar Header */}
      <div style={{ 
        width: '100%',
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '1rem 1.25rem', 
        display: 'flex', 
        justify: 'flex-start', 
        alignItems: 'center',
        boxSizing: 'border-box'
      }}>
        <button 
          onClick={() => router.push('/')} 
          style={{ 
            fontWeight: 700, 
            fontSize: '0.8125rem', 
            cursor: 'pointer', 
            background: 'none', 
            border: 'none',
            color: isAdmin ? '#a1a1aa' : '#71717a',
            letterSpacing: '0.5px'
          }}
        >
          &larr; BERANDA
        </button>
      </div>

      {/* Main Form Center Box */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1.25rem 1rem' }}>
        <div 
          style={{ 
            width: '100%', 
            maxWidth: '380px', 
            padding: '0.5rem'
          }}
        >
          
          {/* Header Role Badge & Switcher Tabs */}
          <div style={{ marginBottom: '1.75rem', textAlign: 'center' }}>
            <span style={{ 
              fontSize: '0.6875rem', 
              fontWeight: 800, 
              letterSpacing: '1.5px', 
              color: 'var(--color-chocolate)',
              textTransform: 'uppercase',
              display: 'inline-block',
              padding: '0.2rem 0.6rem',
              borderRadius: '9999px',
              backgroundColor: isAdmin ? 'rgba(124, 74, 45, 0.2)' : 'var(--color-chocolate-light)',
              border: '1px solid var(--color-chocolate-border)',
              marginBottom: '0.75rem'
            }}>
              ANDINI PURE MILK
            </span>

            <h1 style={{ 
              fontSize: '1.75rem', 
              fontWeight: 900, 
              letterSpacing: '-0.5px', 
              margin: '0 0 1rem 0',
              color: isAdmin ? '#ffffff' : '#0a0a0a'
            }}>
              Masuk Akun
            </h1>

            {/* Segmented Role Switcher Tab */}
            <div style={{ 
              display: 'flex', 
              padding: '3px', 
              borderRadius: '8px', 
              backgroundColor: isAdmin ? '#18181b' : '#f4f4f5',
              border: `1px solid ${isAdmin ? '#27272a' : '#e4e4e7'}`,
              marginBottom: '1rem'
            }}>
              <button
                type="button"
                onClick={() => router.push('/login?role=kasir')}
                style={{
                  flex: 1,
                  padding: '0.55rem',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  backgroundColor: !isAdmin ? 'var(--color-chocolate)' : 'transparent',
                  color: !isAdmin ? '#ffffff' : (isAdmin ? '#a1a1aa' : '#71717a'),
                  transition: 'all 0.15s ease'
                }}
              >
                🛒 KASIR (POS)
              </button>
              <button
                type="button"
                onClick={() => router.push('/login?role=admin')}
                style={{
                  flex: 1,
                  padding: '0.55rem',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  backgroundColor: isAdmin ? 'var(--color-chocolate)' : 'transparent',
                  color: isAdmin ? '#ffffff' : '#71717a',
                  transition: 'all 0.15s ease'
                }}
              >
                👑 ADMIN PANEL
              </button>
            </div>
          </div>

          {/* Alert Message */}
          {error && (
            <div style={{ 
              border: '1px solid #ef4444', 
              padding: '0.75rem 1rem', 
              borderRadius: '6px', 
              marginBottom: '1.25rem', 
              color: '#ef4444', 
              fontWeight: 600, 
              fontSize: '0.8125rem',
              backgroundColor: 'rgba(239, 68, 68, 0.05)',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          {/* Minimalist Login Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '0.75rem', 
                fontWeight: 700, 
                marginBottom: '0.35rem',
                color: isAdmin ? '#a1a1aa' : '#71717a'
              }}>
                Username
              </label>
              <input 
                type="text" 
                className="input-field" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                style={{
                  backgroundColor: isAdmin ? '#18181b' : '#ffffff',
                  color: isAdmin ? '#ffffff' : '#09090b',
                  borderColor: isAdmin ? '#27272a' : '#e4e4e7',
                  borderRadius: '6px',
                  padding: '0.75rem 1rem',
                  fontSize: '0.875rem'
                }}
                required
              />
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '0.75rem', 
                fontWeight: 700, 
                marginBottom: '0.35rem',
                color: isAdmin ? '#a1a1aa' : '#71717a'
              }}>
                Password
              </label>
              <input 
                type="password" 
                className="input-field" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                style={{
                  backgroundColor: isAdmin ? '#18181b' : '#ffffff',
                  color: isAdmin ? '#ffffff' : '#09090b',
                  borderColor: isAdmin ? '#27272a' : '#e4e4e7',
                  borderRadius: '6px',
                  padding: '0.75rem 1rem',
                  fontSize: '0.875rem'
                }}
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              style={{ 
                marginTop: '0.5rem', 
                padding: '0.85rem',
                backgroundColor: 'var(--color-chocolate)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 800,
                fontSize: '0.875rem',
                cursor: 'pointer',
                letterSpacing: '0.5px',
                transition: 'background-color 0.15s ease'
              }}
            >
              {loading ? 'Memproses...' : `Masuk Sebagai ${role.toUpperCase()}`}
            </button>

            {/* Default credentials note with chocolate accent */}
            <div style={{
              padding: '0.6rem 0.75rem',
              borderRadius: '6px',
              backgroundColor: isAdmin ? 'rgba(124, 74, 45, 0.15)' : 'var(--color-chocolate-light)',
              border: '1px solid var(--color-chocolate-border)',
              textAlign: 'center',
              fontSize: '0.75rem',
              color: isAdmin ? '#d4d4d8' : '#683b20'
            }}>
              Akun Default: <strong style={{ color: isAdmin ? '#ffffff' : 'var(--color-chocolate)' }}>{role}</strong> &bull; Password: <strong style={{ color: isAdmin ? '#ffffff' : 'var(--color-chocolate)' }}>{role}</strong>
            </div>

            {/* Admin-only account notice */}
            <div style={{ marginTop: '0.5rem', textAlign: 'center' }}>
              <p style={{ fontSize: '0.75rem', color: isAdmin ? '#71717a' : '#a1a1aa', margin: 0, lineHeight: 1.4 }}>
                🔒 Registrasi & pengelolaan akun dikelola terpusat melalui <strong>Panel Admin</strong>.
              </p>
            </div>

          </form>

        </div>
      </div>

    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ padding: '3rem', textAlign: 'center', fontWeight: 700 }}>Memuat...</div>}>
      <LoginForm />
    </Suspense>
  );
}
