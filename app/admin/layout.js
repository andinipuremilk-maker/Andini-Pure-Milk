'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  IconMilk,
  IconDashboard,
  IconReceipt,
  IconPackage,
  IconUsers,
  IconShield,
  IconFileText,
  IconCart,
  IconLogOut,
  IconChevronDown,
  IconChevronRight,
  IconX,
  IconTrendingUp,
  IconTrendingDown
} from '../../components/ui/icons';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [transaksiManualToggle, setTransaksiManualToggle] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminUser, setAdminUser] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          if (user && user.role === 'admin') return user;
        }
      } catch (e) {}
    }
    return null;
  });

  const isTransaksiOpen = transaksiManualToggle !== null 
    ? transaksiManualToggle 
    : pathname.startsWith('/admin/transaksi');

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

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login?role=admin');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', color: 'var(--text-secondary)' }}>
        Memuat Admin Panel...
      </div>
    );
  }

  const isTransaksiActive = pathname.startsWith('/admin/transaksi');
  const isPemasukanActive = pathname === '/admin/transaksi/pemasukan' || pathname === '/admin/transaksi';
  const isPengeluaranActive = pathname === '/admin/transaksi/pengeluaran';

  const renderNavLinks = (isMobile = false) => (
    <>
      {/* Brand Header */}
      <div style={{
        padding: isMobile ? '1.15rem 1rem' : '1.25rem 1.25rem 1rem 1.25rem',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--accent-subtle)',
            border: '1px solid var(--accent-border)',
            color: 'var(--accent-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <IconMilk size={18} />
          </div>
          <div>
            <h2 style={{
              fontSize: '0.875rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: 0,
              lineHeight: 1.2
            }}>
              Andini Pure Milk
            </h2>
            <span style={{
              fontSize: '0.6875rem',
              color: 'var(--text-secondary)',
              fontWeight: 500,
              display: 'block'
            }}>
              Management Console
            </span>
          </div>
        </div>

        {isMobile && (
          <button
            onClick={() => setMobileMenuOpen(false)}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--surface-panel)',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            aria-label="Tutup menu"
          >
            <IconX size={15} />
          </button>
        )}
      </div>

      {/* Nav Items */}
      <nav style={{ flex: 1, padding: '0.75rem 0.65rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {/* Dashboard */}
        <Link
          href="/admin/dashboard"
          onClick={() => setMobileMenuOpen(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.55rem 0.75rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.8125rem',
            fontWeight: pathname === '/admin/dashboard' ? 600 : 500,
            backgroundColor: pathname === '/admin/dashboard' ? 'var(--accent-subtle)' : 'transparent',
            color: pathname === '/admin/dashboard' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            transition: 'all 0.12s ease'
          }}
        >
          <IconDashboard size={16} />
          <span>Dashboard</span>
        </Link>

        {/* Transaksi Section */}
        <div>
          <button
            type="button"
            onClick={() => {
              if (pathname !== '/admin/transaksi/pemasukan' && !isTransaksiActive) {
                setTransaksiManualToggle(true);
                if (isMobile) setMobileMenuOpen(false);
                router.push('/admin/transaksi/pemasukan');
              } else {
                setTransaksiManualToggle(!isTransaksiOpen);
              }
            }}
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.55rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8125rem',
              fontWeight: isTransaksiActive ? 600 : 500,
              backgroundColor: isTransaksiActive && !isTransaksiOpen ? 'var(--accent-subtle)' : 'transparent',
              color: isTransaksiActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
              transition: 'all 0.12s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <IconReceipt size={16} />
              <span>Transaksi</span>
            </div>
            <span style={{ color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center' }}>
              {isTransaksiOpen ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
            </span>
          </button>

          {/* Submenu Transaksi */}
          {isTransaksiOpen && (
            <div style={{
              margin: '2px 0 4px 1rem',
              paddingLeft: '0.65rem',
              borderLeft: '1.5px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px'
            }}>
              <Link
                href="/admin/transaksi/pemasukan"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.4rem 0.55rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.78125rem',
                  fontWeight: isPemasukanActive ? 600 : 400,
                  backgroundColor: isPemasukanActive ? 'var(--accent-subtle)' : 'transparent',
                  color: isPemasukanActive ? 'var(--accent-primary)' : 'var(--text-secondary)'
                }}
              >
                <IconTrendingUp size={13} style={{ color: isPemasukanActive ? 'var(--status-success)' : 'inherit' }} />
                <span>Pemasukan (Sales)</span>
              </Link>

              <Link
                href="/admin/transaksi/pengeluaran"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.4rem 0.55rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.78125rem',
                  fontWeight: isPengeluaranActive ? 600 : 400,
                  backgroundColor: isPengeluaranActive ? 'var(--accent-subtle)' : 'transparent',
                  color: isPengeluaranActive ? 'var(--accent-primary)' : 'var(--text-secondary)'
                }}
              >
                <IconTrendingDown size={13} style={{ color: isPengeluaranActive ? 'var(--status-danger)' : 'inherit' }} />
                <span>Pengeluaran (Beban)</span>
              </Link>
            </div>
          )}
        </div>

        {/* Produk & Stok */}
        <Link
          href="/admin/produk"
          onClick={() => setMobileMenuOpen(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.55rem 0.75rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.8125rem',
            fontWeight: pathname === '/admin/produk' ? 600 : 500,
            backgroundColor: pathname === '/admin/produk' ? 'var(--accent-subtle)' : 'transparent',
            color: pathname === '/admin/produk' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            transition: 'all 0.12s ease'
          }}
        >
          <IconPackage size={16} />
          <span>Produk & Stok</span>
        </Link>

        {/* Karyawan */}
        <Link
          href="/admin/karyawan"
          onClick={() => setMobileMenuOpen(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.55rem 0.75rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.8125rem',
            fontWeight: pathname === '/admin/karyawan' ? 600 : 500,
            backgroundColor: pathname === '/admin/karyawan' ? 'var(--accent-subtle)' : 'transparent',
            color: pathname === '/admin/karyawan' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            transition: 'all 0.12s ease'
          }}
        >
          <IconUsers size={16} />
          <span>Karyawan</span>
        </Link>

        {/* Manajemen Akun */}
        <Link
          href="/admin/akun"
          onClick={() => setMobileMenuOpen(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.55rem 0.75rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.8125rem',
            fontWeight: pathname === '/admin/akun' ? 600 : 500,
            backgroundColor: pathname === '/admin/akun' ? 'var(--accent-subtle)' : 'transparent',
            color: pathname === '/admin/akun' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            transition: 'all 0.12s ease'
          }}
        >
          <IconShield size={16} />
          <span>Manajemen Akun</span>
        </Link>

        {/* Laporan */}
        <Link
          href="/admin/laporan"
          onClick={() => setMobileMenuOpen(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.55rem 0.75rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.8125rem',
            fontWeight: pathname === '/admin/laporan' ? 600 : 500,
            backgroundColor: pathname === '/admin/laporan' ? 'var(--accent-subtle)' : 'transparent',
            color: pathname === '/admin/laporan' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            transition: 'all 0.12s ease'
          }}
        >
          <IconFileText size={16} />
          <span>Laporan Keuangan</span>
        </Link>
      </nav>

      {/* Bottom Footer Actions */}
      <div style={{
        padding: '0.85rem',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        backgroundColor: 'var(--surface-canvas)'
      }}>
        {/* Shortcut to POS Kasir */}
        <Link
          href="/kasir"
          onClick={() => setMobileMenuOpen(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.55rem 0.75rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--surface-panel)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--accent-primary)',
            fontSize: '0.78125rem',
            fontWeight: 600,
            boxShadow: 'var(--shadow-xs)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <IconCart size={15} />
            <span>Terminal Kasir</span>
          </div>
          <IconChevronRight size={13} style={{ color: 'var(--text-tertiary)' }} />
        </Link>

        {/* User Info & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.25rem 0.2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', overflow: 'hidden' }}>
            <div style={{
              width: '26px',
              height: '26px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--accent-primary)',
              color: 'var(--text-inverse)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.72rem',
              fontWeight: 700,
              flexShrink: 0
            }}>
              {adminUser?.nama?.charAt(0) || 'A'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                {adminUser?.nama || 'Administrator'}
              </span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', display: 'block' }}>
                Pusat
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            style={{
              padding: '0.35rem 0.5rem',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              fontSize: '0.72rem',
              fontWeight: 500,
              transition: 'color 0.15s ease'
            }}
            title="Keluar dari akun"
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--status-danger)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
          >
            <IconLogOut size={14} />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--surface-canvas)' }}>
      {/* Mobile Top Header */}
      <header className="admin-mobile-header" style={{
        display: 'none',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.65rem 1rem',
        backgroundColor: 'var(--surface-panel)',
        borderBottom: '1px solid var(--border-subtle)',
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              padding: '0.35rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--surface-panel)',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            aria-label="Buka menu navigasi"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <div>
            <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
              Andini Pure Milk
            </span>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {pathname === '/admin/dashboard' ? 'Dashboard' : 
               pathname === '/admin/produk' ? 'Produk & Stok' : 
               pathname === '/admin/karyawan' ? 'Karyawan' : 
               pathname === '/admin/akun' ? 'Manajemen Akun' : 
               pathname === '/admin/laporan' ? 'Laporan Keuangan' : 
               pathname.includes('pemasukan') ? 'Transaksi Pemasukan' : 
               pathname.includes('pengeluaran') ? 'Transaksi Pengeluaran' : 'Admin'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Link
            href="/kasir"
            className="btn-primary"
            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
          >
            <IconCart size={14} />
            <span>Kasir</span>
          </Link>
        </div>
      </header>

      {/* Main Container: Sidebar + Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        {/* Desktop Sidebar */}
        <aside className="admin-desktop-sidebar" style={{
          width: '230px',
          backgroundColor: 'var(--surface-panel)',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 10
        }}>
          {renderNavLinks(false)}
        </aside>

        {/* Mobile Backdrop */}
        {mobileMenuOpen && (
          <div
            onClick={() => setMobileMenuOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(28, 25, 23, 0.45)',
              zIndex: 9998
            }}
          />
        )}

        {/* Mobile Drawer */}
        <aside
          className="admin-mobile-drawer"
          style={{
            position: 'fixed',
            top: 0,
            bottom: 0,
            left: 0,
            width: '260px',
            maxWidth: '85vw',
            backgroundColor: 'var(--surface-panel)',
            borderRight: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 9999,
            transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: mobileMenuOpen ? 'var(--shadow-lg)' : 'none',
            overflow: 'hidden'
          }}
        >
          {renderNavLinks(true)}
        </aside>

        {/* Main Page Area */}
        <main style={{ flex: 1, overflowY: 'auto', backgroundColor: 'var(--surface-canvas)', width: '100%' }}>
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
        }
        @media (min-width: 851px) {
          .admin-mobile-header {
            display: none !important;
          }
          .admin-mobile-drawer {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
