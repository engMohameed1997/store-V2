import { NextResponse, type NextRequest } from "next/server";

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(",").map((o) => o.trim()) || [
  "http://localhost:3000",
];

const ADMIN_PATH_PREFIX = process.env.ADMIN_PATH_PREFIX || "mx-panel";

const ADMIN_IP_ALLOWLIST = process.env.ADMIN_IP_ALLOWLIST?.split(",").map((ip) => ip.trim()).filter(Boolean) || [];

function isAdminRoute(pathname: string): boolean {
  return pathname.includes(`/api/v1/${ADMIN_PATH_PREFIX}`);
}

function getRequestIp(request: NextRequest): string {
  const trustedHeader = process.env.TRUSTED_IP_HEADER;
  if (trustedHeader) {
    const ip = request.headers.get(trustedHeader)?.split(",")[0]?.trim();
    if (ip) return ip;
  }

  if (process.env.BEHIND_REVERSE_PROXY === "true") {
    const xff = request.headers.get("x-forwarded-for");
    if (xff) {
      const ips = xff.split(",").map((ip) => ip.trim());
      return ips[ips.length - 1] || "unknown";
    }
  }

  // In production without explicit proxy config, do NOT trust client-supplied headers.
  if (process.env.NODE_ENV === "production") {
    return "unknown";
  }

  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function checkAdminIpAllowlist(request: NextRequest): NextResponse | null {
  if (ADMIN_IP_ALLOWLIST.length === 0) return null;

  const clientIp = getRequestIp(request);

  if (!ADMIN_IP_ALLOWLIST.includes(clientIp)) {
    return NextResponse.json(
      { success: false, error: { code: "FORBIDDEN", message: "Access denied" } },
      { status: 403 }
    );
  }

  return null;
}

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  ...(process.env.NODE_ENV === "production"
    ? {
        // Note: 'unsafe-inline' in script-src is required by Next.js for its inline
        // hydration scripts (__NEXT_DATA__). Full removal requires nonce-based CSP.
        "Content-Security-Policy": [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: blob: http: https:",
          "font-src 'self' data:",
          "media-src 'self' blob: http: https:",
          "worker-src 'self' blob:",
          "connect-src 'self' http: https: https://api.telegram.org",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          "frame-ancestors 'none'",
        ].join("; "),
      }
    : {}),
};

function isApiRoute(pathname: string): boolean {
  return pathname.startsWith("/api/");
}

function handleCors(request: NextRequest, response: NextResponse): NextResponse {
  const origin = request.headers.get("origin") || "";

  const isAllowed =
    process.env.NODE_ENV === "development"
      ? ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGINS.includes("*")
      : ALLOWED_ORIGINS.includes(origin);

  if (isAllowed) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Request-ID");
    response.headers.set("Access-Control-Max-Age", "86400");
    response.headers.set("Access-Control-Allow-Credentials", "true");
  }

  return response;
}

// Auth pages that require specific conditions (handled individually below)
// verify-email: needs session | verify-phone: needs phone param | reset-password: guest only

function isAuthenticated(request: NextRequest): boolean {
  return !!request.cookies.get("accessToken")?.value;
}

function handleAuthRoutes(request: NextRequest): NextResponse | null {
  const { pathname, searchParams } = request.nextUrl;
  const hasSession = isAuthenticated(request);

  // Conditional pages: verify-phone requires phone param or session
  if (pathname === "/verify-phone") {
    const hasPhone = !!searchParams.get("phone");
    if (!hasPhone && !hasSession) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Conditional pages: verify-email requires session (user just registered)
  if (pathname === "/verify-email" && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Conditional pages: reset-password - logged in users don't need it
  if (pathname === "/reset-password" && hasSession) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Admin panel: requires authentication (role check is done client-side via AdminGuard)
  if (pathname.startsWith("/mx-panel") && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return null;
}

function runMiddleware(request: NextRequest): NextResponse {
  if (request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 204 });
    return handleCors(request, response);
  }

  // Admin IP allowlist enforcement
  if (isAdminRoute(request.nextUrl.pathname)) {
    const blocked = checkAdminIpAllowlist(request);
    if (blocked) return blocked;
  }

  // Frontend auth route protection (non-API routes only)
  if (!isApiRoute(request.nextUrl.pathname)) {
    const authRedirect = handleAuthRoutes(request);
    if (authRedirect) return authRedirect;
  }

  // Generate request ID before building response so it can be forwarded to the handler
  const requestId = isApiRoute(request.nextUrl.pathname) ? crypto.randomUUID() : undefined;

  // Forward requestId as an incoming request header so route handlers can read it
  const requestHeaders = new Headers(request.headers);
  if (requestId) requestHeaders.set("x-request-id", requestId);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  if (requestId) {
    handleCors(request, response);

    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("X-Request-ID", requestId);
  }

  return response;
}

export function proxy(request: NextRequest): NextResponse {
  try {
    return runMiddleware(request);
  } catch {
    if (isApiRoute(request.nextUrl.pathname)) {
      return NextResponse.json(
        { success: false, error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
        { status: 500 }
      );
    }
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/api/:path*", "/((?!_next/static|_next/image|favicon.ico).*)"],
};
