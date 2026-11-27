import { createClient } from '@supabase/supabase-js';

// Toggle Database Mode:
// false = Pakai database lokal in-memory (sangat cepat, 0ms, offline)
// true  = Pakai Supabase Cloud
const useSupabase = process.env.USE_SUPABASE === 'true';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Server wajib memakai service role key: RLS mengunci semua tabel dari kunci anon.
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseConfigured = () => {
  if (!useSupabase) return false;
  return Boolean(
    supabaseUrl && 
    supabaseUrl.startsWith('http') && 
    supabaseServiceKey &&
    supabaseServiceKey.length > 20
  );
};

/**
 * Mode Supabase aktif bila USE_SUPABASE=true dan kredensial lengkap.
 *
 * Catatan: dulu fungsi ini memakai "circuit breaker" yang diam-diam beralih ke
 * database lokal in-memory jika Supabase lambat/offline. Itu berbahaya di produksi
 * karena transaksi bisa tersimpan di memori lalu hilang. Sekarang, bila mode
 * Supabase aktif, semua request selalu ke Supabase; jika gagal, API mengembalikan
 * error (database lokal dinonaktifkan di lib/db.js).
 */
export async function isSupabaseAvailable() {
  if (!useSupabase) return false;
  if (!isSupabaseConfigured()) {
    console.error('[Supabase] USE_SUPABASE=true tetapi NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum diisi.');
    return false;
  }
  return true;
}

export const supabaseAdmin = (useSupabase && isSupabaseConfigured())
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })
  : null;
