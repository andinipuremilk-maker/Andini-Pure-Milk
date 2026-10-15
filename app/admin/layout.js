'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [transaksiOpen, setTransaksiOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        router.push('/login?role=admin');
        return;
      }
      const user = JSON.parse(userStr);
      if (!user || user.role !== 'admin') {
        router.push('/login?role=admin');
      }
    } catch (e) {
      router.push('/login?role=admin');
    }
  }, [router]);

  useEffect(() => {
    setTransaksiOpen(pathname.startsWith('/admin/transaksi'));
    setMobileMenuOpen(false); // Close mobile drawer on route change
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login?role=admin');
  };

  if (loading) return <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}>Loading...</div>;

  const isTransaksiActive = pathname.startsWith('/admin/transaksi');
  const isPemasukanActive = pathname === '/admin/transaksi/pemasukan' || pathname === '/admin/transaksi';
  const isPengeluaranActive = pathname === '/admin/transaksi/pengeluaran';

  const renderNavLinks = (isMobile = false) => (
    <>
      <div style={{ 
        padding: isMobile ? '1rem 1.15rem' : '1.15rem 1.25rem', 
        borderBottom: '1px solid var(--color-border)', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
      }}>
        <div>
          <span style={{ 
            fontSize: isMobile ? '0.5625rem' : '0.5625rem', 
            fontWeight: 800, 
            color: 'var(--color-text-secondary)', 
            letterSpacing: '1px', 
            textTransform: 'uppercase', 
            display: 'block' 
          }}>
            ANDINI PURE MILK
          </span>
          <h2 style={{ 
            fontSize: isMobile ? '0.9375rem' : '0.9375rem', 
            fontWeight: 800, 
            letterSpacing: '0.5px', 
            margin: '2px 0 0 0' 
          }}>
            ADMIN PANEL
          </h2>
        </div>
        {isMobile && (
          <button 
            onClick={() => setMobileMenuOpen(false)}
            style={{ 
              width: '28px', 
              height: '28px', 
              borderRadius: '50%', 
              border: '1px solid var(--color-border)', 
              backgroundColor: 'var(--color-bg-light)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '15px', 
              fontWeight: 800, 
              cursor: 'pointer', 
              lineHeight: 1,
              padding: 0
            }}
            aria-label="Tutup menu"
          >
            &times;
          </button>
        )}
      </div>
      
      <nav style={{ flex: 1, padding: isMobile ? '0.65rem 0.5rem' : '0.65rem 0', overflowY: 'auto' }}>
        {/* Dashboard */}
        <Link 
          href="/admin/dashboard"
          onClick={() => setMobileMenuOpen(false)}
          style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: isMobile ? '0.65rem 0.85rem' : '0.65rem 1.15rem', 
            borderRadius: isMobile ? '6px' : '0',
            fontWeight: 800, 
            fontSize: isMobile ? '0.78rem' : '0.8125rem',
            backgroundColor: pathname === '/admin/dashboard' ? 'var(--color-chocolate)' : 'transparent',
            color: pathname === '/admin/dashboard' ? '#ffffff' : 'var(--color-text-primary)',
            borderLeft: (!isMobile && pathname === '/admin/dashboard') ? '3px solid var(--color-caramel)' : '3px solid transparent',
            letterSpacing: '0.5px',
            marginBottom: '3px',
            transition: 'background-color 0.15s ease'
          }}
        >
          <span style={{ fontSize: '0.95rem' }}>📊</span>
          <span>DASHBOARD</span>
        </Link>

        {/* Transaksi Section */}
        <div style={{ marginTop: '2px' }}>
          <div 
            onClick={() => setTransaksiOpen(!transaksiOpen)}
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: isMobile ? '0.5rem 0.65rem' : '0.65rem 1.15rem', 
              borderRadius: isMobile ? '6px' : '0',
              fontWeight: 800, 
              fontSize: isMobile ? '0.72rem' : '0.8125rem',
              color: isTransaksiActive ? 'var(--color-chocolate)' : 'var(--color-text-primary)',
              letterSpacing: '0.5px',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: isMobile ? '0.8rem' : '0.9rem' }}>💳</span>
              <span>TRANSAKSI</span>
            </div>
            <span style={{ fontSize: '0.5625rem' }}>{transaksiOpen ? '▲' : '▼'}</span>
          </div>

          {/* Submenu items */}
          {transaksiOpen && (
            <div style={{ 
              padding: isMobile ? '2px 0 2px 0.5rem' : '0', 
              backgroundColor: isMobile ? 'transparent' : 'rgba(124, 74, 45, 0.04)' 
            }}>
              <Link 
                href="/admin/transaksi/pemasukan"
                onClick={() => setMobileMenuOpen(false)}
                style={{ 
                  display: 'block', 
                  padding: isMobile ? '0.38rem 0.6rem' : '0.55rem 1.15rem 0.55rem 1.75rem', 
                  borderRadius: isMobile ? '4px' : '0',
                  fontWeight: 700, 
                  fontSize: isMobile ? '0.6875rem' : '0.75rem',
                  backgroundColor: isPemasukanActive ? 'var(--color-chocolate)' : 'transparent',
                  color: isPemasukanActive ? '#ffffff' : 'var(--color-text-primary)',
                  letterSpacing: '0.5px',
                  marginBottom: '2px'
                }}
              >
                ↳ Pemasukan
              </Link>

              <Link 
                href="/admin/transaksi/pengeluaran"
                onClick={() => setMobileMenuOpen(false)}
                style={{ 
                  display: 'block', 
                  padding: isMobile ? '0.38rem 0.6rem' : '0.55rem 1.15rem 0.55rem 1.75rem', 
                  borderRadius: isMobile ? '4px' : '0',
                  fontWeight: 700, 
                  fontSize: isMobile ? '0.6875rem' : '0.75rem',
                  backgroundColor: isPengeluaranActive ? 'var(--color-chocolate)' : 'transparent',
                  color: isPengeluaranActive ? '#ffffff' : 'var(--color-text-primary)',
                  letterSpacing: '0.5px'
                }}
              >
                ↳ Pengeluaran
              </Link>
            </div>
          )}
        </div>

        {/* Produk */}
        <Link 
          href="/admin/produk"
          onClick={() => setMobileMenuOpen(false)}
          style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: isMobile ? '0.5rem 0.65rem' : '0.65rem 1.15rem', 
            borderRadius: isMobile ? '6px' : '0',
            fontWeight: 800, 
            fontSize: isMobile ? '0.72rem' : '0.8125rem',
            backgroundColor: pathname === '/admin/produk' ? 'var(--color-chocolate)' : 'transparent',
            color: pathname === '/admin/produk' ? '#ffffff' : 'var(--color-text-primary)',
            borderLeft: (!isMobile && pathname === '/admin/produk') ? '3px solid var(--color-caramel)' : '3px solid transparent',
            letterSpacing: '0.5px',
            marginTop: '2px',
            transition: 'background-color 0.15s ease'
          }}
        >
          <span style={{ fontSize: isMobile ? '0.8rem' : '0.9rem' }}>🥛</span>
          <span>PRODUK</span>
        </Link>

        {/* Karyawan */}
        <Link 
          href="/admin/karyawan"
          onClick={() => setMobileMenuOpen(false)}
          style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: isMobile ? '0.5rem 0.65rem' : '0.65rem 1.15rem', 
            borderRadius: isMobile ? '6px' : '0',
            fontWeight: 800, 
            fontSize: isMobile ? '0.72rem' : '0.8125rem',
            backgroundColor: pathname === '/admin/karyawan' ? 'var(--color-chocolate)' : 'transparent',
            color: pathname === '/admin/karyawan' ? '#ffffff' : 'var(--color-text-primary)',
            borderLeft: (!isMobile && pathname === '/admin/karyawan') ? '3px solid var(--color-caramel)' : '3px solid transparent',
            letterSpacing: '0.5px',
            marginTop: '2px',
            transition: 'background-color 0.15s ease'
          }}
        >
          <span style={{ fontSize: isMobile ? '0.8rem' : '0.9rem' }}>👥</span>
          <span>KARYAWAN</span>
        </Link>

        {/* Manajemen Akun */}
        <Link 
          href="/admin/akun"
          onClick={() => setMobileMenuOpen(false)}
          style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: isMobile ? '0.5rem 0.65rem' : '0.65rem 1.15rem', 
            borderRadius: isMobile ? '6px' : '0',
            fontWeight: 800, 
            fontSize: isMobile ? '0.72rem' : '0.8125rem',
            backgroundColor: pathname === '/admin/akun' ? 'var(--color-chocolate)' : 'transparent',
            color: pathname === '/admin/akun' ? '#ffffff' : 'var(--color-text-primary)',
            borderLeft: (!isMobile && pathname === '/admin/akun') ? '3px solid var(--color-caramel)' : '3px solid transparent',
            letterSpacing: '0.5px',
            marginTop: '2px',
            transition: 'background-color 0.15s ease'
          }}
        >
          <span style={{ fontSize: isMobile ? '0.8rem' : '0.9rem' }}>🔐</span>
          <span>MANAJEMEN AKUN</span>
        </Link>

        {/* Laporan */}
        <Link 
          href="/admin/laporan"
          onClick={() => setMobileMenuOpen(false)}
          style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: isMobile ? '0.5rem 0.65rem' : '0.65rem 1.15rem', 
            borderRadius: isMobile ? '6px' : '0',
            fontWeight: 800, 
            fontSize: isMobile ? '0.72rem' : '0.8125rem',
            backgroundColor: pathname === '/admin/laporan' ? 'var(--color-chocolate)' : 'transparent',
            color: pathname === '/admin/laporan' ? '#ffffff' : 'var(--color-text-primary)',
            borderLeft: (!isMobile && pathname === '/admin/laporan') ? '3px solid var(--color-caramel)' : '3px solid transparent',
            letterSpacing: '0.5px',
            marginTop: '2px',
            transition: 'background-color 0.15s ease'
          }}
        >
          <span style={{ fontSize: isMobile ? '0.8rem' : '0.9rem' }}>📈</span>
          <span>LAPORAN</span>
        </Link>
      </nav>

      <div style={{ 
        padding: isMobile ? '0.5rem 0.5rem max(0.5rem, env(safe-area-inset-bottom, 0.5rem)) 0.5rem' : '0.85rem 1.15rem', 
        borderTop: '1px solid var(--color-border)' 
      }}>
        <button 
          onClick={handleLogout} 
          className="btn-secondary" 
          style={{ 
            width: '100%', 
            padding: isMobile ? '0.42rem' : '0.55rem', 
            fontSize: isMobile ? '0.6875rem' : '0.75rem',
            borderRadius: isMobile ? '6px' : '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.35rem'
          }}
        >
          <span>🚪</span>
          <span>KELUAR</span>
        </button>
      </div>
    </>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      
      {/* Mobile Top Navigation Bar (Visible on mobile/tablet) */}
      <header className="admin-mobile-header" style={{ 
        display: 'none', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '0.55rem 0.85rem', 
        backgroundColor: 'var(--color-bg-dark)', 
        borderBottom: '1px solid var(--color-border)',
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ 
              padding: '0.25rem 0.45rem', 
              fontSize: '0.95rem', 
              fontWeight: 800, 
              border: '1px solid var(--color-border)', 
              borderRadius: '4px',
              backgroundColor: 'var(--color-bg-light)',
              cursor: 'pointer',
              lineHeight: 1
            }}
            aria-label="Buka menu navigasi"
          >
            ☰
          </button>
          <div>
            <span style={{ fontSize: '0.5rem', fontWeight: 800, color: 'var(--color-text-secondary)', letterSpacing: '0.5px', textTransform: 'uppercase', display: 'block' }}>
              ANDINI PURE MILK
            </span>
            <span style={{ fontSize: '0.8125rem', fontWeight: 800, letterSpacing: '0.5px' }}>
              {pathname === '/admin/dashboard' ? 'DASHBOARD' : 
               pathname === '/admin/produk' ? 'PRODUK' : 
               pathname === '/admin/karyawan' ? 'KARYAWAN' : 
               pathname === '/admin/akun' ? 'MANAJEMEN AKUN' : 
               pathname === '/admin/laporan' ? 'LAPORAN' : 
               pathname.includes('pemasukan') ? 'PEMASUKAN' : 
               pathname.includes('pengeluaran') ? 'PENGELUARAN' : 'ADMIN'}
            </span>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-error)', padding: '0.25rem 0.4rem', border: '1px solid var(--color-border)', borderRadius: '4px', backgroundColor: 'transparent' }}
        >
          KELUAR
        </button>
      </header>

      {/* Main Container with Sidebar + Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        
        {/* Desktop Sidebar */}
        <aside className="admin-desktop-sidebar" style={{ 
          width: '220px', 
          backgroundColor: 'var(--color-bg-dark)', 
          borderRight: '1px solid var(--color-border)', 
          display: 'flex', 
          flexDirection: 'column' 
        }}>
          {renderNavLinks(false)}
        </aside>

        {/* Mobile Drawer Overlay Backdrop */}
        {mobileMenuOpen && (
          <div 
            onClick={() => setMobileMenuOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(2px)',
              zIndex: 9998
            }}
          />
        )}

        {/* Mobile Drawer Sidebar - Clean, Sleek, Touch Friendly */}
        <aside 
          className="admin-mobile-drawer"
          style={{ 
            position: 'fixed',
            top: 0,
            bottom: 0,
            left: 0,
            width: '240px',
            maxWidth: '84vw',
            backgroundColor: 'var(--color-bg-dark)',
            borderRight: '1px solid var(--color-border)',
            borderTopRightRadius: '16px',
            borderBottomRightRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 9999,
            transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.24s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: mobileMenuOpen ? '8px 0 28px rgba(0,0,0,0.22)' : 'none',
            overflow: 'hidden'
          }}
        >
          {renderNavLinks(true)}
        </aside>

        {/* Main Page Content */}
        <main style={{ flex: 1, overflowY: 'auto', backgroundColor: 'var(--color-bg-light)', width: '100%' }}>
          {children}
        </main>
      </div>

      <style jsx global>{`
        @media (max-width: 850px) {
          .admin-mobile-header {
            display: flex !important;
          }
          .admin-desktop-sidebar {
            display: none !important;
          }
          .admin-mobile-close-btn {
            display: block !important;
          }
        }
        @media (min-width: 851px) {
          .admin-mobile-header {
            display: none !important;
          }
          .admin-mobile-drawer {
            display: none !important;
          }
          .admin-mobile-close-btn {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

