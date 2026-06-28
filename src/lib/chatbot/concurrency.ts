import { redis } from "@/lib/redis";
import { CHAT_LIMITS } from "./config";

function getLockKey(identifier: string): string {
  return `chatbot:lock:${identifier}`;
}

export async function acquireLock(identifier: string): Promise<boolean> {
  const key = getLockKey(identifier);
  const result = await redis.set(key, "1", {
    nx: true,
    ex: CHAT_LIMITS.CONCURRENCY_LOCK_TTL_SEC,
  });
  // result === "OK" when Redis is active and lock acquired
  // result === null when Redis is not configured (no-op fallback) — allow through
  return result === "OK" || result === null;
}

export async function releaseLock(identifier: string): Promise<void> {
  const key = getLockKey(identifier);
  await redis.del(key);
}
