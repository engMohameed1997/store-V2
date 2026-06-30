import { postJson, type ApiResult } from "@/lib/client/api";

const AUTH_BASE = "/api/v1/auth";

export interface LoginPayload {
  identifier: string;
  password: string;
  deviceName?: string;
  deviceId?: string;
}

export interface RegisterByPhonePayload {
  phone: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  firebaseIdToken: string;
  preAuthToken: string;
}

export interface VerifyPhonePayload {
  phone: string;
  firebaseIdToken: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface VerifyResetOtpPayload {
  phone: string;
  firebaseIdToken: string;
}

export interface VerifyResetOtpResponse {
  token: string;
  message: string;
}

export interface AuthUser {
  id: string;
  email?: string;
  phone?: string;
  firstName: string;
  lastName: string;
  role: string;
  avatar?: string | null;
}

export interface LoginResponse {
  user: AuthUser;
}

export interface SendOtpResponse {
  preAuthToken: string | null;
}

export const authClient = {
  login(payload: LoginPayload): Promise<ApiResult<LoginResponse>> {
    return postJson<LoginResponse>(`${AUTH_BASE}/login`, payload);
  },

  sendOtp(phone: string): Promise<ApiResult<SendOtpResponse>> {
    return postJson<SendOtpResponse>(`${AUTH_BASE}/send-otp`, { phone });
  },

  registerByPhone(payload: RegisterByPhonePayload): Promise<ApiResult<LoginResponse>> {
    return postJson<LoginResponse>(`${AUTH_BASE}/register`, payload);
  },

  verifyPhone(payload: VerifyPhonePayload): Promise<ApiResult> {
    return postJson(`${AUTH_BASE}/verify-phone`, payload);
  },

  forgotPassword(phone: string): Promise<ApiResult> {
    return postJson(`${AUTH_BASE}/forgot-password`, { phone });
  },

  verifyResetOtp(payload: VerifyResetOtpPayload): Promise<ApiResult<VerifyResetOtpResponse>> {
    return postJson<VerifyResetOtpResponse>(`${AUTH_BASE}/verify-reset-otp`, payload);
  },

  resetPassword(payload: ResetPasswordPayload): Promise<ApiResult> {
    return postJson(`${AUTH_BASE}/reset-password`, payload);
  },

  refresh(): Promise<ApiResult<{ user: AuthUser }>> {
    return postJson<{ user: AuthUser }>(`${AUTH_BASE}/refresh`);
  },

  logout(): Promise<ApiResult> {
    return postJson(`${AUTH_BASE}/logout`);
  },
};
