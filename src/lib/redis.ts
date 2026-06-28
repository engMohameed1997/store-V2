import { Redis } from "@upstash/redis";

const globalForRedis = globalThis as unknown as { __redis?: Redis | null };

function isRedisConfigured(): boolean {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  return !!(url && token && url.startsWith("https://") && !url.includes("YOUR_ENDPOINT"));
}

function createRedisClient(): Redis {
  const url = process.env.UPSTASH_REDIS_REST_URL!;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!;
  return new Redis({ url, token });
}

function getRedis(): Redis | null {
  if (!isRedisConfigured()) return null;
  if (globalForRedis.__redis === undefined) {
    try {
      const client = createRedisClient();
      if (process.env.NODE_ENV !== "production") {
        globalForRedis.__redis = client;
      }
      return client;
    } catch {
      globalForRedis.__redis = null;
      return null;
    }
  }
  return globalForRedis.__redis ?? null;
}

const noopAsync = async () => null;
const noopNumberAsync = async () => 0;

export const redis: Redis = new Proxy({} as Redis, {
  get(_target, prop) {
    const client = getRedis();
    if (client) {
      return (client as unknown as Record<string | symbol, unknown>)[prop];
    }
    // No-op fallbacks when Redis is not configured
    if (prop === "set") return async () => null;
    if (prop === "get") return noopAsync;
    if (prop === "del") return noopAsync;
    if (prop === "incr") return noopNumberAsync;
    if (prop === "expire") return noopAsync;
    return noopAsync;
  },
});
