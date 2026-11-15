'use client';
import { useState, useEffect } from 'react';
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
  IconCreditCard
} from '../../../components/ui/icons';

function StatCard({ title, value, subtitle, highlightColor }) {
  return (
    <div className="panel" style={{ padding: '1rem 1.15rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{title}</span>
      <p className="tabular" style={{ fontSize: '1.25rem', fontWeight: 800, whiteSpace: 'nowrap', margin: 0, color: highlightColor || 'var(--text-primary)' }}>{value}</p>
      {subtitle && <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.25rem', margin: 0, whiteSpace: 'nowrap' }}>{subtitle}</p>}
    </div>
  );
}

export default function LaporanPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rangeType, setRangeType] = useState('month'); // 'today' | 'week' | 'month' | 'year' | 'custom'
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Responsive Pagination (5 di Mobile, 8 di Tablet, 12 di Desktop)
  const ITEMS_PER_PAGE = useResponsivePagination(5, 8, 12);
  const [currentPage, setCurrentPage] = useState(0);

  // PDF Preview State
  const [pdfPreviewModal, setPdfPreviewModal] = useState(false);
  const [previewImg, setPreviewImg] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (rangeType === 'custom' && (!customStart || !customEnd)) {
      return;
    }

    let start, end;
    if (rangeType === 'custom') {
      start = new Date(customStart);
      end = new Date(customEnd);
    } else {
      end = new Date();
      start = new Date();
      if (rangeType === 'today') {
        // already today
      } else if (rangeType === 'week') {
        start.setDate(end.getDate() - 7);
      } else if (rangeType === 'month') {
        start.setDate(1);
      } else if (rangeType === 'year') {
        start = new Date(end.getFullYear(), 0, 1);
      }
    }

    let url = `/api/laporan?type=laporan&start=${start.toISOString()}&end=${end.toISOString()}`;

    fetch(url)
      .then(r => r.json())
      .then(data => {
        if (isMounted) {
          setStats(data);
          setLoading(false);
          setCurrentPage(0);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [rangeType, customStart, customEnd]);

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
      const pdfHeight = pdf.internal.pageSize.getHeight();

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
    const { pdf, imgData, margin, contentWidth, imgHeight } = pdfDoc;
    pdf.addImage(imgData, 'PNG', margin, margin, contentWidth, imgHeight);
    pdf.save(`Laporan_Keuangan_Andini_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Top 5 Best Selling Products
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

  const netMargin = (stats && stats.totalRevenue > 0) 
    ? Math.round((stats.totalNetProfit / stats.totalRevenue) * 100) 
    : 0;

  return (
    <div className="admin-page-container">
      
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>Laporan Keuangan</h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>Rekapitulasi omset penjualan, beban operasional, dan laba bersih</p>
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

      {loading || !stats ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Memuat laporan keuangan...</div>
      ) : (
        <div id="laporan-content" style={{ padding: '0.5rem 0', backgroundColor: 'transparent' }}>
          
          {/* Executive Metrics Summary */}
          <section style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.65rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Ringkasan Eksekutif Keuangan</h2>
            <div className="responsive-stats-grid">
              <StatCard 
                title="Total Pendapatan" 
                value={`Rp ${stats.totalRevenue.toLocaleString('id-ID')}`} 
                highlightColor="var(--terracotta)" 
              />
              <StatCard 
                title="Pengeluaran Operasional" 
                value={`Rp ${(stats.totalExpense || 0).toLocaleString('id-ID')}`} 
                highlightColor="var(--status-danger)" 
              />
              <StatCard 
                title="Laba Bersih (Net)" 
                value={`Rp ${(stats.totalNetProfit || 0).toLocaleString('id-ID')}`} 
                highlightColor={(stats.totalNetProfit || 0) >= 0 ? 'var(--status-success)' : 'var(--status-danger)'} 
              />
              <StatCard 
                title="Margin Laba Bersih" 
                value={`${netMargin}%`} 
                subtitle={`Dari ${stats.totalCount} transaksi`} 
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
                      const formattedDate = `${dt.toLocaleDateString('id-ID')} ${dt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
                      
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
                          <td className="tabular" style={{ padding: '0.75rem 0.85rem', textAlign: 'right', fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>Rp {item.total.toLocaleString('id-ID')}</td>
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

        </div>
      )}

      {/* PDF Preview Modal */}
      {pdfPreviewModal && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content" style={{ maxWidth: '850px', width: '92%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              <div>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>Preview Laporan PDF</h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>Pratinjau visual sebelum mencetak atau menyimpan dokumen</p>
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
