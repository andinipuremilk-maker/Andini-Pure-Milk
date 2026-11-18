import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin, isSupabaseAvailable } from '../../../lib/supabase';
import { db, isLocalDbEnabled } from '../../../lib/db';
import { hashPassword, isHashed, verifyPassword } from '../../../lib/password';
import {
  SESSION_COOKIE,
  createSessionToken,
  verifySessionToken,
  sessionCookieOptions
} from '../../../lib/session';

// Validasi akun (role, status aktif) lalu buat cookie sesi
async function finishLogin(user, role) {
  if (user.role !== role) {
    return NextResponse.json({
      error: `Akses ditolak. Akun Anda terdaftar sebagai ${user.role?.toUpperCase()}, bukan ${role?.toUpperCase()}.`
    }, { status: 403 });
  }
  if (user.is_active === false) {
    return NextResponse.json({ error: 'Akun Anda tidak aktif.' }, { status: 403 });
  }

  let token;
  try {
    token = await createSessionToken(user);
  } catch (err) {
    console.error('[Auth] Gagal membuat sesi:', err.message);
    return NextResponse.json({ error: 'Server belum dikonfigurasi (SESSION_SECRET). Hubungi admin.' }, { status: 500 });
  }

  const { password: _, ...safeUser } = user;
  const res = NextResponse.json(safeUser);
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return res;
}

// POST: Login
export async function POST(req) {
  try {
    const { username, password, role } = await req.json();
    const cleanUsername = username?.trim().toLowerCase();

    if (!cleanUsername || !password || !role) {
      return NextResponse.json({ error: 'Username, password, dan role wajib diisi.' }, { status: 400 });
    }

    // 1. Supabase (mode produksi)
    if (await isSupabaseAvailable() && supabaseAdmin) {
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .ilike('username', cleanUsername)
        .maybeSingle();

      if (error) {
        console.error('Supabase Auth Error:', error);
        return NextResponse.json({ error: 'Database tidak dapat dihubungi. Coba lagi.' }, { status: 503 });
      }
      if (!user || !verifyPassword(password, user.password)) {
        return NextResponse.json({ error: 'Username atau password salah.' }, { status: 401 });
      }

      // Upgrade otomatis password lama (polos) menjadi hash
      if (!isHashed(user.password)) {
        await supabaseAdmin.from('users').update({ password: hashPassword(password) }).eq('id', user.id);
      }
      return finishLogin(user, role);
    }

    // 2. Database lokal in-memory (mode pengembangan)
    if (!isLocalDbEnabled) {
      return NextResponse.json({ error: 'Database tidak tersedia. Periksa konfigurasi Supabase.' }, { status: 503 });
    }
    if (!db.users) db.users = [];

    const user = db.users.find(u => u.username?.toLowerCase() === cleanUsername);
    if (!user || !verifyPassword(password, user.password)) {
      return NextResponse.json({ error: 'Username atau password salah.' }, { status: 401 });
    }
    if (!isHashed(user.password)) user.password = hashPassword(password);

    return finishLogin(user, role);
  } catch (err) {
    console.error('Auth POST error:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan saat login.' }, { status: 500 });
  }
}

// GET: Cek sesi aktif
export async function GET() {
  const cookieStore = await cookies();
  const session = await verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ error: 'Sesi tidak valid atau telah berakhir.' }, { status: 401 });
  }
  return NextResponse.json(session);
}

// DELETE: Logout (hapus cookie sesi)
export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(SESSION_COOKIE, '', { ...sessionCookieOptions(), maxAge: 0 });
  return res;
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Pendaftaran publik dinonaktifkan. Pembuatan dan pengelolaan akun hanya dapat dilakukan melalui Panel Admin.' },
    { status: 403 }
  );
}
