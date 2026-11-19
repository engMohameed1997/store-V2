import crypto from "crypto";

/**
 * Sealed registration token.
 *
 * Sign-up doesn't create a user until the email code is confirmed. The pending
 * details (email, password hash, names) travel with the visitor in this token,
 * encrypted and authenticated with AES-256-GCM, so:
 *  - nobody can reserve or squat an email they don't own, and
 *  - a second sign-up attempt for the same email can't replace the password of
 *    the person who actually confirms the code.
 */

const TOKEN_TTL_MS = 30 * 60 * 1000;

export interface RegistrationData {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
}

function getKey(): Buffer {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_ACCESS_SECRET is missing or too short (min 32 chars)");
  }
  return crypto.createHash("sha256").update(`registration-token:${secret}`).digest();
}

export function sealRegistrationToken(data: RegistrationData): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const payload = JSON.stringify({ ...data, exp: Date.now() + TOKEN_TTL_MS });
  const encrypted = Buffer.concat([cipher.update(payload, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64url");
}

/** Returns the registration data, or null if the token is forged, malformed or expired. */
export function openRegistrationToken(token: string): RegistrationData | null {
  try {
    const raw = Buffer.from(token, "base64url");
    if (raw.length < 29) return null;
    const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), raw.subarray(0, 12));
    decipher.setAuthTag(raw.subarray(12, 28));
    const json = Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString("utf8");
    const data = JSON.parse(json) as RegistrationData & { exp: number };
    if (typeof data.exp !== "number" || data.exp < Date.now()) return null;
    if (!data.email || !data.passwordHash || !data.firstName || !data.lastName) return null;
    return {
      email: data.email,
      passwordHash: data.passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
    };
  } catch {
    return null;
  }
}
