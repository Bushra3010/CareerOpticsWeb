import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Lead endpoint rate limit — PRD §8, 5 requests per 10 minutes per IP.
 *
 * Upstash is the production limiter. It is not configured yet (§12 lists the
 * variables as empty until now), so there is a process-local fallback: it is
 * per-instance and resets on deploy, which is weaker than Redis but still
 * stops a single client hammering the endpoint in dev or before the env is
 * filled in. `configured` is reported so the route can log which one ran.
 */

const LIMIT = 5;
const WINDOW_MS = 10 * 60 * 1000;

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  /** Seconds until the caller may retry. 0 when the request was allowed. */
  retryAfter: number;
  backend: "upstash" | "memory";
};

const upstash =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Ratelimit({
        redis: new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL,
          token: process.env.UPSTASH_REDIS_REST_TOKEN,
        }),
        limiter: Ratelimit.slidingWindow(LIMIT, "10 m"),
        prefix: "careeroptics:leads",
        analytics: false,
      })
    : null;

/** Timestamps of recent hits per key. Trimmed on every call. */
const hits = new Map<string, number[]>();

function memoryLimit(key: string): RateLimitResult {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((at) => now - at < WINDOW_MS);

  if (recent.length >= LIMIT) {
    hits.set(key, recent);
    const retryAfter = Math.ceil((WINDOW_MS - (now - recent[0]!)) / 1000);
    return { success: false, remaining: 0, retryAfter, backend: "memory" };
  }

  recent.push(now);
  hits.set(key, recent);

  // Keep the map from growing without bound on a long-lived instance.
  if (hits.size > 5000) {
    for (const [k, stamps] of hits) {
      if (stamps.every((at) => now - at >= WINDOW_MS)) hits.delete(k);
    }
  }

  return {
    success: true,
    remaining: LIMIT - recent.length,
    retryAfter: 0,
    backend: "memory",
  };
}

export async function limitLeads(identifier: string): Promise<RateLimitResult> {
  if (!upstash) return memoryLimit(identifier);

  const { success, remaining, reset } = await upstash.limit(identifier);
  return {
    success,
    remaining,
    retryAfter: success ? 0 : Math.max(1, Math.ceil((reset - Date.now()) / 1000)),
    backend: "upstash",
  };
}

/** True when the production limiter is wired up (used by health checks/logs). */
export const rateLimitConfigured = Boolean(upstash);
