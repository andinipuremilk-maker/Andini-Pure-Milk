// Hashing password memakai scrypt bawaan Node.js (tanpa library tambahan).
// Format tersimpan: scrypt$<salt hex>$<hash hex>
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const PREFIX = 'scrypt$';

export function isHashed(stored) {
  return typeof stored === 'string' && stored.startsWith(PREFIX);
}

export function hashPassword(plain) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(String(plain), salt, 64).toString('hex');
  return `${PREFIX}${salt}$${hash}`;
}

/**
 * Mencocokkan password. Mendukung data lama yang masih tersimpan polos
 * (akan otomatis di-upgrade ke hash oleh pemanggil saat login berhasil).
 */
export function verifyPassword(plain, stored) {
  if (!stored || plain == null) return false;
  if (!isHashed(stored)) return String(plain) === String(stored);
  const [, salt, hash] = stored.split('$');
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, 'hex');
  const actual = scryptSync(String(plain), salt, expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
