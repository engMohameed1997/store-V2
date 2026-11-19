import { Redis } from "@upstash/redis";

const globalForRedis = globalThis as unknown as {
  __redis?: Redis | null;
  __memoryRedis?: MemoryRedis;
};

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
      globalForRedis.__redis = createRedisClient();
    } catch {
      globalForRedis.__redis = null;
    }
  }
  return globalForRedis.__redis ?? null;
}

// ── In-memory fallback ──────────────────────────────────────────────────────
// Used when Upstash is not configured. Rate limits, quotas, locks and dedup
// keep working for a single app instance (the Docker deployment runs one
// Node process). State is lost on restart. For multiple instances, configure
// Upstash so counters are shared.
//
// Values are JSON round-tripped to match Upstash semantics (e.g. Date → string).

interface MemoryEntry {
  value: string;
  expiresAt: number | null; // epoch ms, null = no expiry
}

const MAX_MEMORY_KEYS = 20_000;
const SWEEP_INTERVAL_MS = 60_000;

class MemoryRedis {
  private store = new Map<string, MemoryEntry>();
  private lastSweep = Date.now();

  private live(key: string): MemoryEntry | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt !== null && entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry;
  }

  private maintain(): void {
    const now = Date.now();
    if (now - this.lastSweep > SWEEP_INTERVAL_MS) {
      this.lastSweep = now;
      for (const [k, e] of this.store) {
        if (e.expiresAt !== null && e.expiresAt <= now) this.store.delete(k);
      }
    }
    // Evict oldest-inserted keys if still over capacity
    while (this.store.size > MAX_MEMORY_KEYS) {
      const oldest = this.store.keys().next().value;
      if (oldest === undefined) break;
      this.store.delete(oldest);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.live(key);
    return entry ? (JSON.parse(entry.value) as T) : null;
  }

  async set(
    key: string,
    value: unknown,
    opts?: { ex?: number; px?: number; nx?: boolean; xx?: boolean }
  ): Promise<"OK" | null> {
    const exists = !!this.live(key);
    if (opts?.nx && exists) return null;
    if (opts?.xx && !exists) return null;
    const ttlMs = opts?.ex ? opts.ex * 1000 : opts?.px ?? null;
    this.store.delete(key); // refresh insertion order for eviction
    this.store.set(key, {
      value: JSON.stringify(value),
      expiresAt: ttlMs ? Date.now() + ttlMs : null,
    });
    this.maintain();
    return "OK";
  }

  async del(...keys: string[]): Promise<number> {
    let n = 0;
    for (const k of keys) if (this.store.delete(k)) n++;
    return n;
  }

  async incr(key: string): Promise<number> {
    const entry = this.live(key);
    const next = (entry ? Number(JSON.parse(entry.value)) || 0 : 0) + 1;
    if (entry) {
      entry.value = JSON.stringify(next);
    } else {
      this.store.set(key, { value: JSON.stringify(next), expiresAt: null });
      this.maintain();
    }
    return next;
  }

  async expire(key: string, seconds: number): Promise<0 | 1> {
    const entry = this.live(key);
    if (!entry) return 0;
    entry.expiresAt = Date.now() + seconds * 1000;
    return 1;
  }

  async ttl(key: string): Promise<number> {
    const entry = this.live(key);
    if (!entry) return -2;
    if (entry.expiresAt === null) return -1;
    return Math.max(0, Math.ceil((entry.expiresAt - Date.now()) / 1000));
  }

  async keys(pattern: string): Promise<string[]> {
    const re = new RegExp(
      "^" + pattern.replace(/[.+^${}()|[\]\\?]/g, "\\$&").replace(/\*/g, ".*") + "$"
    );
    const out: string[] = [];
    for (const k of this.store.keys()) if (this.live(k) && re.test(k)) out.push(k);
    return out;
  }
}

function getMemoryRedis(): MemoryRedis {
  if (!globalForRedis.__memoryRedis) {
    globalForRedis.__memoryRedis = new MemoryRedis();
    console.warn(
      "[redis] Upstash not configured — using in-memory store (single instance only)."
    );
  }
  return globalForRedis.__memoryRedis;
}

export const redis: Redis = new Proxy({} as Redis, {
  get(_target, prop) {
    const client = getRedis() ?? getMemoryRedis();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});
