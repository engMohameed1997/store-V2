import { NextResponse } from "next/server";

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface ApiPaginatedResponse<T = unknown> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
};

function withHeaders<T extends NextResponse>(response: T): T {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

export function apiSuccess<T>(
  data: T,
  message?: string,
  status = 200
): NextResponse<ApiSuccessResponse<T>> {
  return withHeaders(
    NextResponse.json({ success: true, data, message }, { status })
  );
}

export function apiError(
  code: string,
  message: string,
  status = 400,
  details?: unknown
): NextResponse<ApiErrorResponse> {
  return withHeaders(
    NextResponse.json(
      { success: false, error: { code, message, details } },
      { status }
    )
  );
}

export function apiPaginated<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): NextResponse<ApiPaginatedResponse<T>> {
  const totalPages = Math.ceil(total / limit);
  return withHeaders(
    NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    })
  );
}

export function apiCreated<T>(data: T, message?: string) {
  return apiSuccess(data, message, 201);
}

export function apiNoContent() {
  return withHeaders(new NextResponse(null, { status: 204 }));
}
