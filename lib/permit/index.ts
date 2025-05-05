import { Permit } from 'permitio'

/**
 * lib/permit/index.ts
 *
 * Unified Permit.io helper that relies on a direct SDK import.
 * Edge-specific shims and dynamic module loading have been removed.
 */

/* -------------------------------------------------------------------------- */
/*                               CONFIGURATION                                */
/* -------------------------------------------------------------------------- */

const {
  PERMIT_API_KEY = '',
  PERMIT_PDP_URL = 'https://cloudpdp.api.permit.io',
  PERMIT_TENANT_KEY = 'default',
  NODE_ENV = 'production',
} = process.env

if (!PERMIT_API_KEY) {
  throw new Error('PERMIT_API_KEY environment variable must be provided')
}

/* -------------------------------------------------------------------------- */
/*                            INITIALISE PERMIT SDK                           */
/* -------------------------------------------------------------------------- */

const permit = new Permit({
  token: PERMIT_API_KEY,
  pdp: PERMIT_PDP_URL,
  log: { level: NODE_ENV === 'development' ? 'debug' : 'error' },
})

/* -------------------------------------------------------------------------- */
/*                          PERMISSION ENFORCEMENT API                        */
/* -------------------------------------------------------------------------- */

/**
 * Check if the user may perform an action on a resource.
 * Returns false (fail-closed) when an error occurs.
 */
export async function check(
  userId: string,
  action: string,
  resource: string,
  context: Record<string, unknown> = {},
  tenant: string = PERMIT_TENANT_KEY,
): Promise<boolean> {
  try {
    return await permit.check({ key: String(userId) }, action, resource, { tenant, ...context })
  } catch (error) {
    console.warn('[permit.check] Falling back –', (error as Error).message)
    return false
  }
}

/**
 * Ensure the user exists in Permit and has the specified role.
 * Errors are logged but never re-thrown so callers can proceed.
 */
export async function ensureUserRole(
  userId: string,
  role: string,
  tenant: string = PERMIT_TENANT_KEY,
): Promise<void> {
  try {
    const api: any = (permit as any).api

    /* Upsert user */
    await api.users.sync({ key: String(userId) })

    /* Assign role (ignore duplicates) */
    try {
      await api.roleAssignments.assign({ user: String(userId), role, tenant })
      console.debug('[permit.ensureUserRole] Assigned', { userId, role, tenant })
    } catch (err: any) {
      if (err?.response?.status !== 409) throw err
    }
  } catch (error) {
    console.warn('[permit.ensureUserRole] Skipped –', (error as Error).message)
  }
}