import { NextRequest, NextResponse } from "next/server";
import { publicRoute } from "@/lib/api/route-handler";
import { secureCookies } from "@/lib/api/auth-cookies";
import {
  GOOGLE_STATE_COOKIE,
  GOOGLE_STATE_COOKIE_PATH,
  GOOGLE_STATE_TTL_SEC,
  isGoogleAuthConfigured,
  startGoogleAuth,
} from "@/lib/api/google-oauth";
import { safeNext } from "@/lib/utils/safe-next";
import { loginErrorRedirect } from "./redirects";

/** Starts "Continue with Google": stores the attempt's secrets, then hands off to Google. */
export const GET = publicRoute(async (request: NextRequest) => {
  const next = safeNext(request.nextUrl.searchParams.get("next"));

  if (!isGoogleAuthConfigured()) return loginErrorRedirect("google_unavailable", next);

  const { url, cookie } = startGoogleAuth(next);
  const response = NextResponse.redirect(url, 302);
  response.headers.set("Cache-Control", "no-store");
  // Lax (not Strict): the cookie must come back on Google's cross-site redirect.
  response.cookies.set(GOOGLE_STATE_COOKIE, cookie, {
    httpOnly: true,
    secure: secureCookies(),
    sameSite: "lax",
    path: GOOGLE_STATE_COOKIE_PATH,
    maxAge: GOOGLE_STATE_TTL_SEC,
  });
  return response;
});
