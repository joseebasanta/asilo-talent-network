/**
 * Per-process sliding-window rate limiter shared by every public endpoint.
 *
 * ponytail: memory is per serverless instance and resets on cold start, so
 * this only slows down naive abuse. The durable guarantees live elsewhere
 * (moderation, dedupe). For a
 * shared limit use Vercel Firewall rate-limit rules or Upstash Redis.
 */
export function createRateLimiter(max: number, windowMs: number) {
  const hits = new Map<string, number[]>();

  return function limited(key: string, now = Date.now()): boolean {
    const recent = (hits.get(key) ?? []).filter((at) => now - at < windowMs);
    if (recent.length >= max) {
      hits.set(key, recent);
      return true;
    }
    recent.push(now);
    hits.set(key, recent);
    // Opportunistic cleanup so long-lived instances do not grow unbounded.
    if (hits.size > 10_000) {
      for (const [k, times] of hits) {
        if (times.every((at) => now - at >= windowMs)) hits.delete(k);
      }
    }
    return false;
  };
}
