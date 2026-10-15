import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '../../../lib/supabase';
import { db } from '../../../lib/db';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const seller = searchParams.get('seller');
  const search = searchParams.get('search');
  const start = searchParams.get('start');
  const end = searchParams.get('end');
  const produkId = searchParams.get('produk_id');
  const kategoriId = searchParams.get('kategori_id');
  const metodeBayar = searchParams.get('metode_bayar');

  if (isSupabaseConfigured() && supabaseAdmin) {
    try {
      let query = supabaseAdmin
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

      if (seller && seller !== 'ALL') {
        query = query.ilike('seller', seller);
      }

      if (metodeBayar && metodeBayar !== 'ALL') {
        query = query.eq('metode_bayar', metodeBayar);
      }

      if (start && end) {
        query = query.gte('tanggal', start).lte('tanggal', end);
      }

      const { data, error } = await query;

      if (!error && data) {
        let list = data.map(t => {
          // Hitung nilai setoran, modal (estimasi HPP 60% bila tidak ada), dan laba secara dinamis
          const totalSetor = Number(t.total) || 0;
          return {
            ...t,
            total_setor: totalSetor,
            total_modal: Math.round(totalSetor * 0.6), // dynamic HPP
            total_laba: Math.round(totalSetor * 0.4),  // dynamic gross profit
          };
        });

        // Filter client-side untuk pencarian kata kunci / produk
        if (search) {
          const q = search.toLowerCase();
          list = list.filter(t => 
            (t.no_transaksi && t.no_transaksi.toLowerCase().includes(q)) || 
            (t.seller && t.seller.toLowerCase().includes(q)) ||
            (t.keterangan && t.keterangan.toLowerCase().includes(q)) ||
            (t.items && t.items.some(item => item.nama_produk && item.nama_produk.toLowerCase().includes(q)))
          );
        }

        if (produkId && produkId !== 'ALL') {
          list = list.filter(t => t.items && t.items.some(item => item.produk_id === produkId));
        }

        return NextResponse.json(list);
      }
    } catch (err) {
      console.error('Supabase GET transaksi error:', err);
    }
  }

  // Fallback ke in-memory database
  let list = db.transaksi.map(t => {
    const details = db.detailTransaksi.filter(dt => dt.transaksi_id === t.id).map(dt => {
      const prod = db.produk.find(p => p.id === dt.produk_id);
      return {
        ...dt,
        nama_produk: prod ? prod.nama : dt.nama_produk || 'Produk'
      };
    });

    return {
      ...t,
      items: details
    };
  });

  if (seller && seller !== 'ALL') {
    list = list.filter(t => t.seller?.toLowerCase() === seller.toLowerCase());
  }

  if (metodeBayar && metodeBayar !== 'ALL') {
    list = list.filter(t => t.metode_bayar?.toLowerCase() === metodeBayar.toLowerCase());
  }

  if (produkId && produkId !== 'ALL') {
    list = list.filter(t => t.items.some(item => item.produk_id === produkId));
  }

  if (kategoriId && kategoriId !== 'ALL') {
    list = list.filter(t => t.items.some(item => {
      const prod = db.produk.find(p => p.id === item.produk_id);
      return prod && prod.kategori_id === kategoriId;
    }));
  }

  if (search) {
    const q = search.toLowerCase();
    list = list.filter(t => 
      t.no_transaksi.toLowerCase().includes(q) || 
      (t.seller && t.seller.toLowerCase().includes(q)) ||
      (t.keterangan && t.keterangan.toLowerCase().includes(q)) ||
      t.items.some(item => item.nama_produk && item.nama_produk.toLowerCase().includes(q))
    );
  }

  if (start && end) {
    const startDate = new Date(start);
    const endDate = new Date(end);

    list = list.filter(t => {
      const d = new Date(t.tanggal);
      return d >= startDate && d <= endDate;
    });
  }

  // Sort descending by date
  list.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

  return NextResponse.json(list);
}

export async function POST(req) {
  const { transaksiData, detailItems, userId } = await req.json();
  
  const no_transaksi = 'TRX-' + Date.now();
  const seller = transaksiData.seller || 'Umum / Retail';
  const totalSetor = Number(transaksiData.total) || 0;
  const bayar = Number(transaksiData.bayar) || totalSetor;
  const kembalian = Math.max(0, bayar - totalSetor);
  const tanggal = new Date().toISOString();

  // 1. Eksekusi ke Supabase
  if (isSupabaseConfigured() && supabaseAdmin) {
    try {
      // Validasi userId apakah UUID valid, jika tidak atau tidak ada, set null
      const validUserId = (userId && typeof userId === 'string' && userId.length >= 32) ? userId : null;

      // Insert ke tabel transaksi
      const { data: newTrx, error: trxErr } = await supabaseAdmin
        .from('transaksi')
        .insert({
          no_transaksi,
          user_id: validUserId,
          seller,
          tanggal,
          total: totalSetor,
          bayar,
          kembalian,
          metode_bayar: transaksiData.metode_bayar || 'tunai',
          keterangan: (transaksiData.keterangan || '').trim(),
          status: 'selesai'
        })
        .select()
        .single();

      if (trxErr || !newTrx) {
        console.error('Supabase Insert Transaksi error:', trxErr);
        throw new Error(trxErr?.message || 'Gagal menyimpan transaksi');
      }

      // Siapkan baris detail_transaksi
      const detailsToInsert = detailItems.map(item => ({
        transaksi_id: newTrx.id,
        produk_id: (item.produk_id && typeof item.produk_id === 'string' && item.produk_id.length >= 32) ? item.produk_id : null,
        nama_produk: item.nama || item.nama_produk || 'Produk',
        qty: Number(item.qty) || 1,
        harga_satuan: Number(item.harga_satuan) || 0,
        subtotal: (Number(item.qty) || 1) * (Number(item.harga_satuan) || 0)
      }));

      const { data: insertedDetails, error: dtErr } = await supabaseAdmin
        .from('detail_transaksi')
        .insert(detailsToInsert)
        .select();

      if (dtErr) {
        console.error('Supabase Insert Detail Transaksi error:', dtErr);
      }

      // Potong stok produk di Supabase
      for (const item of detailItems) {
        if (item.produk_id && typeof item.produk_id === 'string' && item.produk_id.length >= 32) {
          const { data: prod } = await supabaseAdmin
            .from('produk')
            .select('stok')
            .eq('id', item.produk_id)
            .single();

          if (prod) {
            await supabaseAdmin
              .from('produk')
              .update({ stok: Math.max(0, (prod.stok || 0) - item.qty) })
              .eq('id', item.produk_id);
          }
        }
      }

      return NextResponse.json({
        ...newTrx,
        total_setor: totalSetor,
        total_modal: Math.round(totalSetor * 0.6),
        total_laba: Math.round(totalSetor * 0.4),
        items: insertedDetails || detailsToInsert
      });
    } catch (err) {
      console.error('Supabase POST Transaksi error:', err);
    }
  }

  // 2. Fallback In-Memory DB
  let totalModal = 0;
  const preparedDetails = detailItems.map((item, index) => {
    const prod = db.produk.find(p => p.id === item.produk_id);
    const hargaModal = prod ? (prod.harga_modal || Math.round(item.harga_satuan * 0.6)) : Math.round(item.harga_satuan * 0.6);
    const subtotalModal = item.qty * hargaModal;
    const subtotalSetor = item.qty * item.harga_satuan;
    totalModal += subtotalModal;

    return {
      id: `dt${Date.now()}_${index}`,
      transaksi_id: '',
      produk_id: item.produk_id,
      nama_produk: prod ? prod.nama : item.nama || 'Produk',
      qty: item.qty,
      harga_satuan: item.harga_satuan,
      harga_modal: hargaModal,
      subtotal: subtotalSetor,
      subtotal_modal: subtotalModal,
      laba: subtotalSetor - subtotalModal
    };
  });

  const totalLaba = totalSetor - totalModal;

  const transaksi = {
    id: `t${Date.now()}`,
    user_id: userId,
    no_transaksi,
    seller,
    tanggal,
    total: totalSetor,
    total_setor: totalSetor,
    total_modal: totalModal,
    total_laba: totalLaba,
    bayar,
    kembalian,
    metode_bayar: transaksiData.metode_bayar,
    keterangan: (transaksiData.keterangan || '').trim(),
    status: 'selesai'
  };

  db.transaksi.push(transaksi);

  preparedDetails.forEach(dt => {
    dt.transaksi_id = transaksi.id;
    db.detailTransaksi.push(dt);

    const prod = db.produk.find(p => p.id === dt.produk_id);
    if (prod) {
      prod.stok = Math.max(0, (prod.stok ?? 100) - dt.qty);
    }
  });

  return NextResponse.json({ ...transaksi, items: preparedDetails });
}
