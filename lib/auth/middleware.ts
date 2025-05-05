import { redirect } from 'next/navigation'

import { z } from 'zod'

import { getTeamForUser, getUser } from '@/lib/db/queries/queries'
import { TeamDataWithMembers, User } from '@/lib/db/schema'
import { check, ensureUserRole } from '@/lib/permit'

export type ActionState = {
  error?: string
  success?: string
  [key: string]: any
}

type ValidatedActionFunction<S extends z.ZodType<any, any>, T> = (
  data: z.infer<S>,
  formData: FormData,
) => Promise<T>

export function validatedAction<S extends z.ZodType<any, any>, T>(
  schema: S,
  action: ValidatedActionFunction<S, T>,
) {
  return async (_prevState: ActionState, formData: FormData): Promise<T> => {
    const result = schema.safeParse(Object.fromEntries(formData))
    if (!result.success) {
      return { error: result.error.errors[0].message } as T
    }

    return action(result.data, formData)
  }
}

type ValidatedActionWithUserFunction<S extends z.ZodType<any, any>, T> = (
  data: z.infer<S>,
  formData: FormData,
  user: User,
) => Promise<T>

export function validatedActionWithUser<S extends z.ZodType<any, any>, T>(
  schema: S,
  action: ValidatedActionWithUserFunction<S, T>,
) {
  return async (_prevState: ActionState, formData: FormData): Promise<T> => {
    const user = await getUser()
    if (!user) {
      throw new Error('User is not authenticated')
    }

    const result = schema.safeParse(Object.fromEntries(formData))
    if (!result.success) {
      return { error: result.error.errors[0].message } as T
    }

    return action(result.data, formData, user)
  }
}

type ActionWithTeamFunction<T> = (formData: FormData, team: TeamDataWithMembers) => Promise<T>

export function withTeam<T>(action: ActionWithTeamFunction<T>) {
  return async (formData: FormData): Promise<T> => {
    const user = await getUser()
    if (!user) {
      redirect('/sign-in')
    }

    const team = await getTeamForUser(user.id)
    if (!team) {
      throw new Error('Team not found')
    }

    return action(formData, team)
  }
}

/**
 * Assert that a user is authorised to perform an action on a resource.
 * Returns { error: 'unauthorized' } when the Permit.io check fails.
 */
export async function assertPermission(
  user: User,
  action: string,
  resource: string,
  context: Record<string, unknown> = {},
): Promise<ActionState | undefined> {
  // Ensure Permit knows about this user & its role before we evaluate the policy
  await ensureUserRole(String(user.id), user.role)

  const permitted = await check(String(user.id), action, resource, context)

  console.log('[assertPermission]', {
    userId: user.id,
    role: user.role,
    action,
    resource,
    permitted,
  })

  if (!permitted) {
    return { error: 'unauthorized' }
  }
  return undefined
}
