import { Redis } from "@upstash/redis";

const globalForRedis = globalThis as unknown as { __redis?: Redis };

function createRedisClient(): Redis {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error(
      "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set in environment variables"
    );
  }

  return new Redis({ url, token });
}

export const redis: Redis = globalForRedis.__redis ?? createRedisClient();

if (process.env.NODE_ENV !== "production") {
  globalForRedis.__redis = redis;
}
