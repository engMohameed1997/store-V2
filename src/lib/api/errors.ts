export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 400,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const Errors = {
  unauthorized: (message = "يجب تسجيل الدخول أولاً.") =>
    new AppError("UNAUTHORIZED", message, 401),

  forbidden: (message = "لا تملك صلاحية الوصول.") =>
    new AppError("FORBIDDEN", message, 403),

  notFound: (entity = "العنصر") =>
    new AppError("NOT_FOUND", `${entity} غير موجود.`, 404),

  conflict: (message: string) => new AppError("CONFLICT", message, 409),

  validation: (message: string, details?: unknown) =>
    new AppError("VALIDATION_ERROR", message, 422, details),

  tooManyRequests: (retryAfter?: number) =>
    new AppError(
      "RATE_LIMITED",
      `طلبات كثيرة. ${retryAfter ? `حاول بعد ${retryAfter} ثانية.` : "حاول لاحقاً."}`,
      429
    ),

  internal: (message = "حدث خطأ ما. حاول لاحقاً.") =>
    new AppError("INTERNAL_ERROR", message, 500),

  badRequest: (message: string) =>
    new AppError("BAD_REQUEST", message, 400),

  accountLocked: (_until?: Date) =>
    new AppError(
      "ACCOUNT_LOCKED",
      "تم تأمين الحساب مؤقتاً بسبب محاولات كثيرة فاشلة. حاول لاحقاً.",
      423
    ),

  invalidCredentials: () =>
    new AppError("INVALID_CREDENTIALS", "البريد/الهاتف أو كلمة المرور غير صحيحة.", 401),

  tokenExpired: () =>
    new AppError("TOKEN_EXPIRED", "انتهت الجلسة. سجّل الدخول مجدداً.", 401),

  tokenRevoked: () =>
    new AppError("TOKEN_REVOKED", "انتهت الجلسة. سجّل الدخول مجدداً.", 401),

  phoneNotVerified: () =>
    new AppError("PHONE_NOT_VERIFIED", "رقم الهاتف غير مُؤكَّد.", 403),

  emailNotVerified: () =>
    new AppError("EMAIL_NOT_VERIFIED", "البريد الإلكتروني غير مُؤكَّد.", 403),
} as const;
