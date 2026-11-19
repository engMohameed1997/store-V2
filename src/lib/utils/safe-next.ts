/**
 * "Return to where you were" after login/sign-up, without an open redirect:
 * only same-site paths are accepted ("//evil.com", "/\evil.com", "https://…"
 * all fall back to "/"), and auth pages are skipped to avoid loops.
 */

const AUTH_PAGES = ["/login", "/register"];
const BASE = "http://same-site.invalid";

export function safeNext(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith("/")) return "/";
  try {
    const url = new URL(raw, BASE);
    if (url.origin !== BASE) return "/";
    if (AUTH_PAGES.some((p) => url.pathname === p || url.pathname.startsWith(`${p}/`))) return "/";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}

/** Builds an auth page link that returns to `next` afterwards. */
export function withNext(page: string, next: string | null | undefined): string {
  const target = safeNext(next);
  return target === "/" ? page : `${page}?next=${encodeURIComponent(target)}`;
}

/** Current location (path + query) in the browser, for use as `next`. */
export function currentPath(): string {
  if (typeof window === "undefined") return "/";
  return `${window.location.pathname}${window.location.search}`;
}
