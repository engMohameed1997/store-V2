const FIREBASE_ERROR_MAP: Record<string, string> = {
  "auth/invalid-verification-code": "رمز التحقق غير صحيح. حاول مجدداً.",
  "auth/invalid-phone-number": "رقم الهاتف غير صالح.",
  "auth/phone-number-already-exists": "رقم الهاتف مستخدم بالفعل.",
  "auth/too-many-requests": "طلبات كثيرة. حاول لاحقاً.",
  "auth/quota-exceeded": "تجاوزت الحد المسموح. حاول لاحقاً.",
  "auth/code-expired": "انتهت صلاحية الرمز. أعد الإرسال.",
  "auth/invalid-verification-id": "انتهت الجلسة. أعد الإرسال.",
  "auth/operation-not-allowed": "تعذّر إرسال رمز التحقق. حاول لاحقاً.",
  "auth/network-request-failed": "تعذّر الاتصال. تحقق من الإنترنت.",
  "auth/app-deleted": "تعذّر إرسال رمز التحقق. حاول لاحقاً.",
  "auth/invalid-app-id": "تعذّر إرسال رمز التحقق. حاول لاحقاً.",
  "auth/api-key-not-valid": "تعذّر إرسال رمز التحقق. حاول لاحقاً.",
  "auth/user-disabled": "تعذّر إرسال رمز التحقق. حاول لاحقاً.",
  "auth/captcha-check-failed": "تعذّر التحقق. أعد المحاولة.",
  "auth/missing-client-identifier": "تعذّر التحقق. أعد المحاولة.",
  "auth/billing-not-enabled": "تعذّر إرسال رمز التحقق. حاول لاحقاً.",
  "auth/unverified-domain": "تعذّر إرسال رمز التحقق. حاول لاحقاً.",
  "auth/invalid-app-credential": "تعذّر إرسال رمز التحقق. حاول لاحقاً.",
  "auth/admin-restricted-operation": "تعذّر إرسال رمز التحقق. حاول لاحقاً.",
  "auth/argument-error": "تعذّر إرسال رمز التحقق. حاول لاحقاً.",
  "auth/configuration-not-found": "تعذّر إرسال رمز التحقق. حاول لاحقاً.",
  "auth/missing-phone-number": "رقم الهاتف غير صالح.",
  "auth/invalid-verification-session": "انتهت الجلسة. أعد الإرسال.",
  "auth/internal-error": "تعذّر إرسال رمز التحقق. حاول لاحقاً.",
  "auth/missing-verification-code": "رمز التحقق غير صحيح. حاول مجدداً.",
  "auth/missing-verification-id": "انتهت الجلسة. أعد الإرسال.",
  "auth/session-expired": "انتهت الجلسة. أعد الإرسال.",
  "auth/credential-already-in-use": "تعذّر التحقق. حاول لاحقاً.",
  "auth/popup-closed-by-user": "تعذّر التحقق. أعد المحاولة.",
  "auth/cancelled-popup-request": "تعذّر التحقق. أعد المحاولة.",
};

const DEFAULT_MSG = "تعذّر إرسال رمز التحقق. حاول لاحقاً.";

export function getFirebaseErrorMessage(err: unknown): string {
  if (!err) return DEFAULT_MSG;

  // Firebase errors have a `code` property like "auth/invalid-verification-code"
  const firebaseCode = (err as { code?: string }).code;
  if (firebaseCode && FIREBASE_ERROR_MAP[firebaseCode]) {
    return FIREBASE_ERROR_MAP[firebaseCode];
  }

  if (err instanceof Error) {
    for (const [code, msg] of Object.entries(FIREBASE_ERROR_MAP)) {
      if (err.message.includes(code)) return msg;
    }
    if (err.message.includes("reCAPTCHA") || err.message.includes("recaptcha")) {
      return "تعذّر التحقق. أعد المحاولة.";
    }
    if (err.message.includes("network") || err.message.includes("Network")) {
      return "تعذّر الاتصال. تحقق من الإنترنت.";
    }
  }

  // If it's our own Error thrown from sendFirebaseOtp, the message is already friendly
  if (err instanceof Error && err.message) {
    return err.message;
  }

  return DEFAULT_MSG;
}
