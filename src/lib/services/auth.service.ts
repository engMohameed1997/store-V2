import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { Errors } from "@/lib/api/errors";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken,
  storeRefreshToken,
  revokeTokenFamily,
  revokeAllUserTokens,
  isTokenRevoked,
} from "@/lib/api/jwt";
import type { LoginInput } from "@/lib/validators/auth";
import { USER_AUTH_SELECT } from "@/lib/selects/user.select";
import { toAuthUserDTO } from "@/lib/dto/user.dto";
import { GoogleSignInRejected, type GoogleProfile } from "@/lib/api/google-oauth";

const SALT_ROUNDS = 12;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

/** Emails are stored lowercased; match case-insensitively for older rows. */
function emailWhere(email: string) {
  return { email: { equals: email.trim(), mode: "insensitive" as const } };
}

/**
 * Customers sign in with Google only; email + password is kept for staff
 * accounts (admin panel), which are never allowed through Google.
 */
export class AuthService {
  static async login(
    input: LoginInput,
    meta: { ipAddress: string; userAgent: string }
  ) {
    const isEmail = input.identifier.includes("@");

    // Normalize Iraqi phone to E.164 format (+964XXXXXXXXX) before lookup
    let lookupIdentifier = input.identifier;
    if (!isEmail) {
      const cleaned = input.identifier.replace(/^(\+964|00964|0)/, "");
      if (/^7[3-9]\d{8}$/.test(cleaned)) {
        lookupIdentifier = `+964${cleaned}`;
      }
    }

    const user = await db.user.findFirst({
      where: isEmail
        ? emailWhere(lookupIdentifier)
        : { phone: lookupIdentifier },
      select: USER_AUTH_SELECT,
    });

    if (!user) {
      // Constant-time dummy compare to prevent user enumeration via timing
      await bcrypt.compare(input.password, "$2b$12$invalidhashXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
      throw Errors.invalidCredentials();
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw Errors.accountLocked(user.lockedUntil);
    }

    if (user.lockedUntil && user.lockedUntil <= new Date()) {
      await db.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
      user.failedLoginAttempts = 0;
    }

    if (!user.passwordHash) throw Errors.invalidCredentials();

    const valid = await bcrypt.compare(input.password, user.passwordHash);

    if (!valid) {
      const attempts = user.failedLoginAttempts + 1;
      const lockData =
        attempts >= MAX_LOGIN_ATTEMPTS
          ? { lockedUntil: new Date(Date.now() + LOCK_DURATION_MS), failedLoginAttempts: attempts }
          : { failedLoginAttempts: attempts };

      await db.user.update({ where: { id: user.id }, data: lockData });
      throw Errors.invalidCredentials();
    }

    if (user.status === "BANNED") throw Errors.forbidden("تم حظر هذا الحساب.");
    if (user.status === "SUSPENDED") throw Errors.forbidden("تم تعطيل هذا الحساب.");
    if (user.status === "PENDING_VERIFICATION") {
      throw Errors.forbidden("يجب تأكيد حسابك قبل تسجيل الدخول.");
    }
    // Checked only after the password, so it doesn't reveal which emails exist.
    if (user.role === "CUSTOMER") {
      throw Errors.forbidden("سجّل الدخول باستخدام حساب Google.");
    }

    await db.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: meta.ipAddress,
      },
    });

    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id, user.role);
    const rtPayload = verifyRefreshToken(refreshToken);

    await storeRefreshToken(user.id, refreshToken, rtPayload.family!, {
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      deviceName: input.deviceName,
      deviceId: input.deviceId,
    });

    return {
      accessToken,
      refreshToken,
      user: toAuthUserDTO(user),
    };
  }

  /**
   * "Continue with Google". Accounts are matched by Google's stable user id;
   * on first use an existing account with the same (Google-verified) email is
   * linked, otherwise a new customer account is created. Staff accounts keep
   * signing in with their password only.
   */
  static async loginWithGoogle(
    profile: GoogleProfile,
    meta: { ipAddress: string; userAgent: string }
  ) {
    const email = profile.email.trim().toLowerCase();
    const select = {
      id: true, email: true, phone: true, firstName: true, lastName: true,
      role: true, avatar: true, status: true, emailVerified: true,
    } as const;
    const assertAllowed = (u: { role: string; status: string }) => {
      if (u.role !== "CUSTOMER") throw new GoogleSignInRejected("staff");
      if (u.status === "BANNED" || u.status === "SUSPENDED") throw new GoogleSignInRejected("blocked");
    };

    const linked = await db.account.findUnique({
      where: { provider_providerAccountId: { provider: "GOOGLE", providerAccountId: profile.sub } },
      select: { user: { select } },
    });
    let user = linked?.user ?? null;

    if (user) {
      assertAllowed(user);
    } else {
      const existing = await db.user.findFirst({ where: emailWhere(email), select });

      if (existing) {
        assertAllowed(existing);
        // An unverified account may have been opened by someone else with this
        // email (before sign-up required a code). Google proved ownership, so
        // the unproven password and its sessions are dropped.
        user = await db.user.update({
          where: { id: existing.id },
          data: {
            emailVerified: true,
            ...(existing.status === "PENDING_VERIFICATION" ? { status: "ACTIVE" as const } : {}),
            ...(existing.emailVerified ? {} : { passwordHash: null }),
            accounts: { create: { provider: "GOOGLE", providerAccountId: profile.sub } },
          },
          select,
        });
        if (!existing.emailVerified) await revokeAllUserTokens(existing.id);
      } else {
        try {
          user = await db.user.create({
            data: {
              email,
              firstName: (profile.givenName || profile.name || email.split("@")[0]).slice(0, 50),
              lastName: (profile.familyName ?? "").slice(0, 50),
              status: "ACTIVE",
              emailVerified: true,
              authProvider: "GOOGLE",
              accounts: { create: { provider: "GOOGLE", providerAccountId: profile.sub } },
            },
            select,
          });
        } catch (err) {
          // Unique violation: the same Google account finished in a parallel request.
          if ((err as { code?: string })?.code === "P2002") {
            throw Errors.conflict("تم إنشاء الحساب بالفعل. حاول تسجيل الدخول مرة أخرى.");
          }
          throw err;
        }
      }
    }

    await db.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: meta.ipAddress,
      },
    });

    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id, user.role);
    const rtPayload = verifyRefreshToken(refreshToken);
    await storeRefreshToken(user.id, refreshToken, rtPayload.family!, meta);

    return {
      accessToken,
      refreshToken,
      user: toAuthUserDTO(user),
    };
  }

  static async refreshTokens(
    token: string,
    meta: { ipAddress: string; userAgent: string; deviceName?: string; deviceId?: string }
  ) {
    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      throw Errors.tokenExpired();
    }

    const tokenHash = hashToken(token);
    const revoked = await isTokenRevoked(tokenHash);

    if (revoked) {
      await revokeTokenFamily(payload.family!);
      throw Errors.tokenRevoked();
    }

    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true, status: true, email: true, phone: true, firstName: true, lastName: true, avatar: true },
    });

    if (!user || user.status === "BANNED" || user.status === "SUSPENDED") {
      throw Errors.unauthorized("الحساب غير موجود أو معطّل.");
    }

    await db.apiToken.update({
      where: { tokenHash },
      data: { isRevoked: true },
    });

    const accessToken = generateAccessToken(user.id, user.role);
    const newRefreshToken = generateRefreshToken(user.id, user.role, payload.family);

    await storeRefreshToken(user.id, newRefreshToken, payload.family!, meta);

    return {
      accessToken,
      refreshToken: newRefreshToken,
      user: toAuthUserDTO(user),
    };
  }

  static async logout(refreshToken: string) {
    try {
      const payload = verifyRefreshToken(refreshToken);
      await revokeTokenFamily(payload.family!);
    } catch {
      // Token already invalid, just return
    }
  }

  static async logoutAll(userId: string) {
    await revokeAllUserTokens(userId);
  }

  static async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true },
    });
    if (!user || !user.passwordHash) throw Errors.badRequest("تعذّر تغيير كلمة المرور.");

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw Errors.badRequest("كلمة المرور الحالية غير صحيحة.");

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await db.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { message: "تم تغيير كلمة المرور بنجاح." };
  }

}
