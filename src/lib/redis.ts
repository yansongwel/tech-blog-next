import Redis from "ioredis";

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

function createRedis() {
  const client = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      // Exponential backoff: 100ms, 200ms, 400ms... max 3s
      return Math.min(times * 100, 3000);
    },
    lazyConnect: false,
  });

  client.on("error", (err) => {
    console.error("Redis connection error:", err.message);
  });

  return client;
}

// Cache in both dev and prod
export const redis = globalForRedis.redis ?? createRedis();
globalForRedis.redis = redis;
