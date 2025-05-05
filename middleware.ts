import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { signToken, verifyToken } from '@/lib/auth/session'

/* -------------------------------------------------------------------------- */
/*  CONSTANTS                                                                 */
/* -------------------------------------------------------------------------- */

const PROTECTED_PREFIX = '/dashboard'
const FORBIDDEN_PATH = '/403'
const isProd = process.env.NODE_ENV === 'production'

/* -------------------------------------------------------------------------- */
/*  EDGE-RUNTIME MIDDLEWARE (no Node modules)                                 */
/* -------------------------------------------------------------------------- */

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isProtectedRoute = pathname.startsWith(PROTECTED_PREFIX)

  /* --------------------------- UNAUTHENTICATED --------------------------- */
  const sessionCookie = request.cookies.get('session')
  if (isProtectedRoute && !sessionCookie) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  /* --------------------------- DEFAULT RESPONSE -------------------------- */
  let response = NextResponse.next()

  /* ------------------------------ NO SESSION ----------------------------- */
  if (!sessionCookie) return response

  try {
    /* ----------------------------- DECODE TOKEN -------------------------- */
    const session = await verifyToken(sessionCookie.value)

    const userId =
      (session as any).user?.id ??
      (session as any).id ??
      (session as any).userId ??
      ''

    let role: string =
      (session as any).user?.role ??
      (session as any).role ??
      (session as any).payload?.role ??
      ''

    role = role.trim().toLowerCase()

    /* ------------------------- AUTHORISATION CHECK ----------------------- */
    if (isProtectedRoute) {
      const roleWhitelist = ['admin', 'candidate', 'recruiter', 'issuer'] as const
      if (!roleWhitelist.includes(role as (typeof roleWhitelist)[number])) {
        return NextResponse.redirect(new URL(FORBIDDEN_PATH, request.url))
      }
    }

    /* ---------------------- ROLLING SESSION REFRESH ---------------------- */
    if (request.method === 'GET') {
      const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000)
      const newToken = await signToken({
        ...(session as any),
        expires: expiresInOneDay.toISOString(),
      })

      response.cookies.set({
        name: 'session',
        value: newToken,
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        expires: expiresInOneDay,
      })
    }
  } catch {
    const res = NextResponse.redirect(new URL('/sign-in', request.url))
    res.cookies.delete('session')
    return res
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}