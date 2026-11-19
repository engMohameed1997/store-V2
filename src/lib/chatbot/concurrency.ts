import { redis } from "@/lib/redis";
import { CHAT_LIMITS } from "./config";

function getLockKey(identifier: string): string {
  return `chatbot:lock:${identifier}`;
}

export async function acquireLock(identifier: string): Promise<boolean> {
  const key = getLockKey(identifier);
  try {
    // SET NX returns "OK" when acquired, null when the lock is already held.
    const result = await redis.set(key, "1", {
      nx: true,
      ex: CHAT_LIMITS.CONCURRENCY_LOCK_TTL_SEC,
    });
    return result === "OK";
  } catch {
    // Store unavailable — don't block chat on the lock itself; quotas still apply.
    return true;
  }
}

export async function releaseLock(identifier: string): Promise<void> {
  const key = getLockKey(identifier);
  await redis.del(key);
}
