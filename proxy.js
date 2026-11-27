import { NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from './lib/session';

// ============================================================================
// Kebijakan akses API
//   'public' : boleh tanpa login
//   'staff'  : wajib login (kasir atau admin)
//   'admin'  : khusus admin
// Method yang tidak tercantum otomatis 'admin'.
// ============================================================================
const API_POLICY = {
  auth: { POST: 'public', GET: 'public', DELETE: 'public', PUT: 'public' },
  booth: { GET: 'public' }, // daftar booth tampil di halaman login
  produk: { GET: 'staff' },
  kategori: { GET: 'staff' },
  diskon: { GET: 'staff' },
  sellers: { GET: 'staff', POST: 'staff' }, // kasir bisa menambah mitra
  transaksi: { GET: 'staff', POST: 'staff', PUT: 'staff', DELETE: 'staff' },
  // akun, karyawan, laporan, pengeluaran, seed => admin
};

function apiAccessLevel(pathname, method) {
  const resource = pathname.split('/')[2] || '';
  return API_POLICY[resource]?.[method] || 'admin';
}

function isAllowed(level, session) {
  if (level === 'public') return true;
  if (!session) return false;
  if (level === 'staff') return session.role === 'kasir' || session.role === 'admin';
  return session.role === 'admin';
}

export async function proxy(request) {
  const { pathname } = request.nextUrl;
  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);

  // ---------------------------- API ----------------------------
  if (pathname.startsWith('/api/')) {
    const level = apiAccessLevel(pathname, request.method);
    if (!isAllowed(level, session)) {
      return NextResponse.json(
        { error: session ? 'Akses ditolak. Fitur ini khusus admin.' : 'Sesi berakhir. Silakan login kembali.' },
        { status: session ? 403 : 401 }
      );
    }

    // Teruskan identitas user ke API route (header kiriman klien selalu ditimpa)
    const headers = new Headers(request.headers);
    headers.delete('x-session-id');
    headers.delete('x-session-role');
    headers.delete('x-session-nama');
    if (session) {
      headers.set('x-session-id', String(session.id ?? ''));
      headers.set('x-session-role', session.role);
      headers.set('x-session-nama', encodeURIComponent(session.nama || ''));
    }
    return NextResponse.next({ request: { headers } });
  }

  // --------------------------- Halaman ---------------------------
  if (pathname.startsWith('/admin')) {
    if (session?.role !== 'admin') {
      return NextResponse.redirect(new URL('/login?role=admin', request.url));
    }
  } else if (pathname.startsWith('/kasir')) {
    if (!session || (session.role !== 'kasir' && session.role !== 'admin')) {
      return NextResponse.redirect(new URL('/login?role=kasir', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*', '/admin/:path*', '/kasir/:path*']
};
