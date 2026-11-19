import { NextResponse } from "next/server";
import { GOOGLE_STATE_COOKIE, GOOGLE_STATE_COOKIE_PATH } from "@/lib/api/google-oauth";
import { safeNext } from "@/lib/utils/safe-next";

export type GoogleLoginError =
  | "google_unavailable"
  | "google_cancelled"
  | "google_failed"
  | "google_blocked"
  | "google_staff";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

export function clearGoogleState(response: NextResponse): NextResponse {
  response.cookies.set(GOOGLE_STATE_COOKIE, "", { path: GOOGLE_STATE_COOKIE_PATH, maxAge: 0 });
  return response;
}

/**
 * Back to the login page with an error code (relative Location, so the
 * internal host behind the proxy never leaks into the redirect).
 */
export function loginErrorRedirect(error: GoogleLoginError, next: string): NextResponse {
  const params = new URLSearchParams({ error });
  const target = safeNext(next);
  if (target !== "/") params.set("next", target);
  return clearGoogleState(
    new NextResponse(null, {
      status: 303,
      headers: { Location: `/login?${params}`, "Cache-Control": "no-store" },
    })
  );
}

/**
 * Landing page after a successful sign-in. A plain 302 would keep the
 * navigation "cross-site" (it started at Google), so browsers would withhold
 * the SameSite=Strict session cookies on the first page load; a same-site
 * refresh from our own page avoids that.
 */
export function signedInPage(next: string): NextResponse {
  const target = escapeHtml(safeNext(next));
  const html =
    `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">` +
    `<meta http-equiv="refresh" content="0;url=${target}"><title>جارٍ تسجيل الدخول…</title></head>` +
    `<body style="font-family:sans-serif;text-align:center;padding:3rem">` +
    `<p>تم تسجيل الدخول. <a href="${target}">متابعة</a></p></body></html>`;
  return clearGoogleState(
    new NextResponse(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
    })
  );
}
