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
