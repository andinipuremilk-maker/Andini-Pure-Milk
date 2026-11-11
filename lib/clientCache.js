// Lightweight client-side memory cache with TTL (Time-To-Live)
const cache = new Map();

/**
 * Fetch with memory cache
 * @param {string} url 
 * @param {RequestInit} [options] 
 * @param {number} [ttlMs] Default 30 seconds
 */
export async function fetchWithCache(url, options = {}, ttlMs = 30000) {
  const now = Date.now();
  if (cache.has(url)) {
    const entry = cache.get(url);
    if (now - entry.timestamp < ttlMs) {
      return entry.data;
    }
  }

  const res = await fetch(url, options);
  if (!res.ok) {
    throw new Error(`HTTP error: ${res.status}`);
  }
  const data = await res.json();
  cache.set(url, { data, timestamp: now });
  return data;
}

/**
 * Invalidate cache by URL prefix or all
 * @param {string} [urlPrefix] 
 */
export function invalidateCache(urlPrefix = '') {
  if (!urlPrefix) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.startsWith(urlPrefix)) {
      cache.delete(key);
    }
  }
}

