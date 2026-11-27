'use client';
import { useState, useEffect } from 'react';
import { 
  IconTrendingUp, 
  IconTrendingDown, 
  IconReceipt, 
  IconPackage,
  IconCalendar,
  IconStore
} from '../../../components/ui/icons';

function StatCard({ title, value, subtitle, icon: IconComponent, trendType = 'neutral' }) {
  const getTrendStyle = () => {
    if (trendType === 'positive') return { color: 'var(--status-success)', bg: 'var(--status-success-bg)' };
    if (trendType === 'negative') return { color: 'var(--status-danger)', bg: 'var(--status-danger-bg)' };
    return { color: 'var(--accent-primary)', bg: 'var(--accent-subtle)' };
  };

  const style = getTrendStyle();

  return (
    <div className="panel" style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      gap: '0.75rem',
      padding: '1.25rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{
          fontSize: '0.75rem',
          fontWeight: 600,
          color: 'var(--text-secondary)',
          lineHeight: 1.3
        }}>
          {title}
        </span>
        {IconComponent && (
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: style.bg,
            color: style.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <IconComponent size={15} />
          </div>
        )}
      </div>

      <div>
        <div className="tabular" style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
          lineHeight: 1.2
        }}>
          {value}
        </div>
        {subtitle && (
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('today'); // 'today' | 'month'
  const [segmentTab, setSegmentTab] = useState('sekolah'); // 'sekolah' | 'olehOleh' | 'booth'

  useEffect(() => {
    fetch('/api/laporan?type=dashboard')
      .then(r => r.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="admin-page-container" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
        <span>Memuat data ringkasan dashboard...</span>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="admin-page-container" style={{ color: 'var(--status-danger)', fontSize: '0.875rem' }}>
        Gagal memuat data statistik dashboard.
      </div>
    );
  }

  const maxVal = Math.max(
    ...stats.weeklyData.flatMap(d => [d.revenue, d.expense]),
    1
  );

  const activeRevenue = period === 'today' ? (stats.todayRevenue || 0) : (stats.monthRevenue || 0);
  const activeCount = period === 'today' ? (stats.todayCount || 0) : (stats.monthCount || 0);

  const segmentedData = stats?.segmentedSales
    ? (period === 'today' ? stats.segmentedSales.today : stats.segmentedSales.month)
    : null;

  const currentSegmentList = (segmentedData && segmentedData[segmentTab])
    ? segmentedData[segmentTab]
    : [];

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div style={{
        marginBottom: '1.75rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <h1 style={{
              fontSize: '1.375rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              margin: 0
            }}>
              Ringkasan Operasional
            </h1>
            <span className="badge-chocolate" style={{ fontSize: '0.65rem' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)', display: 'inline-block' }} />
              <span>Live Analytics</span>
            </span>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>
            Pantau arus omset penjualan dan tren transaksi kasir gerai Andini
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Period Toggle Switcher - Equal Width & Clean */}
          <div style={{
            display: 'inline-grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            padding: '2px',
            backgroundColor: 'var(--surface-muted)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            height: '32px',
            alignItems: 'center',
            gap: '2px',
            width: '170px'
          }}>
            <button
              type="button"
              onClick={() => setPeriod('today')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                width: '100%',
                height: '26px',
                padding: '0 0.5rem',
                fontSize: '0.75rem',
                fontWeight: period === 'today' ? 700 : 500,
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: period === 'today' ? 'var(--accent-primary)' : 'transparent',
                color: period === 'today' ? '#ffffff' : 'var(--text-secondary)',
                boxShadow: period === 'today' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap'
              }}
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() => setPeriod('month')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                width: '100%',
                height: '26px',
                padding: '0 0.5rem',
                fontSize: '0.75rem',
                fontWeight: period === 'month' ? 700 : 500,
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: period === 'month' ? 'var(--accent-primary)' : 'transparent',
                color: period === 'month' ? '#ffffff' : 'var(--text-secondary)',
                boxShadow: period === 'month' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap'
              }}
            >
              Bulan Ini
            </button>
          </div>

          {/* Date Label - Matching Height */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            height: '32px',
            padding: '0 0.75rem',
            fontSize: '0.75rem',
            fontWeight: 500,
            color: 'var(--text-primary)',
            backgroundColor: 'var(--surface-panel)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)'
          }}>
            <IconCalendar size={13} style={{ color: 'var(--accent-primary)' }} />
            <span>
              {period === 'today'
                ? new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                : new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid (Omset & Volume Transaksi Saja) */}
      <section style={{ marginBottom: '1.75rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.25rem'
        }}>
          <StatCard
            title={period === 'today' ? "Total Omset Hari Ini" : "Total Omset Bulan Ini"}
            value={`Rp ${activeRevenue.toLocaleString('id-ID')}`}
            subtitle={period === 'today' ? "Akumulasi penjualan kasir hari ini" : `Akumulasi penjualan bulan ${new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`}
            icon={IconTrendingUp}
            trendType="positive"
          />
          <StatCard
            title={period === 'today' ? "Volume Transaksi Hari Ini" : "Volume Transaksi Bulan Ini"}
            value={`${activeCount} Nota`}
            subtitle="Pesanan berhasil diselesaikan di kasir"
            icon={IconPackage}
            trendType="neutral"
          />
        </div>
      </section>

      {/* 2-Column Section: Top Products & Weekly Trends */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
        
        {/* Segmented Sales Channel (Sekolah, Pusat Oleh-Oleh, Booth) */}
        <section className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.75rem',
            paddingBottom: '0.65rem',
            borderBottom: '1px solid var(--border-subtle)',
            flexWrap: 'wrap',
            gap: '0.65rem'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <IconStore size={15} style={{ color: 'var(--accent-primary)' }} />
                <h2 style={{ fontSize: '0.875rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Penjualan Terbanyak per Segmen
                </h2>
              </div>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', marginTop: '0.15rem', display: 'block' }}>
                Peringkat distribusi tempat/mitra khusus item unggulan
              </span>
            </div>

            {/* Segment Switcher Tabs - Equal Width & Balanced */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              padding: '2px',
              backgroundColor: 'var(--surface-muted)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              height: '32px',
              alignItems: 'center',
              gap: '3px',
              width: '100%',
              maxWidth: '510px'
            }}>
              <button
                type="button"
                onClick={() => setSegmentTab('sekolah')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  gap: '0.3rem',
                  height: '26px',
                  width: '100%',
                  padding: '0 0.5rem',
                  fontSize: '0.72rem',
                  fontWeight: segmentTab === 'sekolah' ? 700 : 500,
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: segmentTab === 'sekolah' ? 'var(--accent-primary)' : 'transparent',
                  color: segmentTab === 'sekolah' ? '#ffffff' : 'var(--text-secondary)',
                  boxShadow: segmentTab === 'sekolah' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                <span>🏫 SD (Kiko & Puding)</span>
              </button>

              <button
                type="button"
                onClick={() => setSegmentTab('olehOleh')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  gap: '0.3rem',
                  height: '26px',
                  width: '100%',
                  padding: '0 0.5rem',
                  fontSize: '0.72rem',
                  fontWeight: segmentTab === 'olehOleh' ? 700 : 500,
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: segmentTab === 'olehOleh' ? 'var(--accent-primary)' : 'transparent',
                  color: segmentTab === 'olehOleh' ? '#ffffff' : 'var(--text-secondary)',
                  boxShadow: segmentTab === 'olehOleh' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                <span>🛍️ Oleh-Oleh (Pie)</span>
              </button>

              <button
                type="button"
                onClick={() => setSegmentTab('booth')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  gap: '0.3rem',
                  height: '26px',
                  width: '100%',
                  padding: '0 0.5rem',
                  fontSize: '0.72rem',
                  fontWeight: segmentTab === 'booth' ? 700 : 500,
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: segmentTab === 'booth' ? 'var(--accent-primary)' : 'transparent',
                  color: segmentTab === 'booth' ? '#ffffff' : 'var(--text-secondary)',
                  boxShadow: segmentTab === 'booth' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                <span>🥛 Booth (Susu)</span>
              </button>
            </div>
          </div>

          {/* Active Segment Subtitle Banner */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.35rem 0.65rem',
            backgroundColor: 'var(--surface-subtle)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '0.75rem',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.72rem',
            flexWrap: 'wrap',
            gap: '0.35rem'
          }}>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {segmentTab === 'sekolah' && 'Fokus: Kiko (Es Lilin Susu) & Aneka Puding'}
              {segmentTab === 'olehOleh' && 'Fokus: Pie Susu Original, Coklat, Box & Pastry'}
              {segmentTab === 'booth' && 'Fokus: Susu Murni Segar, Hangat & Minuman Olahan'}
            </span>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
              {period === 'today' ? 'Filter: Hari Ini' : 'Filter: Bulan Ini'}
            </span>
          </div>

          {/* List of Places / Partners */}
          {currentSegmentList.length === 0 ? (
            <div style={{
              padding: '1.75rem 1rem',
              textAlign: 'center',
              color: 'var(--text-secondary)',
              fontSize: '0.78rem',
              backgroundColor: 'var(--surface-subtle)',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--border-subtle)',
              margin: '0.25rem 0'
            }}>
              <p style={{ margin: 0, fontWeight: 500 }}>
                Belum ada transaksi {segmentTab === 'sekolah' ? 'Kiko & Puding ke mitra SD' : segmentTab === 'olehOleh' ? 'Pie ke pusat oleh-oleh' : 'Susu di booth'} untuk {period === 'today' ? 'hari ini' : 'bulan ini'}.
              </p>
              {period === 'today' && (
                <button
                  type="button"
                  onClick={() => setPeriod('month')}
                  style={{
                    marginTop: '0.45rem',
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-primary)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Lihat akumulasi Bulan Ini &rarr;
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              {currentSegmentList.slice(0, 5).map((item, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: i === 0 ? 'var(--surface-subtle)' : 'var(--surface-panel)',
                  border: i === 0 ? '1.5px solid var(--border-strong)' : '1px solid var(--border-subtle)',
                  boxShadow: 'var(--shadow-xs)',
                  transition: 'transform 0.15s ease'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: i === 0 ? 'var(--accent-primary)' : 'var(--surface-muted)',
                      color: i === 0 ? '#ffffff' : 'var(--text-secondary)',
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      #{i + 1}
                    </span>
                    <div>
                      <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {item.mitra}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
                        {item.itemHighlight || item.fokus || 'Produk Unggulan'}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div className="tabular" style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                      {item.qty} <span style={{ fontSize: '0.6875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>pcs</span>
                    </div>
                    <div className="tabular" style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      Rp {(item.revenue || 0).toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Weekly Comparative Chart */}
        <section className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid var(--border-subtle)',
            flexWrap: 'wrap',
            gap: '0.5rem'
          }}>
            <div>
              <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Arus Kas 7 Hari Terakhir
              </h2>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                Komparasi omset harian vs pengeluaran gerai
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.6875rem', fontWeight: 600 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-primary)' }}>
                <span style={{ width: '8px', height: '8px', backgroundColor: 'var(--accent-primary)', borderRadius: '2px' }} />
                <span>Omset</span>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)' }}>
                <span style={{ width: '8px', height: '8px', backgroundColor: 'var(--border-strong)', borderRadius: '2px' }} />
                <span>Pengeluaran</span>
              </span>
            </div>
          </div>

          {/* Bar Chart Area */}
          <div style={{
            height: '220px',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: '0.5rem',
            paddingTop: '1rem'
          }}>
            {stats.weeklyData?.map((day, i) => {
              const revPerc = Math.min(Math.round((day.revenue / maxVal) * 100), 100);
              const expPerc = Math.min(Math.round((day.expense / maxVal) * 100), 100);

              return (
                <div key={i} style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  height: '100%',
                  justifyContent: 'flex-end'
                }}>
                  {/* Bars container */}
                  <div style={{
                    display: 'flex',
                    gap: '3px',
                    alignItems: 'flex-end',
                    height: '160px',
                    width: '100%',
                    justifyContent: 'center'
                  }}>
                    {/* Revenue Bar */}
                    <div
                      title={`Omset: Rp ${day.revenue.toLocaleString('id-ID')}`}
                      style={{
                        width: '12px',
                        height: `${Math.max(revPerc, 4)}%`,
                        backgroundColor: 'var(--accent-primary)',
                        borderRadius: '3px 3px 0 0',
                        transition: 'height 0.2s ease'
                      }}
                    />
                    {/* Expense Bar */}
                    <div
                      title={`Beban: Rp ${day.expense.toLocaleString('id-ID')}`}
                      style={{
                        width: '12px',
                        height: `${Math.max(expPerc, 4)}%`,
                        backgroundColor: 'var(--border-strong)',
                        borderRadius: '3px 3px 0 0',
                        transition: 'height 0.2s ease'
                      }}
                    />
                  </div>

                  {/* Day Label */}
                  <span style={{
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    marginTop: '0.5rem',
                    textAlign: 'center'
                  }}>
                    {day.date}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

      </div>
    </div>
  );
}
