import crypto from "crypto";
import { sealToken, openToken } from "@/lib/api/sealed-token";

/**
 * "Continue with Google" — OpenID Connect authorization-code flow with PKCE,
 * state and nonce. The per-attempt secrets live in a short-lived sealed cookie
 * (no server-side session needed).
 */

const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const ISSUERS = ["https://accounts.google.com", "accounts.google.com"];
const STATE_PURPOSE = "google-oauth-state";

export const GOOGLE_STATE_COOKIE = "g_oauth";
export const GOOGLE_STATE_COOKIE_PATH = "/api/v1/auth/google";
export const GOOGLE_STATE_TTL_SEC = 10 * 60;

export interface GoogleAuthState {
  state: string;
  verifier: string;
  nonce: string;
  next: string;
}

export interface GoogleProfile {
  sub: string;
  email: string;
  givenName?: string;
  familyName?: string;
  name?: string;
}

/** Sign-in refused by store policy (not a technical failure). */
export class GoogleSignInRejected extends Error {
  constructor(public reason: "blocked" | "staff") {
    super(`Google sign-in rejected: ${reason}`);
  }
}

/**
 * The callback URL registered in Google Cloud. Defaults to the site's public
 * origin (first https entry of ALLOWED_ORIGINS).
 */
function getRedirectUri(): string | null {
  if (process.env.GOOGLE_REDIRECT_URI) return process.env.GOOGLE_REDIRECT_URI;
  const origins = (process.env.ALLOWED_ORIGINS ?? "").split(",").map((o) => o.trim()).filter(Boolean);
  const origin = origins.find((o) => o.startsWith("https://")) ?? origins[0];
  return origin ? `${origin.replace(/\/+$/, "")}${GOOGLE_STATE_COOKIE_PATH}/callback` : null;
}

export function isGoogleAuthConfigured(): boolean {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && getRedirectUri());
}

function randomToken(bytes: number): string {
  return crypto.randomBytes(bytes).toString("base64url");
}

/** Builds the Google consent URL and the sealed state cookie value for one attempt. */
export function startGoogleAuth(next: string): { url: string; cookie: string } {
  const state = randomToken(32);
  const verifier = randomToken(32);
  const nonce = randomToken(16);

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: getRedirectUri()!,
    response_type: "code",
    scope: "openid email profile",
    state,
    nonce,
    code_challenge: crypto.createHash("sha256").update(verifier).digest("base64url"),
    code_challenge_method: "S256",
    prompt: "select_account",
  });

  const data: GoogleAuthState = { state, verifier, nonce, next };
  return {
    url: `${AUTH_ENDPOINT}?${params}`,
    cookie: sealToken(STATE_PURPOSE, data, GOOGLE_STATE_TTL_SEC * 1000),
  };
}

export function readGoogleAuthState(cookie: string | undefined): GoogleAuthState | null {
  if (!cookie) return null;
  const data = openToken(STATE_PURPOSE, cookie);
  if (!data) return null;
  const { state, verifier, nonce, next } = data;
  if (typeof state !== "string" || typeof verifier !== "string" || typeof nonce !== "string" || typeof next !== "string") {
    return null;
  }
  return { state, verifier, nonce, next };
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

function decodeJwtPayload(jwt: string): Record<string, unknown> {
  const parts = jwt.split(".");
  if (parts.length !== 3) throw new Error("Malformed ID token");
  return JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
}

/** Exchanges the authorization code and returns the verified Google profile. */
export async function exchangeGoogleCode(code: string, saved: GoogleAuthState): Promise<GoogleProfile> {
  const clientId = process.env.GOOGLE_CLIENT_ID!;

  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: getRedirectUri()!,
      grant_type: "authorization_code",
      code_verifier: saved.verifier,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Google token exchange failed (${res.status}): ${body.slice(0, 200)}`);
  }

  const { id_token: idToken } = (await res.json()) as { id_token?: unknown };
  if (typeof idToken !== "string") throw new Error("Google response has no ID token");

  // The ID token comes straight from Google's token endpoint over TLS, which
  // OIDC Core §3.1.3.7 accepts in place of a signature check. Claims are still
  // validated here.
  const claims = decodeJwtPayload(idToken);
  const aud = Array.isArray(claims.aud) ? claims.aud : [claims.aud];

  if (!ISSUERS.includes(claims.iss as string)) throw new Error("ID token: bad issuer");
  if (!aud.includes(clientId)) throw new Error("ID token: bad audience");
  if (typeof claims.exp !== "number" || claims.exp * 1000 < Date.now()) throw new Error("ID token: expired");
  if (typeof claims.nonce !== "string" || !safeEqual(claims.nonce, saved.nonce)) throw new Error("ID token: bad nonce");
  if (typeof claims.sub !== "string" || !claims.sub) throw new Error("ID token: no subject");
  if (typeof claims.email !== "string" || claims.email_verified !== true) {
    throw new Error("ID token: email missing or not verified");
  }

  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
  return {
    sub: claims.sub,
    email: claims.email,
    givenName: str(claims.given_name),
    familyName: str(claims.family_name),
    name: str(claims.name),
  };
}
