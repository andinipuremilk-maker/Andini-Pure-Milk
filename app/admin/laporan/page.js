'use client';
import { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

function StatCard({ title, value, subtitle, highlightColor, borderColor = 'var(--color-chocolate)' }) {
  return (
    <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderLeft: `4px solid ${borderColor}`, backgroundColor: '#ffffff' }}>
      <h3 style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--color-text-secondary)', marginBottom: '0.35rem', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{title}</h3>
      <p style={{ fontSize: '1.25rem', fontWeight: 900, color: highlightColor || 'inherit', margin: 0, overflowWrap: 'break-word' }}>{value}</p>
      {subtitle && <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>{subtitle}</p>}
    </div>
  );
}

export default function LaporanPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rangeType, setRangeType] = useState('month'); // 'today' | 'week' | 'month' | 'custom'
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const ITEMS_PER_PAGE = 5;

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '0.5px', margin: 0 }}>LAPORAN KEUANGAN</h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: '0.2rem 0 0 0', fontWeight: 600 }}>Rekapitulasi omset, laba rugi, dan transaksi</p>
        </div>
        <button 
          className="btn-chocolate" 
          onClick={handleOpenPDFPreview} 
          style={{ padding: '0.65rem 1.15rem', fontSize: '0.8125rem' }}
        >
          ⬇ EXPORT PDF
        </button>
      </div>

      {/* Date Filter Card */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div className="responsive-filter-bar">
          
          <div style={{ flex: 1, minWidth: '180px' }}>
            <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, marginBottom: '0.35rem', letterSpacing: '0.5px' }}>PERIODE LAPORAN</label>
            <select 
              className="input-field"
              value={rangeType}
              onChange={e => setRangeType(e.target.value)}
              style={{ padding: '0.65rem 0.85rem', fontSize: '0.875rem' }}
            >
              <option value="today">HARI INI</option>
              <option value="week">7 HARI TERAKHIR</option>
              <option value="month">BULAN INI</option>
              <option value="year">TAHUN INI</option>
              <option value="custom">KUSTOM TANGGAL</option>
            </select>
          </div>

          {rangeType === 'custom' && (
            <>
              <div style={{ flex: 1, minWidth: '140px' }}>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, marginBottom: '0.35rem', letterSpacing: '0.5px' }}>DARI TANGGAL</label>
                <input 
                  type="date" 
                  className="input-field" 
                  value={customStart} 
                  onChange={e => setCustomStart(e.target.value)} 
                  style={{ padding: '0.65rem 0.85rem', fontSize: '0.875rem' }}
                />
              </div>
              <div style={{ flex: 1, minWidth: '140px' }}>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, marginBottom: '0.35rem', letterSpacing: '0.5px' }}>SAMPAI TANGGAL</label>
                <input 
                  type="date" 
                  className="input-field" 
                  value={customEnd} 
                  onChange={e => setCustomEnd(e.target.value)} 
                  style={{ padding: '0.65rem 0.85rem', fontSize: '0.875rem' }}
                />
              </div>
            </>
          )}

          {rangeType !== 'month' && (
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={() => {
                setRangeType('month');
                setCustomStart('');
                setCustomEnd('');
              }}
              style={{ padding: '0.65rem 1rem', fontSize: '0.75rem' }}
            >
              RESET
            </button>
          )}

        </div>
      </div>

      {loading || !stats ? (
        <div style={{ padding: '2rem', textAlign: 'center', fontWeight: 700 }}>Memuat Laporan...</div>
      ) : (
        <div id="laporan-content" style={{ padding: '0.5rem 0', backgroundColor: 'var(--color-bg-light)' }}>
          
          {/* Executive Metrics Summary */}
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--color-text-secondary)', marginBottom: '0.75rem', letterSpacing: '1px' }}>RINGKASAN EKSEKUTIF KEUANGAN</h2>
            <div className="responsive-stats-grid">
              <StatCard title="TOTAL PENDAPATAN" value={`Rp ${stats.totalRevenue.toLocaleString('id-ID')}`} />
              <StatCard title="PENGELUARAN OPERASIONAL" value={`Rp ${(stats.totalExpense || 0).toLocaleString('id-ID')}`} highlightColor="var(--color-error)" />
              <StatCard title="LABA BERSIH (NET)" value={`Rp ${(stats.totalNetProfit || 0).toLocaleString('id-ID')}`} highlightColor={(stats.totalNetProfit || 0) >= 0 ? 'var(--color-text-primary)' : 'var(--color-error)'} />
              <StatCard title="MARGIN LABA BERSIH" value={`${netMargin}%`} subtitle={`Dari ${stats.totalCount} transaksi`} />
            </div>
          </section>

          {/* Side-by-Side Breakdown Tables */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            
            {/* Pendapatan per Kategori */}
            <div>
              <h2 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--color-text-secondary)', marginBottom: '0.75rem', letterSpacing: '1px' }}>PENDAPATAN PER KATEGORI PRODUK</h2>
              <div className="card" style={{ height: '100%' }}>
                {stats.categoryBreakdown.length === 0 ? (
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Tidak ada transaksi penjualan.</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                        <th style={{ padding: '0.75rem 0', fontWeight: 800, color: 'var(--color-text-secondary)', fontSize: '0.75rem', letterSpacing: '1px' }}>KATEGORI</th>
                        <th style={{ padding: '0.75rem 0', fontWeight: 800, color: 'var(--color-text-secondary)', fontSize: '0.75rem', letterSpacing: '1px', textAlign: 'right' }}>PENDAPATAN</th>
                        <th style={{ padding: '0.75rem 0', fontWeight: 800, color: 'var(--color-text-secondary)', fontSize: '0.75rem', letterSpacing: '1px', textAlign: 'right' }}>PANGSA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.categoryBreakdown.map((item, i) => {
                        const pct = stats.totalRevenue > 0 ? Math.round((item.revenue / stats.totalRevenue) * 100) : 0;
                        return (
                          <tr key={i} style={{ borderBottom: i < stats.categoryBreakdown.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                            <td style={{ padding: '0.75rem 0', fontWeight: 700, fontSize: '0.8125rem' }}>{item.kategori}</td>
                            <td style={{ padding: '0.75rem 0', textAlign: 'right', fontWeight: 700, fontSize: '0.8125rem' }}>Rp {item.revenue.toLocaleString('id-ID')}</td>
                            <td style={{ padding: '0.75rem 0', textAlign: 'right', fontWeight: 800, fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{pct}%</td>
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
              <h2 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--color-text-secondary)', marginBottom: '0.75rem', letterSpacing: '1px' }}>PENGELUARAN PER KATEGORI OPERASIONAL</h2>
              <div className="card" style={{ height: '100%' }}>
                {!stats.expenseCategoryBreakdown || stats.expenseCategoryBreakdown.length === 0 ? (
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: 0 }}>Tidak ada pengeluaran pada periode ini.</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                        <th style={{ padding: '0.75rem 0', fontWeight: 800, color: 'var(--color-text-secondary)', fontSize: '0.75rem', letterSpacing: '1px' }}>KATEGORI</th>
                        <th style={{ padding: '0.75rem 0', fontWeight: 800, color: 'var(--color-text-secondary)', fontSize: '0.75rem', letterSpacing: '1px', textAlign: 'right' }}>NOMINAL</th>
                        <th style={{ padding: '0.75rem 0', fontWeight: 800, color: 'var(--color-text-secondary)', fontSize: '0.75rem', letterSpacing: '1px', textAlign: 'right' }}>PANGSA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.expenseCategoryBreakdown.map((item, i) => {
                        const pct = stats.totalExpense > 0 ? Math.round((item.nominal / stats.totalExpense) * 100) : 0;
                        return (
                          <tr key={i} style={{ borderBottom: i < stats.expenseCategoryBreakdown.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                            <td style={{ padding: '0.75rem 0', fontWeight: 700, fontSize: '0.8125rem' }}>{item.kategori}</td>
                            <td style={{ padding: '0.75rem 0', textAlign: 'right', fontWeight: 800, fontSize: '0.8125rem', color: 'var(--color-error)' }}>- Rp {item.nominal.toLocaleString('id-ID')}</td>
                            <td style={{ padding: '0.75rem 0', textAlign: 'right', fontWeight: 800, fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{pct}%</td>
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
          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--color-text-secondary)', marginBottom: '0.75rem', letterSpacing: '1px' }}>PRODUK TERLARIS (TOP 5 BEST SELLERS)</h2>
            <div className="card">
              {topProductsList.length === 0 ? (
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: 0 }}>Belum ada data penjualan produk.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                      <th style={{ padding: '0.75rem 0', fontWeight: 800, color: 'var(--color-text-secondary)', fontSize: '0.75rem', letterSpacing: '1px', width: '50px' }}>PERINGKAT</th>
                      <th style={{ padding: '0.75rem 0', fontWeight: 800, color: 'var(--color-text-secondary)', fontSize: '0.75rem', letterSpacing: '1px' }}>NAMA PRODUK</th>
                      <th style={{ padding: '0.75rem 0', fontWeight: 800, color: 'var(--color-text-secondary)', fontSize: '0.75rem', letterSpacing: '1px', textAlign: 'center' }}>TOTAL TERJUAL</th>
                      <th style={{ padding: '0.75rem 0', fontWeight: 800, color: 'var(--color-text-secondary)', fontSize: '0.75rem', letterSpacing: '1px', textAlign: 'right' }}>TOTAL OMZET</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProductsList.map((item, i) => (
                      <tr key={i} style={{ borderBottom: i < topProductsList.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                        <td style={{ padding: '0.75rem 0', fontWeight: 800, fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>#{i + 1}</td>
                        <td style={{ padding: '0.75rem 0', fontWeight: 700, fontSize: '0.875rem' }}>{item.nama}</td>
                        <td style={{ padding: '0.75rem 0', textAlign: 'center', fontWeight: 800, fontSize: '0.875rem' }}>{item.qty} pcs</td>
                        <td style={{ padding: '0.75rem 0', textAlign: 'right', fontWeight: 800, fontSize: '0.875rem' }}>Rp {item.revenue.toLocaleString('id-ID')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          {/* Compact Log Penjualan Summary */}
          <section>
            <h2 style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--color-text-secondary)', marginBottom: '0.75rem', letterSpacing: '1px' }}>RINGKASAN LOG TRANSAKSI PENJUALAN</h2>
            <div className="table-responsive">
              {stats.transactionsList && stats.transactionsList.length === 0 ? (
                <p style={{ color: 'var(--color-text-secondary)', margin: '1rem', fontSize: '0.875rem' }}>Tidak ada transaksi.</p>
              ) : (
                <table style={{ width: '100%', minWidth: '650px', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--color-border)', backgroundColor: 'var(--color-bg-dark)' }}>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--color-text-secondary)', fontSize: '0.6875rem', letterSpacing: '1px', whiteSpace: 'nowrap' }}>WAKTU & TANGGAL</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--color-text-secondary)', fontSize: '0.6875rem', letterSpacing: '1px', whiteSpace: 'nowrap' }}>NO. TRX</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--color-text-secondary)', fontSize: '0.6875rem', letterSpacing: '1px' }}>RINGKASAN PRODUK</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--color-text-secondary)', fontSize: '0.6875rem', letterSpacing: '1px', whiteSpace: 'nowrap' }}>METODE</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--color-text-secondary)', fontSize: '0.6875rem', letterSpacing: '1px', textAlign: 'right', whiteSpace: 'nowrap' }}>TOTAL SETOR</th>
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
                        <tr key={i} style={{ borderBottom: i < ITEMS_PER_PAGE - 1 ? '1px solid var(--color-border)' : 'none' }}>
                          <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>{formattedDate}</td>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 700, fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>{item.no_transaksi}</td>
                          <td style={{ padding: '0.75rem 1rem', fontSize: '0.8125rem', fontWeight: 600 }}>{produkSummary}</td>
                          <td style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 800, whiteSpace: 'nowrap' }}>{item.metode_bayar || 'TUNAI'}</td>
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 800, fontSize: '0.875rem', whiteSpace: 'nowrap' }}>Rp {item.total.toLocaleString('id-ID')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination Controls */}
            {stats.transactionsList && stats.transactionsList.length > ITEMS_PER_PAGE && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))} 
                  disabled={currentPage === 0}
                  className="btn-secondary"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                >
                  &larr; SEBELUMNYA
                </button>
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                  HALAMAN {currentPage + 1} DARI {Math.ceil(stats.transactionsList.length / ITEMS_PER_PAGE)}
                </span>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(Math.ceil(stats.transactionsList.length / ITEMS_PER_PAGE) - 1, prev + 1))} 
                  disabled={currentPage >= Math.ceil(stats.transactionsList.length / ITEMS_PER_PAGE) - 1}
                  className="btn-secondary"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                >
                  SELANJUTNYA &rarr;
                </button>
              </div>
            )}
          </section>

        </div>
      )}

      {/* PDF Preview Modal */}
      {pdfPreviewModal && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content" style={{ maxWidth: '850px', width: '90%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '1px', margin: 0 }}>PREVIEW LAPORAN PDF</h2>
              <button 
                onClick={() => setPdfPreviewModal(false)}
                style={{ fontSize: '1.25rem', fontWeight: 800, cursor: 'pointer', background: 'none', border: 'none' }}
              >
                &times;
              </button>
            </div>

            <div style={{ 
              flex: 1, 
              minHeight: '480px', 
              maxHeight: '580px', 
              backgroundColor: '#e5e7eb', 
              borderRadius: '6px', 
              border: '1px solid var(--color-border)', 
              overflowY: 'auto', 
              padding: '1.5rem', 
              display: 'flex', 
              justify: 'center', 
              alignItems: 'flex-start' 
            }}>
              {generatingPdf ? (
                <div style={{ padding: '4rem', textAlign: 'center', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                  MEMBUAT PREVIEW LAPORAN PDF...
                </div>
              ) : previewImg ? (
                <div style={{ 
                  boxShadow: '0 10px 30px rgba(0,0,0,0.15)', 
                  border: '1px solid #cbd5e1', 
                  backgroundColor: '#ffffff', 
                  maxWidth: '100%',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <img 
                    src={previewImg} 
                    alt="Preview Laporan PDF" 
                    style={{ width: '100%', height: 'auto', display: 'block' }} 
                  />
                </div>
              ) : (
                <div style={{ color: 'var(--color-error)', padding: '2rem', fontWeight: 700 }}>Gagal memuat preview</div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
              <button 
                type="button"
                className="btn-secondary" 
                onClick={() => setPdfPreviewModal(false)}
                style={{ flex: '1 1 120px', padding: '0.75rem 1.25rem' }}
              >
                BATAL
              </button>
              <button 
                type="button"
                className="btn-primary" 
                onClick={handleDownloadPDF}
                disabled={generatingPdf || !pdfDoc}
                style={{ flex: '1 1 180px', padding: '0.75rem 1.25rem' }}
              >
                SIMPAN / UNDUH PDF
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
