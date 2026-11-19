import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseAvailable } from '../../../lib/supabase';
import { db } from '../../../lib/db';
import { getRequestUser } from '../../../lib/session';
import { isDiskonBerlaku } from '../../../lib/diskon';

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
          kasir,
          booth,
          seller,
          tanggal,
          subtotal,
          diskon,
          diskon_tipe,
          diskon_nilai,
          diskon_id,
          diskon_nama,
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
          const subtotal = t.subtotal !== undefined && t.subtotal !== null ? Number(t.subtotal) : totalSetor;
          const diskon = Number(t.diskon) || 0;
          return {
            ...t,
            subtotal,
            diskon,
            diskon_tipe: t.diskon_tipe || 'nominal',
            diskon_nilai: Number(t.diskon_nilai) || 0,
            diskon_id: t.diskon_id || null,
            diskon_nama: t.diskon_nama || null,
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
      throw error || new Error('Data transaksi kosong');
    } catch (err) {
      return errorDatabase(err, 'Gagal memuat transaksi dari database.');
    }
  }

  // Database lokal in-memory (mode pengembangan)
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
    const subtotal = t.subtotal !== undefined ? Number(t.subtotal) : Number(t.total || 0);

    return {
      ...t,
      subtotal,
      diskon: Number(t.diskon) || 0,
      diskon_tipe: t.diskon_tipe || 'nominal',
      diskon_nilai: Number(t.diskon_nilai) || 0,
      diskon_id: t.diskon_id || null,
      diskon_nama: t.diskon_nama || null,
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

// ============================================================================
// Helper bersama POST / PUT / DELETE
// ============================================================================
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (v) => typeof v === 'string' && UUID_RE.test(v);

// Hitung rincian & total transaksi di SERVER (nilai dari browser tidak dipercaya).
// Harga satuan diambil dari tabel produk; hanya admin yang boleh memakai harga khusus.
function hitungTransaksi(rawItems, produkMap, { isAdmin, diskonTipe, diskonNilai }) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return { error: 'Transaksi harus berisi minimal 1 produk.' };
  }
  let subtotal = 0;
  let totalModal = 0;
  const details = [];
  for (const item of rawItems) {
    const nama = item.nama || item.nama_produk || 'Produk';
    const qty = Math.floor(Number(item.qty));
    if (!Number.isFinite(qty) || qty < 1) return { error: `Jumlah "${nama}" tidak valid.` };
    const prod = produkMap.get(item.produk_id);
    if (!prod && !isAdmin) return { error: `Produk "${nama}" tidak ditemukan.` };
    const harga = (isAdmin || !prod) ? Math.max(0, Number(item.harga_satuan) || 0) : Math.max(0, Number(prod.harga_jual) || 0);
    const hargaModal = Number(prod?.harga_modal) || Math.round(harga * 0.6);
    subtotal += qty * harga;
    totalModal += qty * hargaModal;
    details.push({
      id: item.id,
      produk_id: item.produk_id,
      nama_produk: item.nama || item.nama_produk || prod?.nama || 'Produk',
      qty,
      harga_satuan: harga,
      harga_modal: hargaModal,
      subtotal: qty * harga,
      subtotal_modal: qty * hargaModal,
      laba: qty * (harga - hargaModal)
    });
  }
  const tipe = diskonTipe === 'persen' ? 'persen' : 'nominal';
  const nilai = Math.max(0, Number(diskonNilai) || 0);
  if (tipe === 'persen' && nilai > 100) return { error: 'Diskon persentase maksimal 100%.' };
  const diskon = tipe === 'persen' ? Math.round((subtotal * nilai) / 100) : Math.min(subtotal, nilai);
  return { details, subtotal, totalModal, diskonTipe: tipe, diskonNilai: nilai, diskon, total: subtotal - diskon };
}

// Tolak penjualan bila stok tidak cukup (qty produk yang sama dijumlahkan, mis. beda kemasan).
// shortcut: cek lalu potong tidak atomik; dua kasir menjual stok terakhir bersamaan bisa lolos. Upgrade ke fungsi RPC Postgres bila sering terjadi.
function cekStok(details, produkMap) {
  const butuh = new Map();
  for (const d of details) {
    if (produkMap.has(d.produk_id)) butuh.set(d.produk_id, (butuh.get(d.produk_id) || 0) + d.qty);
  }
  for (const [id, qty] of butuh) {
    const prod = produkMap.get(id);
    const stok = prod.stok ?? 100;
    if (stok < qty) return `Stok "${prod.nama}" tidak cukup (tersisa ${stok}, diminta ${qty}).`;
  }
  return null;
}

// Ambil harga jual, harga modal & stok produk dari database aktif
async function getProdukMap(produkIds, useSupabase) {
  const map = new Map();
  const ids = [...new Set((produkIds || []).filter(Boolean))];
  if (ids.length === 0) return map;
  if (useSupabase) {
    const uuidIds = ids.filter(isUuid);
    if (uuidIds.length) {
      const { data } = await supabaseAdmin.from('produk').select('id, nama, harga_jual, harga_modal, stok').in('id', uuidIds);
      (data || []).forEach(p => map.set(p.id, p));
    }
  } else {
    ids.forEach(id => {
      const prod = db.produk.find(p => p.id === id);
      if (prod) map.set(id, prod);
    });
  }
  return map;
}

// Potong stok produk setelah transaksi selesai
async function potongStok(details, useSupabase) {
  for (const d of details) {
    if (!d.produk_id) continue;
    if (useSupabase) {
      if (!isUuid(d.produk_id)) continue;
      const { data: prod } = await supabaseAdmin.from('produk').select('stok').eq('id', d.produk_id).single();
      if (prod) {
        await supabaseAdmin.from('produk').update({ stok: Math.max(0, (prod.stok || 0) - d.qty) }).eq('id', d.produk_id);
      }
    } else {
      const prod = db.produk.find(p => p.id === d.produk_id);
      if (prod) prod.stok = Math.max(0, (prod.stok ?? 100) - d.qty);
    }
  }
}

// Pastikan diskon yang dipakai masih aktif & dalam masa berlaku (kasir bisa memegang daftar lama)
async function cekDiskon(diskonId, useSupabase) {
  if (!diskonId) return {};
  let diskon = null;
  if (useSupabase) {
    if (!isUuid(diskonId)) return { error: 'Diskon tidak ditemukan.' };
    const { data, error } = await supabaseAdmin.from('diskon').select('*').eq('id', diskonId).maybeSingle();
    if (error) throw error;
    diskon = data;
  } else {
    diskon = (db.diskon || []).find(d => d.id === diskonId);
  }
  if (!diskon) return { error: 'Diskon tidak ditemukan.' };
  if (!isDiskonBerlaku(diskon)) return { error: `Diskon "${diskon.nama}" sudah tidak berlaku. Hapus diskon dari pesanan lalu coba lagi.` };
  return { diskon };
}

function errorDatabase(err, pesan) {
  console.error(pesan, err);
  return NextResponse.json(
    { error: `${pesan} Data belum tersimpan, silakan coba lagi.` },
    { status: 503 }
  );
}

// ============================================================================
// POST: Simpan transaksi baru dari kasir
// ============================================================================
export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Format data tidak valid.' }, { status: 400 });
  }

  const { transaksiData = {}, detailItems = [], userId, kasirNama } = body || {};
  const sessionUser = getRequestUser(req);

  if (!Array.isArray(detailItems) || detailItems.length === 0) {
    return NextResponse.json({ error: 'Transaksi harus berisi minimal 1 produk.' }, { status: 400 });
  }

  const no_transaksi = 'TRX-' + Date.now();
  const seller = transaksiData.seller || 'Umum / Retail';
  const status = transaksiData.status || 'selesai';
  const metodeBayar = transaksiData.metode_bayar || 'tunai';
  if (!['tunai', 'qris', 'transfer'].includes(metodeBayar)) {
    return NextResponse.json({ error: 'Metode bayar tidak valid.' }, { status: 400 });
  }

  const tanggal = transaksiData.tanggal || new Date().toISOString();
  const kasir = transaksiData.kasir || kasirNama || sessionUser?.nama || 'Kasir Gerai';
  // Booth wajib agar laporan per gerai akurat (tidak ada default diam-diam)
  const booth = String(transaksiData.booth || '').trim();
  if (!booth) {
    return NextResponse.json({ error: 'Booth penjualan wajib dipilih sebelum menyimpan transaksi.' }, { status: 400 });
  }
  const keterangan = (transaksiData.keterangan || '').trim();
  const effectiveUserId = sessionUser?.id || userId || null;

  const useSupabase = Boolean(await isSupabaseAvailable() && supabaseAdmin);
  const diskonId = transaksiData.diskon_id || null;
  let hasil, diskonNama, produkMap;
  try {
    // Promo resmi: tipe & nilai diambil dari database. Tanpa promo: diskon manual kasir (dibatasi di hitungTransaksi).
    const { error: diskonError, diskon: promo } = await cekDiskon(diskonId, useSupabase);
    if (diskonError) return NextResponse.json({ error: diskonError }, { status: 400 });
    diskonNama = promo?.nama || (transaksiData.diskon_nama || '').trim() || null;

    produkMap = await getProdukMap(detailItems.map(i => i.produk_id), useSupabase);
    hasil = hitungTransaksi(detailItems, produkMap, {
      isAdmin: sessionUser?.role === 'admin',
      diskonTipe: promo ? promo.tipe : transaksiData.diskon_tipe,
      diskonNilai: promo ? promo.nilai : transaksiData.diskon_nilai
    });
    if (hasil.error) return NextResponse.json({ error: hasil.error }, { status: 400 });
    if (status === 'selesai') {
      const stokError = cekStok(hasil.details, produkMap);
      if (stokError) return NextResponse.json({ error: stokError }, { status: 400 });
    }
  } catch (err) {
    return errorDatabase(err, 'Gagal memeriksa produk & diskon.');
  }

  const { subtotal: rawSubtotal, diskon: diskonNominal, diskonTipe, diskonNilai, total: totalSetor, totalModal } = hasil;
  const bayar = status === 'pending' ? 0 : (metodeBayar === 'tunai' ? (Number(transaksiData.bayar) || totalSetor) : totalSetor);
  if (bayar < (status === 'pending' ? 0 : totalSetor)) {
    return NextResponse.json({ error: 'Uang yang dibayarkan kurang dari total tagihan.' }, { status: 400 });
  }
  const kembalian = Math.max(0, bayar - totalSetor);

  // 1. Supabase (mode produksi) — tidak ada fallback diam-diam ke memori
  if (useSupabase) {
    try {

      const { data: newTrx, error: trxErr } = await supabaseAdmin
        .from('transaksi')
        .insert({
          no_transaksi,
          user_id: isUuid(effectiveUserId) ? effectiveUserId : null,
          kasir,
          booth,
          seller,
          tanggal,
          subtotal: rawSubtotal,
          diskon: diskonNominal,
          diskon_tipe: diskonTipe,
          diskon_nilai: diskonNilai,
          diskon_id: isUuid(diskonId) ? diskonId : null,
          diskon_nama: diskonNama,
          total: totalSetor,
          bayar,
          kembalian,
          metode_bayar: metodeBayar,
          keterangan,
          status
        })
        .select()
        .single();

      if (trxErr || !newTrx) throw trxErr || new Error('Insert transaksi gagal');

      const detailsToInsert = hasil.details.map(d => ({
        transaksi_id: newTrx.id,
        produk_id: isUuid(d.produk_id) ? d.produk_id : null,
        nama_produk: d.nama_produk,
        qty: d.qty,
        harga_satuan: d.harga_satuan,
        harga_modal: d.harga_modal,
        subtotal: d.subtotal
      }));

      const { data: insertedDetails, error: dtErr } = await supabaseAdmin
        .from('detail_transaksi')
        .insert(detailsToInsert)
        .select();

      if (dtErr) {
        // Batalkan transaksi induk agar tidak ada transaksi tanpa rincian
        await supabaseAdmin.from('transaksi').delete().eq('id', newTrx.id);
        throw dtErr;
      }

      if (status === 'selesai') await potongStok(detailsToInsert, true);

      return NextResponse.json({
        ...newTrx,
        kasir,
        booth,
        total_setor: totalSetor,
        total_modal: totalModal,
        total_laba: totalSetor - totalModal,
        items: insertedDetails || detailsToInsert
      });
    } catch (err) {
      return errorDatabase(err, 'Gagal menyimpan transaksi ke database.');
    }
  }

  // 2. Database lokal in-memory (mode pengembangan)
  try {
    const preparedDetails = hasil.details.map((d, index) => ({
      ...d,
      id: `dt${Date.now()}_${index}`,
      transaksi_id: ''
    }));

    const transaksi = {
      id: `t${Date.now()}`,
      user_id: effectiveUserId,
      kasir,
      booth,
      no_transaksi,
      seller,
      tanggal,
      subtotal: rawSubtotal,
      diskon: diskonNominal,
      diskon_tipe: diskonTipe,
      diskon_nilai: diskonNilai,
      diskon_id: diskonId,
      diskon_nama: diskonNama,
      total: totalSetor,
      total_setor: totalSetor,
      total_modal: totalModal,
      total_laba: totalSetor - totalModal,
      bayar,
      kembalian,
      metode_bayar: metodeBayar,
      keterangan,
      status
    };

    db.transaksi.push(transaksi);
    preparedDetails.forEach(dt => {
      dt.transaksi_id = transaksi.id;
      db.detailTransaksi.push(dt);
    });
    if (status === 'selesai') await potongStok(preparedDetails, false);

    return NextResponse.json({ ...transaksi, items: preparedDetails });
  } catch (err) {
    return errorDatabase(err, 'Gagal menyimpan transaksi.');
  }
}

// ============================================================================
// Ambil transaksi (beserta rinciannya) dari database aktif
// ============================================================================
async function findTransaksi(key, useSupabase) {
  if (!key) return null;
  if (useSupabase) {
    let query = supabaseAdmin.from('transaksi').select('*, items:detail_transaksi(*)');
    query = isUuid(key) ? query.eq('id', key) : query.eq('no_transaksi', key);
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return data ? { tx: data, details: data.items || [] } : null;
  }
  const tx = db.transaksi.find(t => t.id === key || t.no_transaksi === key);
  if (!tx) return null;
  return { tx, details: db.detailTransaksi.filter(dt => dt.transaksi_id === tx.id) };
}

// ============================================================================
// PUT: Ubah tanggal / selesaikan pesanan pending / edit rincian transaksi
// ============================================================================
export async function PUT(req) {
  try {
    const body = await req.json();
    const { id, no_transaksi, tanggal, status, detailItems, items, transaksiData } = body;
    const targetId = id || transaksiData?.id || no_transaksi;
    const sessionUser = getRequestUser(req);

    if (!targetId) {
      return NextResponse.json({ error: 'ID transaksi diperlukan' }, { status: 400 });
    }

    const useSupabase = Boolean(await isSupabaseAvailable() && supabaseAdmin);
    const found = await findTransaksi(targetId, useSupabase)
      || (no_transaksi && no_transaksi !== targetId ? await findTransaksi(no_transaksi, useSupabase) : null);
    if (!found) {
      return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 });
    }

    const currentTx = found.tx;

    // Kasir hanya boleh mengubah pesanan yang masih pending
    if (sessionUser?.role !== 'admin' && currentTx.status !== 'pending') {
      return NextResponse.json({ error: 'Transaksi yang sudah selesai hanya dapat diubah oleh admin.' }, { status: 403 });
    }

    const rawItems = detailItems || items || transaksiData?.items || null;

    // Case A: Hanya Mengubah Tanggal Transaksi
    if (tanggal && (!rawItems || rawItems.length === 0)) {
      const newTanggal = new Date(tanggal).toISOString();
      if (useSupabase) {
        const { error } = await supabaseAdmin.from('transaksi').update({ tanggal: newTanggal }).eq('id', currentTx.id);
        if (error) throw error;
      } else {
        currentTx.tanggal = newTanggal;
      }
      return NextResponse.json({ ...currentTx, tanggal: newTanggal, items: found.details });
    }

    // Case B: Selesaikan Transaksi Pending / Edit Qty & Harga Satuan
    const newStatus = status || transaksiData?.status || currentTx.status || 'selesai';
    const wasPending = currentTx.status === 'pending';
    const isNowSelesai = newStatus === 'selesai';

    const isAdmin = sessionUser?.role === 'admin';
    const diskonId = body.diskon_id !== undefined ? body.diskon_id : (transaksiData?.diskon_id !== undefined ? transaksiData.diskon_id : (currentTx.diskon_id || null));
    let diskonTipe = body.diskon_tipe || transaksiData?.diskon_tipe || currentTx.diskon_tipe || 'nominal';
    let diskonNilai = Number(body.diskon_nilai ?? transaksiData?.diskon_nilai ?? currentTx.diskon_nilai ?? 0);
    let diskonNama = body.diskon_nama !== undefined ? body.diskon_nama : (transaksiData?.diskon_nama !== undefined ? transaksiData.diskon_nama : (currentTx.diskon_nama || null));
    if (diskonId && diskonId !== currentTx.diskon_id) {
      // Promo yang baru dipilih wajib masih berlaku; tipe & nilainya diambil dari database
      const { error: diskonError, diskon: promo } = await cekDiskon(diskonId, useSupabase);
      if (diskonError) return NextResponse.json({ error: diskonError }, { status: 400 });
      ({ tipe: diskonTipe, nilai: diskonNilai, nama: diskonNama } = promo);
    } else if (diskonId) {
      // Promo yang sudah tercatat tetap dihormati dengan nilai saat pesanan dibuat
      diskonTipe = currentTx.diskon_tipe || diskonTipe;
      diskonNilai = Number(currentTx.diskon_nilai ?? diskonNilai);
    }

    const produkMap = await getProdukMap((rawItems || []).map(i => i.produk_id), useSupabase);
    const hasil = hitungTransaksi(rawItems, produkMap, { isAdmin, diskonTipe, diskonNilai });
    if (hasil.error) return NextResponse.json({ error: hasil.error }, { status: 400 });
    if (wasPending && isNowSelesai) {
      const stokError = cekStok(hasil.details, produkMap);
      if (stokError) return NextResponse.json({ error: stokError }, { status: 400 });
    }

    const { subtotal: rawSubtotal, totalModal, diskon: diskonNominal, total: totalSetor } = hasil;
    ({ diskonTipe, diskonNilai } = hasil);
    const updatedDetails = hasil.details.map((d, idx) => ({
      ...d,
      id: d.id || `dt_upd_${Date.now()}_${idx}`,
      transaksi_id: currentTx.id
    }));

    const metodeBayar = body.metode_bayar || transaksiData?.metode_bayar || currentTx.metode_bayar || 'tunai';
    if (!['tunai', 'qris', 'transfer'].includes(metodeBayar)) {
      return NextResponse.json({ error: 'Metode bayar tidak valid.' }, { status: 400 });
    }
    const finalBayar = newStatus === 'pending' ? 0
      : (metodeBayar === 'tunai' ? (Number(body.bayar ?? transaksiData?.bayar) || totalSetor) : totalSetor);
    if (newStatus !== 'pending' && finalBayar < totalSetor) {
      return NextResponse.json({ error: 'Uang yang dibayarkan kurang dari total tagihan.' }, { status: 400 });
    }

    const updates = {
      subtotal: rawSubtotal,
      diskon: diskonNominal,
      diskon_tipe: diskonTipe,
      diskon_nilai: diskonNilai,
      diskon_id: diskonId,
      diskon_nama: diskonNama,
      total: totalSetor,
      bayar: finalBayar,
      kembalian: Math.max(0, finalBayar - totalSetor),
      metode_bayar: metodeBayar,
      keterangan: ((body.keterangan !== undefined ? body.keterangan : (transaksiData?.keterangan ?? currentTx.keterangan ?? '')) || '').trim(),
      tanggal: tanggal ? new Date(tanggal).toISOString() : (transaksiData?.tanggal ? new Date(transaksiData.tanggal).toISOString() : currentTx.tanggal),
      seller: body.seller || transaksiData?.seller || currentTx.seller,
      kasir: body.kasir || transaksiData?.kasir || currentTx.kasir,
      status: newStatus
    };

    if (useSupabase) {
      const { error: upErr } = await supabaseAdmin
        .from('transaksi')
        .update({ ...updates, diskon_id: isUuid(updates.diskon_id) ? updates.diskon_id : null })
        .eq('id', currentTx.id);
      if (upErr) throw upErr;

      const { error: delErr } = await supabaseAdmin.from('detail_transaksi').delete().eq('transaksi_id', currentTx.id);
      if (delErr) throw delErr;

      const supaDetails = updatedDetails.map(d => ({
        transaksi_id: currentTx.id,
        produk_id: isUuid(d.produk_id) ? d.produk_id : null,
        nama_produk: d.nama_produk,
        qty: d.qty,
        harga_satuan: d.harga_satuan,
        harga_modal: d.harga_modal,
        subtotal: d.subtotal
      }));
      if (supaDetails.length) {
        const { error: insErr } = await supabaseAdmin.from('detail_transaksi').insert(supaDetails);
        if (insErr) throw insErr;
      }
    } else {
      Object.assign(currentTx, updates, {
        total_setor: totalSetor,
        total_modal: totalModal,
        total_laba: totalSetor - totalModal
      });
      db.detailTransaksi = db.detailTransaksi.filter(dt => dt.transaksi_id !== currentTx.id);
      updatedDetails.forEach(dt => db.detailTransaksi.push(dt));
    }

    // Jika sebelumnya pending dan sekarang selesai, potong stok sekarang
    if (wasPending && isNowSelesai) await potongStok(updatedDetails, useSupabase);

    return NextResponse.json({
      ...currentTx,
      ...updates,
      total_setor: totalSetor,
      total_modal: totalModal,
      total_laba: totalSetor - totalModal,
      items: updatedDetails
    });
  } catch (err) {
    return errorDatabase(err, 'Gagal memperbarui transaksi.');
  }
}

// ============================================================================
// DELETE: Batalkan / hapus transaksi
// ============================================================================
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const sessionUser = getRequestUser(req);

    if (!id) {
      return NextResponse.json({ error: 'ID transaksi diperlukan' }, { status: 400 });
    }

    const useSupabase = Boolean(await isSupabaseAvailable() && supabaseAdmin);
    const found = await findTransaksi(id, useSupabase);
    if (!found) {
      return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 });
    }

    // Kasir hanya boleh membatalkan pesanan pending; transaksi selesai khusus admin
    if (sessionUser?.role !== 'admin' && found.tx.status !== 'pending') {
      return NextResponse.json({ error: 'Transaksi yang sudah selesai hanya dapat dihapus oleh admin.' }, { status: 403 });
    }

    if (useSupabase) {
      const { error: dtErr } = await supabaseAdmin.from('detail_transaksi').delete().eq('transaksi_id', found.tx.id);
      if (dtErr) throw dtErr;
      const { error } = await supabaseAdmin.from('transaksi').delete().eq('id', found.tx.id);
      if (error) throw error;
    } else {
      db.detailTransaksi = db.detailTransaksi.filter(dt => dt.transaksi_id !== found.tx.id);
      db.transaksi = db.transaksi.filter(t => t.id !== found.tx.id);
    }

    return NextResponse.json({ success: true, message: 'Transaksi berhasil dibatalkan / dihapus' });
  } catch (err) {
    return errorDatabase(err, 'Gagal menghapus transaksi.');
  }
}
