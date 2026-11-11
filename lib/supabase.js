import { createClient } from '@supabase/supabase-js';

// Toggle Database Mode:
// false = Pakai database lokal in-memory (sangat cepat, 0ms, offline)
// true  = Pakai Supabase Cloud
const useSupabase = process.env.USE_SUPABASE === 'true';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

export const isSupabaseConfigured = () => {
  if (!useSupabase) return false;
  return Boolean(
    supabaseUrl && 
    supabaseUrl.startsWith('http') && 
    supabaseAnonKey && 
    supabaseAnonKey.length > 20
  );
};

// Circuit Breaker State: Mencegah delay 7-15 detik jika Supabase offline/NXDOMAIN/paused
let isCircuitOpen = false;
let lastCheckTime = 0;
const HEALTH_CHECK_INTERVAL = 45000; // Cek ulang setiap 45 detik

/**
 * Cek cepat apakah server Supabase aktif dan dapat dihubungi (timeout 1.2 detik).
 * Jika host mati / paused / tidak ada koneksi / mode lokal aktif, langsung alihkan ke database lokal (0ms).
 */
export async function isSupabaseAvailable() {
  if (!useSupabase || !isSupabaseConfigured()) return false;

  const now = Date.now();
  if (isCircuitOpen && (now - lastCheckTime < HEALTH_CHECK_INTERVAL)) {
    return false;
  }

  try {
    await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'HEAD',
      headers: { apikey: supabaseAnonKey },
      signal: AbortSignal.timeout(1200)
    });
    isCircuitOpen = false;
    lastCheckTime = now;
    return true;
  } catch (err) {
    if (!isCircuitOpen) {
      console.warn(`[Supabase Offline] Host ${supabaseUrl} tidak dapat dihubungi (${err.message}). Beralih otomatis ke data lokal.`);
    }
    isCircuitOpen = true;
    lastCheckTime = now;
    return false;
  }
}

export const supabase = (useSupabase && isSupabaseConfigured())
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false }
    })
  : null;

export const supabaseAdmin = (useSupabase && isSupabaseConfigured())
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })
  : null;
