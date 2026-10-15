import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '../../../lib/supabase';
import { db } from '../../../lib/db';

export async function POST(req) {
  const { username, password, role } = await req.json();
  const cleanUsername = username?.trim().toLowerCase();

  // 1. Eksekusi ke Supabase jika telah dikonfigurasi
  if (isSupabaseConfigured() && supabaseAdmin) {
    try {
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .ilike('username', cleanUsername)
        .eq('password', password)
        .single();

      if (error || !user) {
        return NextResponse.json({ error: 'Username atau password salah.' }, { status: 401 });
      }

      if (user.role !== role) {
        return NextResponse.json({ 
          error: `Akses ditolak. Akun Anda terdaftar sebagai ${user.role?.toUpperCase()}, bukan ${role?.toUpperCase()}.` 
        }, { status: 403 });
      }

      if (user.is_active === false) {
        return NextResponse.json({ error: 'Akun Anda tidak aktif.' }, { status: 403 });
      }

      const { password: _, ...safeUser } = user;
      return NextResponse.json(safeUser);
    } catch (err) {
      console.error('Supabase Auth Error, fallback ke local db:', err);
    }
  }

  // 2. Fallback In-Memory DB jika Supabase belum aktif
  if (!db.users) db.users = [];

  const user = db.users.find(u => 
    u.username?.toLowerCase() === cleanUsername && 
    u.password === password
  );
  
  if (!user) {
    return NextResponse.json({ error: 'Username atau password salah.' }, { status: 401 });
  }
  if (user.role !== role) {
    return NextResponse.json({ 
      error: `Akses ditolak. Akun Anda terdaftar sebagai ${user.role?.toUpperCase()}, bukan ${role?.toUpperCase()}.` 
    }, { status: 403 });
  }
  if (user.is_active === false) {
    return NextResponse.json({ error: 'Akun Anda tidak aktif.' }, { status: 403 });
  }

  const { password: _, ...safeUser } = user;
  return NextResponse.json(safeUser);
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Pendaftaran publik dinonaktifkan. Pembuatan dan pengelolaan akun hanya dapat dilakukan melalui Panel Admin.' },
    { status: 403 }
  );
}
