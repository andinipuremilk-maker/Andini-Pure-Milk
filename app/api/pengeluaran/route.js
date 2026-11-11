import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured, isSupabaseAvailable } from '../../../lib/supabase';
import { db } from '../../../lib/db';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search');
  const start = searchParams.get('start');
  const end = searchParams.get('end');
  const metodeBayar = searchParams.get('metode_bayar');
  const kategori = searchParams.get('kategori');
  const limitParam = searchParams.get('limit');
  const limit = limitParam ? parseInt(limitParam) : (start && end ? null : 200);

  if (await isSupabaseAvailable() && supabaseAdmin) {
    try {
      let query = supabaseAdmin
        .from('pengeluaran')
        .select('id, no_transaksi, tanggal, kategori, deskripsi, nominal, metode_bayar, pj')
        .order('tanggal', { ascending: false });

      if (kategori && kategori !== 'ALL') {
        query = query.eq('kategori', kategori);
      }

      if (metodeBayar && metodeBayar !== 'ALL') {
        query = query.eq('metode_bayar', metodeBayar);
      }

      if (start && end) {
        query = query.gte('tanggal', start).lte('tanggal', end);
      }

      if (search && search.trim()) {
        const q = search.trim();
        query = query.or(`no_transaksi.ilike.%${q}%,kategori.ilike.%${q}%,deskripsi.ilike.%${q}%,pj.ilike.%${q}%`);
      }

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      if (!error && data) {
        return NextResponse.json(data);
      }
    } catch (err) {
      console.error('Supabase GET pengeluaran error:', err);
    }
  }

  // Fallback in-memory
  if (!db.pengeluaran) db.pengeluaran = [];
  let list = [...db.pengeluaran];

  if (kategori && kategori !== 'ALL') {
    list = list.filter(e => e.kategori?.toLowerCase() === kategori.toLowerCase());
  }

  if (metodeBayar && metodeBayar !== 'ALL') {
    list = list.filter(e => e.metode_bayar?.toLowerCase() === metodeBayar.toLowerCase());
  }

  if (search) {
    const q = search.toLowerCase();
    list = list.filter(e => 
      e.no_transaksi?.toLowerCase().includes(q) || 
      e.kategori?.toLowerCase().includes(q) ||
      e.deskripsi?.toLowerCase().includes(q) ||
      (e.pj && e.pj.toLowerCase().includes(q))
    );
  }

  if (start && end) {
    const startDate = new Date(start);
    const endDate = new Date(end);

    list = list.filter(e => {
      const d = new Date(e.tanggal);
      return d >= startDate && d <= endDate;
    });
  }

  list.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
  if (limit) {
    list = list.slice(0, limit);
  }
  return NextResponse.json(list);
}

export async function POST(req) {
  const data = await req.json();

  if (await isSupabaseAvailable() && supabaseAdmin) {
    try {
      const payload = {
        no_transaksi: 'EXP-' + Date.now().toString().slice(-6),
        tanggal: data.tanggal ? new Date(data.tanggal).toISOString() : new Date().toISOString(),
        kategori: data.kategori || 'Operasional',
        deskripsi: data.deskripsi || '',
        nominal: Number(data.nominal) || 0,
        metode_bayar: data.metode_bayar || 'tunai',
        pj: data.pj || 'Admin'
      };

      const { data: newExp, error } = await supabaseAdmin
        .from('pengeluaran')
        .insert(payload)
        .select()
        .single();

      if (!error && newExp) {
        return NextResponse.json(newExp);
      }
      return NextResponse.json({ error: error?.message || 'Gagal menyimpan pengeluaran' }, { status: 400 });
    } catch (err) {
      console.error('Supabase POST pengeluaran error:', err);
    }
  }

  // Fallback
  if (!db.pengeluaran) db.pengeluaran = [];
  const newExpense = {
    id: `exp_${Date.now()}`,
    no_transaksi: 'EXP-' + Date.now().toString().slice(-6),
    tanggal: data.tanggal ? new Date(data.tanggal).toISOString() : new Date().toISOString(),
    kategori: data.kategori || 'Operasional',
    deskripsi: data.deskripsi || '',
    nominal: Number(data.nominal) || 0,
    metode_bayar: data.metode_bayar || 'tunai',
    pj: data.pj || 'Admin'
  };

  db.pengeluaran.unshift(newExpense);
  return NextResponse.json(newExpense);
}

export async function DELETE(req) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (await isSupabaseAvailable() && supabaseAdmin) {
    try {
      const { error } = await supabaseAdmin
        .from('pengeluaran')
        .delete()
        .eq('id', id);

      if (!error) {
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    } catch (err) {
      console.error('Supabase DELETE pengeluaran error:', err);
    }
  }

  // Fallback
  if (!db.pengeluaran) db.pengeluaran = [];
  const idx = db.pengeluaran.findIndex(e => e.id === id);
  if (idx !== -1) {
    db.pengeluaran.splice(idx, 1);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Pengeluaran not found' }, { status: 404 });
}
