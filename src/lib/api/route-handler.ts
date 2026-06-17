import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "./error-handler";
import { checkRateLimit } from "./rate-limiter";
import { AuthUser, requireAuth, requireAdmin, requireSuperAdmin, requireRole } from "./auth-guard";
import type { UserRole } from "@/generated/prisma/client";

type RateLimitTier = "default" | "auth" | "refresh" | "strict" | "search" | "upload";

interface RouteOptions {
  rateLimit?: RateLimitTier;
  auth?: boolean;
  admin?: boolean;
  superAdmin?: boolean;
  roles?: UserRole[];
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
      } else if (options.roles && options.roles.length > 0) {
        user = await requireRole(request, ...options.roles);
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

export const staffRoute = (roles: UserRole[], handler: HandlerFn, rateLimit?: RateLimitTier) =>
  createHandler(handler, { roles, rateLimit });

export const salesRoute = (handler: HandlerFn, rateLimit?: RateLimitTier) =>
  staffRoute(["ADMIN", "SUPER_ADMIN", "SALES"], handler, rateLimit);

export const warehouseRoute = (handler: HandlerFn, rateLimit?: RateLimitTier) =>
  staffRoute(["ADMIN", "SUPER_ADMIN", "WAREHOUSE"], handler, rateLimit);

export const customerServiceRoute = (handler: HandlerFn, rateLimit?: RateLimitTier) =>
  staffRoute(["ADMIN", "SUPER_ADMIN", "CUSTOMER_SERVICE"], handler, rateLimit);
