import { postJson, type ApiResult } from "@/lib/client/api";

const AUTH_BASE = "/api/v1/auth";

export interface LoginPayload {
  identifier: string;
  password: string;
  deviceName?: string;
  deviceId?: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
}

export interface RegisterResponse {
  registrationToken: string;
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface VerifyResetOtpPayload {
  email: string;
  code: string;
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


export const authClient = {
  login(payload: LoginPayload): Promise<ApiResult<LoginResponse>> {
    return postJson<LoginResponse>(`${AUTH_BASE}/login`, payload);
  },

  register(payload: RegisterPayload): Promise<ApiResult<RegisterResponse>> {
    return postJson<RegisterResponse>(`${AUTH_BASE}/register`, payload);
  },

  verifyEmail(registrationToken: string, code: string): Promise<ApiResult<LoginResponse>> {
    return postJson<LoginResponse>(`${AUTH_BASE}/verify-email`, { registrationToken, code });
  },

  resendCode(registrationToken: string): Promise<ApiResult> {
    return postJson(`${AUTH_BASE}/resend-code`, { registrationToken });
  },

  forgotPassword(email: string): Promise<ApiResult> {
    return postJson(`${AUTH_BASE}/forgot-password`, { email });
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
