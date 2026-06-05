import { postJson, type ApiResult } from "@/lib/client/api";

const AUTH_BASE = "/api/v1/auth";

export interface LoginPayload {
  identifier: string;
  password: string;
  deviceName?: string;
  deviceId?: string;
}

export interface RegisterByEmailPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface RegisterByPhonePayload {
  phone: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface VerifyPhonePayload {
  phone: string;
  code: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email?: string;
  phone?: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export const authClient = {
  login(payload: LoginPayload): Promise<ApiResult<LoginResponse>> {
    return postJson<LoginResponse>(`${AUTH_BASE}/login`, payload);
  },

  registerByEmail(payload: RegisterByEmailPayload): Promise<ApiResult> {
    return postJson(`${AUTH_BASE}/register`, payload);
  },

  registerByPhone(payload: RegisterByPhonePayload): Promise<ApiResult> {
    return postJson(`${AUTH_BASE}/register`, payload);
  },

  verifyEmail(token: string): Promise<ApiResult> {
    return postJson(`${AUTH_BASE}/verify-email`, { token });
  },

  verifyPhone(payload: VerifyPhonePayload): Promise<ApiResult> {
    return postJson(`${AUTH_BASE}/verify-phone`, payload);
  },

  forgotPassword(identifier: string): Promise<ApiResult> {
    return postJson(`${AUTH_BASE}/forgot-password`, { identifier });
  },

  resetPassword(payload: ResetPasswordPayload): Promise<ApiResult> {
    return postJson(`${AUTH_BASE}/reset-password`, payload);
  },

  resendOtp(phone: string): Promise<ApiResult> {
    return postJson(`${AUTH_BASE}/resend-otp`, { phone });
  },

  refresh(): Promise<ApiResult<{ accessToken: string }>> {
    return postJson<{ accessToken: string }>(`${AUTH_BASE}/refresh`);
  },

  logout(token: string): Promise<ApiResult> {
    return postJson(`${AUTH_BASE}/logout`, undefined, { token });
  },
};
