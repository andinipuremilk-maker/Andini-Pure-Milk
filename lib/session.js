// Sesi login berbasis cookie bertanda tangan (HMAC-SHA256).
// Memakai Web Crypto agar bisa dipakai di proxy.js maupun API route.

export const SESSION_COOKIE = 'apm_session';
export const SESSION_MAX_AGE = 60 * 60 * 12; // 12 jam (satu hari kerja)

const DEV_FALLBACK_SECRET = 'andini-dev-secret-ganti-di-produksi';

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= 32) return secret;
  if (process.env.NODE_ENV === 'production') {
    // Tanpa secret yang kuat, semua sesi ditolak di produksi.
    return null;
  }
  return DEV_FALLBACK_SECRET;
}

const encoder = new TextEncoder();

function toBase64Url(bytes) {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(str) {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((str.length + 3) % 4);
  const bin = atob(b64);
  return Uint8Array.from(bin, c => c.charCodeAt(0));
}

async function hmac(secret, data) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return toBase64Url(new Uint8Array(sig));
}

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Membuat token sesi untuk user yang berhasil login. */
export async function createSessionToken(user) {
  const secret = getSecret();
  if (!secret) throw new Error('SESSION_SECRET belum diatur (minimal 32 karakter).');
  const payload = {
    id: user.id,
    username: user.username,
    nama: user.nama || user.username,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE
  };
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const sig = await hmac(secret, body);
  return `${body}.${sig}`;
}

/** Memverifikasi token sesi. Mengembalikan payload atau null bila tidak valid/kedaluwarsa. */
export async function verifySessionToken(token) {
  try {
    const secret = getSecret();
    if (!secret || !token || typeof token !== 'string') return null;
    const [body, sig] = token.split('.');
    if (!body || !sig) return null;
    const expected = await hmac(secret, body);
    if (!safeEqual(sig, expected)) return null;
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(body)));
    if (!payload?.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE
  };
}

/**
 * Membaca identitas user di API route. Header ini diisi oleh proxy.js
 * setelah sesi diverifikasi (header kiriman klien selalu ditimpa).
 */
export function getRequestUser(req) {
  const role = req.headers.get('x-session-role');
  if (!role) return null;
  return {
    id: req.headers.get('x-session-id') || null,
    role,
    nama: decodeURIComponent(req.headers.get('x-session-nama') || '')
  };
}
