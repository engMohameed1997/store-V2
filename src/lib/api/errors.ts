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
  unauthorized: (message = "Authentication required") =>
    new AppError("UNAUTHORIZED", message, 401),

  forbidden: (message = "Access denied") =>
    new AppError("FORBIDDEN", message, 403),

  notFound: (entity = "Resource") =>
    new AppError("NOT_FOUND", `${entity} not found`, 404),

  conflict: (message: string) => new AppError("CONFLICT", message, 409),

  validation: (message: string, details?: unknown) =>
    new AppError("VALIDATION_ERROR", message, 422, details),

  tooManyRequests: (retryAfter?: number) =>
    new AppError(
      "RATE_LIMITED",
      `Too many requests. ${retryAfter ? `Retry after ${retryAfter}s` : ""}`,
      429
    ),

  internal: (message = "Internal server error") =>
    new AppError("INTERNAL_ERROR", message, 500),

  badRequest: (message: string) =>
    new AppError("BAD_REQUEST", message, 400),

  accountLocked: (_until?: Date) =>
    new AppError(
      "ACCOUNT_LOCKED",
      "Account temporarily locked due to too many failed attempts. Try again later.",
      423
    ),

  invalidCredentials: () =>
    new AppError("INVALID_CREDENTIALS", "Invalid email/phone or password", 401),

  tokenExpired: () =>
    new AppError("TOKEN_EXPIRED", "Token has expired", 401),

  tokenRevoked: () =>
    new AppError("TOKEN_REVOKED", "Token has been revoked", 401),

  phoneNotVerified: () =>
    new AppError("PHONE_NOT_VERIFIED", "Phone number not verified", 403),

  emailNotVerified: () =>
    new AppError("EMAIL_NOT_VERIFIED", "Email not verified", 403),
} as const;
