'use client';
import { useState, useEffect } from 'react';
import { 
  IconTrendingUp, 
  IconTrendingDown, 
  IconReceipt, 
  IconPackage,
  IconCalendar
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

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div style={{
        marginBottom: '1.75rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '0.75rem'
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
            Pantau arus kas, performa penjualan harian, dan tren outlet Andini
          </p>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
          backgroundColor: 'var(--surface-panel)',
          border: '1px solid var(--border-subtle)',
          padding: '0.4rem 0.75rem',
          borderRadius: 'var(--radius-md)'
        }}>
          <IconCalendar size={14} />
          <span>Hari Ini: {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <section style={{ marginBottom: '1.75rem' }}>
        <div className="responsive-stats-grid">
          <StatCard
            title="Pendapatan (Omset Hari Ini)"
            value={`Rp ${(stats.todayRevenue || 0).toLocaleString('id-ID')}`}
            subtitle="Akumulasi penjualan kasir hari ini"
            icon={IconTrendingUp}
            trendType="positive"
          />
          <StatCard
            title="Pengeluaran Operasional"
            value={`Rp ${(stats.todayExpense || 0).toLocaleString('id-ID')}`}
            subtitle="Beban bahan baku & logistik gerai"
            icon={IconTrendingDown}
            trendType="negative"
          />
          <StatCard
            title="Laba Bersih (Net Profit)"
            value={`Rp ${(stats.todayNetProfit || 0).toLocaleString('id-ID')}`}
            subtitle={`Margin Laba: ${stats.todayRevenue > 0 ? Math.round((stats.todayNetProfit / stats.todayRevenue) * 100) : 0}%`}
            icon={IconReceipt}
            trendType={(stats.todayNetProfit || 0) >= 0 ? 'positive' : 'negative'}
          />
          <StatCard
            title="Volume Transaksi Kasir"
            value={`${stats.todayCount || 0} Nota`}
            subtitle="Pesanan berhasil diselesaikan"
            icon={IconPackage}
            trendType="neutral"
          />
        </div>
      </section>

      {/* 2-Column Section: Top Products & Weekly Trends */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
        
        {/* Top Selling Products */}
        <section className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid var(--border-subtle)'
          }}>
            <div>
              <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Produk Terlaris Hari Ini
              </h2>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                Berdasarkan kuantitas unit terjual di kasir
              </span>
            </div>
            <span className="badge-neutral">
              {stats.topProducts?.length || 0} Menu
            </span>
          </div>

          {(!stats.topProducts || stats.topProducts.length === 0) ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
              Belum ada transaksi penjualan yang terekam hari ini.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {stats.topProducts.map((p, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.55rem 0.65rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: i === 0 ? 'var(--surface-subtle)' : 'transparent',
                  border: i === 0 ? '1px solid var(--border-subtle)' : '1px solid transparent'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: i === 0 ? 'var(--accent-primary)' : 'var(--surface-subtle)',
                      color: i === 0 ? 'var(--text-inverse)' : 'var(--text-secondary)',
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {i + 1}
                    </span>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {p.nama}
                    </span>
                  </div>

                  <div className="tabular" style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                    {p.qty} <span style={{ fontSize: '0.6875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>terjual</span>
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
