import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "./error-handler";
import { checkRateLimit } from "./rate-limiter";
import { AuthUser, requireAuth, requireAdmin, requireSuperAdmin } from "./auth-guard";

type RateLimitTier = "default" | "auth" | "strict" | "search" | "upload";

interface RouteOptions {
  rateLimit?: RateLimitTier;
  auth?: boolean;
  admin?: boolean;
  superAdmin?: boolean;
}

type RouteContext = {
  params: Promise<Record<string, string>>;
};

type HandlerFn = (
  request: NextRequest,
  context: RouteContext & { user?: AuthUser }
) => Promise<NextResponse>;

export function createHandler(handler: HandlerFn, options: RouteOptions = {}) {
  return async (request: NextRequest, context: RouteContext): Promise<NextResponse> => {
    try {
      const rateLimitResponse = await checkRateLimit(
        request,
        options.rateLimit || "default"
      );
      if (rateLimitResponse) return rateLimitResponse;

      let user: AuthUser | undefined;

      if (options.superAdmin) {
        user = await requireSuperAdmin(request);
      } else if (options.admin) {
        user = await requireAdmin(request);
      } else if (options.auth) {
        user = await requireAuth(request);
      }

      return await handler(request, { ...context, user });
    } catch (error) {
      return handleApiError(error);
    }
  };
}

export const publicRoute = (handler: HandlerFn, rateLimit?: RateLimitTier) =>
  createHandler(handler, { rateLimit });

export const protectedRoute = (handler: HandlerFn, rateLimit?: RateLimitTier) =>
  createHandler(handler, { auth: true, rateLimit });

export const adminRoute = (handler: HandlerFn, rateLimit?: RateLimitTier) =>
  createHandler(handler, { admin: true, rateLimit });

export const superAdminRoute = (handler: HandlerFn, rateLimit?: RateLimitTier) =>
  createHandler(handler, { superAdmin: true, rateLimit });
