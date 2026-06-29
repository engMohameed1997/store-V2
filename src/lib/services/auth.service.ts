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
  LoginInput,
  VerifyPhoneInput,
} from "@/lib/validators/auth";
import { verifyFirebaseToken, isFirebaseAdminConfigured, deleteFirebaseUser } from "@/lib/firebase/admin";

const SALT_ROUNDS = 12;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

export class AuthService {
  static async registerByPhone(
    input: RegisterByPhoneInput,
    meta: { ipAddress: string; userAgent: string }
  ) {
    if (!isFirebaseAdminConfigured()) {
      throw Errors.internal("تعذّر إنشاء الحساب. حاول لاحقاً.");
    }

    // Verify the Firebase ID token — this confirms the phone number was OTP-verified by Firebase
    const decodedToken = await verifyFirebaseToken(input.firebaseIdToken);
    const firebaseUid = decodedToken.uid;
    const verifiedPhone = decodedToken.phone_number;

    if (!verifiedPhone) {
      throw Errors.badRequest("تعذّر التحقق من الرقم. حاول لاحقاً.");
    }

    // Ensure the verified phone matches the requested phone
    const normalizedInputPhone = input.phone;
    const normalizedFirebasePhone = verifiedPhone.replace(/^\+964/, "0").replace(/^00964/, "0");
    const normalizedInputPhoneClean = normalizedInputPhone.replace(/^\+964/, "0").replace(/^00964/, "0");
    if (normalizedFirebasePhone !== normalizedInputPhoneClean) {
      throw Errors.badRequest("رقم الهاتف غير مطابق.");
    }

    try {
      // Check if user already exists (check both +964 and 0 prefix formats)
      const altPhone = input.phone.replace(/^\+964/, "0");
      const existing = await db.user.findFirst({
        where: { phone: { in: [input.phone, altPhone] } },
      });
      if (existing) {
        throw Errors.conflict("رقم الهاتف مستخدم بالفعل.");
      }

      const existingUid = await db.user.findUnique({ where: { firebaseUid } });
      if (existingUid) {
        throw Errors.conflict("رقم الهاتف مستخدم بالفعل.");
      }

      const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

      const user = await db.user.create({
        data: {
          phone: input.phone,
          firebaseUid,
          passwordHash,
          firstName: input.firstName,
          lastName: input.lastName,
          status: "ACTIVE",
          phoneVerified: true,
          authProvider: "PHONE",
        },
        select: { id: true, phone: true, firstName: true, lastName: true, role: true, avatar: true },
      });

      const accessToken = generateAccessToken(user.id, user.role);
      const refreshToken = generateRefreshToken(user.id, user.role);
      const rtPayload = verifyRefreshToken(refreshToken);

      await storeRefreshToken(user.id, refreshToken, rtPayload.family!, meta);

      return {
        user: {
          id: user.id,
          phone: user.phone,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          avatar: user.avatar,
        },
        accessToken,
        refreshToken,
        message: "تم إنشاء الحساب بنجاح.",
      };
    } catch (err) {
      // Clean up the orphaned Firebase user if DB operations fail
      try {
        await deleteFirebaseUser(firebaseUid);
      } catch {
        // Best-effort cleanup; log but don't mask the original error
      }
      throw err;
    }
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

  static async verifyPhone(input: VerifyPhoneInput) {
    if (!isFirebaseAdminConfigured()) {
      throw Errors.badRequest("تعذّر التحقق. حاول لاحقاً.");
    }

    const decodedToken = await verifyFirebaseToken(input.firebaseIdToken);
    const verifiedPhone = decodedToken.phone_number;

    if (!verifiedPhone) {
      throw Errors.badRequest("تعذّر التحقق من الرقم. حاول لاحقاً.");
    }

    const normalizedFirebasePhone = verifiedPhone.replace(/^\+964/, "0").replace(/^00964/, "0");
    const normalizedInputPhone = input.phone.replace(/^\+964/, "0").replace(/^00964/, "0");
    if (normalizedFirebasePhone !== normalizedInputPhone) {
      throw Errors.badRequest("رقم الهاتف غير مطابق.");
    }

    const user = await db.user.findUnique({ where: { phone: input.phone } });
    if (!user) {
      throw Errors.notFound("المستخدم");
    }
    await db.user.update({
      where: { id: user.id },
      data: { phoneVerified: true, status: "ACTIVE", firebaseUid: decodedToken.uid },
    });

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
    if (!user) return { message: "إذا كان الحساب موجوداً، تم إرسال تعليمات الاستعادة." };

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
      // Phone password reset: return the reset token for client-side Firebase OTP flow
      // The client will verify the phone via Firebase, then call resetPassword with the token
      if (process.env.NODE_ENV === "development") {
        console.log(`[DEV] Reset token for ${identifier}: ${token}`);
      }
    }

    return { message: "إذا كان الحساب موجوداً، تم إرسال تعليمات الاستعادة." };
  }

  static async verifyEmail(tokenStr: string) {
    const tokenHash = hashToken(tokenStr);

    const verification = await db.emailVerification.findFirst({
      where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
    });

    if (!verification) throw Errors.badRequest("رابط التحقق غير صالح أو منتهي الصلاحية.");

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
        where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
      });

      if (!resetToken) throw Errors.badRequest("رمز الاستعادة غير صالح أو منتهي الصلاحية.");

      // Atomically mark as used to prevent race condition (double-use)
      const marked = await tx.passwordResetToken.updateMany({
        where: { id: resetToken.id, usedAt: null },
        data: { usedAt: new Date() },
      });
      if (marked.count === 0) throw Errors.badRequest("تم استخدام هذا الرمز بالفعل.");

      await tx.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash, failedLoginAttempts: 0, lockedUntil: null },
      });

      return resetToken.userId;
    });

    await revokeAllUserTokens(userId);

    return { message: "تم استعادة كلمة المرور بنجاح." };
  }
}
