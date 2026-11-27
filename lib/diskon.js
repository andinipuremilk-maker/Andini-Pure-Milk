// Aturan masa berlaku diskon, dipakai bersama oleh API dan halaman admin.
// tanggal_mulai / tanggal_selesai berformat 'YYYY-MM-DD' (opsional, kosong = tanpa batas).
// Tanggal selesai bersifat inklusif: diskon masih berlaku sepanjang hari tersebut (WIB).

/** Tanggal hari ini dalam zona waktu WIB, format 'YYYY-MM-DD'. */
export function hariIniWIB(now = new Date()) {
  return now.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
}

/** 'aktif' | 'nonaktif' | 'belum_mulai' | 'kedaluwarsa' */
export function statusDiskon(d, now = new Date()) {
  if (!d || d.is_active === false) return 'nonaktif';
  const today = hariIniWIB(now);
  if (d.tanggal_mulai && today < d.tanggal_mulai) return 'belum_mulai';
  if (d.tanggal_selesai && today > d.tanggal_selesai) return 'kedaluwarsa';
  return 'aktif';
}

export const isDiskonBerlaku = (d, now) => statusDiskon(d, now) === 'aktif';

/** Validasi & normalisasi input rentang tanggal. Mengembalikan { error } atau { tanggal_mulai, tanggal_selesai }. */
export function parseRentangTanggal(body) {
  const valid = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
  const tanggal_mulai = body?.tanggal_mulai || null;
  const tanggal_selesai = body?.tanggal_selesai || null;
  if ((tanggal_mulai && !valid(tanggal_mulai)) || (tanggal_selesai && !valid(tanggal_selesai))) {
    return { error: 'Format tanggal tidak valid.' };
  }
  if (tanggal_mulai && tanggal_selesai && tanggal_selesai < tanggal_mulai) {
    return { error: 'Tanggal selesai tidak boleh sebelum tanggal mulai.' };
  }
  return { tanggal_mulai, tanggal_selesai };
}
