/**
 * In-memory rate limiter — production-ready swap ke Redis (ioredis + sliding window)
 * ketika Redis tersedia. Interface-nya identik sehingga tidak perlu ubah caller.
 *
 * Algoritma: Fixed window per IP
 * - Simpan { count, resetAt } per key di Map
 * - Expired entries di-prune setiap kali hit
 */

interface RateLimitEntry {
  count:   number;
  resetAt: number; // unix ms
}

const store = new Map<string, RateLimitEntry>();

/** Prune entries yang sudah expired (hindari memory leak) */
function prune() {
  const now = Date.now();
  store.forEach((entry, key) => {
    if (entry.resetAt < now) store.delete(key);
  });
}

export interface RateLimitOptions {
  /** Unique key untuk bucket (mis: `register:${ip}`) */
  key:          string;
  /** Maksimum requests dalam window */
  limit:        number;
  /** Panjang window dalam detik */
  windowSecs:   number;
}

export interface RateLimitResult {
  success:    boolean;
  remaining:  number;
  resetAt:    number; // unix ms
  retryAfter: number; // detik sampai reset
}

export function rateLimit({ key, limit, windowSecs }: RateLimitOptions): RateLimitResult {
  prune();

  const now      = Date.now();
  const windowMs = windowSecs * 1000;

  const existing = store.get(key);

  /* Window sudah habis — reset */
  if (!existing || existing.resetAt < now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return {
      success:    true,
      remaining:  limit - 1,
      resetAt,
      retryAfter: 0,
    };
  }

  /* Masih dalam window */
  if (existing.count >= limit) {
    return {
      success:    false,
      remaining:  0,
      resetAt:    existing.resetAt,
      retryAfter: Math.ceil((existing.resetAt - now) / 1000),
    };
  }

  existing.count += 1;
  return {
    success:    true,
    remaining:  limit - existing.count,
    resetAt:    existing.resetAt,
    retryAfter: 0,
  };
}

/**
 * Helper: ambil IP dari Next.js Request headers
 * Urutan prioritas: x-forwarded-for (nginx proxy) → x-real-ip → fallback "unknown"
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "unknown";
}
