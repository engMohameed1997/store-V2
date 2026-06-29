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
};

export function getFirebaseErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    for (const [code, msg] of Object.entries(FIREBASE_ERROR_MAP)) {
      if (err.message.includes(code)) return msg;
    }
    if (err.message.includes("reCAPTCHA")) return "تعذّر التحقق. أعد المحاولة.";
  }
  return "تعذّر إرسال رمز التحقق. حاول لاحقاً.";
}
