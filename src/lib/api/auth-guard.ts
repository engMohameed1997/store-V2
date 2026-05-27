import { NextRequest } from "next/server";
import { verifyAccessToken, TokenPayload } from "./jwt";
import { Errors } from "./errors";
import { UserRole } from "@/generated/prisma";
import { db } from "@/lib/db";

export interface AuthUser {
  userId: string;
  role: UserRole;
}

export function extractToken(request: NextRequest): string {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw Errors.unauthorized("Missing or invalid Authorization header");
  }
  return authHeader.slice(7);
}

export async function requireAuth(request: NextRequest): Promise<AuthUser> {
  const token = extractToken(request);
  let payload: TokenPayload;

  try {
    payload = verifyAccessToken(token);
  } catch {
    throw Errors.unauthorized("Invalid or expired token");
  }

  if (payload.type !== "access") {
    throw Errors.unauthorized("Invalid token type");
  }

  const user = await db.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, role: true, status: true, deletedAt: true },
  });

  if (!user || user.deletedAt) {
    throw Errors.unauthorized("User not found");
  }

  if (user.status === "BANNED" || user.status === "SUSPENDED" || user.status === "PENDING_VERIFICATION") {
    throw Errors.forbidden("Account is suspended, banned, or pending verification");
  }

  return { userId: user.id, role: user.role };
}

export async function requireRole(
  request: NextRequest,
  ...roles: UserRole[]
): Promise<AuthUser> {
  const authUser = await requireAuth(request);

  if (!roles.includes(authUser.role)) {
    throw Errors.forbidden("Insufficient permissions");
  }

  return authUser;
}

export async function requireAdmin(request: NextRequest): Promise<AuthUser> {
  return requireRole(request, "ADMIN", "SUPER_ADMIN");
}

export async function requireSuperAdmin(request: NextRequest): Promise<AuthUser> {
  return requireRole(request, "SUPER_ADMIN");
}

export async function optionalAuth(request: NextRequest): Promise<AuthUser | null> {
  try {
    const token = extractToken(request);
    const payload = verifyAccessToken(token);
    if (payload.type !== "access") return null;

    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true, status: true, deletedAt: true },
    });

    if (!user || user.deletedAt) return null;
    if (user.status === "BANNED" || user.status === "SUSPENDED" || user.status === "PENDING_VERIFICATION") return null;

    return { userId: user.id, role: user.role };
  } catch {
    return null;
  }
}

export function getClientIp(request: NextRequest): string {
  // In production behind a trusted reverse proxy (e.g. Vercel, Cloudflare, Nginx),
  // use the LAST entry before the proxy or a platform-specific header.
  // NEVER trust the raw X-Forwarded-For from the client without proxy validation.
  const trustedProxyHeader = process.env.TRUSTED_IP_HEADER; // e.g. "cf-connecting-ip", "x-vercel-forwarded-for"

  if (trustedProxyHeader) {
    const trustedIp = request.headers.get(trustedProxyHeader)?.split(",")[0]?.trim();
    if (trustedIp) return trustedIp;
  }

  // Fallback: use the rightmost IP in X-Forwarded-For (closest to proxy) if we know we're behind a proxy
  if (process.env.BEHIND_REVERSE_PROXY === "true") {
    const xff = request.headers.get("x-forwarded-for");
    if (xff) {
      const ips = xff.split(",").map((ip) => ip.trim());
      // Rightmost non-private IP is the most trustworthy
      return ips[ips.length - 1] || "unknown";
    }
  }

  // In production without explicit proxy config, do NOT trust client-supplied headers.
  // This prevents IP spoofing via X-Forwarded-For manipulation.
  if (process.env.NODE_ENV === "production") {
    console.warn(
      "[SECURITY] No TRUSTED_IP_HEADER or BEHIND_REVERSE_PROXY configured. " +
      "Client IP resolution is unreliable. Set these env vars for production."
    );
    return "unknown";
  }

  // Development only: trust first XFF entry for convenience
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1";
}

export function getUserAgent(request: NextRequest): string {
  return request.headers.get("user-agent") || "unknown";
}
