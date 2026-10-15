import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '../../../lib/supabase';
import { db } from '../../../lib/db';

export async function GET() {
  if (isSupabaseConfigured() && supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from('kategori_produk')
        .select('*')
        .order('created_at', { ascending: true });

      if (!error && data) {
        return NextResponse.json(data);
      }
    } catch (err) {
      console.error('Supabase GET kategori error:', err);
    }
  }

  // Fallback
  return NextResponse.json(db.kategoriProduk || []);
}

export async function POST(req) {
  const { nama } = await req.json();

  if (isSupabaseConfigured() && supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from('kategori_produk')
        .insert({ nama: nama.trim() })
        .select()
        .single();

      if (!error && data) {
        return NextResponse.json(data);
      }
      return NextResponse.json({ error: error?.message || 'Gagal menambahkan kategori' }, { status: 400 });
    } catch (err) {
      console.error('Supabase POST kategori error:', err);
    }
  }

  // Fallback
  if (!db.kategoriProduk) db.kategoriProduk = [];
  const newKat = { id: `k${Date.now()}`, nama: nama.trim() };
  db.kategoriProduk.push(newKat);
  return NextResponse.json(newKat);
}

export async function PUT(req) {
  const data = await req.json();

  if (isSupabaseConfigured() && supabaseAdmin) {
    try {
      const { data: updated, error } = await supabaseAdmin
        .from('kategori_produk')
        .update({ nama: data.nama })
        .eq('id', data.id)
        .select()
        .single();

      if (!error && updated) {
        return NextResponse.json(updated);
      }
      return NextResponse.json({ error: error?.message || 'Gagal mengupdate kategori' }, { status: 400 });
    } catch (err) {
      console.error('Supabase PUT kategori error:', err);
    }
  }

  // Fallback
  const index = db.kategoriProduk.findIndex(k => k.id === data.id);
  if (index !== -1) {
    db.kategoriProduk[index].nama = data.nama;
    return NextResponse.json(db.kategoriProduk[index]);
  }
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function DELETE(req) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (isSupabaseConfigured() && supabaseAdmin) {
    try {
      // Cek apakah ada produk aktif dalam kategori ini
      const { count } = await supabaseAdmin
        .from('produk')
        .select('*', { count: 'exact', head: true })
        .eq('kategori_id', id)
        .eq('is_active', true);

      if (count && count > 0) {
        return NextResponse.json({ 
          error: 'Tidak dapat menghapus kategori yang masih memiliki produk aktif.' 
        }, { status: 400 });
      }

      const { error } = await supabaseAdmin
        .from('kategori_produk')
        .delete()
        .eq('id', id);

      if (!error) {
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    } catch (err) {
      console.error('Supabase DELETE kategori error:', err);
    }
  }

  // Fallback
  const hasProducts = db.produk && db.produk.some(p => p.kategori_id === id && p.is_active);
  if (hasProducts) {
    return NextResponse.json({ error: 'Tidak dapat menghapus kategori yang masih memiliki produk aktif.' }, { status: 400 });
  }
  
  const index = db.kategoriProduk.findIndex(k => k.id === id);
  if (index !== -1) {
    db.kategoriProduk.splice(index, 1);
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
