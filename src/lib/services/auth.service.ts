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
  VerifyResetOtpInput,
} from "@/lib/validators/auth";
import { verifyFirebaseToken, isFirebaseAdminConfigured, deleteFirebaseUser } from "@/lib/firebase/admin";
import { normalizeIraqiPhone } from "@/lib/firebase/client";
import { USER_AUTH_SELECT, USER_ID_ONLY } from "@/lib/selects/user.select";
import { toAuthUserDTO } from "@/lib/dto/user.dto";

const SALT_ROUNDS = 12;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;
const RESET_TOKEN_EXPIRY_MS = 5 * 60 * 1000;

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
    const { local: firebaseLocal } = normalizeIraqiPhone(verifiedPhone);
    const { local: inputLocal } = normalizeIraqiPhone(input.phone);
    if (firebaseLocal !== inputLocal) {
      throw Errors.badRequest("رقم الهاتف غير مطابق.");
    }

    try {
      // Check if user already exists (check both +964 and 0 prefix formats)
      const { e164, local } = normalizeIraqiPhone(input.phone);
      const existing = await db.user.findFirst({
        where: { phone: { in: [e164, local] } },
        select: USER_ID_ONLY,
      });
      if (existing) {
        throw Errors.conflict("رقم الهاتف مستخدم بالفعل.");
      }

      const existingUid = await db.user.findUnique({ where: { firebaseUid }, select: USER_ID_ONLY });
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
        user: toAuthUserDTO(user),
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

  static async verifyPhone(input: VerifyPhoneInput) {
    if (!isFirebaseAdminConfigured()) {
      throw Errors.badRequest("تعذّر التحقق. حاول لاحقاً.");
    }

    const decodedToken = await verifyFirebaseToken(input.firebaseIdToken);
    const verifiedPhone = decodedToken.phone_number;

    if (!verifiedPhone) {
      throw Errors.badRequest("تعذّر التحقق من الرقم. حاول لاحقاً.");
    }

    const { local: firebaseLocal } = normalizeIraqiPhone(verifiedPhone);
    const { local: inputLocal } = normalizeIraqiPhone(input.phone);
    if (firebaseLocal !== inputLocal) {
      throw Errors.badRequest("رقم الهاتف غير مطابق.");
    }

    const { e164 } = normalizeIraqiPhone(input.phone);
    const user = await db.user.findUnique({ where: { phone: e164 }, select: USER_ID_ONLY });
    if (!user) {
      throw Errors.notFound("المستخدم");
    }
    await db.user.update({
      where: { id: user.id },
      data: { phoneVerified: true, status: "ACTIVE", firebaseUid: decodedToken.uid },
    });

    return { verified: true };
  }

  static async forgotPassword(phone: string) {
    const { e164, local } = normalizeIraqiPhone(phone);

    const user = await db.user.findFirst({
      where: { phone: { in: [e164, local] } },
      select: { id: true },
    });

    // Always return the same message to prevent user enumeration
    if (!user) {
      return { message: "إذا كان الحساب موجوداً، تم إرسال رمز التحقق إلى رقمك." };
    }

    // Invalidate all previous unused tokens for this user
    await db.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    // OTP is sent by Firebase client-side (signInWithPhoneNumber)
    // No server-side OTP generation needed

    return { message: "إذا كان الحساب موجوداً، تم إرسال رمز التحقق إلى رقمك." };
  }

  static async verifyResetOtp(input: VerifyResetOtpInput) {
    if (!isFirebaseAdminConfigured()) {
      throw Errors.badRequest("تعذّر التحقق. حاول لاحقاً.");
    }

    // Verify the Firebase ID token — this confirms the phone number was OTP-verified by Firebase
    const decodedToken = await verifyFirebaseToken(input.firebaseIdToken);
    const verifiedPhone = decodedToken.phone_number;

    if (!verifiedPhone) {
      throw Errors.badRequest("تعذّر التحقق من الرقم. حاول لاحقاً.");
    }

    // Ensure the verified phone matches the requested phone
    const { local: firebaseLocal } = normalizeIraqiPhone(verifiedPhone);
    const { local: inputLocal } = normalizeIraqiPhone(input.phone);
    if (firebaseLocal !== inputLocal) {
      throw Errors.badRequest("رقم الهاتف غير مطابق.");
    }

    const { e164, local } = normalizeIraqiPhone(input.phone);

    // Check if user exists — generic error to avoid account enumeration
    const user = await db.user.findFirst({
      where: { phone: { in: [e164, local] } },
      select: { id: true },
    });

    if (!user) {
      throw Errors.badRequest("رمز التحقق غير صحيح أو منتهي الصلاحية.");
    }

    // Generate a reset token
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(token);

    await db.passwordResetToken.create({
      data: {
        userId: user.id,
        phone: e164,
        tokenHash,
        attempts: 0,
        verifiedAt: new Date(),
        expiresAt: new Date(Date.now() + RESET_TOKEN_EXPIRY_MS),
      },
    });

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
        data: { passwordHash, failedLoginAttempts: 0, lockedUntil: null },
      });

      return resetToken.userId;
    });

    await revokeAllUserTokens(userId);

    return { message: "تم استعادة كلمة المرور بنجاح." };
  }
}
