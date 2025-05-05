/**
 * lib/permit/index.ts — central Permit.io helper that works both in Node
 * and in the Edge Runtime.  The Permit SDK cannot run in the Edge isolate,
 * so we return graceful fall-backs there while using a lazy dynamic import
 * (`import()`) inside Node environments.
 */

/* -------------------------------------------------------------------------- */
/*                              RUNTIME DETECTION                             */
/* -------------------------------------------------------------------------- */

const IS_EDGE_RUNTIME = typeof (globalThis as any).EdgeRuntime !== 'undefined'

/* -------------------------------------------------------------------------- */
/*                               CONFIGURATION                                */
/* -------------------------------------------------------------------------- */

const {
  PERMIT_API_KEY = '',
  PERMIT_PDP_URL = 'https://cloudpdp.api.permit.io',
  PERMIT_TENANT_KEY = 'default',
} = process.env

if (!PERMIT_API_KEY && !IS_EDGE_RUNTIME) {
  throw new Error('PERMIT_API_KEY environment variable must be provided')
}

/* -------------------------------------------------------------------------- */
/*                           LAZY-LOAD SDK IN NODE                            */
/* -------------------------------------------------------------------------- */

type PermitCtor = typeof import('permitio').Permit
let _permit: InstanceType<PermitCtor> | null = null

async function getPermit(): Promise<InstanceType<PermitCtor>> {
  /* ------------------------- Edge runtime short-circuit ------------------ */
  if (IS_EDGE_RUNTIME) {
    throw new Error('Permit SDK unavailable in Edge runtime')
  }

  /* ------------------------ Load & cache the SDK in Node ----------------- */
  if (_permit) return _permit

  /* Dynamic import avoids `eval` / `require` which are disallowed in Edge. */
  const moduleName = 'permitio' // prevent static analyser from bundling in edge
  const { Permit } = (await import(moduleName)) as { Permit: PermitCtor }

  _permit = new Permit({
    token: PERMIT_API_KEY,
    pdp: PERMIT_PDP_URL,
    log: { level: process.env.NODE_ENV === 'development' ? 'debug' : 'error' },
  })

  return _permit
}

/* -------------------------------------------------------------------------- */
/*                          PERMISSION ENFORCEMENT API                        */
/* -------------------------------------------------------------------------- */

/**
 * Check if the user may perform an action on a resource.
 * Returns `false` (fail-close) in Edge or when the SDK cannot be used.
 */
export async function check(
  userId: string,
  action: string,
  resource: string,
  context: Record<string, unknown> = {},
  tenant = PERMIT_TENANT_KEY,
): Promise<boolean> {
  /* Edge runtime cannot use the SDK – deny by default */
  if (IS_EDGE_RUNTIME) return false

  try {
    const permit = await getPermit()
    const permitted = await permit.check({ key: String(userId) }, action, resource, {
      tenant,
      ...context,
    })
    console.debug('[permit.check]', { userId, action, resource, permitted })
    return permitted
  } catch (err) {
    console.warn('[permit.check] Falling back –', (err as Error).message)
    return false
  }
}

/**
 * Ensure the user exists in Permit and has the given role.
 * No-op in Edge runtime; never re-throws so middleware can continue.
 */
export async function ensureUserRole(
  userId: string,
  role: string,
  tenant = PERMIT_TENANT_KEY,
): Promise<void> {
  /* Skip completely in Edge runtime */
  if (IS_EDGE_RUNTIME) return

  try {
    const permit = await getPermit()

    /* Upsert user */
    await permit.api.users.sync({ key: String(userId) })

    /* Assign role (ignore duplicates) */
    try {
      await permit.api.roleAssignments.assign({ user: String(userId), role, tenant })
      console.debug('[permit.ensureUserRole] Assigned', { userId, role, tenant })
    } catch (e: any) {
      if (e?.response?.status !== 409) throw e
    }
  } catch (err) {
    /* Non-fatal – log & carry on */
    console.warn('[permit.ensureUserRole] Skipped –', (err as Error).message)
  }
}