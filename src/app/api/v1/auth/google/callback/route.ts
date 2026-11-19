import { NextRequest } from "next/server";
import { publicRoute } from "@/lib/api/route-handler";
import { getClientIp, getUserAgent } from "@/lib/api/auth-guard";
import { setAuthCookies } from "@/lib/api/auth-cookies";
import {
  GOOGLE_STATE_COOKIE,
  GoogleSignInRejected,
  exchangeGoogleCode,
  readGoogleAuthState,
  safeEqual,
} from "@/lib/api/google-oauth";
import { AuthService } from "@/lib/services/auth.service";
import { loginErrorRedirect, signedInPage } from "../redirects";

/** Google redirects back here with ?code&state (or ?error when the user cancels). */
export const GET = publicRoute(async (request: NextRequest) => {
  const saved = readGoogleAuthState(request.cookies.get(GOOGLE_STATE_COOKIE)?.value);
  const params = request.nextUrl.searchParams;
  const next = saved?.next ?? "/";

  if (params.get("error")) return loginErrorRedirect("google_cancelled", next);

  // Missing/expired cookie or a state mismatch: not the attempt this browser started.
  const state = params.get("state");
  const code = params.get("code");
  if (!saved || !state || !code || !safeEqual(state, saved.state)) {
    return loginErrorRedirect("google_failed", next);
  }

  try {
    const profile = await exchangeGoogleCode(code, saved);
    const result = await AuthService.loginWithGoogle(profile, {
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
    });

    const response = signedInPage(next);
    setAuthCookies(response, result.accessToken, result.refreshToken);
    return response;
  } catch (err) {
    if (err instanceof GoogleSignInRejected) {
      return loginErrorRedirect(err.reason === "staff" ? "google_staff" : "google_blocked", next);
    }
    console.error("[auth/google] sign-in failed:", err instanceof Error ? err.message : err);
    return loginErrorRedirect("google_failed", next);
  }
}, "auth");
