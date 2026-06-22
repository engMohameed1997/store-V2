import { redis } from "@/lib/redis";
import { logger } from "@/lib/logger";

// Cache TTL constants (in milliseconds for backward compat, converted to seconds for Redis)
export const CACHE_TTL = {
  ANALYTICS_DASHBOARD: 5 * 60 * 1000,  // 5 minutes
  PRODUCT_LIST: 60 * 1000,              // 1 minute
  CATEGORIES: 10 * 60 * 1000,           // 10 minutes
  BRANDS: 10 * 60 * 1000,               // 10 minutes
} as const;

class RedisCache {
  get<T>(key: string): Promise<T | null> | T | null {
    return redis.get<T>(key).catch((err) => {
      logger.warn("Cache get failed", { key, error: String(err) });
      return null;
    });
  }

  set<T>(key: string, data: T, ttlMs: number): void {
    const ttlSeconds = Math.ceil(ttlMs / 1000);
    redis.set(key, data, { ex: ttlSeconds }).catch((err) => {
      logger.warn("Cache set failed", { key, error: String(err) });
    });
  }

  invalidate(key: string): void {
    redis.del(key).catch((err) => {
      logger.warn("Cache invalidate failed", { key, error: String(err) });
    });
  }

  invalidatePattern(pattern: string): void {
    redis.keys(`${pattern}*`).then((keys) => {
      if (keys.length > 0) {
        redis.del(...keys).catch((err) => {
          logger.warn("Cache invalidatePattern del failed", { pattern, error: String(err) });
        });
      }
    }).catch((err) => {
      logger.warn("Cache invalidatePattern keys failed", { pattern, error: String(err) });
    });
  }
}

export const cache = new RedisCache();
