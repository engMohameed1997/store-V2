import { unstable_cache } from "next/cache";
import { ProductService } from "@/lib/services/product.service";
import { UserService } from "@/lib/services/user.service";
import { OrderService } from "@/lib/services/order.service";

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class InMemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string): T | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  set<T>(key: string, value: T, ttlSec: number): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlSec * 1000 });
  }

  delete(key: string): void {
    this.store.delete(key);
  }
}

const memCache = new InMemoryCache();

// ── Public data: Next.js unstable_cache (5min TTL) ─────────────────────────

export const getCachedProducts = unstable_cache(
  async (search?: string, category?: string) => {
    const result = await ProductService.list({
      search,
      category,
      limit: 10,
      isActive: true,
    });
    return result.products;
  },
  ["chatbot-products"],
  { revalidate: 300 }
);

export const getCachedProductById = unstable_cache(
  async (id: string) => {
    return ProductService.getById(id);
  },
  ["chatbot-product-by-id"],
  { revalidate: 300 }
);

// ── User-specific data: In-Memory cache (60s TTL) ──────────────────────────

export async function getCachedUserOrders(userId: string, page = 1) {
  const key = `orders:${userId}:${page}`;
  const cached = memCache.get<Awaited<ReturnType<typeof OrderService.getMyOrders>>>(key);
  if (cached) return cached;

  const result = await OrderService.getMyOrders(userId, page, 5);
  memCache.set(key, result, 60);
  return result;
}

export async function getCachedOrderById(orderId: string, userId: string) {
  const key = `order:${orderId}:${userId}`;
  const cached = memCache.get<Awaited<ReturnType<typeof OrderService.getById>>>(key);
  if (cached) return cached;

  const result = await OrderService.getById(orderId, userId);
  memCache.set(key, result, 60);
  return result;
}

export async function getCachedUserProfile(userId: string) {
  const key = `profile:${userId}`;
  const cached = memCache.get<Awaited<ReturnType<typeof UserService.getProfile>>>(key);
  if (cached) return cached;

  const result = await UserService.getProfile(userId);
  memCache.set(key, result, 60);
  return result;
}
