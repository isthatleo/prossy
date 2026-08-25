import { NextResponse, type NextRequest } from "next/server"

/**
 * Lightweight edge-of-app guard (cookie presence only).
 * Real session validation + RBAC happens in layouts/pages/actions via
 * lib/auth/guards.ts — this merely avoids rendering protected shells
 * for obviously anonymous traffic.
 */

const SESSION_COOKIE_NAMES = [
  "better-auth.session_token",
  "better-auth.session_token.secure",
]

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/projects",
  "/messages",
  "/meetings",
  "/resources",
  "/notifications",
  "/reports",
  "/settings",
  "/students",
  "/supervisors",
  "/admin",
]

function hasSessionCookie(request: NextRequest): boolean {
  return SESSION_COOKIE_NAMES.some((name) => request.cookies.has(name))
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const authenticated = hasSessionCookie(request)

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) =>
      pathname === prefix || pathname.startsWith(`${prefix}/`)
  )

  if (!authenticated && isProtected) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("next", `${pathname}${search}`)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Run on everything except static assets, images and API routes
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}
