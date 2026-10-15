import { mockTransaksi, mockDetailTransaksi, mockProduk, mockKategoriProduk } from './mockData';

export const getDashboardStats = async () => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Today's transactions
  const todaysTransactions = mockTransaksi.filter(t => {
    const tDate = new Date(t.tanggal);
    return tDate >= today && t.status === 'selesai';
  });

  const todayRevenue = todaysTransactions.reduce((sum, t) => sum + t.total, 0);
  const todayCount = todaysTransactions.length;

  // Top 3 products today
  const productQtyMap = {};
  todaysTransactions.forEach(t => {
    const details = mockDetailTransaksi.filter(dt => dt.transaksi_id === t.id);
    details.forEach(dt => {
      productQtyMap[dt.produk_id] = (productQtyMap[dt.produk_id] || 0) + dt.qty;
    });
  });

  const topProductsRaw = Object.entries(productQtyMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
    
  const topProducts = topProductsRaw.map(([produkId, qty]) => {
    const produk = mockProduk.find(p => p.id === produkId);
    return {
      nama: produk ? produk.nama : 'Unknown',
      qty
    };
  });

  // Last 7 days revenue chart data
  const last7Days = [];
  for(let i=6; i>=0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0,0,0,0);
    const nextD = new Date(d);
    nextD.setDate(d.getDate() + 1);

    const dayTransactions = mockTransaksi.filter(t => {
      const tDate = new Date(t.tanggal);
      return tDate >= d && tDate < nextD && t.status === 'selesai';
    });
    
    const revenue = dayTransactions.reduce((sum, t) => sum + t.total, 0);
    last7Days.push({
      date: d.toLocaleDateString('id-ID', { weekday: 'short' }),
      revenue
    });
  }

  return {
    todayRevenue,
    todayCount,
    topProducts,
    last7Days
  };
};

export const getLaporanStats = async (startDate, endDate) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const start = new Date(startDate);
  start.setHours(0,0,0,0);
  
  const end = new Date(endDate);
  end.setHours(23,59,59,999);

  const rangeTransactions = mockTransaksi.filter(t => {
    const tDate = new Date(t.tanggal);
    return tDate >= start && tDate <= end && t.status === 'selesai';
  });

  const totalRevenue = rangeTransactions.reduce((sum, t) => sum + t.total, 0);
  const totalCount = rangeTransactions.length;
  const avgValue = totalCount > 0 ? totalRevenue / totalCount : 0;

  // Breakdown by day
  const dailyBreakdownRaw = {};
  rangeTransactions.forEach(t => {
    const dStr = new Date(t.tanggal).toLocaleDateString('id-ID');
    dailyBreakdownRaw[dStr] = (dailyBreakdownRaw[dStr] || 0) + t.total;
  });
  
  const dailyBreakdown = Object.entries(dailyBreakdownRaw).map(([date, revenue]) => ({ date, revenue }));

  // Breakdown by category
  const categoryRevenueRaw = {};
  rangeTransactions.forEach(t => {
    const details = mockDetailTransaksi.filter(dt => dt.transaksi_id === t.id);
    details.forEach(dt => {
      const prod = mockProduk.find(p => p.id === dt.produk_id);
      if (prod) {
        const catId = prod.kategori_id;
        categoryRevenueRaw[catId] = (categoryRevenueRaw[catId] || 0) + dt.subtotal;
      }
    });
  });

  const categoryBreakdown = Object.entries(categoryRevenueRaw).map(([catId, rev]) => {
    const cat = mockKategoriProduk.find(k => k.id === catId);
    return {
      kategori: cat ? cat.nama : 'Unknown',
      revenue: rev
    };
  }).sort((a,b) => b.revenue - a.revenue);

  return {
    totalRevenue,
    totalCount,
    avgValue,
    dailyBreakdown,
    categoryBreakdown
  };
};
