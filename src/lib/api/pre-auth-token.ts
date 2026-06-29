import jwt from "jsonwebtoken";

const PREAUTH_SECRET =
  process.env.JWT_SECRET || process.env.NEXT_PUBLIC_APP_URL || "pre-auth-dev-secret";
const PREAUTH_EXPIRY = "5m";

export function signPreAuthToken(phone: string): string {
  return jwt.sign({ phone, purpose: "pre-auth" }, PREAUTH_SECRET, {
    expiresIn: PREAUTH_EXPIRY,
  });
}

export function verifyPreAuthToken(token: string): { phone: string } | null {
  try {
    const decoded = jwt.verify(token, PREAUTH_SECRET) as {
      phone: string;
      purpose: string;
    };
    if (decoded.purpose !== "pre-auth" || !decoded.phone) return null;
    return { phone: decoded.phone };
  } catch {
    return null;
  }
}
