import { redis } from "./redis";

/**
 * Simple Redis-based rate limiter.
 * @param key - Unique identifier (e.g., IP + endpoint)
 * @param limit - Max requests allowed in the window
 * @param windowSeconds - Time window in seconds
 * @returns true if request is allowed, false if rate limited
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<boolean> {
  try {
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, windowSeconds);
    }
    return current <= limit;
  } catch {
    // If Redis is down, allow the request
    return true;
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
