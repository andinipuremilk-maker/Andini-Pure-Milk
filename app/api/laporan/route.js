import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured, isSupabaseAvailable } from '../../../lib/supabase';
import { db } from '../../../lib/db';

function computeSegmentedSales(transactions, detailItems) {
  const trxSellerMap = {};
  (transactions || []).forEach(t => {
    trxSellerMap[t.id] = t.seller || 'Booth 1 - Gerai Utama (Pusat)';
  });

  const sekolahMap = {};
  const olehOlehMap = {};
  const boothMap = {};

  (detailItems || []).forEach(dt => {
    const trxId = dt.transaksi_id;
    const seller = trxSellerMap[trxId] || 'Booth 1 - Gerai Utama (Pusat)';
    const sUpper = seller.toUpperCase();
    const prodName = (dt.nama_produk || '').toLowerCase();
    const qty = Number(dt.qty || 1);
    const subtotal = Number(dt.subtotal || (qty * (dt.harga_satuan || 0)));

    // 1. Mitra Sekolah (SD): Khusus Kiko & Aneka Puding
    const isKikoOrPuding = prodName.includes('kiko') || prodName.includes('puding') || prodName.includes('es lilin');
    const isSekolah = sUpper.includes('SD') || sUpper.includes('SEKOLAH') || sUpper.includes('KANTIN') || sUpper.includes('MADRASAH');
    if (isKikoOrPuding && isSekolah) {
      if (!sekolahMap[seller]) {
        sekolahMap[seller] = {
          mitra: seller,
          kategori: 'Mitra Sekolah (SD)',
          itemHighlight: 'Kiko & Aneka Puding',
          qty: 0,
          revenue: 0
        };
      }
      sekolahMap[seller].qty += qty;
      sekolahMap[seller].revenue += subtotal;
    }

    // 2. Pusat Oleh-Oleh: Khusus Pie Susu & Pastry
    const isPieOrPastry = prodName.includes('pie') || prodName.includes('brownies') || prodName.includes('pastry');
    const isOlehOleh = sUpper.includes('TOKO') || sUpper.includes('OLEH') || sUpper.includes('ROTI') || sUpper.includes('RESELLER') || sUpper.includes('KOPERASI') || sUpper.includes('WARUNG') || sUpper.includes('CAFE') || sUpper.includes('NAFIS');
    if (isPieOrPastry && isOlehOleh) {
      if (!olehOlehMap[seller]) {
        olehOlehMap[seller] = {
          mitra: seller,
          kategori: 'Pusat Oleh-Oleh',
          itemHighlight: 'Pie Susu & Pastry',
          qty: 0,
          revenue: 0
        };
      }
      olehOlehMap[seller].qty += qty;
      olehOlehMap[seller].revenue += subtotal;
    }

    // 3. Gerai / Booth: Khusus Susu Murni & Minuman
    const isSusu = prodName.includes('susu') || prodName.includes('stmj') || prodName.includes('smj') || prodName.includes('jahe') || prodName.includes('yoghurt');
    const isBooth = !isSekolah && !isOlehOleh;
    if (isSusu && isBooth) {
      if (!boothMap[seller]) {
        boothMap[seller] = {
          mitra: seller,
          kategori: 'Gerai / Booth',
          itemHighlight: 'Susu Murni & Olahan',
          qty: 0,
          revenue: 0
        };
      }
      boothMap[seller].qty += qty;
      boothMap[seller].revenue += subtotal;
    }
  });

  return {
    sekolah: Object.values(sekolahMap).sort((a, b) => b.qty - a.qty),
    olehOleh: Object.values(olehOlehMap).sort((a, b) => b.qty - a.qty),
    booth: Object.values(boothMap).sort((a, b) => b.qty - a.qty)
  };
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');

  // ============================================================================
  // 1. SUPABASE REALTIME & AGGREGATED QUERIES
  // ============================================================================
  if (await isSupabaseAvailable() && supabaseAdmin) {
    try {
      if (type === 'dashboard') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayIso = today.toISOString();

        // Awal Bulan Ini
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        startOfMonth.setHours(0, 0, 0, 0);
        const startOfMonthIso = startOfMonth.toISOString();

        // Data Mingguan (Senin - Minggu)
        const now = new Date();
        const dayOfWeek = now.getDay();
        const diffToMonday = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const monday = new Date(now.setDate(diffToMonday));
        monday.setHours(0, 0, 0, 0);

        const sundayEnd = new Date(monday);
        sundayEnd.setDate(monday.getDate() + 7);

        // Run queries in parallel to eliminate sequential network latency
        const [
          { data: trxToday },
          { data: trxMonth },
          { data: expToday },
          { data: weekTrx },
          { data: weekExp }
        ] = await Promise.all([
          supabaseAdmin
            .from('transaksi')
            .select('id, total, status, tanggal, seller')
            .gte('tanggal', todayIso)
            .eq('status', 'selesai'),
          supabaseAdmin
            .from('transaksi')
            .select('id, total, status, tanggal, seller')
            .gte('tanggal', startOfMonthIso)
            .eq('status', 'selesai'),
          supabaseAdmin
            .from('pengeluaran')
            .select('nominal, tanggal')
            .gte('tanggal', todayIso),
          supabaseAdmin
            .from('transaksi')
            .select('total, tanggal')
            .gte('tanggal', monday.toISOString())
            .lt('tanggal', sundayEnd.toISOString())
            .eq('status', 'selesai'),
          supabaseAdmin
            .from('pengeluaran')
            .select('nominal, tanggal')
            .gte('tanggal', monday.toISOString())
            .lt('tanggal', sundayEnd.toISOString())
        ]);

        const todayRevenue = (trxToday || []).reduce((sum, t) => sum + Number(t.total || 0), 0);
        const todayExpense = (expToday || []).reduce((sum, e) => sum + Number(e.nominal || 0), 0);
        const todayNetProfit = todayRevenue - todayExpense;
        const todayCount = (trxToday || []).length;

        const monthRevenue = (trxMonth || []).reduce((sum, t) => sum + Number(t.total || 0), 0);
        const monthCount = (trxMonth || []).length;

        // Top Produk hari ini & bulan ini
        const trxIdsToday = new Set((trxToday || []).map(t => t.id));
        const trxIdsMonth = (trxMonth || []).map(t => t.id);
        let topProducts = [];
        let topProductsMonth = [];
        let segmentedSales = {
          today: { sekolah: [], olehOleh: [], booth: [] },
          month: { sekolah: [], olehOleh: [], booth: [] }
        };

        if (trxIdsMonth.length > 0) {
          const { data: details } = await supabaseAdmin
            .from('detail_transaksi')
            .select('transaksi_id, nama_produk, qty, harga_satuan, subtotal')
            .in('transaksi_id', trxIdsMonth);

          const productQtyMapToday = {};
          const productQtyMapMonth = {};

          (details || []).forEach(dt => {
            const qty = Number(dt.qty || 1);
            productQtyMapMonth[dt.nama_produk] = (productQtyMapMonth[dt.nama_produk] || 0) + qty;
            if (trxIdsToday.has(dt.transaksi_id)) {
              productQtyMapToday[dt.nama_produk] = (productQtyMapToday[dt.nama_produk] || 0) + qty;
            }
          });

          topProducts = Object.entries(productQtyMapToday)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([nama, qty]) => ({ nama, qty }));

          topProductsMonth = Object.entries(productQtyMapMonth)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([nama, qty]) => ({ nama, qty }));

          // Segmented Sales
          const detailsToday = (details || []).filter(dt => trxIdsToday.has(dt.transaksi_id));
          segmentedSales.today = computeSegmentedSales(trxToday, detailsToday);
          segmentedSales.month = computeSegmentedSales(trxMonth, details);
        }

        const weeklyData = [];
        for (let i = 0; i < 7; i++) {
          const dStart = new Date(monday);
          dStart.setDate(monday.getDate() + i);
          const dEnd = new Date(dStart);
          dEnd.setDate(dStart.getDate() + 1);

          const dayTrx = (weekTrx || []).filter(t => {
            const dt = new Date(t.tanggal);
            return dt >= dStart && dt < dEnd;
          });

          const dayExp = (weekExp || []).filter(e => {
            const de = new Date(e.tanggal);
            return de >= dStart && de < dEnd;
          });

          const rev = dayTrx.reduce((sum, t) => sum + Number(t.total || 0), 0);
          const exp = dayExp.reduce((sum, e) => sum + Number(e.nominal || 0), 0);

          weeklyData.push({
            date: dStart.toLocaleDateString('id-ID', { weekday: 'short' }),
            revenue: rev,
            expense: exp,
            net: rev - exp
          });
        }

        return NextResponse.json({
          todayRevenue,
          todayExpense,
          todayNetProfit,
          todayCount,
          topProducts,
          monthRevenue,
          monthCount,
          topProductsMonth,
          segmentedSales,
          weeklyData
        });
      }

      if (type === 'laporan') {
        const startStr = searchParams.get('start');
        const endStr = searchParams.get('end');

        let queryTrx = supabaseAdmin
          .from('transaksi')
          .select(`
            id,
            no_transaksi,
            tanggal,
            subtotal,
            diskon,
            diskon_id,
            diskon_nama,
            diskon_tipe,
            diskon_nilai,
            total,
            metode_bayar,
            kasir,
            seller,
            user_id,
            items:detail_transaksi(
              id,
              produk_id,
              kategori_id,
              nama_produk,
              qty,
              harga_satuan,
              subtotal
            )
          `)
          .order('tanggal', { ascending: false });

        let queryExp = supabaseAdmin
          .from('pengeluaran')
          .select('id, no_transaksi, tanggal, kategori, nominal, keterangan')
          .order('tanggal', { ascending: false });

        if (startStr && endStr) {
          queryTrx = queryTrx.gte('tanggal', startStr).lte('tanggal', endStr);
          queryExp = queryExp.gte('tanggal', startStr).lte('tanggal', endStr);
        }

        const [{ data: transactions }, { data: expenses }, { data: categories }, { data: products }] = await Promise.all([
          queryTrx,
          queryExp,
          supabaseAdmin.from('kategori_produk').select('*'),
          supabaseAdmin.from('produk').select('id, nama, harga_jual, harga_modal, kategori_id')
        ]);

        const trxs = transactions || [];
        const exps = expenses || [];
        const kats = categories || [];
        const prods = products || [];

        const prodMap = {};
        prods.forEach(p => {
          prodMap[p.id] = p;
        });

        // 1. Hitung Gross Sales, Diskon, HPP, & Profitabilitas Produk
        let totalGrossSales = 0;
        let totalDiscount = 0;
        let totalHpp = 0;
        const productProfitMap = {};

        trxs.forEach(t => {
          const tDiskon = Number(t.diskon || 0);
          const tSubtotal = (t.subtotal !== undefined && t.subtotal !== null) 
            ? Number(t.subtotal) 
            : (Number(t.total || 0) + tDiskon);

          totalGrossSales += tSubtotal;
          totalDiscount += tDiskon;

          (t.items || []).forEach(it => {
            const p = prodMap[it.produk_id];
            const qty = Number(it.qty || 1);
            const hargaSatuan = Number(it.harga_satuan || (p ? p.harga_jual : 0));
            const subtotal = Number(it.subtotal || (qty * hargaSatuan));
            const modalSatuan = (p && p.harga_modal !== undefined && p.harga_modal !== null && Number(p.harga_modal) > 0)
              ? Number(p.harga_modal)
              : Math.round(hargaSatuan * 0.6);
            const itemHpp = qty * modalSatuan;
            totalHpp += itemHpp;

            const key = it.produk_id || it.nama_produk || 'unknown';
            if (!productProfitMap[key]) {
              const katName = (p && p.kategori_id) ? (kats.find(k => k.id === p.kategori_id)?.nama || 'Olahan Susu') : 'Olahan Susu';
              productProfitMap[key] = {
                id: key,
                nama: it.nama_produk || (p ? p.nama : 'Produk'),
                kategori: katName,
                qty: 0,
                grossSales: 0,
                hpp: 0,
                grossProfit: 0,
                marginPct: 0
              };
            }
            productProfitMap[key].qty += qty;
            productProfitMap[key].grossSales += subtotal;
            productProfitMap[key].hpp += itemHpp;
          });
        });

        const productProfitability = Object.values(productProfitMap).map(item => {
          const grossProfit = item.grossSales - item.hpp;
          const marginPct = item.grossSales > 0 ? Math.round((grossProfit / item.grossSales) * 100) : 0;
          return {
            ...item,
            grossProfit,
            marginPct
          };
        }).sort((a, b) => b.grossProfit - a.grossProfit);

        const totalRevenue = totalGrossSales - totalDiscount;
        const totalGrossProfit = totalRevenue - totalHpp;
        const grossMarginPct = totalRevenue > 0 ? Math.round((totalGrossProfit / totalRevenue) * 100) : 0;

        const totalExpense = exps.reduce((sum, e) => sum + Number(e.nominal || 0), 0);
        const totalNetProfit = totalGrossProfit - totalExpense;
        const netProfitMargin = totalRevenue > 0 ? Math.round((totalNetProfit / totalRevenue) * 100) : 0;
        const totalCount = trxs.length;
        const averageTicket = totalCount > 0 ? Math.round(totalRevenue / totalCount) : 0;

        // Breakdown Kategori Produk
        const catMap = {};
        kats.forEach(k => { catMap[k.id] = { kategori: k.nama, revenue: 0 }; });

        trxs.forEach(t => {
          (t.items || []).forEach(it => {
            const catId = it.kategori_id || kats[0]?.id;
            if (catId && catMap[catId]) {
              catMap[catId].revenue += Number(it.subtotal || 0);
            }
          });
        });

        const categoryBreakdown = Object.values(catMap).filter(c => c.revenue > 0);
        if (categoryBreakdown.length === 0 && totalRevenue > 0) {
          categoryBreakdown.push({ kategori: 'Produk Susu & Olahan', revenue: totalRevenue });
        }

        // Breakdown Kategori Pengeluaran
        const expCatMap = {};
        exps.forEach(e => {
          const k = e.kategori || 'Operasional';
          expCatMap[k] = (expCatMap[k] || 0) + Number(e.nominal || 0);
        });

        const expenseCategoryBreakdown = Object.entries(expCatMap).map(([kategori, nominal]) => ({
          kategori,
          nominal,
          percentage: totalExpense > 0 ? Math.round((nominal / totalExpense) * 100) : 0
        })).sort((a, b) => b.nominal - a.nominal);

        return NextResponse.json({
          totalGrossSales,
          totalDiscount,
          totalRevenue,
          totalHpp,
          totalGrossProfit,
          grossMarginPct,
          totalExpense,
          totalNetProfit,
          netProfitMargin,
          totalCount,
          averageTicket,
          categoryBreakdown,
          expenseCategoryBreakdown,
          productProfitability,
          transactionsList: trxs.map(t => ({
            ...t,
            kasir: t.kasir || (t.user_id ? 'Kasir' : 'Kasir Gerai'),
            seller: t.seller || 'Booth 1 - Gerai Utama (Pusat)'
          })),
          expensesList: exps
        });
      }
    } catch (err) {
      console.error('Supabase GET laporan error:', err);
    }
  }

  // ============================================================================
  // 2. FALLBACK IN-MEMORY DB
  // ============================================================================
  if (!db.pengeluaran) db.pengeluaran = [];

  if (type === 'dashboard') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);

    const todaysTransactions = db.transaksi.filter(t => {
      const tDate = new Date(t.tanggal);
      return tDate >= today && t.status === 'selesai';
    });

    const monthsTransactions = db.transaksi.filter(t => {
      const tDate = new Date(t.tanggal);
      return tDate >= startOfMonth && t.status === 'selesai';
    });

    const todaysExpenses = db.pengeluaran.filter(e => {
      const eDate = new Date(e.tanggal);
      return eDate >= today;
    });

    const todayRevenue = todaysTransactions.reduce((sum, t) => sum + t.total, 0);
    const todayExpense = todaysExpenses.reduce((sum, e) => sum + e.nominal, 0);
    const todayNetProfit = todayRevenue - todayExpense;
    const todayCount = todaysTransactions.length;

    const monthRevenue = monthsTransactions.reduce((sum, t) => sum + t.total, 0);
    const monthCount = monthsTransactions.length;

    // Top Produk hari ini
    const productQtyMapToday = {};
    todaysTransactions.forEach(t => {
      const details = db.detailTransaksi.filter(dt => dt.transaksi_id === t.id);
      details.forEach(dt => {
        productQtyMapToday[dt.produk_id] = (productQtyMapToday[dt.produk_id] || 0) + dt.qty;
      });
    });

    const topProductsRaw = Object.entries(productQtyMapToday)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
      
    const topProducts = topProductsRaw.map(([produkId, qty]) => {
      const produk = db.produk.find(p => p.id === produkId);
      return {
        nama: produk ? produk.nama : 'Unknown',
        qty
      };
    });

    // Top Produk bulan ini
    const productQtyMapMonth = {};
    monthsTransactions.forEach(t => {
      const details = db.detailTransaksi.filter(dt => dt.transaksi_id === t.id);
      details.forEach(dt => {
        productQtyMapMonth[dt.produk_id] = (productQtyMapMonth[dt.produk_id] || 0) + dt.qty;
      });
    });

    const topProductsMonthRaw = Object.entries(productQtyMapMonth)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
      
    const topProductsMonth = topProductsMonthRaw.map(([produkId, qty]) => {
      const produk = db.produk.find(p => p.id === produkId);
      return {
        nama: produk ? produk.nama : 'Unknown',
        qty
      };
    });

    const weeklyData = [];
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diffToMonday));
    monday.setHours(0,0,0,0);

    for(let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const nextD = new Date(d);
      nextD.setDate(d.getDate() + 1);

      const dayTransactions = db.transaksi.filter(t => {
        const tDate = new Date(t.tanggal);
        return tDate >= d && tDate < nextD && t.status === 'selesai';
      });

      const dayExpenses = db.pengeluaran.filter(e => {
        const eDate = new Date(e.tanggal);
        return eDate >= d && eDate < nextD;
      });
      
      const revenue = dayTransactions.reduce((sum, t) => sum + t.total, 0);
      const expense = dayExpenses.reduce((sum, e) => sum + e.nominal, 0);
      const net = revenue - expense;

      weeklyData.push({
        date: d.toLocaleDateString('id-ID', { weekday: 'short' }),
        revenue,
        expense,
        net
      });
    }

    // Segmented Sales
    const trxIdsToday = new Set(todaysTransactions.map(t => t.id));
    const trxIdsMonth = new Set(monthsTransactions.map(t => t.id));
    const detailsToday = db.detailTransaksi.filter(dt => trxIdsToday.has(dt.transaksi_id));
    const detailsMonth = db.detailTransaksi.filter(dt => trxIdsMonth.has(dt.transaksi_id));

    const segmentedSales = {
      today: computeSegmentedSales(todaysTransactions, detailsToday),
      month: computeSegmentedSales(monthsTransactions, detailsMonth)
    };

    return NextResponse.json({
      todayRevenue,
      todayExpense,
      todayNetProfit,
      todayCount,
      topProducts,
      monthRevenue,
      monthCount,
      topProductsMonth,
      segmentedSales,
      weeklyData
    });
  }

  if (type === 'laporan') {
    const startStr = searchParams.get('start');
    const endStr = searchParams.get('end');

    let transactions = [...db.transaksi];
    let expenses = [...db.pengeluaran];

    if (startStr && endStr) {
      const s = new Date(startStr);
      const e = new Date(endStr);
      transactions = transactions.filter(t => {
        const d = new Date(t.tanggal);
        return d >= s && d <= e;
      });
      expenses = expenses.filter(exp => {
        const d = new Date(exp.tanggal);
        return d >= s && d <= e;
      });
    }

    const kats = db.kategoriProduk || [];
    const prods = db.produk || [];

    // 1. Hitung Gross Sales, Diskon, HPP, & Profitabilitas Produk
    let totalGrossSales = 0;
    let totalDiscount = 0;
    let totalHpp = 0;
    const productProfitMap = {};

    const populatedTransactions = transactions.map(t => {
      const items = db.detailTransaksi.filter(dt => dt.transaksi_id === t.id);
      const u = db.users ? db.users.find(usr => usr.id === t.user_id) : null;
      return {
        ...t,
        kasir: t.kasir || (u ? u.nama : 'Kasir Gerai'),
        seller: t.seller || 'Booth 1 - Gerai Utama (Pusat)',
        items
      };
    });

    populatedTransactions.forEach(t => {
      const tDiskon = Number(t.diskon || 0);
      const tSubtotal = (t.subtotal !== undefined && t.subtotal !== null) 
        ? Number(t.subtotal) 
        : (Number(t.total || 0) + tDiskon);

      totalGrossSales += tSubtotal;
      totalDiscount += tDiskon;

      (t.items || []).forEach(it => {
        const p = prods.find(prod => prod.id === it.produk_id);
        const qty = Number(it.qty || 1);
        const hargaSatuan = Number(it.harga_satuan || (p ? p.harga_jual : 0));
        const subtotal = Number(it.subtotal || (qty * hargaSatuan));
        const modalSatuan = (p && p.harga_modal !== undefined && p.harga_modal !== null && Number(p.harga_modal) > 0)
          ? Number(p.harga_modal)
          : Math.round(hargaSatuan * 0.6);
        const itemHpp = qty * modalSatuan;
        totalHpp += itemHpp;

        const key = it.produk_id || it.nama_produk || 'unknown';
        if (!productProfitMap[key]) {
          const katName = (p && p.kategori_id) ? (kats.find(k => k.id === p.kategori_id)?.nama || 'Olahan Susu') : 'Olahan Susu';
          productProfitMap[key] = {
            id: key,
            nama: it.nama_produk || (p ? p.nama : 'Produk'),
            kategori: katName,
            qty: 0,
            grossSales: 0,
            hpp: 0,
            grossProfit: 0,
            marginPct: 0
          };
        }
        productProfitMap[key].qty += qty;
        productProfitMap[key].grossSales += subtotal;
        productProfitMap[key].hpp += itemHpp;
      });
    });

    const productProfitability = Object.values(productProfitMap).map(item => {
      const grossProfit = item.grossSales - item.hpp;
      const marginPct = item.grossSales > 0 ? Math.round((grossProfit / item.grossSales) * 100) : 0;
      return {
        ...item,
        grossProfit,
        marginPct
      };
    }).sort((a, b) => b.grossProfit - a.grossProfit);

    const totalRevenue = totalGrossSales - totalDiscount;
    const totalGrossProfit = totalRevenue - totalHpp;
    const grossMarginPct = totalRevenue > 0 ? Math.round((totalGrossProfit / totalRevenue) * 100) : 0;

    const totalExpense = expenses.reduce((sum, e) => sum + Number(e.nominal || 0), 0);
    const totalNetProfit = totalGrossProfit - totalExpense;
    const netProfitMargin = totalRevenue > 0 ? Math.round((totalNetProfit / totalRevenue) * 100) : 0;
    const totalCount = transactions.length;
    const averageTicket = totalCount > 0 ? Math.round(totalRevenue / totalCount) : 0;

    // Breakdown Kategori Produk
    const catMap = {};
    kats.forEach(k => {
      catMap[k.id] = { kategori: k.nama, revenue: 0 };
    });

    populatedTransactions.forEach(t => {
      (t.items || []).forEach(dt => {
        const p = prods.find(prod => prod.id === dt.produk_id);
        if (p && catMap[p.kategori_id]) {
          catMap[p.kategori_id].revenue += Number(dt.subtotal || 0);
        }
      });
    });

    const categoryBreakdown = Object.values(catMap).filter(c => c.revenue > 0);
    if (categoryBreakdown.length === 0 && totalRevenue > 0) {
      categoryBreakdown.push({ kategori: 'Produk Susu & Olahan', revenue: totalRevenue });
    }

    // Breakdown Kategori Pengeluaran
    const expCatMap = {};
    expenses.forEach(e => {
      const k = e.kategori || 'Operasional';
      expCatMap[k] = (expCatMap[k] || 0) + Number(e.nominal || 0);
    });

    const expenseCategoryBreakdown = Object.entries(expCatMap).map(([kategori, nominal]) => ({
      kategori,
      nominal,
      percentage: totalExpense > 0 ? Math.round((nominal / totalExpense) * 100) : 0
    })).sort((a, b) => b.nominal - a.nominal);

    return NextResponse.json({
      totalGrossSales,
      totalDiscount,
      totalRevenue,
      totalHpp,
      totalGrossProfit,
      grossMarginPct,
      totalExpense,
      totalNetProfit,
      netProfitMargin,
      totalCount,
      averageTicket,
      categoryBreakdown,
      expenseCategoryBreakdown,
      productProfitability,
      transactionsList: populatedTransactions,
      expensesList: expenses
    });
  }

  return NextResponse.json({ error: 'Type parameter required' }, { status: 400 });
}
