import crypto from "crypto";

/**
 * Small encrypted + authenticated (AES-256-GCM) tokens for short-lived state
 * that travels with the visitor (in the page or a cookie) instead of the
 * database. Each purpose derives its own key, so a token minted for one use
 * can't be replayed as another.
 */

function getKey(purpose: string): Buffer {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_ACCESS_SECRET is missing or too short (min 32 chars)");
  }
  return crypto.createHash("sha256").update(`${purpose}:${secret}`).digest();
}

export function sealToken(purpose: string, data: object, ttlMs: number): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(purpose), iv);
  const payload = JSON.stringify({ ...data, exp: Date.now() + ttlMs });
  const encrypted = Buffer.concat([cipher.update(payload, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64url");
}

/** Returns the payload, or null if the token is forged, malformed or expired. */
export function openToken(purpose: string, token: string): Record<string, unknown> | null {
  try {
    const raw = Buffer.from(token, "base64url");
    if (raw.length < 29) return null;
    const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(purpose), raw.subarray(0, 12));
    decipher.setAuthTag(raw.subarray(12, 28));
    const json = Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString("utf8");
    const data: unknown = JSON.parse(json);
    if (!data || typeof data !== "object") return null;
    const record = data as Record<string, unknown>;
    if (typeof record.exp !== "number" || record.exp < Date.now()) return null;
    return record;
  } catch {
    return null;
  }
}
