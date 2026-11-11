import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured, isSupabaseAvailable } from '../../../lib/supabase';
import { db } from '../../../lib/db';

export async function GET(req) {
  const searchParams = new URL(req.url).searchParams;
  const seller = searchParams.get('seller');
  const search = searchParams.get('search');
  const start = searchParams.get('start');
  const end = searchParams.get('end');
  const produkId = searchParams.get('produk_id');
  const kategoriId = searchParams.get('kategori_id');
  const metodeBayar = searchParams.get('metode_bayar') || searchParams.get('metode');
  const statusParam = searchParams.get('status');
  const limitParam = searchParams.get('limit');
  const limit = limitParam ? parseInt(limitParam) : (start && end ? null : 200);

  if (await isSupabaseAvailable() && supabaseAdmin) {
    try {
      let query = supabaseAdmin
        .from('transaksi')
        .select(`
          id,
          no_transaksi,
          user_id,
          seller,
          tanggal,
          total,
          bayar,
          kembalian,
          metode_bayar,
          keterangan,
          status,
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

      if (statusParam && statusParam !== 'ALL') {
        query = query.eq('status', statusParam);
      }

      if (start && end) {
        query = query.gte('tanggal', start).lte('tanggal', end);
      }

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (!error && data) {
        let list = data.map(t => {
          const totalSetor = Number(t.total) || 0;
          return {
            ...t,
            kasir: t.kasir || (t.user_id ? 'Kasir' : 'Kasir Gerai'),
            total_setor: totalSetor,
            total_modal: Math.round(totalSetor * 0.6),
            total_laba: Math.round(totalSetor * 0.4),
          };
        });

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

    const userStaff = db.users?.find(u => u.id === t.user_id);
    const kasir = t.kasir || (userStaff ? userStaff.nama : 'Kasir Gerai');
    const booth = t.booth || 'Gerai Utama';

    return {
      ...t,
      kasir,
      booth,
      items: details
    };
  });

  if (seller && seller !== 'ALL') {
    list = list.filter(t => t.seller?.toLowerCase() === seller.toLowerCase());
  }

  if (metodeBayar && metodeBayar !== 'ALL') {
    list = list.filter(t => t.metode_bayar?.toLowerCase() === metodeBayar.toLowerCase());
  }

  if (statusParam && statusParam !== 'ALL') {
    list = list.filter(t => (t.status || 'selesai').toLowerCase() === statusParam.toLowerCase());
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
  if (limit) {
    list = list.slice(0, limit);
  }

  return NextResponse.json(list);
}

export async function POST(req) {
  const { transaksiData, detailItems, userId, kasirNama } = await req.json();
  
  const no_transaksi = 'TRX-' + Date.now();
  const seller = transaksiData.seller || 'Umum / Retail';
  const totalSetor = Number(transaksiData.total) || 0;
  const status = transaksiData.status || 'selesai';
  const bayar = Number(transaksiData.bayar) || (status === 'pending' ? 0 : totalSetor);
  const kembalian = Math.max(0, bayar - totalSetor);
  const tanggal = transaksiData.tanggal || new Date().toISOString();
  const userStaff = db.users?.find(u => u.id === userId || u.username === userId);
  const kasir = transaksiData.kasir || kasirNama || (userStaff ? userStaff.nama : 'Kasir Gerai');
  const booth = transaksiData.booth || 'Gerai Utama';

  // 1. Eksekusi ke Supabase
  if (await isSupabaseAvailable() && supabaseAdmin) {
    try {
      const validUserId = (userId && typeof userId === 'string' && userId.length >= 32) ? userId : null;

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
          status
        })
        .select()
        .single();

      if (trxErr || !newTrx) {
        console.error('Supabase Insert Transaksi error:', trxErr);
        throw new Error(trxErr?.message || 'Gagal menyimpan transaksi');
      }

      const detailsToInsert = (detailItems || []).map(item => ({
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

      // Hanya potong stok jika transaksi langsung 'selesai' (bukan pending)
      if (status === 'selesai') {
        for (const item of (detailItems || [])) {
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
      }

      return NextResponse.json({
        ...newTrx,
        kasir,
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
  const preparedDetails = (detailItems || []).map((item, index) => {
    const prod = db.produk.find(p => p.id === item.produk_id);
    const hargaModal = prod ? (prod.harga_modal || Math.round(item.harga_satuan * 0.6)) : Math.round(item.harga_satuan * 0.6);
    const subtotalModal = item.qty * hargaModal;
    const subtotalSetor = item.qty * item.harga_satuan;
    totalModal += subtotalModal;

    return {
      id: `dt${Date.now()}_${index}`,
      transaksi_id: '',
      produk_id: item.produk_id,
      nama_produk: prod ? prod.nama : item.nama || item.nama_produk || 'Produk',
      qty: Number(item.qty) || 1,
      harga_satuan: Number(item.harga_satuan) || 0,
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
    kasir,
    booth,
    no_transaksi,
    seller,
    tanggal,
    total: totalSetor,
    total_setor: totalSetor,
    total_modal: totalModal,
    total_laba: totalLaba,
    bayar,
    kembalian,
    metode_bayar: transaksiData.metode_bayar || 'tunai',
    keterangan: (transaksiData.keterangan || '').trim(),
    status
  };

  db.transaksi.push(transaksi);

  preparedDetails.forEach(dt => {
    dt.transaksi_id = transaksi.id;
    db.detailTransaksi.push(dt);

    // Hanya potong stok jika status langsung 'selesai'
    if (status === 'selesai') {
      const prod = db.produk.find(p => p.id === dt.produk_id);
      if (prod) {
        prod.stok = Math.max(0, (prod.stok ?? 100) - dt.qty);
      }
    }
  });

  return NextResponse.json({ ...transaksi, items: preparedDetails });
}

export async function PUT(req) {
  try {
    const body = await req.json();
    const { id, no_transaksi, tanggal, status, detailItems, items, transaksiData } = body;
    const targetId = id || transaksiData?.id;

    if (!targetId && !no_transaksi) {
      return NextResponse.json({ error: 'ID transaksi diperlukan' }, { status: 400 });
    }

    // 1. In-Memory DB Update
    const txIndex = db.transaksi.findIndex(t => t.id === targetId || t.no_transaksi === targetId || t.no_transaksi === no_transaksi);
    if (txIndex === -1) {
      return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 });
    }

    const currentTx = db.transaksi[txIndex];
    const rawItems = detailItems || items || transaksiData?.items || null;

    // Case A: Hanya Mengubah Tanggal Transaksi
    if (tanggal && (!rawItems || rawItems.length === 0)) {
      const newTanggal = new Date(tanggal).toISOString();
      currentTx.tanggal = newTanggal;

      if (await isSupabaseAvailable() && supabaseAdmin) {
        try {
          await supabaseAdmin.from('transaksi').update({ tanggal: newTanggal }).eq('id', currentTx.id);
        } catch (e) {
          console.error('Supabase update tanggal error:', e);
        }
      }

      const existingDetails = db.detailTransaksi.filter(dt => dt.transaksi_id === currentTx.id);
      return NextResponse.json({ ...currentTx, items: existingDetails });
    }

    // Case B: Selesaikan Transaksi Pending / Edit Qty & Harga Satuan
    const newStatus = status || transaksiData?.status || currentTx.status || 'selesai';
    const wasPending = currentTx.status === 'pending';
    const isNowSelesai = newStatus === 'selesai';

    let totalSetor = 0;
    let totalModal = 0;

    const updatedDetails = (rawItems || []).map((item, idx) => {
      const qty = Math.max(1, Number(item.qty) || 1);
      const hargaSatuan = Math.max(0, Number(item.harga_satuan) || 0);
      const prod = db.produk.find(p => p.id === item.produk_id);
      const hargaModal = prod ? (prod.harga_modal || Math.round(hargaSatuan * 0.6)) : Math.round(hargaSatuan * 0.6);
      const subtotal = qty * hargaSatuan;
      const subtotalModal = qty * hargaModal;

      totalSetor += subtotal;
      totalModal += subtotalModal;

      return {
        id: item.id || `dt_upd_${Date.now()}_${idx}`,
        transaksi_id: currentTx.id,
        produk_id: item.produk_id,
        nama_produk: prod ? prod.nama : item.nama || item.nama_produk || 'Produk',
        qty,
        harga_satuan: hargaSatuan,
        harga_modal: hargaModal,
        subtotal,
        subtotal_modal: subtotalModal,
        laba: subtotal - subtotalModal
      };
    });

    const totalLaba = totalSetor - totalModal;
    const finalBayar = Number(body.bayar ?? transaksiData?.bayar ?? totalSetor);
    const finalKembalian = Math.max(0, finalBayar - totalSetor);
    const finalMetode = body.metode_bayar || transaksiData?.metode_bayar || currentTx.metode_bayar || 'tunai';
    const finalKeterangan = body.keterangan !== undefined ? body.keterangan : (transaksiData?.keterangan ?? currentTx.keterangan ?? '');
    const finalTanggal = tanggal ? new Date(tanggal).toISOString() : (transaksiData?.tanggal ? new Date(transaksiData.tanggal).toISOString() : currentTx.tanggal);
    const finalSeller = body.seller || transaksiData?.seller || currentTx.seller;
    const finalKasir = body.kasir || transaksiData?.kasir || currentTx.kasir;

    // Perbarui transaksi induk di memori
    currentTx.total = totalSetor;
    currentTx.total_setor = totalSetor;
    currentTx.total_modal = totalModal;
    currentTx.total_laba = totalLaba;
    currentTx.bayar = finalBayar;
    currentTx.kembalian = finalKembalian;
    currentTx.metode_bayar = finalMetode;
    currentTx.keterangan = (finalKeterangan || '').trim();
    currentTx.tanggal = finalTanggal;
    currentTx.seller = finalSeller;
    currentTx.kasir = finalKasir;
    currentTx.status = newStatus;

    // Ganti detail transaksi
    db.detailTransaksi = db.detailTransaksi.filter(dt => dt.transaksi_id !== currentTx.id);
    updatedDetails.forEach(dt => db.detailTransaksi.push(dt));

    // Jika sebelumnya pending dan sekarang selesai, potong stok sekarang!
    if (wasPending && isNowSelesai) {
      updatedDetails.forEach(dt => {
        const prod = db.produk.find(p => p.id === dt.produk_id);
        if (prod) {
          prod.stok = Math.max(0, (prod.stok ?? 100) - dt.qty);
        }
      });
    }

    // Update ke Supabase bila aktif
    if (await isSupabaseAvailable() && supabaseAdmin) {
      try {
        await supabaseAdmin
          .from('transaksi')
          .update({
            total: totalSetor,
            bayar: finalBayar,
            kembalian: finalKembalian,
            metode_bayar: finalMetode,
            keterangan: finalKeterangan,
            tanggal: finalTanggal,
            seller: finalSeller,
            status: newStatus
          })
          .eq('id', currentTx.id);

        await supabaseAdmin
          .from('detail_transaksi')
          .delete()
          .eq('transaksi_id', currentTx.id);

        const supaDetails = updatedDetails.map(d => ({
          transaksi_id: currentTx.id,
          produk_id: (d.produk_id && typeof d.produk_id === 'string' && d.produk_id.length >= 32) ? d.produk_id : null,
          nama_produk: d.nama_produk,
          qty: d.qty,
          harga_satuan: d.harga_satuan,
          subtotal: d.subtotal
        }));
        await supabaseAdmin.from('detail_transaksi').insert(supaDetails);

        if (wasPending && isNowSelesai) {
          for (const d of updatedDetails) {
            if (d.produk_id && typeof d.produk_id === 'string' && d.produk_id.length >= 32) {
              const { data: prod } = await supabaseAdmin.from('produk').select('stok').eq('id', d.produk_id).single();
              if (prod) {
                await supabaseAdmin.from('produk').update({ stok: Math.max(0, (prod.stok || 0) - d.qty) }).eq('id', d.produk_id);
              }
            }
          }
        }
      } catch (err) {
        console.error('Supabase PUT Transaksi error:', err);
      }
    }

    return NextResponse.json({ ...currentTx, items: updatedDetails });
  } catch (err) {
    console.error('Error PUT Transaksi:', err);
    return NextResponse.json({ error: 'Gagal memperbarui transaksi' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID transaksi diperlukan' }, { status: 400 });
    }

    const txIndex = db.transaksi.findIndex(t => t.id === id || t.no_transaksi === id);
    if (txIndex === -1) {
      return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 });
    }

    const tx = db.transaksi[txIndex];
    // Hapus detail transaksi
    db.detailTransaksi = db.detailTransaksi.filter(dt => dt.transaksi_id !== tx.id);
    // Hapus transaksi
    db.transaksi.splice(txIndex, 1);

    if (await isSupabaseAvailable() && supabaseAdmin) {
      try {
        await supabaseAdmin.from('detail_transaksi').delete().eq('transaksi_id', tx.id);
        await supabaseAdmin.from('transaksi').delete().eq('id', tx.id);
      } catch (e) {
        console.error('Supabase DELETE Transaksi error:', e);
      }
    }

    return NextResponse.json({ success: true, message: 'Transaksi berhasil dibatalkan / dihapus' });
  } catch (err) {
    console.error('Error DELETE Transaksi:', err);
    return NextResponse.json({ error: 'Gagal menghapus transaksi' }, { status: 500 });
  }
}
