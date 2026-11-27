'use client';
import { useState, useEffect, useMemo, Fragment } from 'react';
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
  IconCheck,
  IconStore,
  IconChevronDown
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

  // Mitra Terlaris Segment Tab & State
  const [partnerTab, setPartnerTab] = useState('all'); // 'all' | 'sekolah' | 'olehOleh' | 'booth'
  const [partnerSearch, setPartnerSearch] = useState('');
  const [expandedPartner, setExpandedPartner] = useState(null);

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

  // Format label periode pembukuan untuk laporan resmi
  const formattedPeriodLabel = useMemo(() => {
    const today = new Date();
    if (rangeType === 'today') {
      return today.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }
    if (rangeType === 'month') {
      return today.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    }
    if (rangeType === 'year') {
      return `Tahun ${today.getFullYear()}`;
    }
    if (rangeType === 'week') {
      const past = new Date(today);
      past.setDate(today.getDate() - 7);
      return `${past.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} – ${today.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }
    if (rangeType === 'custom' && customStart && customEnd) {
      const s = new Date(customStart);
      const e = new Date(customEnd);
      return `${s.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} s/d ${e.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }
    return today.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  }, [rangeType, customStart, customEnd]);

  const currentDateFormatted = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }) + `, ${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
  }, []);

  const handleOpenPDFPreview = async () => {
    // Simpan tab dan detail mitra sebelumnya
    const prevPartnerTab = partnerTab;
    const prevExpanded = expandedPartner;

    // Pastikan seluruh kategori segmen mitra ter-render utuh saat membuat dokumen PDF
    if (partnerTab !== 'all') {
      setPartnerTab('all');
    }
    if (expandedPartner !== null) {
      setExpandedPartner(null);
    }

    // Beri waktu re-render DOM agar seluruh 3 segmen mitra aktif
    await new Promise(r => setTimeout(r, 120));

    // Jika tab laba rugi aktif, prioritaskan container PDF resmi
    const targetElement = activeTab === 'pnl' 
      ? (document.getElementById('pnl-pdf-container') || document.getElementById('laporan-content'))
      : document.getElementById('laporan-content');

    if (!targetElement) {
      setPartnerTab(prevPartnerTab);
      setExpandedPartner(prevExpanded);
      return;
    }
    
    setPdfPreviewModal(true);
    setGeneratingPdf(true);
    setPreviewImg(null);
    setPdfDoc(null);

    try {
      const canvas = await html2canvas(targetElement, { 
        scale: 2, 
        backgroundColor: '#ffffff',
        useCORS: true,
        scrollY: 0,
        scrollX: 0,
        windowScrollY: 0,
        logging: false
      });
      const imgData = canvas.toDataURL('image/png');

      const filename = activeTab === 'pnl'
        ? `Laporan_Laba_Rugi_Detail_Andini_${new Date().toISOString().split('T')[0]}.pdf`
        : `Laporan_Keuangan_Andini_${activeTab}_${new Date().toISOString().split('T')[0]}.pdf`;

      setPreviewImg(imgData);
      setPdfDoc({ canvas, imgData, filename });
    } catch (e) {
      console.error('PDF generation error:', e);
      alert('Gagal menghasilkan preview PDF: ' + (e?.message || 'Terjadi kesalahan sistem'));
      setPdfPreviewModal(false);
    } finally {
      setGeneratingPdf(false);
      // Kembalikan ke tab pilihan pengguna
      setPartnerTab(prevPartnerTab);
      setExpandedPartner(prevExpanded);
    }
  };

  const handleDownloadPDF = () => {
    if (!pdfDoc) return;
    const { canvas, imgData, filename } = pdfDoc;

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 8;
    const contentWidth = pdfWidth - (margin * 2);
    const usableHeight = pdfHeight - (margin * 2);
    const imgHeight = canvas ? ((canvas.height * contentWidth) / canvas.width) : (pdfDoc.imgHeight || 200);

    for (let offset = 0, page = 0; offset < imgHeight; offset += usableHeight, page++) {
      if (page > 0) pdf.addPage();
      pdf.addImage(imgData, 'PNG', margin, margin - offset, contentWidth, imgHeight);
      // Tutup area margin agar potongan gambar halaman lain tidak terlihat
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, pdfWidth, margin, 'F');
      pdf.rect(0, margin + usableHeight, pdfWidth, margin, 'F');
    }

    pdf.save(filename || `Laporan_Keuangan_Andini_${activeTab}_${new Date().toISOString().split('T')[0]}.pdf`);
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

  // Analisis Mitra Terlaris & Segmentasi Tempat Distribusi
  const allPartnersAnalysis = useMemo(() => {
    if (!stats || !stats.transactionsList) return [];

    const productHppMap = {};
    if (stats.productProfitability) {
      stats.productProfitability.forEach(p => {
        const hppPerUnit = p.qty > 0 ? (p.hpp / p.qty) : 0;
        productHppMap[p.nama.toLowerCase()] = hppPerUnit;
      });
    }

    const map = {};

    stats.transactionsList.forEach(tx => {
      const seller = tx.seller || 'Booth 1 - Gerai Utama (Pusat)';
      const sUpper = seller.toUpperCase();

      const isSekolah = sUpper.includes('SD') || sUpper.includes('SEKOLAH') || sUpper.includes('KANTIN') || sUpper.includes('MADRASAH');
      const isOlehOleh = sUpper.includes('TOKO') || sUpper.includes('OLEH') || sUpper.includes('ROTI') || sUpper.includes('RESELLER') || sUpper.includes('KOPERASI') || sUpper.includes('WARUNG') || sUpper.includes('CAFE') || sUpper.includes('NAFIS');

      let segment = 'booth';
      let segmentLabel = 'Gerai / Booth';
      let segmentIcon = '🥛';
      let focusCategory = 'Susu Murni & Minuman';

      if (isSekolah) {
        segment = 'sekolah';
        segmentLabel = 'Mitra Sekolah (SD)';
        segmentIcon = '🏫';
        focusCategory = 'Kiko & Aneka Puding';
      } else if (isOlehOleh) {
        segment = 'olehOleh';
        segmentLabel = 'Pusat Oleh-Oleh';
        segmentIcon = '🛍️';
        focusCategory = 'Pie Susu & Pastry';
      } else {
        segment = 'booth';
        segmentLabel = 'Gerai / Booth';
        segmentIcon = '🥛';
        focusCategory = 'Susu Murni & Minuman';
      }

      if (!map[seller]) {
        map[seller] = {
          nama: seller,
          segment,
          segmentLabel,
          segmentIcon,
          focusCategory,
          transactionCount: 0,
          totalQty: 0,
          grossSales: 0,
          totalDiscount: 0,
          netRevenue: 0,
          totalHpp: 0,
          grossProfit: 0,
          marginPct: 0,
          productsMap: {},
          focusedQty: 0,
          focusedRevenue: 0
        };
      }

      map[seller].transactionCount += 1;
      const txDiskon = Number(tx.diskon || 0);
      map[seller].totalDiscount += txDiskon;

      if (tx.items && Array.isArray(tx.items)) {
        tx.items.forEach(it => {
          const qty = Number(it.qty || 1);
          const price = Number(it.harga_satuan || 0);
          const subtotal = Number(it.subtotal || (qty * price));
          const pName = it.nama_produk || 'Produk';
          const pNameLower = pName.toLowerCase();

          const hppUnit = productHppMap[pNameLower] !== undefined 
            ? productHppMap[pNameLower] 
            : Math.round(price * 0.6);
          const itemHpp = qty * hppUnit;

          map[seller].totalQty += qty;
          map[seller].grossSales += subtotal;
          map[seller].totalHpp += itemHpp;

          // Track focused items based on segment
          if (segment === 'sekolah' && (pNameLower.includes('kiko') || pNameLower.includes('puding') || pNameLower.includes('es lilin'))) {
            map[seller].focusedQty += qty;
            map[seller].focusedRevenue += subtotal;
          } else if (segment === 'olehOleh' && (pNameLower.includes('pie') || pNameLower.includes('pastry') || pNameLower.includes('brownies'))) {
            map[seller].focusedQty += qty;
            map[seller].focusedRevenue += subtotal;
          } else if (segment === 'booth' && (pNameLower.includes('susu') || pNameLower.includes('stmj') || pNameLower.includes('smj') || pNameLower.includes('jahe') || pNameLower.includes('yoghurt'))) {
            map[seller].focusedQty += qty;
            map[seller].focusedRevenue += subtotal;
          }

          if (!map[seller].productsMap[pName]) {
            map[seller].productsMap[pName] = {
              nama: pName,
              qty: 0,
              revenue: 0,
              hpp: 0
            };
          }
          map[seller].productsMap[pName].qty += qty;
          map[seller].productsMap[pName].revenue += subtotal;
          map[seller].productsMap[pName].hpp += itemHpp;
        });
      }
    });

    const totalRev = Number(stats.totalRevenue || 1);

    return Object.values(map).map(p => {
      const netRev = Math.max(0, p.grossSales - p.totalDiscount);
      const grossProfit = Math.max(0, netRev - p.totalHpp);
      const marginPct = netRev > 0 ? Math.round((grossProfit / netRev) * 100) : 0;
      const sharePct = totalRev > 0 ? Math.round((netRev / totalRev) * 100) : 0;
      const avgOrder = p.transactionCount > 0 ? Math.round(netRev / p.transactionCount) : 0;

      const topProducts = Object.values(p.productsMap)
        .map(prod => {
          const itemProfit = prod.revenue - prod.hpp;
          const itemMargin = prod.revenue > 0 ? Math.round((itemProfit / prod.revenue) * 100) : 0;
          return {
            ...prod,
            grossProfit: itemProfit,
            marginPct: itemMargin,
            partnerShare: netRev > 0 ? Math.round((prod.revenue / netRev) * 100) : 0
          };
        })
        .sort((a, b) => b.qty - a.qty);

      return {
        ...p,
        netRevenue: netRev,
        grossProfit,
        marginPct,
        sharePct,
        avgOrder,
        topProducts
      };
    });
  }, [stats]);

  // Filtered & sorted partners based on tab and search
  const filteredPartners = useMemo(() => {
    let list = [...allPartnersAnalysis];

    if (partnerTab !== 'all') {
      list = list.filter(p => p.segment === partnerTab);
    }

    if (partnerSearch.trim()) {
      const q = partnerSearch.toLowerCase().trim();
      list = list.filter(p => 
        p.nama.toLowerCase().includes(q) ||
        p.segmentLabel.toLowerCase().includes(q) ||
        p.topProducts.some(pr => pr.nama.toLowerCase().includes(q))
      );
    }

    // Sort order:
    if (partnerTab === 'sekolah') {
      list.sort((a, b) => (b.focusedQty !== a.focusedQty ? b.focusedQty - a.focusedQty : b.netRevenue - a.netRevenue));
    } else if (partnerTab === 'olehOleh') {
      list.sort((a, b) => (b.focusedQty !== a.focusedQty ? b.focusedQty - a.focusedQty : b.netRevenue - a.netRevenue));
    } else if (partnerTab === 'booth') {
      list.sort((a, b) => (b.focusedQty !== a.focusedQty ? b.focusedQty - a.focusedQty : b.netRevenue - a.netRevenue));
    } else {
      list.sort((a, b) => b.netRevenue - a.netRevenue);
    }

    return list;
  }, [allPartnersAnalysis, partnerTab, partnerSearch]);

  const partnerSummary = useMemo(() => {
    const totalRev = filteredPartners.reduce((s, p) => s + p.netRevenue, 0);
    const totalQty = filteredPartners.reduce((s, p) => s + p.totalQty, 0);
    const totalProfit = filteredPartners.reduce((s, p) => s + p.grossProfit, 0);
    const totalTrx = filteredPartners.reduce((s, p) => s + p.transactionCount, 0);
    const avgMargin = totalRev > 0 ? Math.round((totalProfit / totalRev) * 100) : 0;
    return { totalRev, totalQty, totalProfit, totalTrx, avgMargin };
  }, [filteredPartners]);

  const segmentsList = useMemo(() => {
    const list = [
      {
        id: 'sekolah',
        title: '1. Peringkat Mitra Sekolah (SD)',
        icon: '🏫',
        focusText: 'Item Unggulan: Kiko (Es Lilin Susu) & Aneka Puding',
        badgeBg: 'rgba(140, 74, 38, 0.12)',
        badgeColor: '#8c4a26',
        items: allPartnersAnalysis
          .filter(p => p.segment === 'sekolah')
          .sort((a, b) => b.focusedQty !== a.focusedQty ? b.focusedQty - a.focusedQty : b.netRevenue - a.netRevenue)
      },
      {
        id: 'olehOleh',
        title: '2. Peringkat Toko & Pusat Oleh-Oleh',
        icon: '🛍️',
        focusText: 'Item Unggulan: Pie Susu & Aneka Pastry / Brownies',
        badgeBg: 'rgba(37, 99, 235, 0.12)',
        badgeColor: '#2563eb',
        items: allPartnersAnalysis
          .filter(p => p.segment === 'olehOleh')
          .sort((a, b) => b.focusedQty !== a.focusedQty ? b.focusedQty - a.focusedQty : b.netRevenue - a.netRevenue)
      },
      {
        id: 'booth',
        title: '3. Peringkat Gerai & Booth Penjualan Langsung',
        icon: '🥛',
        focusText: 'Item Unggulan: Susu Murni Segar, STMJ & Olahan Minuman',
        badgeBg: 'rgba(5, 150, 105, 0.12)',
        badgeColor: '#059669',
        items: allPartnersAnalysis
          .filter(p => p.segment === 'booth')
          .sort((a, b) => b.focusedQty !== a.focusedQty ? b.focusedQty - a.focusedQty : b.netRevenue - a.netRevenue)
      }
    ];

    if (partnerSearch.trim()) {
      const q = partnerSearch.toLowerCase().trim();
      return list.map(seg => ({
        ...seg,
        items: seg.items.filter(p => 
          p.nama.toLowerCase().includes(q) ||
          p.topProducts.some(pr => pr.nama.toLowerCase().includes(q))
        )
      }));
    }

    return list;
  }, [allPartnersAnalysis, partnerSearch]);

  const displayedSegments = useMemo(() => {
    if (partnerTab === 'all') return segmentsList;
    return segmentsList.filter(s => s.id === partnerTab);
  }, [segmentsList, partnerTab]);

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
              {/* Kop Dokumen Resmi untuk PDF & Cetak Ringkasan Umum */}
              <div style={{
                padding: '1.25rem 1.5rem',
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                borderBottom: '3px double #8c4a26',
                marginBottom: '1.5rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                    <div style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '10px',
                      backgroundColor: '#542a16',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1.4rem'
                    }}>
                      🥛
                    </div>
                    <div>
                      <h1 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: '#542a16', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                        ANDINI PURE MILK
                      </h1>
                      <p style={{ fontSize: '0.75rem', color: '#4b5563', margin: '0.15rem 0 0 0', fontWeight: 600 }}>
                        Ringkasan Umum Laporan Keuangan, Distribusi Penjualan & Kemitraan POS
                      </p>
                      <p style={{ fontSize: '0.6875rem', color: '#6b7280', margin: '0.1rem 0 0 0' }}>
                        Gerai Utama & Jaringan Distribusi Kemitraan Jawa Timur &bull; POS Backoffice System
                      </p>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <span style={{
                      display: 'inline-block',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.55rem',
                      borderRadius: '4px',
                      backgroundColor: '#fef3c7',
                      color: '#92400e',
                      border: '1px solid #fde68a',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      marginBottom: '0.35rem'
                    }}>
                      Ringkasan Eksekutif POS
                    </span>
                    <div style={{ fontSize: '0.75rem', color: '#111827', fontWeight: 700 }}>
                      Periode: <span style={{ color: '#8c4a26' }}>{formattedPeriodLabel}</span>
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: '#6b7280', marginTop: '0.15rem' }}>
                      Dicetak: {currentDateFormatted} WIB
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#059669', fontWeight: 600, marginTop: '0.1rem' }}>
                      Status: Terverifikasi (POS Verified)
                    </div>
                  </div>
                </div>
              </div>
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

              {/* Detailed Mitra & Segment Distribution Analysis Section */}
              <section style={{ marginBottom: '1.75rem' }}>
                <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                  
                  {/* Card Header with Title, Segment Switcher, & Search */}
                  <div style={{
                    padding: '1rem 1.25rem',
                    borderBottom: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.75rem'
                    }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                          <IconStore size={18} style={{ color: 'var(--accent-primary)' }} />
                          <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                            Peringkat Penjualan Tempat / Mitra Terlaris
                          </h2>
                          <span style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.5rem',
                            borderRadius: '4px',
                            backgroundColor: 'var(--surface-muted)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-primary)',
                            textTransform: 'uppercase'
                          }}>
                            {partnerTab === 'all' ? 'Semua Mitra' : partnerTab === 'sekolah' ? 'SD (Kiko & Puding)' : partnerTab === 'olehOleh' ? 'Oleh-Oleh (Pie)' : 'Booth (Susu)'}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
                          Analisis mendalam omzet kotor & bersih, volume produk unggulan, frekuensi pesanan, dan margin laba per mitra
                        </p>
                      </div>

                      {/* Segment Switcher Tabs - Ignored in PDF Export */}
                      <div 
                        data-html2canvas-ignore="true"
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(4, 1fr)',
                          padding: '2px',
                          backgroundColor: 'var(--surface-muted)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-subtle)',
                          height: '32px',
                          alignItems: 'center',
                          gap: '2px',
                          width: '100%',
                          maxWidth: '560px'
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setPartnerTab('all')}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                            height: '26px',
                            width: '100%',
                            padding: '0 0.4rem',
                            fontSize: '0.72rem',
                            fontWeight: partnerTab === 'all' ? 700 : 500,
                            borderRadius: 'var(--radius-sm)',
                            border: 'none',
                            cursor: 'pointer',
                            backgroundColor: partnerTab === 'all' ? 'var(--accent-primary)' : 'transparent',
                            color: partnerTab === 'all' ? '#ffffff' : 'var(--text-secondary)',
                            boxShadow: partnerTab === 'all' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                            transition: 'all 0.15s ease',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          Semua Mitra
                        </button>

                        <button
                          type="button"
                          onClick={() => setPartnerTab('sekolah')}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                            height: '26px',
                            width: '100%',
                            padding: '0 0.4rem',
                            fontSize: '0.72rem',
                            fontWeight: partnerTab === 'sekolah' ? 700 : 500,
                            borderRadius: 'var(--radius-sm)',
                            border: 'none',
                            cursor: 'pointer',
                            backgroundColor: partnerTab === 'sekolah' ? 'var(--accent-primary)' : 'transparent',
                            color: partnerTab === 'sekolah' ? '#ffffff' : 'var(--text-secondary)',
                            boxShadow: partnerTab === 'sekolah' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                            transition: 'all 0.15s ease',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          <span>🏫 SD (Kiko & Puding)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPartnerTab('olehOleh')}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                            height: '26px',
                            width: '100%',
                            padding: '0 0.4rem',
                            fontSize: '0.72rem',
                            fontWeight: partnerTab === 'olehOleh' ? 700 : 500,
                            borderRadius: 'var(--radius-sm)',
                            border: 'none',
                            cursor: 'pointer',
                            backgroundColor: partnerTab === 'olehOleh' ? 'var(--accent-primary)' : 'transparent',
                            color: partnerTab === 'olehOleh' ? '#ffffff' : 'var(--text-secondary)',
                            boxShadow: partnerTab === 'olehOleh' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                            transition: 'all 0.15s ease',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          <span>🛍️ Oleh-Oleh (Pie)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPartnerTab('booth')}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                            height: '26px',
                            width: '100%',
                            padding: '0 0.4rem',
                            fontSize: '0.72rem',
                            fontWeight: partnerTab === 'booth' ? 700 : 500,
                            borderRadius: 'var(--radius-sm)',
                            border: 'none',
                            cursor: 'pointer',
                            backgroundColor: partnerTab === 'booth' ? 'var(--accent-primary)' : 'transparent',
                            color: partnerTab === 'booth' ? '#ffffff' : 'var(--text-secondary)',
                            boxShadow: partnerTab === 'booth' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                            transition: 'all 0.15s ease',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          <span>🥛 Booth (Susu)</span>
                        </button>
                      </div>
                    </div>

                    {/* Filter Banner & Search Sub-row */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.65rem'
                    }}>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.75rem',
                        color: 'var(--accent-primary)',
                        backgroundColor: 'var(--surface-muted)',
                        padding: '0.35rem 0.65rem',
                        borderRadius: 'var(--radius-sm)',
                        fontWeight: 600
                      }}>
                        <span>
                          {partnerTab === 'sekolah' && '🎯 Fokus Segmen SD: Kiko (Es Lilin Susu) & Aneka Puding'}
                          {partnerTab === 'olehOleh' && '🎯 Fokus Segmen Pusat Oleh-Oleh: Pie Susu & Aneka Pastry'}
                          {partnerTab === 'booth' && '🎯 Fokus Segmen Gerai/Booth: Susu Murni, STMJ & Olahan Minuman'}
                          {partnerTab === 'all' && '📊 Menampilkan gabungan seluruh mitra & titik distribusi penjualan'}
                        </span>
                      </div>

                      {/* Search Input - Ignored in PDF */}
                      <div data-html2canvas-ignore="true" style={{ position: 'relative', width: '240px' }}>
                        <span style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>
                          <IconSearch size={14} />
                        </span>
                        <input
                          type="text"
                          value={partnerSearch}
                          onChange={(e) => setPartnerSearch(e.target.value)}
                          placeholder="Cari nama mitra..."
                          style={{
                            width: '100%',
                            padding: '0.35rem 0.65rem 0.35rem 2rem',
                            fontSize: '0.75rem',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-subtle)',
                            backgroundColor: 'var(--surface-panel)',
                            color: 'var(--text-primary)',
                            outline: 'none'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 4 Mini KPI Cards */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: '1px',
                    backgroundColor: 'var(--border-subtle)',
                    borderBottom: '1px solid var(--border-subtle)'
                  }}>
                    <div style={{ backgroundColor: 'var(--surface-panel)', padding: '0.75rem 1rem' }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>Mitra Terdata</span>
                      <p className="tabular" style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0.15rem 0 0 0', color: 'var(--text-primary)' }}>
                        {filteredPartners.length} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)' }}>mitra</span>
                      </p>
                    </div>

                    <div style={{ backgroundColor: 'var(--surface-panel)', padding: '0.75rem 1rem' }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>Total Omzet Bersih</span>
                      <p className="tabular" style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0.15rem 0 0 0', color: 'var(--accent-primary)' }}>
                        Rp {partnerSummary.totalRev.toLocaleString('id-ID')}
                      </p>
                    </div>

                    <div style={{ backgroundColor: 'var(--surface-panel)', padding: '0.75rem 1rem' }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>Volume Produk</span>
                      <p className="tabular" style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0.15rem 0 0 0', color: 'var(--text-primary)' }}>
                        {partnerSummary.totalQty.toLocaleString('id-ID')} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)' }}>pcs</span>
                      </p>
                    </div>

                    <div style={{ backgroundColor: 'var(--surface-panel)', padding: '0.75rem 1rem' }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>Est. Laba Kotor (Margin)</span>
                      <p className="tabular" style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0.15rem 0 0 0', color: 'var(--status-success, #2e7d32)' }}>
                        Rp {partnerSummary.totalProfit.toLocaleString('id-ID')} <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>({partnerSummary.avgMargin}%)</span>
                      </p>
                    </div>
                  </div>

                  {/* Table Content */}
                  <div className="table-responsive">
                    {filteredPartners.length === 0 ? (
                      <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                        Belum ada data transaksi penjualan pada segmen mitra ini untuk periode yang dipilih.
                      </div>
                    ) : (
                      <table style={{ width: '100%', minWidth: '820px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--surface-subtle)' }}>
                            <th style={{ padding: '0.65rem 0.85rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.6875rem', letterSpacing: '0.04em', width: '55px' }}>RANK</th>
                            <th style={{ padding: '0.65rem 0.85rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.6875rem', letterSpacing: '0.04em' }}>NAMA MITRA / TEMPAT</th>
                            <th style={{ padding: '0.65rem 0.85rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.6875rem', letterSpacing: '0.04em' }}>PRODUK UNGGULAN & TERLARIS</th>
                            <th style={{ padding: '0.65rem 0.85rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.6875rem', letterSpacing: '0.04em', textAlign: 'center', whiteSpace: 'nowrap' }}>TOTAL TERJUAL</th>
                            <th style={{ padding: '0.65rem 0.85rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.6875rem', letterSpacing: '0.04em', textAlign: 'right', whiteSpace: 'nowrap' }}>OMZET BERSIH</th>
                            <th style={{ padding: '0.65rem 0.85rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.6875rem', letterSpacing: '0.04em', textAlign: 'right', whiteSpace: 'nowrap' }}>EST. LABA KOTOR</th>
                            <th style={{ padding: '0.65rem 0.85rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.6875rem', letterSpacing: '0.04em', width: '120px' }}>PANGSA OMZET</th>
                            <th data-html2canvas-ignore="true" style={{ padding: '0.65rem 0.85rem', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.6875rem', letterSpacing: '0.04em', textAlign: 'center', width: '80px' }}>RINCIAN</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPartners.map((item, i) => {
                            const isExpanded = expandedPartner === item.nama;
                            return (
                              <Fragment key={item.nama}>
                                <tr
                                  style={{
                                    borderBottom: (!isExpanded && i < filteredPartners.length - 1) ? '1px solid var(--border-subtle)' : 'none',
                                    backgroundColor: isExpanded ? 'var(--surface-muted)' : 'transparent',
                                    transition: 'background-color 0.15s ease'
                                  }}
                                >
                                  {/* Rank */}
                                  <td style={{ padding: '0.75rem 0.85rem', verticalAlign: 'middle' }}>
                                    <span
                                      className={i === 0 ? 'badge-chocolate' : 'badge-neutral'}
                                      style={{
                                        fontSize: '0.6875rem',
                                        padding: '0.15rem 0.5rem',
                                        fontWeight: 700,
                                        display: 'inline-block'
                                      }}
                                    >
                                      #{i + 1}
                                    </span>
                                  </td>

                                  {/* Nama Mitra */}
                                  <td style={{ padding: '0.75rem 0.85rem', verticalAlign: 'middle' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{item.nama}</span>
                                      <span style={{
                                        fontSize: '0.625rem',
                                        padding: '0.1rem 0.4rem',
                                        borderRadius: 'var(--radius-sm)',
                                        backgroundColor: 'var(--surface-muted)',
                                        color: 'var(--text-secondary)',
                                        fontWeight: 600
                                      }}>
                                        {item.segmentIcon} {item.segmentLabel}
                                      </span>
                                    </div>
                                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                                      {item.transactionCount} nota transaksi &bull; Rata-rata: Rp {item.avgOrder.toLocaleString('id-ID')}
                                    </div>
                                  </td>

                                  {/* Produk Terlaris di Mitra ini */}
                                  <td style={{ padding: '0.75rem 0.85rem', verticalAlign: 'middle' }}>
                                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                                      {item.topProducts.slice(0, 3).map((pr, idx) => (
                                        <span
                                          key={idx}
                                          style={{
                                            fontSize: '0.6875rem',
                                            padding: '0.15rem 0.45rem',
                                            borderRadius: 'var(--radius-sm)',
                                            backgroundColor: 'var(--surface-subtle)',
                                            border: '1px solid var(--border-subtle)',
                                            color: 'var(--text-primary)',
                                            whiteSpace: 'nowrap'
                                          }}
                                        >
                                          <strong>{pr.nama}</strong> ({pr.qty} pcs)
                                        </span>
                                      ))}
                                      {item.topProducts.length > 3 && (
                                        <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', alignSelf: 'center' }}>
                                          +{item.topProducts.length - 3} lainnya
                                        </span>
                                      )}
                                    </div>
                                  </td>

                                  {/* Total Terjual */}
                                  <td className="tabular" style={{ padding: '0.75rem 0.85rem', textAlign: 'center', verticalAlign: 'middle' }}>
                                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                      {item.totalQty.toLocaleString('id-ID')} pcs
                                    </div>
                                    {partnerTab !== 'all' && item.focusedQty > 0 && (
                                      <div style={{ fontSize: '0.6875rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                                        {item.focusedQty} pcs unggulan
                                      </div>
                                    )}
                                  </td>

                                  {/* Omzet Bersih */}
                                  <td className="tabular" style={{ padding: '0.75rem 0.85rem', textAlign: 'right', verticalAlign: 'middle' }}>
                                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                      Rp {item.netRevenue.toLocaleString('id-ID')}
                                    </div>
                                    {item.totalDiscount > 0 && (
                                      <div style={{ fontSize: '0.6875rem', color: 'var(--status-danger)' }}>
                                        Diskon: -Rp {item.totalDiscount.toLocaleString('id-ID')}
                                      </div>
                                    )}
                                  </td>

                                  {/* Estimasi Laba Kotor */}
                                  <td className="tabular" style={{ padding: '0.75rem 0.85rem', textAlign: 'right', verticalAlign: 'middle' }}>
                                    <div style={{ fontWeight: 700, color: 'var(--status-success, #2e7d32)' }}>
                                      Rp {item.grossProfit.toLocaleString('id-ID')}
                                    </div>
                                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
                                      Margin: {item.marginPct}%
                                    </div>
                                  </td>

                                  {/* Pangsa Omzet */}
                                  <td style={{ padding: '0.75rem 0.85rem', verticalAlign: 'middle' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                      <div style={{
                                        flex: 1,
                                        height: '6px',
                                        backgroundColor: 'var(--surface-muted)',
                                        borderRadius: '3px',
                                        overflow: 'hidden'
                                      }}>
                                        <div style={{
                                          width: `${Math.min(100, Math.max(3, item.sharePct))}%`,
                                          height: '100%',
                                          backgroundColor: 'var(--accent-primary)',
                                          borderRadius: '3px'
                                        }} />
                                      </div>
                                      <span className="tabular" style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', minWidth: '28px' }}>
                                        {item.sharePct}%
                                      </span>
                                    </div>
                                  </td>

                                  {/* Toggle Action - Ignored in PDF Export */}
                                  <td data-html2canvas-ignore="true" style={{ padding: '0.75rem 0.85rem', textAlign: 'center', verticalAlign: 'middle' }}>
                                    <button
                                      type="button"
                                      onClick={() => setExpandedPartner(isExpanded ? null : item.nama)}
                                      style={{
                                        background: 'none',
                                        border: '1px solid var(--border-subtle)',
                                        borderRadius: 'var(--radius-sm)',
                                        padding: '0.2rem 0.45rem',
                                        cursor: 'pointer',
                                        fontSize: '0.6875rem',
                                        color: isExpanded ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.25rem'
                                      }}
                                    >
                                      <span>{isExpanded ? 'Tutup' : 'Item'}</span>
                                      <IconChevronDown
                                        size={12}
                                        style={{
                                          transform: isExpanded ? 'rotate(180deg)' : 'none',
                                          transition: 'transform 0.2s ease'
                                        }}
                                      />
                                    </button>
                                  </td>
                                </tr>

                                {/* Expanded Detail Sub-table */}
                                {isExpanded && (
                                  <tr style={{ borderBottom: i < filteredPartners.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                                    <td colSpan={7} style={{ padding: '0.85rem 1.25rem', backgroundColor: 'var(--surface-subtle)' }}>
                                      <div style={{
                                        backgroundColor: 'var(--surface-panel)',
                                        borderRadius: 'var(--radius-sm)',
                                        border: '1px solid var(--border-subtle)',
                                        padding: '0.85rem'
                                      }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                            📦 Rincian Produk Terdistribusi ke <span style={{ color: 'var(--accent-primary)' }}>{item.nama}</span>
                                          </div>
                                          <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
                                            Total: {item.topProducts.length} varian produk
                                          </span>
                                        </div>

                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                                          <thead>
                                            <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                                              <th style={{ padding: '0.45rem 0.65rem', textAlign: 'left', fontWeight: 600 }}>NAMA PRODUK</th>
                                              <th style={{ padding: '0.45rem 0.65rem', textAlign: 'center', fontWeight: 600, width: '90px' }}>QTY</th>
                                              <th style={{ padding: '0.45rem 0.65rem', textAlign: 'right', fontWeight: 600 }}>TOTAL OMZET</th>
                                              <th style={{ padding: '0.45rem 0.65rem', textAlign: 'right', fontWeight: 600 }}>EST. LABA</th>
                                              <th style={{ padding: '0.45rem 0.65rem', textAlign: 'right', fontWeight: 600, width: '90px' }}>MARGIN</th>
                                              <th style={{ padding: '0.45rem 0.65rem', textAlign: 'right', fontWeight: 600, width: '90px' }}>PORSI MITRA</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {item.topProducts.map((pr, pIdx) => (
                                              <tr key={pIdx} style={{ borderBottom: pIdx < item.topProducts.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                                                <td style={{ padding: '0.45rem 0.65rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                                  {pr.nama}
                                                </td>
                                                <td className="tabular" style={{ padding: '0.45rem 0.65rem', textAlign: 'center', color: 'var(--text-primary)' }}>
                                                  {pr.qty} pcs
                                                </td>
                                                <td className="tabular" style={{ padding: '0.45rem 0.65rem', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>
                                                  Rp {pr.revenue.toLocaleString('id-ID')}
                                                </td>
                                                <td className="tabular" style={{ padding: '0.45rem 0.65rem', textAlign: 'right', fontWeight: 600, color: 'var(--status-success, #2e7d32)' }}>
                                                  Rp {pr.grossProfit.toLocaleString('id-ID')}
                                                </td>
                                                <td className="tabular" style={{ padding: '0.45rem 0.65rem', textAlign: 'right', color: 'var(--text-secondary)' }}>
                                                  {pr.marginPct}%
                                                </td>
                                                <td className="tabular" style={{ padding: '0.45rem 0.65rem', textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                                  {pr.partnerShare}%
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
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

                {/* Pagination Controls - Ignored in PDF */}
                {stats.transactionsList && stats.transactionsList.length > ITEMS_PER_PAGE && (
                  <div className="responsive-pagination" data-html2canvas-ignore="true" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
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

              {/* Formal Signature & Authorization Block for Ringkasan Umum */}
              <div style={{
                marginTop: '1.75rem',
                padding: '1.25rem 1.5rem',
                backgroundColor: '#ffffff',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                pageBreakInside: 'avoid'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem' }}>
                  <div style={{ textAlign: 'center', minWidth: '180px' }}>
                    <p style={{ fontSize: '0.72rem', color: '#6b7280', margin: '0 0 2.8rem 0' }}>
                      Disiapkan & Dibuat Oleh,
                    </p>
                    <div style={{ borderBottom: '1px solid #374151', width: '160px', margin: '0 auto 0.35rem auto' }} />
                    <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#111827', margin: 0 }}>
                      Bagian Keuangan / Kasir POS
                    </p>
                    <p style={{ fontSize: '0.6875rem', color: '#6b7280', margin: '0.1rem 0 0 0' }}>
                      Andini Pure Milk
                    </p>
                  </div>

                  <div style={{ textAlign: 'center', minWidth: '180px' }}>
                    <p style={{ fontSize: '0.72rem', color: '#6b7280', margin: '0 0 2.8rem 0' }}>
                      Diperiksa & Disetujui Oleh,
                    </p>
                    <div style={{ borderBottom: '1px solid #374151', width: '160px', margin: '0 auto 0.35rem auto' }} />
                    <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#111827', margin: 0 }}>
                      Owner / Manajemen Utama
                    </p>
                    <p style={{ fontSize: '0.6875rem', color: '#6b7280', margin: '0.1rem 0 0 0' }}>
                      Andini Pure Milk
                    </p>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: '1.25rem', paddingTop: '0.65rem', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.65rem', color: '#9ca3af', margin: 0 }}>
                    Dokumen ini dihasilkan secara otomatis dan terverifikasi oleh Sistem POS & Manajemen Keuangan Andini Pure Milk. Data sah dan mengikat untuk pelaporan internal usaha.
                  </p>
                </div>
              </div>
            </>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: LAPORAN LABA RUGI DETAIL (MULTI-STEP INCOME STATEMENT)             */}
          {/* ========================================================================= */}
          {activeTab === 'pnl' && (
            <div 
              id="pnl-pdf-container" 
              style={{ 
                backgroundColor: '#ffffff', 
                color: '#111827', 
                borderRadius: 'var(--radius-md)', 
                padding: '1.75rem', 
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              {/* Kop Dokumen Resmi Keuangan (Corporate Letterhead) */}
              <div style={{
                paddingBottom: '1.25rem',
                borderBottom: '3px double #8c4a26',
                marginBottom: '1.5rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '10px',
                      backgroundColor: '#542a16',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1.5rem',
                      boxShadow: '0 2px 6px rgba(84, 42, 22, 0.25)'
                    }}>
                      🥛
                    </div>
                    <div>
                      <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#542a16', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                        ANDINI PURE MILK
                      </h1>
                      <p style={{ fontSize: '0.75rem', color: '#4b5563', margin: '0.15rem 0 0 0', fontWeight: 600 }}>
                        Produsen Susu Sapi Murni, Olahan Susu, Es Lilin Kiko, Aneka Puding & Pastry
                      </p>
                      <p style={{ fontSize: '0.6875rem', color: '#6b7280', margin: '0.1rem 0 0 0' }}>
                        Gerai Pusat & Jaringan Distribusi Kemitraan Jawa Timur &bull; POS Backoffice System
                      </p>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <span style={{
                      display: 'inline-block',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.55rem',
                      borderRadius: '4px',
                      backgroundColor: '#fef3c7',
                      color: '#92400e',
                      border: '1px solid #fde68a',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      marginBottom: '0.35rem'
                    }}>
                      Dokumen Resmi Keuangan
                    </span>
                    <div style={{ fontSize: '0.75rem', color: '#111827', fontWeight: 700 }}>
                      Periode: <span style={{ color: '#8c4a26' }}>{formattedPeriodLabel}</span>
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: '#6b7280', marginTop: '0.15rem' }}>
                      Dicetak: {currentDateFormatted} WIB
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#059669', fontWeight: 600, marginTop: '0.1rem' }}>
                      Status: Terverifikasi (POS Verified)
                    </div>
                  </div>
                </div>
              </div>

              {/* P&L Stage Highlights */}
              <section style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                  <h2 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4b5563', margin: 0, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    Ikhtisar Struktur Finansial Usaha
                  </h2>
                  <span style={{ fontSize: '0.6875rem', color: '#6b7280' }}>
                    Mata Uang: IDR (Rupiah)
                  </span>
                </div>
                <div className="responsive-stats-grid">
                  <StatCard 
                    title="1. Omzet Kotor (Gross)" 
                    value={`Rp ${(stats.totalGrossSales || stats.totalRevenue || 0).toLocaleString('id-ID')}`} 
                    subtitle={stats.totalDiscount > 0 ? `Diskon: Rp ${stats.totalDiscount.toLocaleString('id-ID')}` : 'Tanpa diskon'}
                    highlightColor="#111827"
                  />
                  <StatCard 
                    title="2. Laba Kotor (Gross Profit)" 
                    value={`Rp ${(stats.totalGrossProfit || 0).toLocaleString('id-ID')}`} 
                    subtitle={`Margin Kotor: ${grossMargin}%`}
                    highlightColor="#059669"
                    badgeText={`${grossMargin}% Margin`}
                    badgeColor="#059669"
                  />
                  <StatCard 
                    title="3. Beban Operasional" 
                    value={`Rp ${(stats.totalExpense || 0).toLocaleString('id-ID')}`} 
                    subtitle={`Rasio OPEX: ${opexRatio}%`}
                    highlightColor="#dc2626"
                  />
                  <StatCard 
                    title="4. Laba Bersih Akhir" 
                    value={`Rp ${(stats.totalNetProfit || 0).toLocaleString('id-ID')}`} 
                    subtitle={`Margin Bersih: ${netMargin}%`}
                    highlightColor={(stats.totalNetProfit || 0) >= 0 ? '#059669' : '#dc2626'}
                    badgeText={(stats.totalNetProfit || 0) >= 0 ? 'Surplus' : 'Defisit'}
                    badgeColor={(stats.totalNetProfit || 0) >= 0 ? '#059669' : '#dc2626'}
                  />
                </div>
              </section>

              {/* Multi-Step P&L Statement Table */}
              <div style={{
                border: '1px solid #e5e7eb',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem 1.5rem',
                marginBottom: '1.5rem',
                backgroundColor: '#ffffff'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.75rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#111827' }}>
                      Laporan Laba Rugi Bertingkat (Multi-Step Income Statement)
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0.2rem 0 0 0' }}>
                      Perhitungan terperinci dari penjualan kotor, modal produk, beban usaha, hingga laba bersih final
                    </p>
                  </div>
                  <span style={{
                    fontSize: '0.6875rem',
                    padding: '0.2rem 0.55rem',
                    borderRadius: '4px',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #e5e7eb',
                    fontWeight: 700
                  }}>
                    Standar Akuntansi POS
                  </span>
                </div>

                <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #374151', backgroundColor: '#f9fafb' }}>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#374151', fontSize: '0.6875rem', letterSpacing: '0.04em' }}>URAIAN AKUNTANSI & POS TRANSAKSI</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#374151', fontSize: '0.6875rem', letterSpacing: '0.04em', textAlign: 'center', width: '130px' }}>REF / % PANGSA</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#374151', fontSize: '0.6875rem', letterSpacing: '0.04em', textAlign: 'right', width: '190px' }}>NILAI NOMINAL (RP)</th>
                    </tr>
                  </thead>
                  <tbody>
                    
                    {/* SECTION 1: PENDAPATAN OPERASIONAL */}
                    <tr style={{ backgroundColor: '#f3f4f6' }}>
                      <td colSpan={3} style={{ padding: '0.65rem 1rem', fontWeight: 800, fontSize: '0.75rem', color: '#111827', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        I. PENDAPATAN OPERASIONAL / PENJUALAN
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '0.65rem 1rem 0.65rem 2rem', color: '#111827' }}>
                        &bull; Penjualan Produk Kotor (Gross Sales)
                      </td>
                      <td className="tabular" style={{ padding: '0.65rem 1rem', textAlign: 'center', color: '#6b7280', fontSize: '0.78rem' }}>100%</td>
                      <td className="tabular" style={{ padding: '0.65rem 1rem', textAlign: 'right', fontWeight: 600, color: '#111827' }}>
                        Rp {(stats.totalGrossSales || stats.totalRevenue || 0).toLocaleString('id-ID')}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '0.65rem 1rem 0.65rem 2rem', color: '#6b7280' }}>
                        &bull; Potongan Harga, Voucher & Diskon Promo
                      </td>
                      <td className="tabular" style={{ padding: '0.65rem 1rem', textAlign: 'center', color: '#dc2626', fontSize: '0.78rem' }}>
                        {stats.totalGrossSales > 0 ? `-${Math.round((stats.totalDiscount / stats.totalGrossSales) * 100)}%` : '0%'}
                      </td>
                      <td className="tabular" style={{ padding: '0.65rem 1rem', textAlign: 'right', fontWeight: 600, color: '#dc2626' }}>
                        {stats.totalDiscount > 0 ? `- Rp ${stats.totalDiscount.toLocaleString('id-ID')}` : 'Rp 0'}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '2px solid #e5e7eb', backgroundColor: '#fef7ee' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#542a16' }}>
                        SUBTOTAL PENDAPATAN PENJUALAN BERSIH (NET SALES)
                      </td>
                      <td className="tabular" style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 700, color: '#542a16', fontSize: '0.8rem' }}>100% Net</td>
                      <td className="tabular" style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 800, fontSize: '0.95rem', color: '#8c4a26' }}>
                        Rp {(stats.totalRevenue || 0).toLocaleString('id-ID')}
                      </td>
                    </tr>

                    {/* SECTION 2: HARGA POKOK PENJUALAN (HPP) */}
                    <tr style={{ backgroundColor: '#f3f4f6' }}>
                      <td colSpan={3} style={{ padding: '0.65rem 1rem', fontWeight: 800, fontSize: '0.75rem', color: '#111827', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        II. HARGA POKOK PENJUALAN (HPP / COGS)
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '0.65rem 1rem 0.65rem 2rem', color: '#4b5563' }}>
                        &bull; Beban Pokok Modal Bahan Baku & Kemasan Produk Terjual
                      </td>
                      <td className="tabular" style={{ padding: '0.65rem 1rem', textAlign: 'center', color: '#6b7280', fontSize: '0.78rem' }}>
                        {stats.totalRevenue > 0 ? `${Math.round(((stats.totalHpp || 0) / stats.totalRevenue) * 100)}%` : '0%'}
                      </td>
                      <td className="tabular" style={{ padding: '0.65rem 1rem', textAlign: 'right', fontWeight: 600, color: '#dc2626' }}>
                        - Rp {(stats.totalHpp || 0).toLocaleString('id-ID')}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '2px solid #e5e7eb', backgroundColor: '#ecfdf5' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#065f46' }}>
                        LABA KOTOR PENJUALAN (GROSS PROFIT)
                      </td>
                      <td className="tabular" style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 700, color: '#065f46', fontSize: '0.8rem' }}>
                        {grossMargin}% Margin
                      </td>
                      <td className="tabular" style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 800, fontSize: '0.95rem', color: '#059669' }}>
                        Rp {(stats.totalGrossProfit || 0).toLocaleString('id-ID')}
                      </td>
                    </tr>

                    {/* SECTION 3: BEBAN OPERASIONAL */}
                    <tr style={{ backgroundColor: '#f3f4f6' }}>
                      <td colSpan={3} style={{ padding: '0.65rem 1rem', fontWeight: 800, fontSize: '0.75rem', color: '#111827', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        III. BEBAN OPERASIONAL (OPERATING EXPENSES / OPEX)
                      </td>
                    </tr>
                    {(!stats.expenseCategoryBreakdown || stats.expenseCategoryBreakdown.length === 0) ? (
                      <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td colSpan={3} style={{ padding: '0.65rem 1rem 0.65rem 2rem', color: '#9ca3af', fontStyle: 'italic' }}>
                          Tidak ada beban operasional yang dicatat pada periode ini.
                        </td>
                      </tr>
                    ) : (
                      stats.expenseCategoryBreakdown.map((exp, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '0.65rem 1rem 0.65rem 2rem', color: '#374151' }}>
                            &bull; {exp.kategori}
                          </td>
                          <td className="tabular" style={{ padding: '0.65rem 1rem', textAlign: 'center', color: '#6b7280', fontSize: '0.78rem' }}>
                            {exp.percentage || (stats.totalExpense > 0 ? Math.round((exp.nominal / stats.totalExpense) * 100) : 0)}%
                          </td>
                          <td className="tabular" style={{ padding: '0.65rem 1rem', textAlign: 'right', fontWeight: 600, color: '#dc2626' }}>
                            - Rp {exp.nominal.toLocaleString('id-ID')}
                          </td>
                        </tr>
                      ))
                    )}
                    <tr style={{ borderBottom: '2px solid #e5e7eb', backgroundColor: '#fef2f2' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#991b1b' }}>
                        TOTAL BEBAN OPERASIONAL
                      </td>
                      <td className="tabular" style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 700, color: '#991b1b', fontSize: '0.8rem' }}>
                        {opexRatio}% Omzet
                      </td>
                      <td className="tabular" style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 800, fontSize: '0.95rem', color: '#dc2626' }}>
                        - Rp {(stats.totalExpense || 0).toLocaleString('id-ID')}
                      </td>
                    </tr>

                    {/* SECTION 4: LABA BERSIH AKHIR (BOTTOM LINE) */}
                    <tr style={{ 
                      backgroundColor: (stats.totalNetProfit || 0) >= 0 ? '#ecfdf5' : '#fef2f2',
                      borderTop: '2px solid #111827',
                      borderBottom: '3px double #111827'
                    }}>
                      <td style={{ padding: '1rem', fontWeight: 900, fontSize: '0.95rem', color: '#111827' }}>
                        LABA BERSIH AKHIR USAHA (NET PROFIT / BOTTOM LINE)
                      </td>
                      <td className="tabular" style={{ padding: '1rem', textAlign: 'center', fontWeight: 800, fontSize: '0.85rem', color: (stats.totalNetProfit || 0) >= 0 ? '#065f46' : '#991b1b' }}>
                        {netMargin}% Margin ({(stats.totalNetProfit || 0) >= 0 ? 'Surplus' : 'Defisit'})
                      </td>
                      <td className="tabular" style={{ 
                        padding: '1rem', 
                        textAlign: 'right', 
                        fontWeight: 900, 
                        fontSize: '1.2rem', 
                        color: (stats.totalNetProfit || 0) >= 0 ? '#059669' : '#dc2626' 
                      }}>
                        Rp {(stats.totalNetProfit || 0).toLocaleString('id-ID')}
                      </td>
                    </tr>

                  </tbody>
                </table>
              </div>

              {/* Financial Health Insights */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ padding: '1rem 1.15rem', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <IconTrendingUp size={16} style={{ color: '#059669' }} />
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#111827' }}>Efisiensi Modal Produk (Gross Margin)</span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#4b5563', margin: 0, lineHeight: 1.5 }}>
                    Margin kotor tercatat sebesar <strong style={{ color: '#111827' }}>{grossMargin}%</strong>. Dari setiap Rp 10.000 omzet produk yang terjual, dihasilkan laba kotor sebesar <strong style={{ color: '#059669' }}>Rp {Math.round(grossMargin * 100).toLocaleString('id-ID')}</strong> sebelum dipotong beban usaha.
                  </p>
                </div>

                <div style={{ padding: '1rem 1.15rem', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <IconBanknote size={16} style={{ color: '#8c4a26' }} />
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#111827' }}>Rasio Beban Operasional (OPEX)</span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#4b5563', margin: 0, lineHeight: 1.5 }}>
                    Beban operasional memakan <strong style={{ color: '#111827' }}>{opexRatio}%</strong> dari penjualan bersih. Beban operasional terbesar berada pada pos <strong style={{ color: '#111827' }}>{stats.expenseCategoryBreakdown?.[0]?.kategori || 'Operasional'}</strong> senilai Rp {(stats.expenseCategoryBreakdown?.[0]?.nominal || 0).toLocaleString('id-ID')}.
                  </p>
                </div>

                <div style={{ padding: '1rem 1.15rem', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <IconCheck size={16} style={{ color: (stats.totalNetProfit || 0) >= 0 ? '#059669' : '#dc2626' }} />
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#111827' }}>Kesehatan Arus Kas Bersih</span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#4b5563', margin: 0, lineHeight: 1.5 }}>
                    {(stats.totalNetProfit || 0) >= 0 ? (
                      <>
                        Usaha berada dalam kondisi <strong style={{ color: '#059669' }}>SURPLUS / SEHAT</strong> dengan margin laba bersih <strong>{netMargin}%</strong>. Keuntungan riil siap dialokasikan untuk cadangan kas atau ekspansi gerai.
                      </>
                    ) : (
                      <>
                        Usaha sedang mengalami <strong style={{ color: '#dc2626' }}>DEFISIT</strong> sebesar Rp {Math.abs(stats.totalNetProfit || 0).toLocaleString('id-ID')}. Disarankan evaluasi pos beban operasional besar dan genjot penjualan produk bermargin tinggi.
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Formal Signature & Authorization Block */}
              <div style={{
                padding: '1.25rem 1.5rem',
                backgroundColor: '#f9fafb',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid #e5e7eb',
                pageBreakInside: 'avoid'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem' }}>
                  <div style={{ textAlign: 'center', minWidth: '180px' }}>
                    <p style={{ fontSize: '0.72rem', color: '#6b7280', margin: '0 0 2.8rem 0' }}>
                      Disiapkan & Dibuat Oleh,
                    </p>
                    <div style={{ borderBottom: '1px solid #374151', width: '160px', margin: '0 auto 0.35rem auto' }} />
                    <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#111827', margin: 0 }}>
                      Bagian Keuangan / Kasir POS
                    </p>
                    <p style={{ fontSize: '0.6875rem', color: '#6b7280', margin: '0.1rem 0 0 0' }}>
                      Andini Pure Milk
                    </p>
                  </div>

                  <div style={{ textAlign: 'center', minWidth: '180px' }}>
                    <p style={{ fontSize: '0.72rem', color: '#6b7280', margin: '0 0 2.8rem 0' }}>
                      Diperiksa & Disetujui Oleh,
                    </p>
                    <div style={{ borderBottom: '1px solid #374151', width: '160px', margin: '0 auto 0.35rem auto' }} />
                    <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#111827', margin: 0 }}>
                      Owner / Manajemen Utama
                    </p>
                    <p style={{ fontSize: '0.6875rem', color: '#6b7280', margin: '0.1rem 0 0 0' }}>
                      Andini Pure Milk
                    </p>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #e5e7eb', marginTop: '1.25rem', paddingTop: '0.65rem', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.65rem', color: '#9ca3af', margin: 0 }}>
                    Dokumen ini dihasilkan secara otomatis dan terverifikasi oleh Sistem POS & Manajemen Keuangan Andini Pure Milk. Data sah dan mengikat untuk pelaporan internal usaha.
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>Preview Laporan PDF</h2>
                  <span className="badge-chocolate" style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem', fontWeight: 700 }}>
                    A4 Official Statement
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
                  Pratinjau visual {activeTab === 'pnl' ? 'Laporan Laba Rugi Detail (Multi-Step Income Statement)' : activeTab === 'products' ? 'Analisis Laba per Produk' : 'Ringkasan Laporan Keuangan'}
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
