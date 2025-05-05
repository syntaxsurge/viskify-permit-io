// 'use server'

'use server'

import { and, eq } from 'drizzle-orm'

import { createCheqdDID } from '@/lib/cheqd'
import { db } from '@/lib/db/drizzle'
import { getUser, getUserWithTeam } from '@/lib/db/queries/queries'
import { teams, teamMembers } from '@/lib/db/schema'

/**
 * Create a DID for the caller’s team.
 * — Only team owners may run this action.
 * — If a DID already exists, return an error instead of the DID string.
 * — On success, return a generic success message (no DID leak).
 */
export async function createDidAction(): Promise<{ success?: string; error?: string }> {
  /* ------------------------------------------------------------ */
  /*                      A U T H E N T I C A T E                  */
  /* ------------------------------------------------------------ */
  const user = await getUser()
  if (!user) return { error: 'User not logged in.' }

  /* ------------------------------------------------------------ */
  /*                  R E S O L V E   T E A M                     */
  /* ------------------------------------------------------------ */
  const userWithTeam = await getUserWithTeam(user.id)
  if (!userWithTeam?.teamId) {
    return { error: "You don't belong to a team." }
  }

  /* Confirm the caller is an owner on that team */
  const [membership] = await db
    .select()
    .from(teamMembers)
    .where(and(eq(teamMembers.userId, user.id), eq(teamMembers.teamId, userWithTeam.teamId)))
    .limit(1)

  if (membership?.role !== 'owner') {
    return { error: 'Only team owners can create a DID.' }
  }

  /* ------------------------------------------------------------ */
  /*                E X I S T I N G   D I D  C H E C K             */
  /* ------------------------------------------------------------ */
  const [team] = await db
    .select({ id: teams.id, did: teams.did })
    .from(teams)
    .where(eq(teams.id, userWithTeam.teamId))
    .limit(1)

  if (!team) {
    return { error: 'Team not found.' }
  }

  /* If a DID is already set, disallow creation */
  if (team.did) {
    return { error: 'Your team already has a DID. You cannot create another one.' }
  }

  /* ------------------------------------------------------------ */
  /*              C R E A T E    N E W   D I D                */
  /* ------------------------------------------------------------ */
  try {
    const { did } = await createCheqdDID()
    await db.update(teams).set({ did }).where(eq(teams.id, team.id))
    return { success: 'Team DID created successfully.' }
  } catch (err: any) {
    return { error: `Error creating DID: ${String(err)}` }
  }
}
