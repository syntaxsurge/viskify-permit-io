import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { signToken, verifyToken } from '@/lib/auth/session'
import { check, ensureUserRole } from '@/lib/permit'

/* -------------------------------------------------------------------------- */
/*  CONSTANTS                                                                 */
/* -------------------------------------------------------------------------- */

const PROTECTED_PREFIX = '/dashboard'
const FORBIDDEN_PATH = '/403'
const isProd = process.env.NODE_ENV === 'production'

console.log('[middleware] Booting – ENV:', process.env.NODE_ENV)

/* -------------------------------------------------------------------------- */
/*  EDGE-COMPATIBLE MIDDLEWARE                                                */
/* -------------------------------------------------------------------------- */

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isProtectedRoute = pathname.startsWith(PROTECTED_PREFIX)

  /* --------------------------- UNAUTHENTICATED --------------------------- */
  const sessionCookie = request.cookies.get('session')
  if (isProtectedRoute && !sessionCookie) {
    console.warn('[middleware] No session cookie – redirecting to /sign-in')
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  /* --------------------------- DEFAULT RESPONSE -------------------------- */
  let response = NextResponse.next()

  /* ------------------------------ NO SESSION ----------------------------- */
  if (!sessionCookie) return response

  try {
    /* ----------------------------- DECODE TOKEN -------------------------- */
    const session = await verifyToken(sessionCookie.value)

    const userId = (session as any).user?.id ?? (session as any).id ?? (session as any).userId ?? ''

    let role: string =
      (session as any).user?.role ?? (session as any).role ?? (session as any).payload?.role ?? ''

    if (typeof role === 'string') role = role.trim().toLowerCase()

    console.log('[middleware] Decoded session', { userId, role, path: pathname })

    /* ------------------------- AUTHORISATION CHECK ----------------------- */
    if (isProtectedRoute) {
      if (userId && role) {
        await ensureUserRole(String(userId), role)
      }

      const permitted = await check(String(userId), 'view', 'dashboard')
      console.log('[middleware] permit.check', {
        userId,
        action: 'view',
        resource: 'dashboard',
        permitted,
      })

      // Fallback: allow recognised roles if Permit is unreachable
      const roleWhitelist = ['admin', 'candidate', 'recruiter', 'issuer'] as const
      if (!permitted && !roleWhitelist.includes(role as (typeof roleWhitelist)[number])) {
        console.warn('[middleware] Access denied – redirecting to 403', { userId, role })
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

      console.log('[middleware] Refreshing session cookie', {
        userId,
        role,
        secure: isProd,
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
  } catch (error) {
    console.error('[middleware] Session error:', error)
    const res = NextResponse.redirect(new URL('/sign-in', request.url))
    res.cookies.delete('session')
    return res
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
