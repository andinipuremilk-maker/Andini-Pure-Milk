'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function KasirPage() {
  const router = useRouter();
  const [produk, setProduk] = useState([]);
  const [kategori, setKategori] = useState([]);
  const [activeKategori, setActiveKategori] = useState(null);
  const [searchProduk, setSearchProduk] = useState('');
  
  const [order, setOrder] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showPayment, setShowPayment] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [completedTx, setCompletedTx] = useState(null);

  const [metodeBayar, setMetodeBayar] = useState('tunai');
  const [seller, setSeller] = useState('Umum / Retail');
  const [customSeller, setCustomSeller] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [processing, setProcessing] = useState(false);

  const [sellersList, setSellersList] = useState([
    'Umum / Retail',
    'NAFIS',
    'EKO',
    'SD LATENG',
    'SD AL KHARIYAH',
    'PAK GOFAR',
    'FARHAN',
    'AIRIN',
    'PAK TOTOK',
    'TIM ANDINI',
    'Lainnya (Kustom)'
  ]);
  const [showQuickAddSeller, setShowQuickAddSeller] = useState(false);
  const [quickSellerName, setQuickSellerName] = useState('');
  const [savingQuickSeller, setSavingQuickSeller] = useState(false);
  const [quickSellerError, setQuickSellerError] = useState('');

  const handleQuickAddSeller = async () => {
    const trimmed = quickSellerName.trim();
    if (!trimmed) {
      setQuickSellerError('Nama mitra tidak boleh kosong.');
      return;
    }

    try {
      setSavingQuickSeller(true);
      setQuickSellerError('');
      const res = await fetch('/api/sellers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama: trimmed })
      });
      const result = await res.json();
      if (res.ok) {
        const newName = result.seller?.nama || trimmed;
        setSellersList(prev => {
          const withoutCustom = prev.filter(s => s !== 'Lainnya (Kustom)');
          if (!withoutCustom.includes(newName)) {
            withoutCustom.push(newName);
          }
          return [...withoutCustom, 'Lainnya (Kustom)'];
        });
        setSeller(newName);
        setShowQuickAddSeller(false);
        setQuickSellerName('');
      } else {
        setQuickSellerError(result.error || 'Gagal menambahkan mitra.');
      }
    } catch (err) {
      setQuickSellerError('Terjadi kesalahan jaringan.');
    } finally {
      setSavingQuickSeller(false);
    }
  };

  useEffect(() => {
    // Check auth
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        router.push('/login?role=kasir');
        return;
      }
      const user = JSON.parse(userStr);
      if (!user || user.role !== 'kasir') {
        router.push('/login?role=kasir');
        return;
      }
    } catch (e) {
      router.push('/login?role=kasir');
      return;
    }

    Promise.all([
      fetch('/api/produk').then(r => r.json()),
      fetch('/api/kategori').then(r => r.json()),
      fetch('/api/sellers').then(r => r.json()).catch(() => ({}))
    ]).then(([prodRes, katRes, sellerRes]) => {
      setProduk(Array.isArray(prodRes) ? prodRes : []);
      setKategori(Array.isArray(katRes) ? katRes : []);
      if (sellerRes && Array.isArray(sellerRes.sellers)) {
        const names = sellerRes.sellers.map(s => s.nama);
        if (!names.includes('Lainnya (Kustom)')) names.push('Lainnya (Kustom)');
        setSellersList(names);
      }
      setLoading(false);
    });
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login?role=kasir');
  };

  const addToOrder = (product) => {
    setOrder(prev => {
      const existing = prev.find(item => item.produk_id === product.id);
      if (existing) {
        return prev.map(item => 
          item.produk_id === product.id 
            ? { ...item, qty: item.qty + 1 }
            : item
        );
      }
      return [...prev, { 
        produk_id: product.id, 
        nama: product.nama, 
        harga_satuan: product.harga_jual, 
        qty: 1 
      }];
    });
  };

  const updateQty = (item, delta) => {
    setOrder(prev => prev.map(o => {
      if (o.produk_id === item.produk_id) {
        const newQty = o.qty + delta;
        return { ...o, qty: newQty > 0 ? newQty : 1 };
      }
      return o;
    }));
  };

  const deleteItem = (item) => {
    setOrder(prev => prev.filter(o => o.produk_id !== item.produk_id));
  };

  const total = order.reduce((sum, item) => sum + (item.qty * item.harga_satuan), 0);
  const totalQty = order.reduce((sum, item) => sum + item.qty, 0);

  const getEffectiveSeller = () => {
    if (seller === 'Lainnya (Kustom)') {
      return customSeller.trim() || 'Umum / Retail';
    }
    return seller;
  };

  const handlePayment = async () => {
    setProcessing(true);
    const user = JSON.parse(localStorage.getItem('user')) || { id: 'u2' };
    const effectiveSeller = getEffectiveSeller();

    try {
      const res = await fetch('/api/transaksi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaksiData: {
            total,
            bayar: total,
            metode_bayar: metodeBayar,
            seller: effectiveSeller,
            keterangan: keterangan.trim()
          },
          detailItems: order,
          userId: user.id
        })
      });
      
      if (res.ok) {
        const txResult = await res.json();
        setCompletedTx({
          no_transaksi: txResult.no_transaksi || 'TRX-SUCCESS',
          tanggal: new Date().toISOString(),
          items: [...order],
          total,
          bayar: total,
          metode_bayar: metodeBayar,
          seller: effectiveSeller,
          keterangan: keterangan.trim()
        });
        setOrder([]);
        setKeterangan('');
        setShowPayment(false);
        setShowReceipt(true);
      } else {
        alert('Gagal memproses transaksi.');
      }
    } catch (e) {
      alert('Terjadi kesalahan jaringan.');
    } finally {
      setProcessing(false);
    }
  };

  const filteredProduk = produk.filter(p => {
    const matchesCat = !activeKategori || p.kategori_id === activeKategori;
    const matchesSearch = !searchProduk || p.nama.toLowerCase().includes(searchProduk.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const getCategoryName = (catId) => {
    const cat = kategori.find(k => k.id === catId);
    return cat ? cat.nama : 'Umum';
  };

  const [mobileTab, setMobileTab] = useState('menu'); // 'menu' | 'cart'

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: 'var(--color-bg-light)', fontWeight: 800 }}>
      MEMUAT POS KASIR...
    </div>
  );

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-bg-light)', position: 'relative' }}>
      {/* Header */}
      <header style={{ 
        padding: '0.65rem 1rem', 
        borderBottom: '2px solid var(--color-border)', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        backgroundColor: '#ffffff', 
        gap: '0.5rem' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
          <span style={{ 
            backgroundColor: 'var(--color-chocolate)', 
            color: '#ffffff', 
            padding: '0.25rem 0.5rem', 
            borderRadius: '4px', 
            fontWeight: 800, 
            fontSize: '0.7rem', 
            letterSpacing: '1px',
            whiteSpace: 'nowrap'
          }}>
            ANDINI
          </span>
          <h1 style={{ 
            fontSize: '0.95rem', 
            fontWeight: 900, 
            letterSpacing: '0.5px', 
            margin: 0, 
            color: 'var(--color-text-primary)',
            whiteSpace: 'nowrap'
          }}>
            POS KASIR <span style={{ color: 'var(--color-chocolate)', fontWeight: 700, fontSize: '0.8rem' }}>&bull; PURE MILK</span>
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="badge-chocolate" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', whiteSpace: 'nowrap' }}>
            <span>👤</span>
            <span>Kasir</span>
          </span>
          <button 
            onClick={handleLogout} 
            className="btn-secondary"
            style={{ padding: '0.35rem 0.65rem', fontSize: '0.72rem', borderColor: 'var(--color-border)', whiteSpace: 'nowrap' }}
          >
            LOGOUT
          </button>
        </div>
      </header>

      {/* Mobile Tab Switcher (Visible only on mobile/tablet) */}
      <div className="kasir-mobile-tabs" style={{ display: 'none', backgroundColor: 'var(--color-bg-dark)', borderBottom: '1px solid var(--color-border)', padding: '0.5rem 0.75rem', gap: '0.5rem' }}>
        <button 
          onClick={() => setMobileTab('menu')}
          style={{ 
            flex: 1, 
            padding: '0.65rem 0.5rem', 
            borderRadius: '4px', 
            fontWeight: 800, 
            fontSize: '0.8125rem',
            backgroundColor: mobileTab === 'menu' ? 'var(--color-text-primary)' : 'var(--color-bg-light)',
            color: mobileTab === 'menu' ? 'var(--color-bg-light)' : 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
            cursor: 'pointer'
          }}
        >
          🛍️ MENU PRODUK ({filteredProduk.length})
        </button>
        <button 
          onClick={() => setMobileTab('cart')}
          style={{ 
            flex: 1, 
            padding: '0.65rem 0.5rem', 
            borderRadius: '4px', 
            fontWeight: 800, 
            fontSize: '0.8125rem',
            backgroundColor: mobileTab === 'cart' ? 'var(--color-text-primary)' : 'var(--color-bg-light)',
            color: mobileTab === 'cart' ? 'var(--color-bg-light)' : 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
            cursor: 'pointer',
            position: 'relative'
          }}
        >
          🛒 KERANJANG {totalQty > 0 ? `(${totalQty})` : ''}
        </button>
      </div>

      {/* Main Layout */}
      <main style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        
        {/* Left Side: Product Selection & Filters */}
        <section 
          className={`kasir-menu-section ${mobileTab === 'menu' ? 'active-mobile' : ''}`}
          style={{ flex: 2, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-bg-dark)', borderRight: '2px solid var(--color-border)' }}
        >
          {/* Search & Category Filter Toolbar */}
          <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-light)', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            
            {/* Search Input */}
            <div>
              <input 
                type="text"
                className="input-field"
                placeholder="🔍 Cari nama produk / kategori..."
                value={searchProduk}
                onChange={e => setSearchProduk(e.target.value)}
                style={{ padding: '0.65rem 0.85rem', fontSize: '0.875rem' }}
              />
            </div>

            {/* Category Filter Pills with smooth scroll */}
            <div className="no-scrollbar" style={{ display: 'flex', overflowX: 'auto', gap: '0.4rem', paddingBottom: '0.2rem', WebkitOverflowScrolling: 'touch' }}>
              <button 
                onClick={() => setActiveKategori(null)}
                style={{ 
                  padding: '0.45rem 0.85rem', 
                  borderRadius: '6px', 
                  border: `1.5px solid ${activeKategori === null ? 'var(--color-chocolate)' : 'var(--color-chocolate-border)'}`, 
                  backgroundColor: activeKategori === null ? 'var(--color-chocolate)' : '#ffffff', 
                  color: activeKategori === null ? '#ffffff' : 'var(--color-text-primary)', 
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                SEMUA
              </button>
              {kategori.map(k => {
                const isActive = activeKategori === k.id;
                return (
                  <button 
                    key={k.id}
                    onClick={() => setActiveKategori(k.id)}
                    style={{ 
                      padding: '0.45rem 0.85rem', 
                      borderRadius: '6px', 
                      border: `1.5px solid ${isActive ? 'var(--color-chocolate)' : 'var(--color-chocolate-border)'}`, 
                      backgroundColor: isActive ? 'var(--color-chocolate)' : '#ffffff', 
                      color: isActive ? '#ffffff' : 'var(--color-text-primary)', 
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {k.nama.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Product Grid */}
          <div style={{ 
            flex: 1, 
            overflowY: 'auto', 
            padding: '0.85rem', 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', 
            gap: '0.625rem', 
            alignContent: 'start', 
            paddingBottom: order.length > 0 ? 'max(5.5rem, calc(4.5rem + env(safe-area-inset-bottom, 0px)))' : '1rem' 
          }}>
            {filteredProduk.map(p => (
              <div 
                key={p.id} 
                onClick={() => addToOrder(p)}
                style={{ 
                  backgroundColor: '#ffffff', 
                  border: '1px solid var(--color-border)', 
                  borderRadius: '8px', 
                  padding: '0.75rem', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between', 
                  minHeight: '120px',
                  transition: 'all 0.15s ease',
                  userSelect: 'none'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = 'var(--color-chocolate)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(124, 74, 45, 0.12)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div>
                  <span style={{ fontSize: '0.625rem', fontWeight: 800, color: 'var(--color-caramel)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    {getCategoryName(p.kategori_id)}
                  </span>
                  <h3 style={{ fontSize: '0.8125rem', fontWeight: 800, marginTop: '0.2rem', marginBottom: '0.3rem', lineHeight: 1.25, color: '#0a0a0a' }}>{p.nama}</h3>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem', paddingTop: '0.4rem', borderTop: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 900, color: 'var(--color-chocolate)' }}>
                    Rp {p.harga_jual.toLocaleString('id-ID')}
                  </span>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 900, 
                    backgroundColor: 'var(--color-chocolate-light)', 
                    color: 'var(--color-chocolate)',
                    border: '1px solid var(--color-chocolate-border)', 
                    padding: '0.15rem 0.45rem', 
                    borderRadius: '4px' 
                  }}>
                    +
                  </span>
                </div>
              </div>
            ))}
            {filteredProduk.length === 0 && (
              <div style={{ gridColumn: '1 / -1', padding: '3rem 1rem', textAlign: 'center', color: 'var(--color-text-secondary)', fontWeight: 700, fontSize: '0.875rem' }}>
                Tidak ada produk ditemukan.
              </div>
            )}
          </div>

          {/* Sticky Mobile Floating Checkout Bar (When on menu tab with items) */}
          {order.length > 0 && (
            <div 
              className="kasir-floating-cart-bar"
              onClick={() => setMobileTab('cart')}
              style={{
                display: 'none',
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: 'var(--color-text-primary)',
                color: 'var(--color-bg-light)',
                padding: '0.75rem 1rem max(0.85rem, env(safe-area-inset-bottom, 0.85rem)) 1rem',
                zIndex: 90,
                boxShadow: '0 -4px 16px rgba(0,0,0,0.2)',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer'
              }}
            >
              <div>
                <span style={{ fontSize: '0.6875rem', opacity: 0.85, display: 'block', letterSpacing: '0.5px' }}>
                  🛒 {totalQty} PRODUK DIPILIH
                </span>
                <strong style={{ fontSize: '1.15rem' }}>Rp {total.toLocaleString('id-ID')}</strong>
              </div>
              <span style={{ 
                backgroundColor: 'var(--color-bg-light)', 
                color: 'var(--color-text-primary)', 
                padding: '0.5rem 1rem', 
                borderRadius: '4px', 
                fontWeight: 800, 
                fontSize: '0.75rem',
                letterSpacing: '0.5px'
              }}>
                LIHAT PESANAN &rarr;
              </span>
            </div>
          )}
        </section>

        {/* Right Side: Order Summary Cart */}
        <section 
          className={`kasir-cart-section ${mobileTab === 'cart' ? 'active-mobile' : ''}`}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-bg-light)', minWidth: '360px' }}
        >
          <div style={{ padding: '1rem 1.25rem', borderBottom: '2px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button 
                onClick={() => setMobileTab('menu')}
                className="kasir-back-to-menu-btn"
                style={{ display: 'none', padding: '0.25rem 0.5rem', fontSize: '0.75rem', fontWeight: 800, border: '1px solid var(--color-border)', borderRadius: '4px' }}
              >
                &larr; MENU
              </button>
              <h2 style={{ fontSize: '0.9375rem', fontWeight: 800, letterSpacing: '1px', margin: 0 }}>PESANAN SAAT INI</h2>
            </div>

            {order.length > 0 && (
              <button 
                onClick={() => setOrder([])} 
                style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-error)', border: 'none', background: 'none', cursor: 'pointer' }}
              >
                KOSONGKAN
              </button>
            )}
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 1.25rem' }}>
            {order.length === 0 ? (
              <div style={{ color: 'var(--color-text-secondary)', textAlign: 'center', marginTop: '3rem', fontWeight: 700 }}>
                <p style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🛒</p>
                <p style={{ fontSize: '0.875rem' }}>Belum ada produk dipilih.</p>
                <button 
                  onClick={() => setMobileTab('menu')}
                  className="btn-secondary" 
                  style={{ marginTop: '1rem', padding: '0.6rem 1rem', fontSize: '0.75rem' }}
                >
                  PILIH DARI MENU
                </button>
              </div>
            ) : (
              order.map(item => (
                <div key={item.produk_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 0', borderBottom: '1px solid var(--color-border)' }}>
                  <div style={{ flex: 1, paddingRight: '0.75rem' }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 800, margin: 0 }}>{item.nama}</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: '0.2rem 0 0 0' }}>
                      Rp {item.harga_satuan.toLocaleString('id-ID')} &times; {item.qty} = <strong style={{ color: 'var(--color-text-primary)' }}>Rp {(item.qty * item.harga_satuan).toLocaleString('id-ID')}</strong>
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <button 
                      onClick={() => updateQty(item, -1)} 
                      style={{ width: '30px', height: '30px', border: '1px solid var(--color-border)', borderRadius: '4px', fontWeight: 800, cursor: 'pointer', backgroundColor: 'var(--color-bg-dark)' }}
                    >
                      -
                    </button>
                    <span style={{ width: '24px', textAlign: 'center', fontWeight: 800, fontSize: '0.8125rem' }}>{item.qty}</span>
                    <button 
                      onClick={() => updateQty(item, 1)} 
                      style={{ width: '30px', height: '30px', border: '1px solid var(--color-border)', borderRadius: '4px', fontWeight: 800, cursor: 'pointer', backgroundColor: 'var(--color-bg-dark)' }}
                    >
                      +
                    </button>
                    <button 
                      onClick={() => deleteItem(item)} 
                      style={{ width: '30px', height: '30px', border: '1px solid var(--color-border)', color: 'var(--color-error)', borderRadius: '4px', fontWeight: 800, marginLeft: '0.25rem', cursor: 'pointer', backgroundColor: 'var(--color-bg-dark)' }}
                    >
                      &times;
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Checkout Footer */}
          <div style={{ borderTop: '2px solid var(--color-border)', padding: '1rem 1.25rem max(1rem, env(safe-area-inset-bottom, 1rem)) 1.25rem', backgroundColor: 'var(--color-chocolate-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>TOTAL ITEM</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>{totalQty} item</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>TOTAL TAGIHAN</span>
              <span style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--color-chocolate)' }}>Rp {total.toLocaleString('id-ID')}</span>
            </div>
            <button 
              className="btn-chocolate" 
              style={{ width: '100%', padding: '1rem', fontSize: '0.9375rem', letterSpacing: '1px' }} 
              disabled={order.length === 0}
              onClick={() => setShowPayment(true)}
            >
              PROSES PEMBAYARAN &rarr;
            </button>
          </div>
        </section>
      </main>

      <style jsx global>{`
        @media (max-width: 850px) {
          .kasir-mobile-tabs {
            display: flex !important;
          }
          .kasir-menu-section {
            display: none !important;
            border-right: none !important;
          }
          .kasir-menu-section.active-mobile {
            display: flex !important;
            flex: 1 !important;
          }
          .kasir-cart-section {
            display: none !important;
            min-width: 100% !important;
          }
          .kasir-cart-section.active-mobile {
            display: flex !important;
            flex: 1 !important;
          }
          .kasir-floating-cart-bar {
            display: flex !important;
          }
          .kasir-back-to-menu-btn {
            display: inline-block !important;
          }
        }
      `}</style>


      {/* Payment Modal */}
      {showPayment && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '520px', width: '90%' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '1px', margin: 0 }}>KONFIRMASI PEMBAYARAN</h2>
              <button 
                onClick={() => setShowPayment(false)} 
                style={{ fontSize: '1.25rem', fontWeight: 800, cursor: 'pointer', background: 'none', border: 'none' }}
              >
                &times;
              </button>
            </div>

            <div style={{ backgroundColor: 'var(--color-bg-dark)', padding: '1.25rem', borderRadius: '4px', border: '1px solid var(--color-border)', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', letterSpacing: '1px' }}>TOTAL TAGIHAN</span>
                <span style={{ fontSize: '1.75rem', fontWeight: 800 }}>Rp {total.toLocaleString('id-ID')}</span>
              </div>
              <span style={{ padding: '0.3rem 0.6rem', border: '1px solid var(--color-text-primary)', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800 }}>
                {totalQty} ITEM
              </span>
            </div>

            {/* Seller / Mitra Selection */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '1px' }}>SELLER / MITRA / PELANGGAN</label>
                <button
                  type="button"
                  onClick={() => { setShowQuickAddSeller(!showQuickAddSeller); setQuickSellerError(''); setQuickSellerName(''); }}
                  style={{
                    background: 'none',
                    border: '1px solid var(--color-chocolate)',
                    color: 'var(--color-chocolate)',
                    padding: '0.2rem 0.55rem',
                    borderRadius: '4px',
                    fontSize: '0.6875rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  {showQuickAddSeller ? 'BATAL' : '+ MITRA BARU'}
                </button>
              </div>

              {/* Quick Add Inline Form */}
              {showQuickAddSeller && (
                <div style={{ marginBottom: '0.75rem', padding: '0.75rem', backgroundColor: 'var(--color-bg-dark)', borderRadius: '6px', border: '1px solid var(--color-chocolate)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.35rem', color: 'var(--color-chocolate)' }}>
                    ➕ DAFTARKAN MITRA BARU
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Nama mitra baru (misal: BU ENI)..."
                      value={quickSellerName}
                      onChange={e => setQuickSellerName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleQuickAddSeller(); } }}
                      disabled={savingQuickSeller}
                      style={{ padding: '0.45rem 0.65rem', fontSize: '0.8125rem', flex: 1 }}
                      autoFocus
                    />
                    <button
                      type="button"
                      disabled={savingQuickSeller || !quickSellerName.trim()}
                      onClick={handleQuickAddSeller}
                      className="btn-chocolate"
                      style={{ padding: '0.45rem 0.85rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                    >
                      {savingQuickSeller ? '...' : 'SIMPAN & PILIH'}
                    </button>
                  </div>
                  {quickSellerError && (
                    <div style={{ color: 'var(--color-error)', fontSize: '0.6875rem', marginTop: '0.35rem', fontWeight: 700 }}>
                      ⚠️ {quickSellerError}
                    </div>
                  )}
                </div>
              )}

              <select 
                className="input-field" 
                value={seller} 
                onChange={e => setSeller(e.target.value)}
                style={{ marginBottom: seller === 'Lainnya (Kustom)' ? '0.5rem' : 0 }}
              >
                {sellersList.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {seller === 'Lainnya (Kustom)' && (
                <input 
                  type="text" 
                  className="input-field"
                  placeholder="Ketik nama Mitra / Pelanggan kustom..."
                  value={customSeller}
                  onChange={e => setCustomSeller(e.target.value)}
                />
              )}
            </div>

            {/* Payment Method Selector */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '1px' }}>METODE PEMBAYARAN</label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {['tunai', 'qris', 'transfer'].map(metode => (
                  <button 
                    key={metode}
                    type="button"
                    onClick={() => setMetodeBayar(metode)}
                    style={{ 
                      flex: '1 1 80px', 
                      minWidth: '75px',
                      padding: '0.75rem 0.5rem', 
                      border: '1px solid var(--color-border)', 
                      borderRadius: '4px', 
                      textTransform: 'uppercase', 
                      fontWeight: 800, 
                      fontSize: '0.8125rem', 
                      cursor: 'pointer',
                      backgroundColor: metodeBayar === metode ? 'var(--color-chocolate)' : 'var(--color-bg-light)', 
                      color: metodeBayar === metode ? '#ffffff' : 'var(--color-text-primary)' 
                    }}
                  >
                    {metode}
                  </button>
                ))}
              </div>
            </div>

            {/* Form Keterangan / Catatan Pembelian */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '1px' }}>
                KETERANGAN / CATATAN PESANAN (OPSIONAL)
              </label>
              <textarea 
                className="input-field" 
                rows={2}
                placeholder="Contoh: Es dipisah, STMJ tanpa telur bebek, titipan reseller Pak Gofar, dll..."
                value={keterangan}
                onChange={e => setKeterangan(e.target.value)}
                style={{ 
                  resize: 'vertical',
                  minHeight: '65px',
                  fontSize: '0.8125rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '6px'
                }}
              />
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button 
                type="button"
                className="btn-secondary" 
                style={{ flex: 1, padding: '0.85rem' }} 
                onClick={() => setShowPayment(false)} 
                disabled={processing}
              >
                BATAL
              </button>
              <button 
                type="button"
                className="btn-primary" 
                style={{ flex: 1, padding: '0.85rem' }} 
                onClick={handlePayment} 
                disabled={processing}
              >
                {processing ? 'MEMPROSES...' : 'KONFIRMASI BAYAR'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Transaction Receipt Modal */}
      {showReceipt && completedTx && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content" style={{ maxWidth: '450px', width: '90%', textAlign: 'center' }}>
            <div style={{ padding: '0.5rem 0 1.5rem 0', borderBottom: '2px dashed var(--color-border)', marginBottom: '1.5rem' }}>
              <span style={{ padding: '0.2rem 0.6rem', border: '1px solid var(--color-text-primary)', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800 }}>
                TRANSAKSI BERHASIL
              </span>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.75rem', marginBottom: '0.25rem' }}>ANDINI PURE MILK</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: 0 }}>No. Trx: {completedTx.no_transaksi}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: '0.25rem 0 0 0' }}>
                {new Date(completedTx.tanggal).toLocaleString('id-ID')} | Mitra: {completedTx.seller}
              </p>
            </div>

            {/* Receipt Items List */}
            <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
              {completedTx.items.map((it, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{it.nama}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{it.qty} x Rp {it.harga_satuan.toLocaleString('id-ID')}</div>
                  </div>
                  <div style={{ fontWeight: 800 }}>Rp {(it.qty * it.harga_satuan).toLocaleString('id-ID')}</div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '2px dashed var(--color-border)', paddingTop: '1rem', marginBottom: '1.5rem', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.125rem', marginBottom: '0.5rem' }}>
                <span>TOTAL</span>
                <span>Rp {completedTx.total.toLocaleString('id-ID')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                <span>METODE PEMBAYARAN</span>
                <span style={{ textTransform: 'uppercase', fontWeight: 700 }}>{completedTx.metode_bayar}</span>
              </div>
              {completedTx.keterangan && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '0.4rem' }}>
                  <span>KETERANGAN:</span>
                  <span style={{ fontWeight: 600, fontStyle: 'italic', maxWidth: '65%', textAlign: 'right', color: 'var(--color-chocolate)' }}>
                    {completedTx.keterangan}
                  </span>
                </div>
              )}
            </div>

            <button 
              className="btn-primary" 
              style={{ width: '100%', padding: '1rem' }}
              onClick={() => {
                setShowReceipt(false);
                setCompletedTx(null);
              }}
            >
              TRANSAKSI BARU
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
