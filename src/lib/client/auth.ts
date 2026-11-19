import { postJson, type ApiResult } from "@/lib/client/api";

const AUTH_BASE = "/api/v1/auth";

export interface LoginPayload {
  identifier: string;
  password: string;
  deviceName?: string;
  deviceId?: string;
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

  refresh(): Promise<ApiResult<{ user: AuthUser }>> {
    return postJson<{ user: AuthUser }>(`${AUTH_BASE}/refresh`);
  },

  logout(): Promise<ApiResult> {
    return postJson(`${AUTH_BASE}/logout`);
  },
};
