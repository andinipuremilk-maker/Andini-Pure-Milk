import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseAvailable } from '../../../lib/supabase';
import { db } from '../../../lib/db';

export async function GET(req) {
  const searchParams = new URL(req.url).searchParams;
  const activeOnly = searchParams.get('active_only') === 'true';

  if (await isSupabaseAvailable() && supabaseAdmin) {
    try {
      let query = supabaseAdmin
        .from('diskon')
        .select('*')
        .order('created_at', { ascending: false });

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;
      if (!error && data) {
        return NextResponse.json({ diskon: data });
      }
    } catch (err) {
      console.error('Supabase GET diskon error:', err);
    }
  }

  // Fallback In-Memory DB
  let list = db.diskon || [];
  if (activeOnly) {
    list = list.filter(d => d.is_active !== false);
  }

  return NextResponse.json({ diskon: list });
}

export async function POST(req) {
  try {
    const body = await req.json();
    const nama = body?.nama?.trim();
    const tipe = body?.tipe === 'persen' ? 'persen' : 'nominal';
    const nilai = Math.max(0, Number(body?.nilai) || 0);
    const keterangan = (body?.keterangan || '').trim();
    const is_active = body?.is_active !== undefined ? Boolean(body.is_active) : true;

    if (!nama) {
      return NextResponse.json({ error: 'Nama diskon / promo tidak boleh kosong.' }, { status: 400 });
    }
    if (nilai <= 0) {
      return NextResponse.json({ error: 'Nilai diskon harus lebih dari 0.' }, { status: 400 });
    }
    if (tipe === 'persen' && nilai > 100) {
      return NextResponse.json({ error: 'Diskon persentase tidak boleh lebih dari 100%.' }, { status: 400 });
    }

    // 1. Supabase
    if (await isSupabaseAvailable() && supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('diskon')
          .insert({ nama, tipe, nilai, keterangan, is_active })
          .select()
          .single();

        if (!error && data) {
          // Sync with local memory
          if (db.diskon) {
            db.diskon.unshift(data);
          }
          return NextResponse.json({ diskon: data });
        }
      } catch (err) {
        console.error('Supabase POST diskon error:', err);
      }
    }

    // 2. Fallback In-Memory
    if (!db.diskon) db.diskon = [];
    const newDiskon = {
      id: `d_${Date.now()}`,
      nama,
      tipe,
      nilai,
      keterangan,
      is_active,
      created_at: new Date().toISOString()
    };
    db.diskon.unshift(newDiskon);

    return NextResponse.json({ diskon: newDiskon });
  } catch (err) {
    return NextResponse.json({ error: 'Gagal memproses data diskon.' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    const id = body?.id;

    if (!id) {
      return NextResponse.json({ error: 'ID diskon diperlukan.' }, { status: 400 });
    }

    const nama = body?.nama?.trim();
    const tipe = body?.tipe === 'persen' ? 'persen' : (body?.tipe === 'nominal' ? 'nominal' : undefined);
    const nilai = body?.nilai !== undefined ? Math.max(0, Number(body.nilai) || 0) : undefined;
    const keterangan = body?.keterangan !== undefined ? body.keterangan.trim() : undefined;
    const is_active = body?.is_active !== undefined ? Boolean(body.is_active) : undefined;

    // 1. Supabase
    if (await isSupabaseAvailable() && supabaseAdmin) {
      try {
        const updateData = {};
        if (nama !== undefined) updateData.nama = nama;
        if (tipe !== undefined) updateData.tipe = tipe;
        if (nilai !== undefined) updateData.nilai = nilai;
        if (keterangan !== undefined) updateData.keterangan = keterangan;
        if (is_active !== undefined) updateData.is_active = is_active;

        const { data, error } = await supabaseAdmin
          .from('diskon')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        if (!error && data) {
          if (db.diskon) {
            const idx = db.diskon.findIndex(d => d.id === id);
            if (idx >= 0) db.diskon[idx] = { ...db.diskon[idx], ...data };
          }
          return NextResponse.json({ diskon: data });
        }
      } catch (err) {
        console.error('Supabase PUT diskon error:', err);
      }
    }

    // 2. Fallback In-Memory
    if (!db.diskon) db.diskon = [];
    const idx = db.diskon.findIndex(d => d.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: 'Diskon tidak ditemukan.' }, { status: 404 });
    }

    if (nama !== undefined) db.diskon[idx].nama = nama;
    if (tipe !== undefined) db.diskon[idx].tipe = tipe;
    if (nilai !== undefined) db.diskon[idx].nilai = nilai;
    if (keterangan !== undefined) db.diskon[idx].keterangan = keterangan;
    if (is_active !== undefined) db.diskon[idx].is_active = is_active;

    return NextResponse.json({ diskon: db.diskon[idx] });
  } catch (err) {
    return NextResponse.json({ error: 'Gagal memperbarui diskon.' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const searchParams = new URL(req.url).searchParams;
    let id = searchParams.get('id');

    if (!id) {
      try {
        const body = await req.json();
        id = body?.id;
      } catch (e) {}
    }

    if (!id) {
      return NextResponse.json({ error: 'ID diskon diperlukan untuk menghapus.' }, { status: 400 });
    }

    // 1. Supabase
    if (await isSupabaseAvailable() && supabaseAdmin) {
      try {
        const { error } = await supabaseAdmin
          .from('diskon')
          .delete()
          .eq('id', id);

        if (!error) {
          if (db.diskon) {
            db.diskon = db.diskon.filter(d => d.id !== id);
          }
          return NextResponse.json({ success: true, message: 'Diskon berhasil dihapus.' });
        }
      } catch (err) {
        console.error('Supabase DELETE diskon error:', err);
      }
    }

    // 2. Fallback In-Memory
    if (!db.diskon) db.diskon = [];
    db.diskon = db.diskon.filter(d => d.id !== id);

    return NextResponse.json({ success: true, message: 'Diskon berhasil dihapus.' });
  } catch (err) {
    return NextResponse.json({ error: 'Gagal menghapus diskon.' }, { status: 500 });
  }
}
