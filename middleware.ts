import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { signToken, verifyToken } from '@/lib/auth/session'
import { check, ensureUserRole } from '@/lib/permit'

const PROTECTED_PREFIX = '/dashboard'
const FORBIDDEN_PATH = '/403'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionCookie = request.cookies.get('session')
  const isProtectedRoute = pathname.startsWith(PROTECTED_PREFIX)

  // Block unauthenticated access to protected routes
  if (isProtectedRoute && !sessionCookie) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  let response = NextResponse.next()

  if (sessionCookie) {
    try {
      // Validate current session
      const session = await verifyToken(sessionCookie.value)

      // Fine‑grained authorization for protected routes
      if (isProtectedRoute) {
        const userId =
          // tolerate different payload shapes
          (session as any).id ?? (session as any).userId ?? ''

        const role =
          (session as any).role ??
          (session as any).user?.role ??
          (session as any).payload?.role ??
          ''

        // Ensure Permit knows about this user and its role before evaluating the policy
        if (role) {
          await ensureUserRole(userId, role)
        }

        const permitted = await check(userId, 'view', 'dashboard')

        if (!permitted) {
          const allowedRoles = ['admin', 'candidate', 'recruiter', 'issuer']
          if (!allowedRoles.includes(role)) {
            return NextResponse.redirect(new URL(FORBIDDEN_PATH, request.url))
          }
        }
      }

      // Refresh session cookie on GET requests
      if (request.method === 'GET') {
        const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000)

        response.cookies.set({
          name: 'session',
          value: await signToken({
            ...session,
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
      response.cookies.delete('session')
      return NextResponse.redirect(new URL('/sign-in', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}