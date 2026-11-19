'use client';
import { useState, useEffect, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useResponsivePagination } from '../../../lib/useResponsivePagination';
import {
  IconDownload,
  IconCalendar,
  IconRefresh,
  IconUser,
  IconX,
  IconPackage,
  IconBanknote,
  IconQrCode,
  IconCreditCard,
  IconDashboard,
  IconReceipt,
  IconMilk,
  IconSearch,
  IconTrendingUp,
  IconTrendingDown,
  IconCheck
} from '../../../components/ui/icons';

function StatCard({ title, value, subtitle, highlightColor, badgeText, badgeColor }) {
  return (
    <div className="panel" style={{ padding: '1rem 1.15rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
        <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{title}</span>
        {badgeText && (
          <span style={{ 
            fontSize: '0.625rem', 
            fontWeight: 700, 
            padding: '0.15rem 0.45rem', 
            borderRadius: 'var(--radius-sm)',
            backgroundColor: badgeColor ? `${badgeColor}18` : 'var(--surface-subtle)',
            color: badgeColor || 'var(--text-secondary)'
          }}>
            {badgeText}
          </span>
        )}
      </div>
      <p className="tabular" style={{ fontSize: '1.25rem', fontWeight: 800, whiteSpace: 'nowrap', margin: 0, color: highlightColor || 'var(--text-primary)' }}>{value}</p>
      {subtitle && <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.25rem', margin: 0, whiteSpace: 'nowrap' }}>{subtitle}</p>}
    </div>
  );
}

export default function LaporanPage() {
  const [stats, setStats] = useState(null);
  const [rangeType, setRangeType] = useState('month'); // 'today' | 'week' | 'month' | 'year' | 'custom'
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Active Tab: 'overview' (Ringkasan Umum) | 'pnl' (Laporan Laba Rugi Detail) | 'products' (Analisis Laba per Produk)
  const [activeTab, setActiveTab] = useState('overview');

  // Tab 3 Filter & Sorting
  const [productSearch, setProductSearch] = useState('');
  const [productSort, setProductSort] = useState('profit'); // 'profit' | 'qty' | 'sales' | 'margin'

  // Responsive Pagination (5 di Mobile, 8 di Tablet, 12 di Desktop)
  const ITEMS_PER_PAGE = useResponsivePagination(5, 8, 12);
  const [currentPage, setCurrentPage] = useState(0);

  // PDF Preview State
  const [pdfPreviewModal, setPdfPreviewModal] = useState(false);
  const [previewImg, setPreviewImg] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const [loadError, setLoadError] = useState('');

  // Periode dikirim sebagai tanggal kalender WIB (YYYY-MM-DD); server menghitung
  // 00:00–23:59 WIB sehingga hari pertama & terakhir ikut terhitung penuh.
  const periode = useMemo(() => {
    if (rangeType === 'custom') {
      return customStart && customEnd ? `${customStart}|${customEnd}` : null;
    }
    const tglWib = (d) => d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
    const today = tglWib(new Date());
    let start = today;
    if (rangeType === 'week') {
      // 7 hari terakhir termasuk hari ini
      start = tglWib(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000));
    } else if (rangeType === 'month') {
      start = `${today.slice(0, 7)}-01`;
    } else if (rangeType === 'year') {
      start = `${today.slice(0, 4)}-01-01`;
    }
    return `${start}|${today}`;
  }, [rangeType, customStart, customEnd]);

  // Periode yang datanya sedang tampil; berbeda dari `periode` berarti masih memuat
  const [loadedPeriode, setLoadedPeriode] = useState(null);
  const isLoading = periode !== null && loadedPeriode !== periode;

  useEffect(() => {
    if (!periode) return;
    let isMounted = true;
    const [start, end] = periode.split('|');

    fetch(`/api/laporan?type=laporan&start=${start}&end=${end}`)
      .then(async r => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok || data.error) throw new Error(data.error || 'Gagal memuat laporan');
        return data;
      })
      .then(data => {
        if (isMounted) {
          setStats(data);
          setLoadError('');
          setLoadedPeriode(periode);
          setCurrentPage(0);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setStats(null);
          setLoadError(err.message || 'Gagal memuat laporan');
          setLoadedPeriode(periode);
        }
      });

    return () => { isMounted = false; };
  }, [periode]);

  const handleOpenPDFPreview = async () => {
    const element = document.getElementById('laporan-content');
    if (!element) return;
    
    setPdfPreviewModal(true);
    setGeneratingPdf(true);
    setPreviewImg(null);
    setPdfDoc(null);

    try {
      const canvas = await html2canvas(element, { 
        scale: 2, 
        backgroundColor: '#ffffff',
        useCORS: true,
        scrollY: 0,
        scrollX: 0,
        windowScrollY: 0
      });
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();

      const margin = 10;
      const contentWidth = pdfWidth - (margin * 2);
      const imgHeight = (canvas.height * contentWidth) / canvas.width;

      setPreviewImg(imgData);
      setPdfDoc({ pdf, imgData, margin, contentWidth, imgHeight });
    } catch (e) {
      alert('Gagal menghasilkan preview PDF');
      setPdfPreviewModal(false);
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!pdfDoc) return;
    const { imgData, margin, contentWidth, imgHeight } = pdfDoc;
    // Buat dokumen baru tiap unduh (agar gambar tidak menumpuk) dan pecah ke beberapa halaman A4
    const pdf = new jsPDF('p', 'mm', 'a4');
    const usableHeight = pdf.internal.pageSize.getHeight() - margin * 2;
    for (let offset = 0, page = 0; offset < imgHeight; offset += usableHeight, page++) {
      if (page > 0) pdf.addPage();
      pdf.addImage(imgData, 'PNG', margin, margin - offset, contentWidth, imgHeight);
      // Tutup area margin agar potongan gambar halaman lain tidak terlihat
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, pdf.internal.pageSize.getWidth(), margin, 'F');
      pdf.rect(0, margin + usableHeight, pdf.internal.pageSize.getWidth(), margin, 'F');
    }
    pdf.save(`Laporan_Keuangan_Andini_${activeTab}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Top 5 Best Selling Products for Overview
  const productSalesMap = {};
  if (stats && stats.transactionsList) {
    stats.transactionsList.forEach(tx => {
      if (tx.items && Array.isArray(tx.items)) {
        tx.items.forEach(it => {
          const key = it.produk_id || it.nama_produk;
          if (!productSalesMap[key]) {
            productSalesMap[key] = {
              id: key,
              nama: it.nama_produk,
              qty: 0,
              revenue: 0
            };
          }
          productSalesMap[key].qty += (it.qty || 1);
          productSalesMap[key].revenue += (it.subtotal || ((it.qty || 1) * (it.harga_satuan || 0)) || 0);
        });
      }
    });
  }

  const topProductsList = Object.values(productSalesMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  // Tab 3 Filtered & Sorted Product Profitability
  const filteredProducts = useMemo(() => {
    if (!stats || !stats.productProfitability) return [];
    let list = stats.productProfitability.filter(p => 
      p.nama.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.kategori && p.kategori.toLowerCase().includes(productSearch.toLowerCase()))
    );

    if (productSort === 'profit') {
      list.sort((a, b) => b.grossProfit - a.grossProfit);
    } else if (productSort === 'qty') {
      list.sort((a, b) => b.qty - a.qty);
    } else if (productSort === 'sales') {
      list.sort((a, b) => b.grossSales - a.grossSales);
    } else if (productSort === 'margin') {
      list.sort((a, b) => b.marginPct - a.marginPct);
    }
    return list;
  }, [stats, productSearch, productSort]);

  // Financial metrics
  const netMargin = (stats && stats.totalRevenue > 0) 
    ? Math.round(((stats.totalNetProfit || 0) / stats.totalRevenue) * 100) 
    : 0;

  const grossMargin = (stats && stats.totalRevenue > 0)
    ? Math.round(((stats.totalGrossProfit || 0) / stats.totalRevenue) * 100)
    : (stats?.grossMarginPct || 0);

  const opexRatio = (stats && stats.totalRevenue > 0)
    ? Math.round(((stats.totalExpense || 0) / stats.totalRevenue) * 100)
    : 0;

  return (
    <div className="admin-page-container">
      
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>Laporan Keuangan & Laba Bersih</h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>Rekapitulasi omset, harga pokok penjualan (HPP), beban operasional, dan laba bersih detail</p>
        </div>
        <button 
          type="button"
          className="btn-primary" 
          onClick={handleOpenPDFPreview} 
          style={{ padding: '0.55rem 1rem', fontSize: '0.8125rem' }}
        >
          <IconDownload size={15} />
          <span>Ekspor Laporan PDF</span>
        </button>
      </div>

      {/* Date Filter Card */}
      <div className="card" style={{ marginBottom: '1.25rem', padding: '1rem' }}>
        <div className="responsive-filter-bar">
          
          <div style={{ flex: 1, minWidth: '180px' }}>
            <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, marginBottom: '0.35rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Periode Laporan</label>
            <select 
              className="input-field"
              value={rangeType}
              onChange={e => setRangeType(e.target.value)}
              style={{ fontSize: '0.8125rem' }}
            >
              <option value="today">Hari Ini</option>
              <option value="week">7 Hari Terakhir</option>
              <option value="month">Bulan Ini</option>
              <option value="year">Tahun Ini</option>
              <option value="custom">Kustom Tanggal</option>
            </select>
          </div>

          {rangeType === 'custom' && (
            <>
              <div style={{ flex: 1, minWidth: '140px' }}>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, marginBottom: '0.35rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Dari Tanggal</label>
                <input 
                  type="date" 
                  className="input-field" 
                  value={customStart} 
                  onChange={e => setCustomStart(e.target.value)} 
                  style={{ fontSize: '0.8125rem' }}
                />
              </div>
              <div style={{ flex: 1, minWidth: '140px' }}>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, marginBottom: '0.35rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Sampai Tanggal</label>
                <input 
                  type="date" 
                  className="input-field" 
                  value={customEnd} 
                  onChange={e => setCustomEnd(e.target.value)} 
                  style={{ fontSize: '0.8125rem' }}
                />
              </div>
            </>
          )}

          {rangeType !== 'month' && (
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => {
                  setRangeType('month');
                  setCustomStart('');
                  setCustomEnd('');
                }}
                style={{ padding: '0.55rem 0.95rem', fontSize: '0.75rem' }}
              >
                <IconRefresh size={13} />
                <span>Reset Periode</span>
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '0.5rem', 
        borderBottom: '1px solid var(--border-subtle)', 
        marginBottom: '1.25rem', 
        overflowX: 'auto',
        paddingBottom: '0.25rem'
      }}>
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.65rem 1.1rem',
            fontSize: '0.8125rem',
            fontWeight: 600,
            borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
            backgroundColor: activeTab === 'overview' ? 'var(--surface)' : 'transparent',
            color: activeTab === 'overview' ? 'var(--terracotta)' : 'var(--text-secondary)',
            border: 'none',
            borderBottom: activeTab === 'overview' ? '2.5px solid var(--terracotta)' : '2.5px solid transparent',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap'
          }}
        >
          <IconDashboard size={16} />
          <span>Ringkasan Umum</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pnl')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.65rem 1.1rem',
            fontSize: '0.8125rem',
            fontWeight: 600,
            borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
            backgroundColor: activeTab === 'pnl' ? 'var(--surface)' : 'transparent',
            color: activeTab === 'pnl' ? 'var(--terracotta)' : 'var(--text-secondary)',
            border: 'none',
            borderBottom: activeTab === 'pnl' ? '2.5px solid var(--terracotta)' : '2.5px solid transparent',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap'
          }}
        >
          <IconReceipt size={16} />
          <span>Laporan Laba Rugi Detail</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('products')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.65rem 1.1rem',
            fontSize: '0.8125rem',
            fontWeight: 600,
            borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
            backgroundColor: activeTab === 'products' ? 'var(--surface)' : 'transparent',
            color: activeTab === 'products' ? 'var(--terracotta)' : 'var(--text-secondary)',
            border: 'none',
            borderBottom: activeTab === 'products' ? '2.5px solid var(--terracotta)' : '2.5px solid transparent',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap'
          }}
        >
          <IconMilk size={16} />
          <span>Analisis Laba per Produk</span>
        </button>
      </div>

      {isLoading || !stats ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: !isLoading && loadError ? 'var(--status-danger)' : 'var(--text-secondary)', fontSize: '0.875rem' }}>
          {isLoading ? 'Memuat laporan keuangan...' : (loadError || 'Pilih tanggal awal dan akhir periode.')}
        </div>
      ) : (
        <div id="laporan-content" style={{ padding: '0.5rem 0', backgroundColor: 'transparent' }}>
          
          {/* ========================================================================= */}
          {/* TAB 1: RINGKASAN UMUM (OVERVIEW)                                          */}
          {/* ========================================================================= */}
          {activeTab === 'overview' && (
            <>
              {/* Executive Metrics Summary */}
              <section style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.65rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Ringkasan Eksekutif Keuangan</h2>
                <div className="responsive-stats-grid">
                  <StatCard 
                    title="Penjualan Bersih (Net)" 
                    value={`Rp ${(stats.totalRevenue || 0).toLocaleString('id-ID')}`} 
                    subtitle={stats.totalDiscount > 0 ? `Diskon: -Rp ${stats.totalDiscount.toLocaleString('id-ID')}` : `${stats.totalCount} transaksi`}
                    highlightColor="var(--terracotta)" 
                  />
                  <StatCard 
                    title="Modal Produk (HPP)" 
                    value={`Rp ${(stats.totalHpp || 0).toLocaleString('id-ID')}`} 
                    subtitle={`Laba Kotor: Rp ${(stats.totalGrossProfit || 0).toLocaleString('id-ID')}`}
                    highlightColor="var(--text-secondary)" 
                  />
                  <StatCard 
                    title="Beban Operasional" 
                    value={`Rp ${(stats.totalExpense || 0).toLocaleString('id-ID')}`} 
                    subtitle={`${stats.expenseCategoryBreakdown?.length || 0} kategori biaya`}
                    highlightColor="var(--status-danger)" 
                  />
                  <StatCard 
                    title="Laba Bersih Akhir" 
                    value={`Rp ${(stats.totalNetProfit || 0).toLocaleString('id-ID')}`} 
                    subtitle={`Margin Bersih: ${netMargin}%`}
                    highlightColor={(stats.totalNetProfit || 0) >= 0 ? 'var(--status-success)' : 'var(--status-danger)'} 
                  />
                </div>
              </section>

              {/* Side-by-Side Breakdown Tables */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                
                {/* Pendapatan per Kategori */}
                <div>
                  <h2 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.65rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Pendapatan per Kategori Produk</h2>
                  <div className="card" style={{ height: '100%', padding: '1rem' }}>
                    {stats.categoryBreakdown.length === 0 ? (
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', margin: 0 }}>Tidak ada transaksi penjualan pada periode ini.</p>
                    ) : (
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--surface-subtle)' }}>
                            <th style={{ padding: '0.6rem 0.75rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.6875rem', letterSpacing: '0.04em' }}>KATEGORI</th>
                            <th style={{ padding: '0.6rem 0.75rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.6875rem', letterSpacing: '0.04em', textAlign: 'right' }}>PENDAPATAN</th>
                            <th style={{ padding: '0.6rem 0.75rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.6875rem', letterSpacing: '0.04em', textAlign: 'right' }}>PANGSA</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.categoryBreakdown.map((item, i) => {
                            const pct = stats.totalRevenue > 0 ? Math.round((item.revenue / stats.totalRevenue) * 100) : 0;
                            return (
                              <tr key={i} style={{ borderBottom: i < stats.categoryBreakdown.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                                <td style={{ padding: '0.65rem 0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.kategori}</td>
                                <td className="tabular" style={{ padding: '0.65rem 0.75rem', textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)' }}>Rp {item.revenue.toLocaleString('id-ID')}</td>
                                <td className="tabular" style={{ padding: '0.65rem 0.75rem', textAlign: 'right', fontWeight: 600, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{pct}%</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                {/* Pengeluaran per Kategori */}
                <div>
                  <h2 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.65rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Pengeluaran per Kategori Operasional</h2>
                  <div className="card" style={{ height: '100%', padding: '1rem' }}>
                    {!stats.expenseCategoryBreakdown || stats.expenseCategoryBreakdown.length === 0 ? (
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', margin: 0 }}>Tidak ada pengeluaran pada periode ini.</p>
                    ) : (
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--surface-subtle)' }}>
                            <th style={{ padding: '0.6rem 0.75rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.6875rem', letterSpacing: '0.04em' }}>KATEGORI</th>
                            <th style={{ padding: '0.6rem 0.75rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.6875rem', letterSpacing: '0.04em', textAlign: 'right' }}>NOMINAL</th>
                            <th style={{ padding: '0.6rem 0.75rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.6875rem', letterSpacing: '0.04em', textAlign: 'right' }}>PANGSA</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.expenseCategoryBreakdown.map((item, i) => {
                            const pct = stats.totalExpense > 0 ? Math.round((item.nominal / stats.totalExpense) * 100) : 0;
                            return (
                              <tr key={i} style={{ borderBottom: i < stats.expenseCategoryBreakdown.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                                <td style={{ padding: '0.65rem 0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.kategori}</td>
                                <td className="tabular" style={{ padding: '0.65rem 0.75rem', textAlign: 'right', fontWeight: 700, color: 'var(--status-danger)' }}>- Rp {item.nominal.toLocaleString('id-ID')}</td>
                                <td className="tabular" style={{ padding: '0.65rem 0.75rem', textAlign: 'right', fontWeight: 600, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{pct}%</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

              </div>

              {/* Top 5 Best Sellers Section */}
              <section style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.65rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Produk Terlaris (Top 5 Best Sellers)</h2>
                <div className="card" style={{ padding: '1rem' }}>
                  {topProductsList.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', margin: 0 }}>Belum ada data penjualan produk pada periode ini.</p>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--surface-subtle)' }}>
                          <th style={{ padding: '0.6rem 0.75rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.6875rem', letterSpacing: '0.04em', width: '60px' }}>PERINGKAT</th>
                          <th style={{ padding: '0.6rem 0.75rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.6875rem', letterSpacing: '0.04em' }}>NAMA PRODUK</th>
                          <th style={{ padding: '0.6rem 0.75rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.6875rem', letterSpacing: '0.04em', textAlign: 'center' }}>TOTAL TERJUAL</th>
                          <th style={{ padding: '0.6rem 0.75rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.6875rem', letterSpacing: '0.04em', textAlign: 'right' }}>TOTAL OMZET</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topProductsList.map((item, i) => (
                          <tr key={i} style={{ borderBottom: i < topProductsList.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                            <td style={{ padding: '0.65rem 0.75rem', verticalAlign: 'middle' }}>
                              <span className={i === 0 ? 'badge-chocolate' : 'badge-neutral'} style={{ fontSize: '0.6875rem', padding: '0.1rem 0.45rem', fontWeight: 700 }}>
                                #{i + 1}
                              </span>
                            </td>
                            <td style={{ padding: '0.65rem 0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.nama}</td>
                            <td className="tabular" style={{ padding: '0.65rem 0.75rem', textAlign: 'center', fontWeight: 600, color: 'var(--text-primary)' }}>{item.qty} pcs</td>
                            <td className="tabular" style={{ padding: '0.65rem 0.75rem', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>Rp {item.revenue.toLocaleString('id-ID')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </section>

              {/* Compact Log Penjualan Summary */}
              <section>
                <h2 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.65rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Ringkasan Log Transaksi Penjualan</h2>
                <div className="table-responsive">
                  {stats.transactionsList && stats.transactionsList.length === 0 ? (
                    <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>Tidak ada transaksi pada periode ini.</div>
                  ) : (
                    <table style={{ width: '100%', minWidth: '780px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--surface-subtle)' }}>
                          <th style={{ padding: '0.65rem 0.85rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.6875rem', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>WAKTU & TANGGAL</th>
                          <th style={{ padding: '0.65rem 0.85rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.6875rem', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>NO. TRX</th>
                          <th style={{ padding: '0.65rem 0.85rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.6875rem', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>KASIR / PJ</th>
                          <th style={{ padding: '0.65rem 0.85rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.6875rem', letterSpacing: '0.04em' }}>RINGKASAN PRODUK</th>
                          <th style={{ padding: '0.65rem 0.85rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.6875rem', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>METODE</th>
                          <th style={{ padding: '0.65rem 0.85rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.6875rem', letterSpacing: '0.04em', textAlign: 'right', whiteSpace: 'nowrap' }}>TOTAL SETOR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.transactionsList && stats.transactionsList.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE).map((item, i) => {
                          const dt = new Date(item.tanggal);
                          const formattedDate = `${dt.toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' })} ${dt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })}`;
                          
                          let produkSummary = '-';
                          if (item.items && item.items.length > 0) {
                            const firstItem = item.items[0];
                            const countOther = item.items.length - 1;
                            produkSummary = `${firstItem.nama_produk} (${firstItem.qty}x)${countOther > 0 ? ` +${countOther} lainnya` : ''}`;
                          }

                          return (
                            <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background-color 0.15s ease' }}>
                              <td className="tabular" style={{ padding: '0.75rem 0.85rem', color: 'var(--text-secondary)', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>{formattedDate}</td>
                              <td style={{ padding: '0.75rem 0.85rem', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                                <span className="font-mono" style={{ 
                                  fontWeight: 600, 
                                  fontSize: '0.75rem', 
                                  backgroundColor: 'var(--surface-subtle)', 
                                  padding: '0.2rem 0.45rem', 
                                  borderRadius: 'var(--radius-sm)', 
                                  border: '1px solid var(--border-subtle)',
                                  color: 'var(--text-primary)'
                                }}>
                                  {item.no_transaksi}
                                </span>
                              </td>
                              <td style={{ padding: '0.75rem 0.85rem', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                                <span style={{ 
                                  display: 'inline-flex', 
                                  alignItems: 'center', 
                                  gap: '0.35rem', 
                                  color: 'var(--text-secondary)',
                                  fontWeight: 500,
                                  fontSize: '0.8125rem'
                                }}>
                                  <IconUser size={13} style={{ color: 'var(--text-tertiary)' }} />
                                  <span>{item.kasir || 'Kasir Gerai'}</span>
                                </span>
                              </td>
                              <td style={{ padding: '0.75rem 0.85rem', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-primary)' }}>{produkSummary}</td>
                              <td style={{ padding: '0.75rem 0.85rem', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                                <span className="badge-neutral" style={{ fontSize: '0.65rem', textTransform: 'uppercase', padding: '0.1rem 0.4rem' }}>
                                  {item.metode_bayar === 'tunai' && <IconBanknote size={11} style={{ marginRight: '0.2rem' }} />}
                                  {item.metode_bayar === 'qris' && <IconQrCode size={11} style={{ marginRight: '0.2rem' }} />}
                                  {item.metode_bayar === 'transfer' && <IconCreditCard size={11} style={{ marginRight: '0.2rem' }} />}
                                  {item.metode_bayar || 'TUNAI'}
                                </span>
                              </td>
                              <td className="tabular" style={{ padding: '0.75rem 0.85rem', textAlign: 'right', fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>Rp {Number(item.total || 0).toLocaleString('id-ID')}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Pagination Controls */}
                {stats.transactionsList && stats.transactionsList.length > ITEMS_PER_PAGE && (
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
                      Menampilkan {stats.transactionsList.length === 0 ? 0 : currentPage * ITEMS_PER_PAGE + 1} - {Math.min((currentPage + 1) * ITEMS_PER_PAGE, stats.transactionsList.length)} dari {stats.transactionsList.length} data &bull; Halaman {currentPage + 1} dari {Math.ceil(stats.transactionsList.length / ITEMS_PER_PAGE)}
                    </span>
                    <button 
                      type="button"
                      onClick={() => setCurrentPage(prev => Math.min(Math.ceil(stats.transactionsList.length / ITEMS_PER_PAGE) - 1, prev + 1))} 
                      disabled={currentPage >= Math.ceil(stats.transactionsList.length / ITEMS_PER_PAGE) - 1}
                      className="btn-secondary"
                      style={{ padding: '0.45rem 0.85rem', fontSize: '0.8125rem' }}
                    >
                      Selanjutnya &rarr;
                    </button>
                  </div>
                )}
              </section>
            </>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: LAPORAN LABA RUGI DETAIL (MULTI-STEP INCOME STATEMENT)             */}
          {/* ========================================================================= */}
          {activeTab === 'pnl' && (
            <div>
              {/* P&L Stage Highlights */}
              <section style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.65rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Struktur Keuangan Usaha</h2>
                <div className="responsive-stats-grid">
                  <StatCard 
                    title="1. Omzet Kotor (Gross)" 
                    value={`Rp ${(stats.totalGrossSales || stats.totalRevenue || 0).toLocaleString('id-ID')}`} 
                    subtitle={stats.totalDiscount > 0 ? `Diskon: Rp ${stats.totalDiscount.toLocaleString('id-ID')}` : 'Tanpa diskon'}
                    highlightColor="var(--text-primary)"
                  />
                  <StatCard 
                    title="2. Laba Kotor (Gross Profit)" 
                    value={`Rp ${(stats.totalGrossProfit || 0).toLocaleString('id-ID')}`} 
                    subtitle={`Margin Kotor: ${grossMargin}%`}
                    highlightColor="var(--status-success)"
                    badgeText={`${grossMargin}% Margin`}
                    badgeColor="var(--status-success)"
                  />
                  <StatCard 
                    title="3. Beban Operasional" 
                    value={`Rp ${(stats.totalExpense || 0).toLocaleString('id-ID')}`} 
                    subtitle={`Rasio OPEX: ${opexRatio}%`}
                    highlightColor="var(--status-danger)"
                  />
                  <StatCard 
                    title="4. Laba Bersih Akhir" 
                    value={`Rp ${(stats.totalNetProfit || 0).toLocaleString('id-ID')}`} 
                    subtitle={`Margin Bersih: ${netMargin}%`}
                    highlightColor={(stats.totalNetProfit || 0) >= 0 ? 'var(--status-success)' : 'var(--status-danger)'}
                    badgeText={(stats.totalNetProfit || 0) >= 0 ? 'Surplus' : 'Defisit'}
                    badgeColor={(stats.totalNetProfit || 0) >= 0 ? 'var(--status-success)' : 'var(--status-danger)'}
                  />
                </div>
              </section>

              {/* Multi-Step P&L Statement Table */}
              <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem', overflowX: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Laporan Laba Rugi Bertingkat (Multi-Step Income Statement)</h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>Perhitungan transparan dari penjualan kotor, modal produk, beban usaha, hingga laba bersih final</p>
                  </div>
                  <span className="badge-chocolate" style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem', fontWeight: 600 }}>
                    Standar Akuntansi POS
                  </span>
                </div>

                <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-subtle)', backgroundColor: 'var(--surface-subtle)' }}>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.6875rem', letterSpacing: '0.04em' }}>URAIAN AKUNTANSI</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.6875rem', letterSpacing: '0.04em', textAlign: 'center', width: '120px' }}>PANGSA / %</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.6875rem', letterSpacing: '0.04em', textAlign: 'right', width: '180px' }}>JUMLAH (RP)</th>
                    </tr>
                  </thead>
                  <tbody>
                    
                    {/* SECTION 1: PENDAPATAN OPERASIONAL */}
                    <tr style={{ backgroundColor: 'var(--surface-subtle)' }}>
                      <td colSpan={3} style={{ padding: '0.65rem 1rem', fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-primary)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        I. PENDAPATAN OPERASIONAL / PENJUALAN
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '0.65rem 1rem 0.65rem 2rem', color: 'var(--text-primary)' }}>
                        &bull; Penjualan Produk Kotor (Gross Sales)
                      </td>
                      <td className="tabular" style={{ padding: '0.65rem 1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>100%</td>
                      <td className="tabular" style={{ padding: '0.65rem 1rem', textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Rp {(stats.totalGrossSales || stats.totalRevenue || 0).toLocaleString('id-ID')}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '0.65rem 1rem 0.65rem 2rem', color: 'var(--text-secondary)' }}>
                        &bull; Potongan Harga, Voucher & Diskon Promo
                      </td>
                      <td className="tabular" style={{ padding: '0.65rem 1rem', textAlign: 'center', color: 'var(--status-danger)', fontSize: '0.78rem' }}>
                        {stats.totalGrossSales > 0 ? `-${Math.round((stats.totalDiscount / stats.totalGrossSales) * 100)}%` : '0%'}
                      </td>
                      <td className="tabular" style={{ padding: '0.65rem 1rem', textAlign: 'right', fontWeight: 600, color: 'var(--status-danger)' }}>
                        {stats.totalDiscount > 0 ? `- Rp ${stats.totalDiscount.toLocaleString('id-ID')}` : 'Rp 0'}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '2px solid var(--border-subtle)', backgroundColor: 'rgba(217, 119, 6, 0.04)' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        SUBTOTAL PENDAPATAN PENJUALAN BERSIH (NET SALES)
                      </td>
                      <td className="tabular" style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>100% Net</td>
                      <td className="tabular" style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, fontSize: '0.92rem', color: 'var(--terracotta)' }}>
                        Rp {(stats.totalRevenue || 0).toLocaleString('id-ID')}
                      </td>
                    </tr>

                    {/* SECTION 2: HARGA POKOK PENJUALAN (HPP) */}
                    <tr style={{ backgroundColor: 'var(--surface-subtle)' }}>
                      <td colSpan={3} style={{ padding: '0.65rem 1rem', fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-primary)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        II. HARGA POKOK PENJUALAN (HPP / COGS)
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '0.65rem 1rem 0.65rem 2rem', color: 'var(--text-secondary)' }}>
                        &bull; Beban Pokok Modal Bahan Baku & Kemasan Produk Terjual
                      </td>
                      <td className="tabular" style={{ padding: '0.65rem 1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                        {stats.totalRevenue > 0 ? `${Math.round(((stats.totalHpp || 0) / stats.totalRevenue) * 100)}%` : '0%'}
                      </td>
                      <td className="tabular" style={{ padding: '0.65rem 1rem', textAlign: 'right', fontWeight: 600, color: 'var(--status-danger)' }}>
                        - Rp {(stats.totalHpp || 0).toLocaleString('id-ID')}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '2px solid var(--border-subtle)', backgroundColor: 'rgba(16, 185, 129, 0.05)' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        LABA KOTOR PENJUALAN (GROSS PROFIT)
                      </td>
                      <td className="tabular" style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 700, color: 'var(--status-success)', fontSize: '0.8rem' }}>
                        {grossMargin}% Margin
                      </td>
                      <td className="tabular" style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, fontSize: '0.92rem', color: 'var(--status-success)' }}>
                        Rp {(stats.totalGrossProfit || 0).toLocaleString('id-ID')}
                      </td>
                    </tr>

                    {/* SECTION 3: BEBAN OPERASIONAL */}
                    <tr style={{ backgroundColor: 'var(--surface-subtle)' }}>
                      <td colSpan={3} style={{ padding: '0.65rem 1rem', fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-primary)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        III. BEBAN OPERASIONAL (OPERATING EXPENSES / OPEX)
                      </td>
                    </tr>
                    {(!stats.expenseCategoryBreakdown || stats.expenseCategoryBreakdown.length === 0) ? (
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td colSpan={3} style={{ padding: '0.65rem 1rem 0.65rem 2rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                          Tidak ada beban operasional yang dicatat pada periode ini.
                        </td>
                      </tr>
                    ) : (
                      stats.expenseCategoryBreakdown.map((exp, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '0.65rem 1rem 0.65rem 2rem', color: 'var(--text-primary)' }}>
                            &bull; {exp.kategori}
                          </td>
                          <td className="tabular" style={{ padding: '0.65rem 1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                            {exp.percentage || (stats.totalExpense > 0 ? Math.round((exp.nominal / stats.totalExpense) * 100) : 0)}%
                          </td>
                          <td className="tabular" style={{ padding: '0.65rem 1rem', textAlign: 'right', fontWeight: 600, color: 'var(--status-danger)' }}>
                            - Rp {exp.nominal.toLocaleString('id-ID')}
                          </td>
                        </tr>
                      ))
                    )}
                    <tr style={{ borderBottom: '2px solid var(--border-subtle)', backgroundColor: 'rgba(239, 68, 68, 0.04)' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        TOTAL BEBAN OPERASIONAL
                      </td>
                      <td className="tabular" style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 700, color: 'var(--status-danger)', fontSize: '0.8rem' }}>
                        {opexRatio}% Omzet
                      </td>
                      <td className="tabular" style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, fontSize: '0.92rem', color: 'var(--status-danger)' }}>
                        - Rp {(stats.totalExpense || 0).toLocaleString('id-ID')}
                      </td>
                    </tr>

                    {/* SECTION 4: LABA BERSIH AKHIR (BOTTOM LINE) */}
                    <tr style={{ backgroundColor: (stats.totalNetProfit || 0) >= 0 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)' }}>
                      <td style={{ padding: '1rem', fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                        LABA BERSIH AKHIR USAHA (NET PROFIT / BOTTOM LINE)
                      </td>
                      <td className="tabular" style={{ padding: '1rem', textAlign: 'center', fontWeight: 800, fontSize: '0.85rem', color: (stats.totalNetProfit || 0) >= 0 ? 'var(--status-success)' : 'var(--status-danger)' }}>
                        {netMargin}% Margin
                      </td>
                      <td className="tabular" style={{ padding: '1rem', textAlign: 'right', fontWeight: 800, fontSize: '1.125rem', color: (stats.totalNetProfit || 0) >= 0 ? 'var(--status-success)' : 'var(--status-danger)' }}>
                        Rp {(stats.totalNetProfit || 0).toLocaleString('id-ID')}
                      </td>
                    </tr>

                  </tbody>
                </table>
              </div>

              {/* Financial Health Insights */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                <div className="card" style={{ padding: '1.15rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <IconTrendingUp size={16} style={{ color: 'var(--status-success)' }} />
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>Efisiensi Modal Produk (Gross Margin)</span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                    Margin kotor usaha tercatat sebesar <strong style={{ color: 'var(--text-primary)' }}>{grossMargin}%</strong>. Dari setiap Rp 10.000 omzet produk yang terjual, Andini Pure Milk menghasilkan laba kotor sebesar <strong style={{ color: 'var(--status-success)' }}>Rp {Math.round(grossMargin * 100).toLocaleString('id-ID')}</strong> sebelum dipotong beban sewa, listrik, dan operasional gerai.
                  </p>
                </div>

                <div className="card" style={{ padding: '1.15rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <IconBanknote size={16} style={{ color: 'var(--terracotta)' }} />
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>Rasio Beban Operasional (OPEX)</span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                    Beban operasional saat ini memakan <strong style={{ color: 'var(--text-primary)' }}>{opexRatio}%</strong> dari total penjualan bersih. Pengeluaran operasional terbesar berada pada kategori <strong style={{ color: 'var(--text-primary)' }}>{stats.expenseCategoryBreakdown?.[0]?.kategori || 'Operasional'}</strong> senilai Rp {(stats.expenseCategoryBreakdown?.[0]?.nominal || 0).toLocaleString('id-ID')}.
                  </p>
                </div>

                <div className="card" style={{ padding: '1.15rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <IconCheck size={16} style={{ color: (stats.totalNetProfit || 0) >= 0 ? 'var(--status-success)' : 'var(--status-danger)' }} />
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>Kesehatan Arus Kas Bersih</span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                    {(stats.totalNetProfit || 0) >= 0 ? (
                      <>
                        Usaha berada dalam kondisi <strong style={{ color: 'var(--status-success)' }}>SURPLUS / SEHAT</strong> dengan margin laba bersih sebesar <strong>{netMargin}%</strong>. Keuntungan riil ini siap dicairkan atau dialokasikan sebagai modal pengembangan gerai.
                      </>
                    ) : (
                      <>
                        Usaha sedang mengalami <strong style={{ color: 'var(--status-danger)' }}>DEFISIT</strong> sebesar Rp {Math.abs(stats.totalNetProfit || 0).toLocaleString('id-ID')}. Evaluasi pos beban operasional yang bernilai besar atau tingkatkan volume penjualan produk dengan margin tinggi.
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: ANALISIS LABA PER PRODUK (PRODUCT PROFITABILITY)                   */}
          {/* ========================================================================= */}
          {activeTab === 'products' && (
            <div>
              {/* Product Profitability Summary Cards */}
              <section style={{ marginBottom: '1.25rem' }}>
                <div className="responsive-stats-grid">
                  <StatCard 
                    title="Total Produk Terjual" 
                    value={`${stats.productProfitability?.reduce((s, p) => s + p.qty, 0) || 0} pcs`} 
                    subtitle={`Dari ${stats.productProfitability?.length || 0} varian menu`}
                    highlightColor="var(--text-primary)"
                  />
                  <StatCard 
                    title="Total Laba Kotor Produk" 
                    value={`Rp ${(stats.totalGrossProfit || 0).toLocaleString('id-ID')}`} 
                    subtitle={`Sebelum beban operasional`}
                    highlightColor="var(--status-success)"
                  />
                  <StatCard 
                    title="Produk Laba Terbesar"
                    value={stats.productProfitability?.[0]?.nama || '-'} 
                    subtitle={`Laba: Rp ${(stats.productProfitability?.[0]?.grossProfit || 0).toLocaleString('id-ID')}`}
                    highlightColor="var(--terracotta)"
                  />
                  <StatCard 
                    title="Rata-rata Margin Produk" 
                    value={`${grossMargin}%`} 
                    subtitle="Efisiensi biaya bahan baku"
                    highlightColor="var(--status-success)"
                  />
                </div>
              </section>

              {/* Table Filter & Search Controls */}
              <div className="card" style={{ padding: '0.85rem 1rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '220px' }}>
                    <div style={{ position: 'relative', width: '100%' }}>
                      <input 
                        type="text" 
                        placeholder="Cari nama produk atau kategori..." 
                        value={productSearch}
                        onChange={e => setProductSearch(e.target.value)}
                        className="input-field"
                        style={{ paddingLeft: '2.1rem', fontSize: '0.8125rem' }}
                      />
                      <IconSearch size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Urutkan:</span>
                    <select 
                      className="input-field" 
                      value={productSort} 
                      onChange={e => setProductSort(e.target.value)}
                      style={{ fontSize: '0.8125rem', width: 'auto' }}
                    >
                      <option value="profit">Laba Kotor Terbesar</option>
                      <option value="qty">Qty Penjualan Terbanyak</option>
                      <option value="sales">Omzet Penjualan Tertinggi</option>
                      <option value="margin">Margin % Tertinggi</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Product Profitability Table */}
              <div className="table-responsive">
                {filteredProducts.length === 0 ? (
                  <div className="card" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                    {productSearch ? 'Tidak ada produk yang cocok dengan pencarian.' : 'Belum ada data penjualan produk pada periode ini.'}
                  </div>
                ) : (
                  <table style={{ width: '100%', minWidth: '850px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--surface-subtle)' }}>
                        <th style={{ padding: '0.7rem 0.85rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.6875rem', letterSpacing: '0.04em', width: '60px' }}>NO</th>
                        <th style={{ padding: '0.7rem 0.85rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.6875rem', letterSpacing: '0.04em' }}>NAMA PRODUK</th>
                        <th style={{ padding: '0.7rem 0.85rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.6875rem', letterSpacing: '0.04em' }}>KATEGORI</th>
                        <th style={{ padding: '0.7rem 0.85rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.6875rem', letterSpacing: '0.04em', textAlign: 'center' }}>QTY TERJUAL</th>
                        <th style={{ padding: '0.7rem 0.85rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.6875rem', letterSpacing: '0.04em', textAlign: 'right' }}>TOTAL OMZET</th>
                        <th style={{ padding: '0.7rem 0.85rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.6875rem', letterSpacing: '0.04em', textAlign: 'right' }}>MODAL (HPP)</th>
                        <th style={{ padding: '0.7rem 0.85rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.6875rem', letterSpacing: '0.04em', textAlign: 'right' }}>LABA KOTOR</th>
                        <th style={{ padding: '0.7rem 0.85rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.6875rem', letterSpacing: '0.04em', textAlign: 'center' }}>MARGIN %</th>
                        <th style={{ padding: '0.7rem 0.85rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.6875rem', letterSpacing: '0.04em', textAlign: 'center' }}>STATUS MARGIN</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((p, idx) => {
                        let statusBadge = { label: 'Margin Sehat', bg: 'rgba(16, 185, 129, 0.1)', color: 'var(--status-success)' };
                        if (p.marginPct >= 50) {
                          statusBadge = { label: 'Sangat Tinggi', bg: 'rgba(217, 119, 6, 0.12)', color: 'var(--terracotta)' };
                        } else if (p.marginPct < 30) {
                          statusBadge = { label: 'Margin Tipis', bg: 'rgba(239, 68, 68, 0.1)', color: 'var(--status-danger)' };
                        }

                        return (
                          <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background-color 0.15s ease' }}>
                            <td className="tabular" style={{ padding: '0.75rem 0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                              #{idx + 1}
                            </td>
                            <td style={{ padding: '0.75rem 0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {p.nama}
                            </td>
                            <td style={{ padding: '0.75rem 0.85rem', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                              {p.kategori || 'Umum'}
                            </td>
                            <td className="tabular" style={{ padding: '0.75rem 0.85rem', textAlign: 'center', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {p.qty} pcs
                            </td>
                            <td className="tabular" style={{ padding: '0.75rem 0.85rem', textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)' }}>
                              Rp {p.grossSales.toLocaleString('id-ID')}
                            </td>
                            <td className="tabular" style={{ padding: '0.75rem 0.85rem', textAlign: 'right', color: 'var(--text-secondary)' }}>
                              Rp {p.hpp.toLocaleString('id-ID')}
                            </td>
                            <td className="tabular" style={{ padding: '0.75rem 0.85rem', textAlign: 'right', fontWeight: 700, color: 'var(--status-success)' }}>
                              Rp {p.grossProfit.toLocaleString('id-ID')}
                            </td>
                            <td className="tabular" style={{ padding: '0.75rem 0.85rem', textAlign: 'center', fontWeight: 700, color: 'var(--text-primary)' }}>
                              {p.marginPct}%
                            </td>
                            <td style={{ padding: '0.75rem 0.85rem', textAlign: 'center' }}>
                              <span style={{ 
                                fontSize: '0.6875rem', 
                                fontWeight: 700, 
                                padding: '0.15rem 0.5rem', 
                                borderRadius: 'var(--radius-sm)', 
                                backgroundColor: statusBadge.bg, 
                                color: statusBadge.color 
                              }}>
                                {statusBadge.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

        </div>
      )}

      {/* PDF Preview Modal */}
      {pdfPreviewModal && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content" style={{ maxWidth: '850px', width: '92%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              <div>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>Preview Laporan PDF</h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
                  Pratinjau visual {activeTab === 'pnl' ? 'Laporan Laba Rugi Detail' : activeTab === 'products' ? 'Analisis Laba per Produk' : 'Ringkasan Laporan Keuangan'}
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setPdfPreviewModal(false)}
                style={{ color: 'var(--text-secondary)', padding: '0.35rem', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center' }}
                aria-label="Tutup modal"
              >
                <IconX size={18} />
              </button>
            </div>

            <div style={{ 
              flex: 1, 
              minHeight: '440px', 
              maxHeight: '560px', 
              backgroundColor: 'var(--surface-subtle)', 
              borderRadius: 'var(--radius-md)', 
              border: '1px solid var(--border-subtle)', 
              overflowY: 'auto', 
              padding: '1.5rem', 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'flex-start' 
            }}>
              {generatingPdf ? (
                <div style={{ padding: '4rem', textAlign: 'center', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  Memproses pratinjau dokumen PDF...
                </div>
              ) : previewImg ? (
                <div style={{ 
                  boxShadow: 'var(--shadow-md)', 
                  border: '1px solid var(--border-subtle)', 
                  backgroundColor: '#ffffff', 
                  maxWidth: '100%',
                  borderRadius: 'var(--radius-sm)',
                  overflow: 'hidden'
                }}>
                  <img 
                    src={previewImg} 
                    alt="Preview Laporan PDF" 
                    style={{ width: '100%', height: 'auto', display: 'block' }} 
                  />
                </div>
              ) : (
                <div style={{ color: 'var(--status-danger)', padding: '2rem', fontWeight: 600, fontSize: '0.875rem' }}>Gagal memuat pratinjau dokumen.</div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
              <button 
                type="button"
                className="btn-secondary" 
                onClick={() => setPdfPreviewModal(false)}
                style={{ flex: '1 1 120px', padding: '0.65rem 1rem' }}
              >
                Batal
              </button>
              <button 
                type="button"
                className="btn-primary" 
                onClick={handleDownloadPDF}
                disabled={generatingPdf || !pdfDoc}
                style={{ flex: '1 1 180px', padding: '0.65rem 1rem' }}
              >
                <IconDownload size={15} />
                <span>Unduh Dokumen PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
