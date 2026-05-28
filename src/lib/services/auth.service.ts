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
  RegisterByPhoneInput,
  RegisterByEmailInput,
  LoginInput,
  VerifyPhoneInput,
} from "@/lib/validators/auth";

const SALT_ROUNDS = 12;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;
const OTP_LENGTH = 6;
const OTP_EXPIRY_MS = 5 * 60 * 1000;

export class AuthService {
  static async registerByPhone(input: RegisterByPhoneInput) {
    const existing = await db.user.findUnique({ where: { phone: input.phone } });
    
    // Prevent user enumeration - always return same message
    if (existing) {
      // If user exists but not verified, resend OTP
      if (existing.status === "PENDING_VERIFICATION" && !existing.phoneVerified) {
        await this.sendPhoneOtp(input.phone, existing.id);
        return { message: "If the phone number is valid, verification code was sent" };
      }
      // If user already verified, don't reveal existence
      return { message: "If the phone number is valid, verification code was sent" };
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    const user = await db.user.create({
      data: {
        phone: input.phone,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        status: "PENDING_VERIFICATION",
        authProvider: "CREDENTIALS",
      },
      select: { id: true, phone: true, firstName: true, lastName: true, role: true },
    });

    await this.sendPhoneOtp(input.phone, user.id);

    return { user, message: "If the phone number is valid, verification code was sent" };
  }

  static async registerByEmail(input: RegisterByEmailInput) {
    const existing = await db.user.findUnique({ where: { email: input.email } });
    
    // Prevent user enumeration - always return same message
    if (existing) {
      return { message: "If the email is valid, verification instructions were sent" };
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    const user = await db.user.create({
      data: {
        email: input.email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        status: "PENDING_VERIFICATION",
        authProvider: "CREDENTIALS",
      },
      select: { id: true, email: true, firstName: true, lastName: true, role: true },
    });

    return { user, message: "If the email is valid, verification instructions were sent" };
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
        ? { email: lookupIdentifier }
        : { phone: lookupIdentifier },
    });

    if (!user) throw Errors.invalidCredentials();

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

    if (user.status === "BANNED") throw Errors.forbidden("Account is banned");
    if (user.status === "SUSPENDED") throw Errors.forbidden("Account is suspended");
    if (user.status === "PENDING_VERIFICATION") {
      throw Errors.forbidden("Please verify your account before logging in");
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
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
      },
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
      select: { id: true, role: true, status: true },
    });

    if (!user || user.status === "BANNED") {
      throw Errors.unauthorized("User not found or banned");
    }

    await db.apiToken.update({
      where: { tokenHash },
      data: { isRevoked: true },
    });

    const accessToken = generateAccessToken(user.id, user.role);
    const newRefreshToken = generateRefreshToken(user.id, user.role, payload.family);

    await storeRefreshToken(user.id, newRefreshToken, payload.family!, meta);

    return { accessToken, refreshToken: newRefreshToken };
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

  static async sendPhoneOtp(phone: string, userId?: string) {
    // Prevent OTP flood: max 3 active OTPs per phone in the expiry window
    const recentOtps = await db.phoneVerification.count({
      where: {
        phone,
        createdAt: { gte: new Date(Date.now() - OTP_EXPIRY_MS) },
      },
    });
    if (recentOtps >= 3) {
      throw Errors.tooManyRequests();
    }

    // Check total failed attempts across ALL recent records for this phone
    const totalAttempts = await db.phoneVerification.aggregate({
      where: {
        phone,
        verified: false,
        createdAt: { gte: new Date(Date.now() - LOCK_DURATION_MS) },
      },
      _sum: { attempts: true },
    });
    if ((totalAttempts._sum.attempts ?? 0) >= 10) {
      throw Errors.accountLocked();
    }

    const code = crypto.randomInt(100000, 999999).toString();
    const codeHash = hashToken(code);

    await db.phoneVerification.create({
      data: {
        userId,
        phone,
        code: codeHash,
        expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
      },
    });

    // TODO: integrate with SMS provider (e.g. Twilio, local Iraqi SMS gateway)
    if (process.env.NODE_ENV === "development") {
      console.log(`[DEV] OTP for ${phone}: ${code}`);
    }

    return { message: "Verification code sent" };
  }

  static async verifyPhone(input: VerifyPhoneInput) {
    const codeHash = hashToken(input.code);

    const verification = await db.phoneVerification.findFirst({
      where: {
        phone: input.phone,
        verified: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!verification) throw Errors.badRequest("Invalid or expired code");

    if (verification.attempts >= 5) {
      throw Errors.tooManyRequests();
    }

    await db.phoneVerification.update({
      where: { id: verification.id },
      data: { attempts: { increment: 1 } },
    });

    const isMatch = crypto.timingSafeEqual(
      Buffer.from(verification.code, "hex"),
      Buffer.from(codeHash, "hex")
    );
    if (!isMatch) {
      throw Errors.badRequest("Invalid verification code");
    }

    await db.phoneVerification.update({
      where: { id: verification.id },
      data: { verified: true },
    });

    if (verification.userId) {
      await db.user.update({
        where: { id: verification.userId },
        data: { phoneVerified: true, status: "ACTIVE" },
      });
    }

    return { verified: true };
  }

  static async forgotPassword(identifier: string) {
    const isEmail = identifier.includes("@");

    // Normalize Iraqi phone before lookup
    let lookupIdentifier = identifier;
    if (!isEmail) {
      const cleaned = identifier.replace(/^(\+964|00964|0)/, "");
      if (/^7[3-9]\d{8}$/.test(cleaned)) lookupIdentifier = `+964${cleaned}`;
    }

    const user = await db.user.findFirst({
      where: isEmail ? { email: lookupIdentifier } : { phone: lookupIdentifier },
    });

    // Always return success to prevent user enumeration
    if (!user) return { message: "If the account exists, reset instructions were sent" };

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(token);

    await db.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
    });

    if (isEmail) {
      // TODO: Send email
      if (process.env.NODE_ENV === "development") {
        console.log(`[DEV] Reset token for ${identifier}: ${token}`);
      }
    } else {
      await this.sendPhoneOtp(identifier, user.id);
    }

    return { message: "If the account exists, reset instructions were sent" };
  }

  static async resendOtp(phone: string) {
    const user = await db.user.findUnique({ where: { phone } });
    // Prevent enumeration – always return same message
    if (!user) return { message: "If the phone number is valid, a new code was sent" };

    await this.sendPhoneOtp(phone, user.id);
    return { message: "If the phone number is valid, a new code was sent" };
  }

  static async verifyEmail(tokenStr: string) {
    const tokenHash = hashToken(tokenStr);

    const verification = await db.emailVerification.findFirst({
      where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
    });

    if (!verification) throw Errors.badRequest("Invalid or expired verification link");

    await db.emailVerification.update({
      where: { id: verification.id },
      data: { usedAt: new Date() },
    });

    if (verification.userId) {
      await db.user.update({
        where: { id: verification.userId },
        data: { emailVerified: true, status: "ACTIVE" },
      });
    }

    return { verified: true };
  }

  static async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user || !user.passwordHash) throw Errors.badRequest("Cannot change password");

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw Errors.badRequest("Current password is incorrect");

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await db.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { message: "Password changed successfully" };
  }

  static async resetPassword(tokenStr: string, newPassword: string) {
    const tokenHash = hashToken(tokenStr);
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = await db.$transaction(async (tx: any) => {
      const resetToken = await tx.passwordResetToken.findFirst({
        where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
      });

      if (!resetToken) throw Errors.badRequest("Invalid or expired reset token");

      // Atomically mark as used to prevent race condition (double-use)
      const marked = await tx.passwordResetToken.updateMany({
        where: { id: resetToken.id, usedAt: null },
        data: { usedAt: new Date() },
      });
      if (marked.count === 0) throw Errors.badRequest("Token already used");

      await tx.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash, failedLoginAttempts: 0, lockedUntil: null },
      });

      return resetToken.userId;
    });

    await revokeAllUserTokens(userId);

    return { message: "Password reset successful" };
  }
}
