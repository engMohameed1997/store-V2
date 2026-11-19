import bcrypt from "bcryptjs";
import crypto from "crypto";
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
import type {
  RegisterInput,
  LoginInput,
  VerifyResetOtpInput,
} from "@/lib/validators/auth";
import { USER_AUTH_SELECT } from "@/lib/selects/user.select";
import { toAuthUserDTO } from "@/lib/dto/user.dto";
import { sealRegistrationToken, openRegistrationToken } from "@/lib/api/registration-token";
import { sendMail } from "@/lib/email/mailer";
import { verificationCodeEmail, passwordResetCodeEmail } from "@/lib/email/templates";
import { GoogleSignInRejected, type GoogleProfile } from "@/lib/api/google-oauth";

const SALT_ROUNDS = 12;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;
const RESET_TOKEN_EXPIRY_MS = 5 * 60 * 1000;

// Emailed 6-digit codes (sign-up confirmation + password reset)
const CODE_TTL_MINUTES = 10;
const CODE_TTL_MS = CODE_TTL_MINUTES * 60 * 1000;
const CODE_RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_CODES_PER_HOUR = 5;
const MAX_CODE_ATTEMPTS = 5;

const CODE_INVALID = "رمز التحقق غير صحيح أو منتهي الصلاحية.";
const CODE_TOO_MANY_ATTEMPTS = "تجاوزت عدد المحاولات. اطلب رمزاً جديداً.";
const RESET_SENT = "إذا كان البريد مسجلاً لدينا، أرسلنا إليه رمز التحقق.";

function generateCode(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/** Code hashes are bound to their row id, so equal codes never collide. */
function hashCode(rowId: string, code: string): string {
  return hashToken(`${rowId}:${code}`);
}

function safeEqualHex(a: string, b: string): boolean {
  const ab = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

/** Emails are stored lowercased; match case-insensitively for older rows. */
function emailWhere(email: string) {
  return { email: { equals: email.trim(), mode: "insensitive" as const } };
}

/** True when another code may be sent now (60s cooldown, max 5 per hour). */
function canSendAnother(recentCreatedAt: Date[]): boolean {
  if (recentCreatedAt.length >= MAX_CODES_PER_HOUR) return false;
  const latest = recentCreatedAt[0];
  return !latest || Date.now() - latest.getTime() >= CODE_RESEND_COOLDOWN_MS;
}

export class AuthService {
  /**
   * Step 1 of sign-up: validates the details, emails a confirmation code and
   * returns a sealed registration token. No user row is created yet.
   */
  static async register(input: RegisterInput) {
    const existing = await db.user.findFirst({ where: emailWhere(input.email), select: { id: true } });
    if (existing) {
      throw Errors.conflict("البريد الإلكتروني مستخدم بالفعل. سجّل الدخول أو استعد كلمة المرور.");
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
    const registrationToken = sealRegistrationToken({
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
    });

    await this.sendVerificationCode(input.email, input.firstName, { force: true });

    return { registrationToken, email: input.email, message: "أرسلنا رمز التأكيد إلى بريدك الإلكتروني." };
  }

  static async resendVerificationCode(registrationToken: string) {
    const pending = openRegistrationToken(registrationToken);
    if (!pending) throw Errors.badRequest("انتهت صلاحية التسجيل. أعد إنشاء الحساب.");

    const existing = await db.user.findFirst({ where: emailWhere(pending.email), select: { id: true } });
    if (existing) throw Errors.conflict("البريد الإلكتروني مستخدم بالفعل. سجّل الدخول.");

    const sent = await this.sendVerificationCode(pending.email, pending.firstName);
    if (!sent) throw Errors.tooManyRequests(60);
    return { message: "تم إرسال رمز جديد إلى بريدك الإلكتروني." };
  }

  /** Step 2 of sign-up: checks the emailed code and creates the active account. */
  static async verifyEmailAndCreate(
    registrationToken: string,
    code: string,
    meta: { ipAddress: string; userAgent: string }
  ) {
    const pending = openRegistrationToken(registrationToken);
    if (!pending) throw Errors.badRequest("انتهت صلاحية التسجيل. أعد إنشاء الحساب.");

    const verification = await db.emailVerification.findFirst({
      where: { email: pending.email, usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });
    if (!verification) throw Errors.badRequest(CODE_INVALID);
    if (verification.attempts >= MAX_CODE_ATTEMPTS) throw Errors.badRequest(CODE_TOO_MANY_ATTEMPTS);

    if (!safeEqualHex(hashCode(verification.id, code), verification.tokenHash)) {
      await db.emailVerification.update({
        where: { id: verification.id },
        data: { attempts: { increment: 1 } },
      });
      throw Errors.badRequest(CODE_INVALID);
    }

    // Single use — the conditional update wins only once under concurrency.
    const claimed = await db.emailVerification.updateMany({
      where: { id: verification.id, usedAt: null },
      data: { usedAt: new Date() },
    });
    if (claimed.count === 0) throw Errors.badRequest(CODE_INVALID);

    const existing = await db.user.findFirst({ where: emailWhere(pending.email), select: { id: true } });
    if (existing) throw Errors.conflict("البريد الإلكتروني مستخدم بالفعل. سجّل الدخول.");

    let user;
    try {
      user = await db.user.create({
        data: {
          email: pending.email,
          passwordHash: pending.passwordHash,
          firstName: pending.firstName,
          lastName: pending.lastName,
          status: "ACTIVE",
          emailVerified: true,
          authProvider: "CREDENTIALS",
          lastLoginAt: new Date(),
          lastLoginIp: meta.ipAddress,
        },
        select: { id: true, email: true, phone: true, firstName: true, lastName: true, role: true, avatar: true },
      });
    } catch (err) {
      // Unique violation: the same email was confirmed in a parallel request.
      if ((err as { code?: string })?.code === "P2002") {
        throw Errors.conflict("البريد الإلكتروني مستخدم بالفعل. سجّل الدخول.");
      }
      throw err;
    }

    await db.emailVerification.update({ where: { id: verification.id }, data: { userId: user.id } });

    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id, user.role);
    const rtPayload = verifyRefreshToken(refreshToken);
    await storeRefreshToken(user.id, refreshToken, rtPayload.family!, meta);

    return {
      user: toAuthUserDTO(user),
      accessToken,
      refreshToken,
      message: "تم إنشاء الحساب بنجاح.",
    };
  }

  /**
   * Emails a fresh sign-up code (invalidating older ones). Returns false when
   * throttled. `force` skips the cooldown (used on a new sign-up submission),
   * the hourly cap still applies.
   */
  private static async sendVerificationCode(
    email: string,
    name: string,
    opts: { force?: boolean } = {}
  ): Promise<boolean> {
    const recent = await db.emailVerification.findMany({
      where: { email, createdAt: { gt: new Date(Date.now() - 60 * 60 * 1000) } },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
    const allowed = opts.force ? recent.length < MAX_CODES_PER_HOUR : canSendAnother(recent.map((r) => r.createdAt));
    if (!allowed) {
      if (opts.force) throw Errors.tooManyRequests();
      return false;
    }

    await db.emailVerification.updateMany({ where: { email, usedAt: null }, data: { usedAt: new Date() } });

    const id = crypto.randomUUID();
    const code = generateCode();
    await db.emailVerification.create({
      data: { id, email, tokenHash: hashCode(id, code), expiresAt: new Date(Date.now() + CODE_TTL_MS) },
    });

    try {
      await sendMail(verificationCodeEmail(email, name, code, CODE_TTL_MINUTES));
    } catch (err) {
      console.error("[auth] failed to send verification email", err);
      await db.emailVerification.delete({ where: { id } }).catch(() => {});
      throw Errors.internal("تعذّر إرسال البريد الإلكتروني. حاول لاحقاً.");
    }
    return true;
  }

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

  static async forgotPassword(email: string) {
    const user = await db.user.findFirst({
      where: { ...emailWhere(email), deletedAt: null },
      select: { id: true, email: true, firstName: true },
    });

    // Always return the same message to prevent user enumeration
    if (!user?.email) return { message: RESET_SENT };

    const recent = await db.passwordResetToken.findMany({
      where: { userId: user.id, createdAt: { gt: new Date(Date.now() - 60 * 60 * 1000) } },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
    if (!canSendAnother(recent.map((r) => r.createdAt))) return { message: RESET_SENT };

    // Invalidate all previous unused tokens for this user
    await db.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const id = crypto.randomUUID();
    const code = generateCode();
    await db.passwordResetToken.create({
      data: {
        id,
        userId: user.id,
        otpCodeHash: hashCode(id, code),
        attempts: 0,
        expiresAt: new Date(Date.now() + CODE_TTL_MS),
      },
    });

    try {
      await sendMail(passwordResetCodeEmail(user.email, user.firstName, code, CODE_TTL_MINUTES));
    } catch (err) {
      console.error("[auth] failed to send password reset email", err);
      await db.passwordResetToken.delete({ where: { id } }).catch(() => {});
    }

    return { message: RESET_SENT };
  }

  static async verifyResetOtp(input: VerifyResetOtpInput) {
    const user = await db.user.findFirst({
      where: { ...emailWhere(input.email), deletedAt: null },
      select: { id: true },
    });
    // Generic error to avoid account enumeration
    if (!user) throw Errors.badRequest(CODE_INVALID);

    const row = await db.passwordResetToken.findFirst({
      where: {
        userId: user.id,
        usedAt: null,
        verifiedAt: null,
        otpCodeHash: { not: null },
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });
    if (!row?.otpCodeHash) throw Errors.badRequest(CODE_INVALID);
    if (row.attempts >= MAX_CODE_ATTEMPTS) throw Errors.badRequest(CODE_TOO_MANY_ATTEMPTS);

    if (!safeEqualHex(hashCode(row.id, input.code), row.otpCodeHash)) {
      await db.passwordResetToken.update({ where: { id: row.id }, data: { attempts: { increment: 1 } } });
      throw Errors.badRequest(CODE_INVALID);
    }

    // Exchange the code for a short-lived reset token (single use)
    const token = crypto.randomBytes(32).toString("hex");
    const claimed = await db.passwordResetToken.updateMany({
      where: { id: row.id, verifiedAt: null, usedAt: null },
      data: {
        tokenHash: hashToken(token),
        verifiedAt: new Date(),
        expiresAt: new Date(Date.now() + RESET_TOKEN_EXPIRY_MS),
      },
    });
    if (claimed.count === 0) throw Errors.badRequest(CODE_INVALID);

    return { token, message: "تم التحقق بنجاح. يمكنك الآن تعيين كلمة مرور جديدة." };
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

  static async resetPassword(tokenStr: string, newPassword: string) {
    const tokenHash = hashToken(tokenStr);
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = await db.$transaction(async (tx: any) => {
      const resetToken = await tx.passwordResetToken.findFirst({
        where: {
          tokenHash,
          usedAt: null,
          verifiedAt: { not: null },
          expiresAt: { gt: new Date() },
        },
      });

      if (!resetToken) throw Errors.badRequest("رمز إعادة التعيين غير صالح أو منتهي الصلاحية.");

      // Atomically mark as used to prevent race condition (double-use)
      const marked = await tx.passwordResetToken.updateMany({
        where: { id: resetToken.id, usedAt: null },
        data: { usedAt: new Date() },
      });
      if (marked.count === 0) throw Errors.badRequest("تم استخدام هذا الرمز بالفعل.");

      await tx.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash, failedLoginAttempts: 0, lockedUntil: null, emailVerified: true },
      });

      return resetToken.userId;
    });

    await revokeAllUserTokens(userId);

    return { message: "تم استعادة كلمة المرور بنجاح." };
  }
}
