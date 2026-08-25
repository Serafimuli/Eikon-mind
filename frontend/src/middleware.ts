import { NextResponse, type NextRequest } from "next/server"

function createNonce() {
  const bytes = crypto.getRandomValues(new Uint8Array(18))
  return btoa(String.fromCharCode(...bytes))
}

// OpenNext Cloudflare currently requires Edge middleware. Next.js 16 calls the
// successor API Proxy, but its Node-runtime Proxy output is not accepted by the
// Cloudflare adapter. Keep this Edge-compatible compatibility entrypoint until
// the adapter supports the new Proxy runtime.
export function middleware(request: NextRequest) {
  const nonce = createNonce()
  const development = process.env.NODE_ENV !== "production"
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://challenges.cloudflare.com${development ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-src https://challenges.cloudflare.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ")
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-nonce", nonce)
  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set("Content-Security-Policy", csp)
  response.headers.set("Strict-Transport-Security", "max-age=15552000")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()")
  if (/^\/(?:ro|en)\/(?:client|admin)(?:\/|$)/.test(request.nextUrl.pathname) || request.nextUrl.pathname.startsWith("/api/auth/")) {
    response.headers.set("Cache-Control", "private, no-store, max-age=0")
  }
  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png|robots.txt|sitemap.xml).*)"],
}
