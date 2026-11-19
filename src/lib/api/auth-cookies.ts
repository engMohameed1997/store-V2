import type { NextResponse } from "next/server";
import { REFRESH_TOKEN_COOKIE_MAX_AGE, ACCESS_TOKEN_COOKIE_MAX_AGE } from "@/lib/api/jwt";

/** Cookies get the Secure flag only when the site is actually served over HTTPS. */
export function secureCookies(): boolean {
  return process.env.NODE_ENV === "production" && process.env.HTTPS_ENABLED === "true";
}

/** Sets the HttpOnly session cookies (access + refresh) on a response. */
export function setAuthCookies(response: NextResponse, accessToken: string, refreshToken: string) {
  const isSecure = secureCookies();

  // Access token: HttpOnly cookie — never exposed to JavaScript
  response.cookies.set("accessToken", accessToken, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "strict",
    path: "/",
    maxAge: ACCESS_TOKEN_COOKIE_MAX_AGE,
  });

  // Refresh token: HttpOnly cookie — used to rotate access tokens
  response.cookies.set("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "strict",
    path: "/api/v1/auth",
    maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE,
  });
}
