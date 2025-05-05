import { NextResponse } from 'next/server'

import { assertPermission } from '@/lib/auth/middleware'
import { db } from '@/lib/db/drizzle'
import { getUser } from '@/lib/db/queries/queries'
import { candidateCredentials } from '@/lib/db/schema/candidate'
import { users, teams } from '@/lib/db/schema/core'
import { issuers } from '@/lib/db/schema/issuer'
import { recruiterPipelines } from '@/lib/db/schema/recruiter'

/**
 * GET /api/admin/stats
 * Aggregated platform statistics for administrators.
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
  const totalTeams = (await db.select().from(teams)).length
  const totalCredentials = (await db.select().from(candidateCredentials)).length
  const totalPipelines = (await db.select().from(recruiterPipelines)).length
  const totalIssuers = (await db.select().from(issuers)).length

  /* Users by role */
  const roleCounts: Record<string, number> = {}
  ;(await db.select({ role: users.role }).from(users)).forEach((r) => {
    roleCounts[r.role] = (roleCounts[r.role] || 0) + 1
  })

  /* Issuers by status */
  const issuerStatusCounts: Record<string, number> = {}
  ;(await db.select({ status: issuers.status }).from(issuers)).forEach((r) => {
    issuerStatusCounts[r.status] = (issuerStatusCounts[r.status] || 0) + 1
  })

  /* Credentials by status */
  const credentialStatusCounts: Record<string, number> = {}
  ;(await db.select({ status: candidateCredentials.status }).from(candidateCredentials)).forEach(
    (r) => {
      credentialStatusCounts[r.status] = (credentialStatusCounts[r.status] || 0) + 1
    },
  )

  /* ------------------------------ Response ------------------------------- */
  return NextResponse.json({
    totals: {
      users: totalUsers,
      teams: totalTeams,
      credentials: totalCredentials,
      pipelines: totalPipelines,
      issuers: totalIssuers,
    },
    breakdown: {
      usersByRole: roleCounts,
      issuersByStatus: issuerStatusCounts,
      credentialsByStatus: credentialStatusCounts,
    },
    timestamp: new Date().toISOString(),
  })
}
