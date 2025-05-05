import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { signToken, verifyToken } from '@/lib/auth/session'
import { check, ensureUserRole } from '@/lib/permit'
import { getUser } from '@/lib/db/queries/queries'

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */

const PROTECTED_PREFIX = '/dashboard'
const FORBIDDEN_PATH = '/403'

/* -------------------------------------------------------------------------- */
/*  Edge Middleware                                                           */
/* -------------------------------------------------------------------------- */

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isProtectedRoute = pathname.startsWith(PROTECTED_PREFIX)

  /* --------------------------- Unauthenticated ---------------------------- */
  const sessionCookie = request.cookies.get('session')
  if (isProtectedRoute && !sessionCookie) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  /* --------------------------- Default response --------------------------- */
  let response = NextResponse.next()

  /* ------------------------------ No session ------------------------------ */
  if (!sessionCookie) return response

  try {
    /* ---------------------------- Decode token ---------------------------- */
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

    if (typeof role === 'string') {
      role = role.trim().toLowerCase()
    }

    /* -------------- Fallback: fetch role from DB if missing --------------- */
    if (!role) {
      try {
        const dbUser = await getUser()
        role = dbUser?.role?.trim().toLowerCase() ?? ''
        console.log('[middleware] role fetched from DB:', role)
      } catch (err) {
        console.error('[middleware] failed to fetch role from DB:', err)
      }
    }

    console.log('[middleware] request', {
      path: pathname,
      userId,
      role,
      protected: isProtectedRoute,
    })

    /* ------------------------- Authorisation check ------------------------ */
    if (isProtectedRoute) {
      if (role) {
        await ensureUserRole(String(userId), role)
      }

      const permitted = await check(String(userId), 'view', 'dashboard')
      console.log('[middleware] permit.check result:', permitted)

      // Fallback: if Permit cannot be reached (permitted === false) but
      // user has a recognised role, allow access.
      const roleWhitelist = ['admin', 'candidate', 'recruiter', 'issuer'] as const

      if (!permitted && !roleWhitelist.includes(role as (typeof roleWhitelist)[number])) {
        console.warn('[middleware] access denied – redirecting to 403')
        return NextResponse.redirect(new URL(FORBIDDEN_PATH, request.url))
      }
    }

    /* ---------------------- Rolling session refresh ----------------------- */
    if (request.method === 'GET') {
      const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000)

      response.cookies.set({
        name: 'session',
        value: await signToken({
          ...(session as any),
          expires: expiresInOneDay.toISOString(),
        }),
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        expires: expiresInOneDay,
      })
    }
  } catch (error) {
    console.error('[middleware] session error:', error)
    const res = NextResponse.redirect(new URL('/sign-in', request.url))
    res.cookies.delete('session')
    return res
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}