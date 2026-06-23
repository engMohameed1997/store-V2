import { Redis } from "@upstash/redis";

const globalForRedis = globalThis as unknown as { __redis?: Redis };

function createRedisClient(): Redis {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error("Redis is not configured");
  }

  return new Redis({ url, token });
}

function getRedis(): Redis {
  if (globalForRedis.__redis) return globalForRedis.__redis;
  const client = createRedisClient();
  if (process.env.NODE_ENV !== "production") {
    globalForRedis.__redis = client;
  }
  return client;
}

export const redis: Redis = new Proxy({} as Redis, {
  get(_target, prop) {
    return (getRedis() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
