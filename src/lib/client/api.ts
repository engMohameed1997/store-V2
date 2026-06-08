import type { ApiErrorResponse, ApiSuccessResponse } from "@/lib/api/response";

export type ApiResult<T = unknown> =
  | (ApiSuccessResponse<T> & { status: number })
  | (ApiErrorResponse & { status: number });

const defaultHeaders = { "Content-Type": "application/json" } as const;

export async function postJson<T = unknown>(
  url: string,
  body?: unknown,
  options?: { token?: string }
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        ...defaultHeaders,
        ...(options?.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    });

    const json = await safeJson(res);

    if (isApiResponse<T>(json)) {
      return { ...json, status: res.status };
    }

    if (res.ok) {
      return { success: true, data: json as T, status: res.status } as ApiResult<T>;
    }

    return {
      success: false,
      error: {
        code: "UNKNOWN_RESPONSE",
        message: "Unexpected response format from server",
      },
      status: res.status,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: "NETWORK_ERROR",
        message: error instanceof Error ? error.message : "Network error",
      },
      status: 0,
    };
  }
}

export async function getJson<T = unknown>(
  url: string,
  options?: { token?: string }
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        ...(options?.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      credentials: "include",
    });

    const json = await safeJson(res);

    if (isApiResponse<T>(json)) {
      return { ...json, status: res.status };
    }

    if (res.ok) {
      return { success: true, data: json as T, status: res.status } as ApiResult<T>;
    }

    return {
      success: false,
      error: { code: "UNKNOWN_RESPONSE", message: "Unexpected response format from server" },
      status: res.status,
    };
  } catch (error) {
    return {
      success: false,
      error: { code: "NETWORK_ERROR", message: error instanceof Error ? error.message : "Network error" },
      status: 0,
    };
  }
}

export async function putJson<T = unknown>(
  url: string,
  body?: unknown,
  options?: { token?: string }
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        ...defaultHeaders,
        ...(options?.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    });

    const json = await safeJson(res);

    if (isApiResponse<T>(json)) {
      return { ...json, status: res.status };
    }

    if (res.ok) {
      return { success: true, data: json as T, status: res.status } as ApiResult<T>;
    }

    return {
      success: false,
      error: { code: "UNKNOWN_RESPONSE", message: "Unexpected response format from server" },
      status: res.status,
    };
  } catch (error) {
    return {
      success: false,
      error: { code: "NETWORK_ERROR", message: error instanceof Error ? error.message : "Network error" },
      status: 0,
    };
  }
}

export async function deleteJson<T = unknown>(
  url: string,
  options?: { token?: string }
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        ...(options?.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      credentials: "include",
    });

    if (res.status === 204) {
      return { success: true, data: null as T, status: 204 } as ApiResult<T>;
    }

    const json = await safeJson(res);

    if (isApiResponse<T>(json)) {
      return { ...json, status: res.status };
    }

    if (res.ok) {
      return { success: true, data: json as T, status: res.status } as ApiResult<T>;
    }

    return {
      success: false,
      error: { code: "UNKNOWN_RESPONSE", message: "Unexpected response format from server" },
      status: res.status,
    };
  } catch (error) {
    return {
      success: false,
      error: { code: "NETWORK_ERROR", message: error instanceof Error ? error.message : "Network error" },
      status: 0,
    };
  }
}

export interface UploadResult {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  width: number;
  height: number;
}

export async function uploadFile(
  file: File,
  folder: string,
  token: string
): Promise<ApiResult<UploadResult>> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    const res = await fetch("/api/v1/uploads", {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: "include",
      body: formData,
    });

    const json = await safeJson(res);

    if (isApiResponse<UploadResult>(json)) {
      return { ...json, status: res.status };
    }

    if (res.ok) {
      return { success: true, data: json as UploadResult, status: res.status } as ApiResult<UploadResult>;
    }

    return {
      success: false,
      error: {
        code: "UPLOAD_FAILED",
        message: (json as { error?: { message?: string } })?.error?.message || "File upload failed",
      },
      status: res.status,
    };
  } catch (error) {
    return {
      success: false,
      error: { code: "NETWORK_ERROR", message: error instanceof Error ? error.message : "Network error" },
      status: 0,
    };
  }
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function isApiResponse<T>(value: unknown): value is ApiSuccessResponse<T> | ApiErrorResponse {
  return (
    !!value &&
    typeof value === "object" &&
    (value as ApiSuccessResponse<T> | ApiErrorResponse).success !== undefined
  );
}
