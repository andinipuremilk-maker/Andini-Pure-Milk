import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '../../../lib/supabase';
import { db } from '../../../lib/db';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const includeArchived = searchParams.get('include_archived');

  if (isSupabaseConfigured() && supabaseAdmin) {
    try {
      let query = supabaseAdmin
        .from('produk')
        .select('*')
        .order('created_at', { ascending: false });

      if (includeArchived !== 'true') {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;
      if (!error && data) {
        return NextResponse.json(data);
      }
    } catch (err) {
      console.error('Supabase GET produk error:', err);
    }
  }

  // Fallback
  if (!db.produk) db.produk = [];
  if (includeArchived === 'true') {
    return NextResponse.json(db.produk);
  }
  const activeProduk = db.produk.filter(p => p.is_active !== false);
  return NextResponse.json(activeProduk);
}

export async function POST(req) {
  const data = await req.json();

  if (isSupabaseConfigured() && supabaseAdmin) {
    try {
      const payload = {
        nama: data.nama,
        sku: data.sku,
        harga_jual: Number(data.harga_jual) || 0,
        harga_modal: Number(data.harga_modal) || 0,
        stok: Number(data.stok) || 0,
        kategori_id: data.kategori_id || null,
        is_active: true
      };

      const { data: newProd, error } = await supabaseAdmin
        .from('produk')
        .insert(payload)
        .select()
        .single();

      if (!error && newProd) {
        return NextResponse.json(newProd);
      }
      return NextResponse.json({ error: error?.message || 'Gagal menambahkan produk' }, { status: 400 });
    } catch (err) {
      console.error('Supabase POST produk error:', err);
    }
  }

  // Fallback
  if (!db.produk) db.produk = [];
  const newProduk = {
    id: `p${Date.now()}`,
    is_active: true,
    ...data
  };
  db.produk.push(newProduk);
  return NextResponse.json(newProduk);
}

export async function PUT(req) {
  const data = await req.json();

  if (isSupabaseConfigured() && supabaseAdmin) {
    try {
      const payload = { ...data };
      delete payload.id; // jangan update id

      const { data: updated, error } = await supabaseAdmin
        .from('produk')
        .update(payload)
        .eq('id', data.id)
        .select()
        .single();

      if (!error && updated) {
        return NextResponse.json(updated);
      }
      return NextResponse.json({ error: error?.message || 'Gagal memperbarui produk' }, { status: 400 });
    } catch (err) {
      console.error('Supabase PUT produk error:', err);
    }
  }

  // Fallback
  const index = db.produk.findIndex(p => p.id === data.id);
  if (index !== -1) {
    db.produk[index] = { ...db.produk[index], ...data };
    return NextResponse.json(db.produk[index]);
  }
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function DELETE(req) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (isSupabaseConfigured() && supabaseAdmin) {
    try {
      const { error } = await supabaseAdmin
        .from('produk')
        .delete()
        .eq('id', id);

      if (!error) {
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    } catch (err) {
      console.error('Supabase DELETE produk error:', err);
    }
  }

  // Fallback
  const index = db.produk.findIndex(p => p.id === id);
  if (index !== -1) {
    db.produk.splice(index, 1);
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
