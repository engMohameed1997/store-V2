import { sealToken, openToken } from "@/lib/api/sealed-token";

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

const PURPOSE = "registration-token";
const TOKEN_TTL_MS = 30 * 60 * 1000;

export interface RegistrationData {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
}

export function sealRegistrationToken(data: RegistrationData): string {
  return sealToken(PURPOSE, data, TOKEN_TTL_MS);
}

/** Returns the registration data, or null if the token is forged, malformed or expired. */
export function openRegistrationToken(token: string): RegistrationData | null {
  const data = openToken(PURPOSE, token);
  if (!data) return null;
  const { email, passwordHash, firstName, lastName } = data;
  if (
    typeof email !== "string" || !email ||
    typeof passwordHash !== "string" || !passwordHash ||
    typeof firstName !== "string" || !firstName ||
    typeof lastName !== "string" || !lastName
  ) {
    return null;
  }
  return { email, passwordHash, firstName, lastName };
}
