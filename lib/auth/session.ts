import { cookies } from 'next/headers'

import { compare, hash } from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'

import { NewUser } from '@/lib/db/schema'

/* -------------------------------------------------------------------------- */
/*                               CONFIGURATION                                */
/* -------------------------------------------------------------------------- */

const key = new TextEncoder().encode(process.env.AUTH_SECRET)
const SALT_ROUNDS = 10
const isProd = process.env.NODE_ENV === 'production'

/* -------------------------------------------------------------------------- */
/*                               HASH HELPERS                                 */
/* -------------------------------------------------------------------------- */

export async function hashPassword(password: string) {
  return hash(password, SALT_ROUNDS)
}

export async function comparePasswords(plainTextPassword: string, hashedPassword: string) {
  return compare(plainTextPassword, hashedPassword)
}

/* -------------------------------------------------------------------------- */
/*                                 JWT TYPES                                  */
/* -------------------------------------------------------------------------- */

type SessionData = {
  user: { id: number; role: string }
  expires: string
}

/* -------------------------------------------------------------------------- */
/*                               JWT HELPERS                                  */
/* -------------------------------------------------------------------------- */

export async function signToken(payload: SessionData) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1 day from now')
    .sign(key)
}

export async function verifyToken(input: string) {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ['HS256'],
  })
  return payload as SessionData
}

/* -------------------------------------------------------------------------- */
/*                               COOKIE HELPERS                               */
/* -------------------------------------------------------------------------- */

export async function getSession() {
  const session = (await cookies()).get('session')?.value
  if (!session) return null
  return await verifyToken(session)
}

export async function setSession(user: NewUser) {
  const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000)

  const session: SessionData = {
    user: { id: user.id!, role: user.role },
    expires: expiresInOneDay.toISOString(),
  }

  const encryptedSession = await signToken(session)
  const cookiesStore = await cookies()

  console.log('[setSession] Writing session cookie', {
    userId: user.id,
    role: user.role,
    expires: session.expires,
    secure: isProd,
  })

  cookiesStore.set('session', encryptedSession, {
    expires: expiresInOneDay,
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
  })
}
