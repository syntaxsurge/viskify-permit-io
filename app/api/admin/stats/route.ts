import { NextResponse } from 'next/server'

import { db } from '@/lib/db/drizzle'
import { users } from '@/lib/db/schema/core'
import { candidateCredentials } from '@/lib/db/schema/candidate'
import { getUser } from '@/lib/db/queries/queries'
import { assertPermission } from '@/lib/auth/middleware'

/**
 * GET /api/admin/stats
 * Returns aggregated platform statistics for administrators.
 * Requires Permit.io permission: action=read, resource=admin_stats
 */
export async function GET() {
  /* -------------------------- Auth + authorise --------------------------- */
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const denied = await assertPermission(user, 'read', 'admin_stats')
  if (denied?.error) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  /* ---------------------------- Aggregations ----------------------------- */
  const totalUsers = (await db.select().from(users)).length
  const totalCredentials = (await db.select().from(candidateCredentials)).length

  /* ------------------------------ Response ------------------------------- */
  return NextResponse.json({ users: totalUsers, credentials: totalCredentials })
}