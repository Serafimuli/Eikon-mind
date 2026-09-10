import { NextResponse, type NextRequest } from "next/server";

// Next.js 16 renamed this convention to proxy.ts, but OpenNext Cloudflare 1.20
// still rejects Node.js Proxy builds. Keep the Edge-compatible convention until
// upstream proxy support lands; server-side route guards remain authoritative.

function createNonce() {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  return btoa(String.fromCharCode(...bytes));
}

// OpenNext Cloudflare currently requires Edge middleware. Next.js 16 calls the
// successor API Proxy, but its Node-runtime Proxy output is not accepted by the
// Cloudflare adapter. Keep this Edge-compatible compatibility entrypoint until
// the adapter supports the new Proxy runtime.
export function middleware(request: NextRequest) {
  const nonce = createNonce();
  const development = process.env.NODE_ENV !== "production";
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://challenges.cloudflare.com${development ? " 'unsafe-eval'" : ""}`,
    development ? "style-src 'self' 'unsafe-inline'" : `style-src 'self' 'nonce-${nonce}'`,
    "style-src-attr 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    "connect-src 'self' https://challenges.cloudflare.com",
    "frame-src https://challenges.cloudflare.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    ...(development ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  const locale = request.nextUrl.pathname.match(/^\/(ro|en)(?:\/|$)/)?.[1] ?? "ro";
  requestHeaders.set("x-locale", locale);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  if (!development) {
    response.headers.set("Strict-Transport-Security", "max-age=31536000");
  }
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  );
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  if (
    /^\/(?:ro|en)\/(?:client|admin|login|register|reset-password|verify-email|two-factor|continue)(?:\/|$)/.test(
      request.nextUrl.pathname,
    ) ||
    request.nextUrl.pathname.startsWith("/api/auth/")
  ) {
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png|robots.txt|sitemap.xml).*)"],
};
