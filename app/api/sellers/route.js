import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '../../../lib/supabase';
import { db } from '../../../lib/db';

export async function GET() {
  if (isSupabaseConfigured() && supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from('sellers')
        .select('*')
        .order('created_at', { ascending: true });

      if (!error && data) {
        return NextResponse.json({ sellers: data });
      }
    } catch (err) {
      console.error('Supabase GET sellers error:', err);
    }
  }

  // Fallback to in-memory db
  const rawSellers = db.sellers || [];
  const normalizedSellers = rawSellers.map((s, idx) => {
    if (typeof s === 'string') {
      return { id: `s_${idx + 1}`, nama: s, created_at: new Date('2025-01-01').toISOString() };
    }
    return s;
  });

  return NextResponse.json({ sellers: normalizedSellers });
}

export async function POST(req) {
  try {
    const body = await req.json();
    const nama = body?.nama?.trim();

    if (!nama) {
      return NextResponse.json({ error: 'Nama mitra / seller tidak boleh kosong.' }, { status: 400 });
    }

    if (isSupabaseConfigured() && supabaseAdmin) {
      try {
        // Cek duplikasi di Supabase
        const { data: existing } = await supabaseAdmin
          .from('sellers')
          .select('id, nama')
          .ilike('nama', nama)
          .maybeSingle();

        if (existing) {
          return NextResponse.json({ error: `Mitra dengan nama "${nama}" sudah terdaftar.` }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
          .from('sellers')
          .insert({ nama })
          .select()
          .single();

        if (!error && data) {
          return NextResponse.json({ success: true, seller: data }, { status: 201 });
        }
        return NextResponse.json({ error: error?.message || 'Gagal menambahkan mitra.' }, { status: 400 });
      } catch (err) {
        console.error('Supabase POST sellers error:', err);
      }
    }

    // Fallback to in-memory db
    if (!db.sellers) db.sellers = [];
    const isDuplicate = db.sellers.some(s => {
      const currentName = typeof s === 'string' ? s : s.nama;
      return currentName.toLowerCase() === nama.toLowerCase();
    });

    if (isDuplicate) {
      return NextResponse.json({ error: `Mitra dengan nama "${nama}" sudah terdaftar.` }, { status: 400 });
    }

    const newSeller = {
      id: `s_${Date.now()}`,
      nama,
      created_at: new Date().toISOString()
    };

    db.sellers.push(newSeller);
    return NextResponse.json({ success: true, seller: newSeller }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Format data tidak valid.' }, { status: 400 });
  }
}

export async function DELETE(req) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const nama = searchParams.get('nama');

  if (!id && !nama) {
    return NextResponse.json({ error: 'Parameter id atau nama wajib disertakan.' }, { status: 400 });
  }

  // Lindungi 'Umum / Retail' agar tidak dihapus
  if (nama && nama.toLowerCase() === 'umum / retail') {
    return NextResponse.json({ error: 'Mitra default "Umum / Retail" tidak boleh dihapus.' }, { status: 400 });
  }

  if (isSupabaseConfigured() && supabaseAdmin) {
    try {
      let query = supabaseAdmin.from('sellers').delete();
      if (id) {
        query = query.eq('id', id);
      } else if (nama) {
        query = query.eq('nama', nama);
      }

      const { error } = await query;
      if (!error) {
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    } catch (err) {
      console.error('Supabase DELETE sellers error:', err);
    }
  }

  // Fallback to in-memory db
  if (db.sellers) {
    const index = db.sellers.findIndex(s => {
      if (typeof s === 'string') return s === nama;
      return (id && s.id === id) || (nama && s.nama === nama);
    });

    if (index !== -1) {
      const target = db.sellers[index];
      const targetName = typeof target === 'string' ? target : target.nama;
      if (targetName.toLowerCase() === 'umum / retail') {
        return NextResponse.json({ error: 'Mitra default "Umum / Retail" tidak boleh dihapus.' }, { status: 400 });
      }
      db.sellers.splice(index, 1);
      return NextResponse.json({ success: true });
    }
  }

  return NextResponse.json({ error: 'Mitra tidak ditemukan.' }, { status: 404 });
}
