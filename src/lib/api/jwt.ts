import jwt from "jsonwebtoken";
import crypto from "crypto";
import { db } from "@/lib/db";

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY_DAYS = 7;
const REFRESH_TOKEN_EXPIRY = `${REFRESH_TOKEN_EXPIRY_DAYS}d`;
const REFRESH_TOKEN_EXPIRY_MS = REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
export const REFRESH_TOKEN_COOKIE_MAX_AGE = REFRESH_TOKEN_EXPIRY_MS / 1000; // seconds
export const ACCESS_TOKEN_COOKIE_MAX_AGE = 15 * 60; // 15 minutes in seconds

function getAccessSecret(): string {
  if (!ACCESS_TOKEN_SECRET || ACCESS_TOKEN_SECRET.length < 32) {
    throw new Error("JWT_ACCESS_SECRET is missing or too short (min 32 chars)");
  }
  return ACCESS_TOKEN_SECRET;
}

function getRefreshSecret(): string {
  if (!REFRESH_TOKEN_SECRET || REFRESH_TOKEN_SECRET.length < 32) {
    throw new Error("JWT_REFRESH_SECRET is missing or too short (min 32 chars)");
  }
  return REFRESH_TOKEN_SECRET;
}

export interface TokenPayload {
  userId: string;
  role: string;
  type: "access" | "refresh";
  family?: string;
}

export function generateAccessToken(userId: string, role: string): string {
  return jwt.sign(
    { userId, role, type: "access" } satisfies TokenPayload,
    getAccessSecret(),
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

export function generateRefreshToken(userId: string, role: string, existingFamily?: string): string {
  const family = existingFamily || crypto.randomUUID();
  return jwt.sign(
    { userId, role, type: "refresh", family } satisfies TokenPayload,
    getRefreshSecret(),
    { expiresIn: REFRESH_TOKEN_EXPIRY, jwtid: crypto.randomUUID() }
  );
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, getAccessSecret(), { algorithms: ["HS256"] }) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, getRefreshSecret(), { algorithms: ["HS256"] }) as TokenPayload;
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function storeRefreshToken(
  userId: string,
  token: string,
  family: string,
  meta: { ipAddress?: string; userAgent?: string; deviceName?: string; deviceId?: string }
): Promise<void> {
  await db.apiToken.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      tokenFamily: family,
      deviceName: meta.deviceName,
      deviceId: meta.deviceId,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
    },
  });
}

export async function revokeTokenFamily(family: string): Promise<void> {
  await db.apiToken.updateMany({
    where: { tokenFamily: family },
    data: { isRevoked: true },
  });
}

export async function revokeAllUserTokens(userId: string): Promise<void> {
  await db.apiToken.updateMany({
    where: { userId },
    data: { isRevoked: true },
  });
}

export async function isTokenRevoked(tokenHash: string): Promise<boolean> {
  const token = await db.apiToken.findUnique({
    where: { tokenHash },
    select: { isRevoked: true, expiresAt: true },
  });

  if (!token) return true;
  if (token.isRevoked) return true;
  if (token.expiresAt < new Date()) return true;

  return false;
}

export async function rotateRefreshToken(
  oldToken: string,
  userId: string,
  role: string,
  meta: { ipAddress?: string; userAgent?: string; deviceName?: string; deviceId?: string }
): Promise<{ accessToken: string; refreshToken: string }> {
  const oldPayload = verifyRefreshToken(oldToken);
  const oldHash = hashToken(oldToken);
  const revoked = await isTokenRevoked(oldHash);

  if (revoked) {
    await revokeTokenFamily(oldPayload.family!);
    throw new Error("TOKEN_REUSE_DETECTED");
  }

  await db.apiToken.update({
    where: { tokenHash: oldHash },
    data: { isRevoked: true },
  });

  const accessToken = generateAccessToken(userId, role);
  const refreshToken = generateRefreshToken(userId, role, oldPayload.family);

  await storeRefreshToken(userId, refreshToken, oldPayload.family!, meta);

  return { accessToken, refreshToken };
}
