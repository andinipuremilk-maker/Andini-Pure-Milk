import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured, isSupabaseAvailable } from '../../../lib/supabase';
import { db } from '../../../lib/db';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const activeOnly = searchParams.get('active_only') === 'true';

  if (await isSupabaseAvailable() && supabaseAdmin) {
    try {
      let query = supabaseAdmin
        .from('booths')
        .select('*')
        .order('created_at', { ascending: true });

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;
      if (!error && data) {
        return NextResponse.json(data);
      }
    } catch (err) {
      console.error('Supabase GET booths error:', err);
    }
  }

  // Fallback to in-memory db
  if (!db.booths) {
    db.booths = [
      { id: 'b1', nama: 'Booth 1 - Gerai Utama (Pusat)', lokasi: 'Outlet Pusat Andini', penanggung_jawab: 'Admin Utama Andini', is_active: true, created_at: '2025-01-01T08:00:00.000Z' },
      { id: 'b2', nama: 'Booth 2 - Alun-Alun Kota', lokasi: 'Kawasan Kuliner Alun-Alun', penanggung_jawab: 'Eko Prasetyo', is_active: true, created_at: '2025-01-05T08:00:00.000Z' },
      { id: 'b3', nama: 'Booth 3 - Pantai Boom', lokasi: 'Area Wisata Pantai Boom', penanggung_jawab: 'Siti Rahma', is_active: true, created_at: '2025-01-10T08:00:00.000Z' },
      { id: 'b4', nama: 'Booth 4 - Kampus & Sekolah', lokasi: 'Jl. Pendidikan No. 45', penanggung_jawab: 'Rizky Ramadhan', is_active: true, created_at: '2025-01-15T08:00:00.000Z' },
      { id: 'b5', nama: 'Booth 5 - RTH Maron Genteng', lokasi: 'Taman Hijau Genteng', penanggung_jawab: 'Angga Wijaya', is_active: true, created_at: '2025-01-20T08:00:00.000Z' },
      { id: 'b6', nama: 'Booth Event / Bazar Keliling', lokasi: 'Mobile / Event Outdoor', penanggung_jawab: 'Farhan Maulana', is_active: true, created_at: '2025-02-01T08:00:00.000Z' }
    ];
  }

  let list = db.booths;
  if (activeOnly) {
    list = list.filter(b => b.is_active !== false);
  }

  return NextResponse.json(list);
}

export async function POST(req) {
  try {
    const body = await req.json();
    const nama = body?.nama?.trim();
    const lokasi = body?.lokasi?.trim() || '';
    const penanggung_jawab = body?.penanggung_jawab?.trim() || '';
    const is_active = body?.is_active !== false;

    if (!nama) {
      return NextResponse.json({ error: 'Nama gerai / booth tidak boleh kosong.' }, { status: 400 });
    }

    if (await isSupabaseAvailable() && supabaseAdmin) {
      try {
        const { data: existing } = await supabaseAdmin
          .from('booths')
          .select('id, nama')
          .ilike('nama', nama)
          .maybeSingle();

        if (existing) {
          return NextResponse.json({ error: `Gerai dengan nama "${nama}" sudah terdaftar.` }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
          .from('booths')
          .insert({
            nama,
            lokasi,
            penanggung_jawab,
            is_active
          })
          .select()
          .single();

        if (!error && data) {
          return NextResponse.json(data);
        }
        return NextResponse.json({ error: error?.message || 'Gagal menambahkan booth di database.' }, { status: 400 });
      } catch (err) {
        console.error('Supabase POST booth error:', err);
      }
    }

    // Fallback in-memory
    if (!db.booths) db.booths = [];
    const exists = db.booths.some(b => b.nama.toLowerCase() === nama.toLowerCase());
    if (exists) {
      return NextResponse.json({ error: `Gerai dengan nama "${nama}" sudah terdaftar.` }, { status: 400 });
    }

    const newBooth = {
      id: `b${Date.now()}`,
      nama,
      lokasi,
      penanggung_jawab,
      is_active,
      created_at: new Date().toISOString()
    };
    db.booths.push(newBooth);
    return NextResponse.json(newBooth);
  } catch (err) {
    return NextResponse.json({ error: 'Gagal memproses data booth.' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    const { id, nama, lokasi, penanggung_jawab, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID booth wajib disertakan.' }, { status: 400 });
    }

    const trimmedName = nama?.trim();
    if (!trimmedName) {
      return NextResponse.json({ error: 'Nama gerai / booth tidak boleh kosong.' }, { status: 400 });
    }

    if (await isSupabaseAvailable() && supabaseAdmin) {
      try {
        // Cek duplikasi nama jika nama diubah
        const { data: duplicate } = await supabaseAdmin
          .from('booths')
          .select('id, nama')
          .ilike('nama', trimmedName)
          .neq('id', id)
          .maybeSingle();

        if (duplicate) {
          return NextResponse.json({ error: `Nama booth "${trimmedName}" sudah digunakan gerai lain.` }, { status: 400 });
        }

        const { data: updated, error } = await supabaseAdmin
          .from('booths')
          .update({
            nama: trimmedName,
            lokasi: lokasi !== undefined ? lokasi.trim() : '',
            penanggung_jawab: penanggung_jawab !== undefined ? penanggung_jawab.trim() : '',
            is_active: is_active !== undefined ? is_active : true
          })
          .eq('id', id)
          .select()
          .single();

        if (!error && updated) {
          return NextResponse.json(updated);
        }
        return NextResponse.json({ error: error?.message || 'Gagal memperbarui data booth di database.' }, { status: 400 });
      } catch (err) {
        console.error('Supabase PUT booth error:', err);
      }
    }

    // Fallback in-memory
    if (!db.booths) db.booths = [];
    const index = db.booths.findIndex(b => b.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Booth tidak ditemukan.' }, { status: 404 });
    }

    const duplicate = db.booths.some(b => b.id !== id && b.nama.toLowerCase() === trimmedName.toLowerCase());
    if (duplicate) {
      return NextResponse.json({ error: `Nama booth "${trimmedName}" sudah digunakan gerai lain.` }, { status: 400 });
    }

    db.booths[index] = {
      ...db.booths[index],
      nama: trimmedName,
      lokasi: lokasi !== undefined ? lokasi.trim() : db.booths[index].lokasi,
      penanggung_jawab: penanggung_jawab !== undefined ? penanggung_jawab.trim() : db.booths[index].penanggung_jawab,
      is_active: is_active !== undefined ? is_active : db.booths[index].is_active
    };

    return NextResponse.json(db.booths[index]);
  } catch (err) {
    return NextResponse.json({ error: 'Gagal memperbarui data booth.' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID booth wajib disertakan.' }, { status: 400 });
    }

    if (await isSupabaseAvailable() && supabaseAdmin) {
      try {
        const { error } = await supabaseAdmin
          .from('booths')
          .delete()
          .eq('id', id);

        if (!error) {
          return NextResponse.json({ success: true, message: 'Booth berhasil dihapus.' });
        }
        return NextResponse.json({ error: error?.message || 'Gagal menghapus booth.' }, { status: 400 });
      } catch (err) {
        console.error('Supabase DELETE booth error:', err);
      }
    }

    // Fallback in-memory
    if (!db.booths) db.booths = [];
    const index = db.booths.findIndex(b => b.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Booth tidak ditemukan.' }, { status: 404 });
    }

    db.booths.splice(index, 1);
    return NextResponse.json({ success: true, message: 'Booth berhasil dihapus.' });
  } catch (err) {
    return NextResponse.json({ error: 'Gagal menghapus data booth.' }, { status: 500 });
  }
}
