import { redis } from "./redis";

/**
 * Simple Redis-based rate limiter.
 * @param key - Unique identifier (e.g., IP + endpoint)
 * @param limit - Max requests allowed in the window
 * @param windowSeconds - Time window in seconds
 * @param failOpen - If true, allow requests when Redis is down (default).
 *                   Set false for security-sensitive endpoints (e.g., password change).
 * @returns true if request is allowed, false if rate limited
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
  failOpen = true
): Promise<boolean> {
  try {
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, windowSeconds);
    }
    return current <= limit;
  } catch {
    return failOpen;
  }
}

/**
 * Get client IP from request headers.
 */
export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
