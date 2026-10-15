import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '../../../lib/supabase';
import { db } from '../../../lib/db';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');

  // ============================================================================
  // 1. SUPABASE REALTIME & AGGREGATED QUERIES
  // ============================================================================
  if (isSupabaseConfigured() && supabaseAdmin) {
    try {
      if (type === 'dashboard') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayIso = today.toISOString();

        // Ambil transaksi hari ini
        const { data: trxToday } = await supabaseAdmin
          .from('transaksi')
          .select('id, total, status, tanggal')
          .gte('tanggal', todayIso)
          .eq('status', 'selesai');

        // Ambil pengeluaran hari ini
        const { data: expToday } = await supabaseAdmin
          .from('pengeluaran')
          .select('nominal, tanggal')
          .gte('tanggal', todayIso);

        const todayRevenue = (trxToday || []).reduce((sum, t) => sum + Number(t.total || 0), 0);
        const todayExpense = (expToday || []).reduce((sum, e) => sum + Number(e.nominal || 0), 0);
        const todayNetProfit = todayRevenue - todayExpense;
        const todayCount = (trxToday || []).length;

        // Top Produk hari ini
        const trxIds = (trxToday || []).map(t => t.id);
        let topProducts = [];

        if (trxIds.length > 0) {
          const { data: details } = await supabaseAdmin
            .from('detail_transaksi')
            .select('nama_produk, qty')
            .in('transaksi_id', trxIds);

          const productQtyMap = {};
          (details || []).forEach(dt => {
            productQtyMap[dt.nama_produk] = (productQtyMap[dt.nama_produk] || 0) + Number(dt.qty || 1);
          });

          topProducts = Object.entries(productQtyMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([nama, qty]) => ({ nama, qty }));
        }

        // Data Mingguan (Senin - Minggu)
        const weeklyData = [];
        const now = new Date();
        const dayOfWeek = now.getDay();
        const diffToMonday = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const monday = new Date(now.setDate(diffToMonday));
        monday.setHours(0, 0, 0, 0);

        const sundayEnd = new Date(monday);
        sundayEnd.setDate(monday.getDate() + 7);

        const { data: weekTrx } = await supabaseAdmin
          .from('transaksi')
          .select('total, tanggal')
          .gte('tanggal', monday.toISOString())
          .lt('tanggal', sundayEnd.toISOString())
          .eq('status', 'selesai');

        const { data: weekExp } = await supabaseAdmin
          .from('pengeluaran')
          .select('nominal, tanggal')
          .gte('tanggal', monday.toISOString())
          .lt('tanggal', sundayEnd.toISOString());

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
          weeklyData
        });
      }

      if (type === 'laporan') {
        const startStr = searchParams.get('start');
        const endStr = searchParams.get('end');

        let queryTrx = supabaseAdmin
          .from('transaksi')
          .select(`
            *,
            items:detail_transaksi(
              id,
              produk_id,
              nama_produk,
              qty,
              harga_satuan,
              subtotal
            )
          `)
          .order('tanggal', { ascending: false });

        let queryExp = supabaseAdmin
          .from('pengeluaran')
          .select('*')
          .order('tanggal', { ascending: false });

        if (startStr && endStr) {
          queryTrx = queryTrx.gte('tanggal', startStr).lte('tanggal', endStr);
          queryExp = queryExp.gte('tanggal', startStr).lte('tanggal', endStr);
        }

        const [{ data: transactions }, { data: expenses }, { data: categories }] = await Promise.all([
          queryTrx,
          queryExp,
          supabaseAdmin.from('kategori_produk').select('*')
        ]);

        const trxs = transactions || [];
        const exps = expenses || [];
        const kats = categories || [];

        const totalRevenue = trxs.reduce((sum, t) => sum + Number(t.total || 0), 0);
        const totalExpense = exps.reduce((sum, e) => sum + Number(e.nominal || 0), 0);
        const totalNetProfit = totalRevenue - totalExpense;
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
          nominal
        }));

        return NextResponse.json({
          totalRevenue,
          totalExpense,
          totalNetProfit,
          totalCount,
          averageTicket,
          categoryBreakdown,
          expenseCategoryBreakdown,
          transactionsList: trxs,
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

    const todaysTransactions = db.transaksi.filter(t => {
      const tDate = new Date(t.tanggal);
      return tDate >= today && t.status === 'selesai';
    });

    const todaysExpenses = db.pengeluaran.filter(e => {
      const eDate = new Date(e.tanggal);
      return eDate >= today;
    });

    const todayRevenue = todaysTransactions.reduce((sum, t) => sum + t.total, 0);
    const todayExpense = todaysExpenses.reduce((sum, e) => sum + e.nominal, 0);
    const todayNetProfit = todayRevenue - todayExpense;
    const todayCount = todaysTransactions.length;

    const productQtyMap = {};
    todaysTransactions.forEach(t => {
      const details = db.detailTransaksi.filter(dt => dt.transaksi_id === t.id);
      details.forEach(dt => {
        productQtyMap[dt.produk_id] = (productQtyMap[dt.produk_id] || 0) + dt.qty;
      });
    });

    const topProductsRaw = Object.entries(productQtyMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
      
    const topProducts = topProductsRaw.map(([produkId, qty]) => {
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

    return NextResponse.json({
      todayRevenue,
      todayExpense,
      todayNetProfit,
      todayCount,
      topProducts,
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

    const totalRevenue = transactions.reduce((sum, t) => sum + t.total, 0);
    const totalExpense = expenses.reduce((sum, e) => sum + e.nominal, 0);
    const totalNetProfit = totalRevenue - totalExpense;
    const totalCount = transactions.length;
    const averageTicket = totalCount > 0 ? Math.round(totalRevenue / totalCount) : 0;

    const catMap = {};
    (db.kategoriProduk || []).forEach(k => {
      catMap[k.id] = { kategori: k.nama, revenue: 0 };
    });

    transactions.forEach(t => {
      const details = db.detailTransaksi.filter(dt => dt.transaksi_id === t.id);
      details.forEach(dt => {
        const p = db.produk.find(prod => prod.id === dt.produk_id);
        if (p && catMap[p.kategori_id]) {
          catMap[p.kategori_id].revenue += dt.subtotal;
        }
      });
    });

    const categoryBreakdown = Object.values(catMap).filter(c => c.revenue > 0);

    const expCatMap = {};
    expenses.forEach(e => {
      expCatMap[e.kategori] = (expCatMap[e.kategori] || 0) + e.nominal;
    });

    const expenseCategoryBreakdown = Object.entries(expCatMap).map(([kategori, nominal]) => ({
      kategori,
      nominal
    }));

    return NextResponse.json({
      totalRevenue,
      totalExpense,
      totalNetProfit,
      totalCount,
      averageTicket,
      categoryBreakdown,
      expenseCategoryBreakdown,
      transactionsList: transactions.map(t => ({
        ...t,
        items: db.detailTransaksi.filter(dt => dt.transaksi_id === t.id)
      })),
      expensesList: expenses
    });
  }

  return NextResponse.json({ error: 'Type parameter required' }, { status: 400 });
}
