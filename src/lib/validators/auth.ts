import { z } from "zod";

const IRAQI_PHONE_REGEX = /^(\+964|00964|0)?(7[3-9]\d{8})$/;

const iraqiPhone = z
  .string()
  .regex(IRAQI_PHONE_REGEX, "Invalid Iraqi phone number (e.g. 07XXXXXXXXX)")
  .transform((val) => {
    const cleaned = val.replace(/^(\+964|00964|0)/, "");
    return `+964${cleaned}`;
  });

const strongPassword = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password too long")
  .regex(/[a-z]/, "Must contain lowercase letter")
  .regex(/[A-Z]/, "Must contain uppercase letter")
  .regex(/\d/, "Must contain number")
  .regex(/[!@#$%^&*(),.?":{}|<>]/, "Must contain special character");

const safeName = z
  .string()
  .min(2, "Name must be at least 2 characters")
  .max(50, "Name too long")
  .regex(/^[\p{L}\s'-]+$/u, "Invalid characters in name");

export const registerByPhoneSchema = z.object({
  phone: iraqiPhone,
  password: strongPassword,
  firstName: safeName,
  lastName: safeName,
});

export const registerByEmailSchema = z.object({
  email: z.string().email("Invalid email address").max(255),
  password: strongPassword,
  firstName: safeName,
  lastName: safeName,
});

export const loginSchema = z.object({
  identifier: z.string().min(1, "Email or phone required"),
  password: z.string().min(1, "Password required"),
  deviceName: z.string().max(100).optional(),
  deviceId: z.string().max(100).optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token required"),
});

export const verifyPhoneSchema = z.object({
  phone: iraqiPhone,
  code: z
    .string()
    .length(6, "Code must be 6 digits")
    .regex(/^\d+$/, "Code must be numeric"),
});

export const forgotPasswordSchema = z.object({
  identifier: z.string().min(1, "Email or phone required"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token required"),
  password: strongPassword,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: strongPassword,
});

export type RegisterByPhoneInput = z.infer<typeof registerByPhoneSchema>;
export type RegisterByEmailInput = z.infer<typeof registerByEmailSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type VerifyPhoneInput = z.infer<typeof verifyPhoneSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
