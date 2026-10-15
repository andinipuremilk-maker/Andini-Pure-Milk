'use client';
import { useState, useEffect } from 'react';

function StatCard({ title, value, highlightColor, borderColor = 'var(--color-chocolate)' }) {
  return (
    <div className="card" style={{ 
      padding: '1rem 1.15rem', 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'center',
      borderLeft: `4px solid ${borderColor}`,
      backgroundColor: '#ffffff'
    }}>
      <h3 style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--color-text-secondary)', marginBottom: '0.35rem', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
        {title}
      </h3>
      <p style={{ fontSize: '1.25rem', fontWeight: 900, color: highlightColor || 'inherit', margin: 0, overflowWrap: 'break-word' }}>
        {value}
      </p>
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
      });
  }, []);

  if (loading) return <div style={{ padding: '2rem', fontWeight: 700 }}>Memuat Dashboard...</div>;
  if (!stats) return <div style={{ padding: '2rem', color: 'var(--color-error)' }}>Gagal memuat data statistik</div>;

  const maxVal = Math.max(
    ...stats.weeklyData.flatMap(d => [d.revenue, d.expense]),
    1
  );

  return (
    <div className="admin-page-container">
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 900, letterSpacing: '0.5px', margin: 0 }}>
          DASHBOARD UTAMA
        </h1>
        <span className="badge-chocolate" style={{ padding: '0.25rem 0.65rem' }}>
          ☕ Live Analytics
        </span>
      </div>

      {/* Hari Ini Overview */}
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--color-text-secondary)', marginBottom: '0.75rem', letterSpacing: '1px' }}>
          PERFORMA HARI INI
        </h2>
        <div className="responsive-stats-grid">
          <StatCard 
            title="PENDAPATAN (OMSET)" 
            value={`Rp ${(stats.todayRevenue || 0).toLocaleString('id-ID')}`} 
            highlightColor="var(--color-chocolate)" 
            borderColor="var(--color-chocolate)"
          />
          <StatCard 
            title="PENGELUARAN OPERASIONAL" 
            value={`Rp ${(stats.todayExpense || 0).toLocaleString('id-ID')}`} 
            highlightColor="#0a0a0a" 
            borderColor="#0a0a0a"
          />
          <StatCard 
            title="LABA BERSIH (NET)" 
            value={`Rp ${(stats.todayNetProfit || 0).toLocaleString('id-ID')}`} 
            highlightColor={(stats.todayNetProfit || 0) >= 0 ? 'var(--color-chocolate)' : 'var(--color-error)'} 
            borderColor={(stats.todayNetProfit || 0) >= 0 ? 'var(--color-caramel)' : 'var(--color-error)'}
          />
          <StatCard 
            title="TRANSAKSI PENJUALAN" 
            value={`${stats.todayCount || 0} Trx`} 
            highlightColor="var(--color-text-primary)"
            borderColor="var(--color-chocolate-border)"
          />
        </div>
      </section>

      {/* Top Products */}
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--color-text-secondary)', marginBottom: '0.75rem', letterSpacing: '1px' }}>
          PRODUK TERLARIS (HARI INI)
        </h2>
        <div className="card" style={{ padding: '0.75rem 1rem', backgroundColor: '#ffffff' }}>
          {stats.topProducts.length === 0 ? (
            <p style={{ color: 'var(--color-text-secondary)', margin: '1rem 0', fontSize: '0.875rem' }}>Belum ada data penjualan hari ini</p>
          ) : (
            <div style={{ width: '100%', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <tbody>
                  {stats.topProducts.map((p, i) => (
                    <tr key={i} style={{ borderBottom: i < stats.topProducts.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                      <td style={{ padding: '0.75rem 0', width: '38px' }}>
                        <span style={{ 
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '24px',
                          height: '24px',
                          borderRadius: '4px',
                          fontWeight: 900,
                          fontSize: '0.75rem',
                          backgroundColor: i === 0 ? 'var(--color-chocolate)' : (i === 1 ? 'var(--color-caramel)' : 'var(--color-chocolate-light)'),
                          color: i < 2 ? '#ffffff' : 'var(--color-chocolate)'
                        }}>
                          #{i + 1}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700 }}>{p.nama}</td>
                      <td style={{ padding: '0.75rem 0', textAlign: 'right', fontWeight: 800, color: 'var(--color-chocolate)', whiteSpace: 'nowrap' }}>
                        {p.qty} terjual
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Weekly Chart Comparative (Pendapatan vs Pengeluaran) */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h2 style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--color-text-secondary)', margin: 0, letterSpacing: '1px' }}>
            PENDAPATAN & PENGELUARAN MINGGU INI
          </h2>
          <div style={{ display: 'flex', gap: '0.85rem', fontSize: '0.6875rem', fontWeight: 800 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '12px', height: '12px', backgroundColor: 'var(--color-chocolate)', display: 'inline-block', borderRadius: '3px' }}></span>
              PENDAPATAN (OMSET)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '12px', height: '12px', backgroundColor: '#0a0a0a', display: 'inline-block', borderRadius: '3px' }}></span>
              PENGELUARAN OPERASIONAL
            </span>
          </div>
        </div>

        <div className="card" style={{ height: '300px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '1.5rem 0.75rem', gap: '0.35rem', overflowX: 'auto', backgroundColor: '#ffffff' }}>
          {stats.weeklyData.map((day, i) => {
            const revPerc = (day.revenue / maxVal) * 100;
            const expPerc = (day.expense / maxVal) * 100;

            return (
              <div key={i} style={{ flex: 1, minWidth: '42px', display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                
                <div style={{ fontSize: '0.625rem', color: 'var(--color-text-secondary)', marginBottom: '0.35rem', textAlign: 'center', lineHeight: 1.1 }}>
                  {day.revenue > 0 && <div style={{ fontWeight: 800, color: 'var(--color-chocolate)' }}>+{(day.revenue / 1000).toFixed(0)}k</div>}
                  {day.expense > 0 && <div style={{ color: '#0a0a0a', fontWeight: 800 }}>-{(day.expense / 1000).toFixed(0)}k</div>}
                </div>

                <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '100%', width: '100%', justifyContent: 'center' }}>
                  {/* Revenue Bar in Chocolate */}
                  <div style={{ width: '14px', height: '100%', backgroundColor: 'rgba(124, 74, 45, 0.08)', display: 'flex', alignItems: 'flex-end', borderRadius: '4px 4px 0 0', overflow: 'hidden' }}>
                    <div style={{ width: '100%', height: `${revPerc}%`, backgroundColor: 'var(--color-chocolate)' }} />
                  </div>
                  {/* Expense Bar in Black */}
                  <div style={{ width: '14px', height: '100%', backgroundColor: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'flex-end', borderRadius: '4px 4px 0 0', overflow: 'hidden' }}>
                    <div style={{ width: '100%', height: `${expPerc}%`, backgroundColor: '#0a0a0a' }} />
                  </div>
                </div>

                <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--color-text-secondary)', marginTop: '0.5rem', textTransform: 'uppercase' }}>
                  {day.date}
                </span>
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
}
