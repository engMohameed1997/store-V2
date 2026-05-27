interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private cleanupInterval: ReturnType<typeof setInterval>;

  constructor() {
    this.cleanupInterval = setInterval(() => this.purgeExpired(), 60_000);
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlMs: number): void {
    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }

  invalidatePattern(pattern: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(pattern)) {
        this.store.delete(key);
      }
    }
  }

  private purgeExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

// Singleton instance
const globalForCache = globalThis as unknown as { __cache?: MemoryCache };
export const cache = globalForCache.__cache ?? new MemoryCache();

if (process.env.NODE_ENV !== "production") {
  globalForCache.__cache = cache;
}

// Cache TTL constants
export const CACHE_TTL = {
  ANALYTICS_DASHBOARD: 5 * 60 * 1000,  // 5 minutes
  PRODUCT_LIST: 60 * 1000,              // 1 minute
  CATEGORIES: 10 * 60 * 1000,           // 10 minutes
  BRANDS: 10 * 60 * 1000,               // 10 minutes
} as const;
