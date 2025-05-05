/**
 * lib/permit/index.ts — central Permit.io helper with Edge-runtime fallbacks.
 *
 * In the V8 isolate used by Next.js edge middleware the Node-only `permitio`
 * package cannot be required, which previously threw and cleared the session
 * cookie. We now detect that environment and transparently short-circuit
 * all SDK calls so the application keeps working (policy is still enforced
 * server-side where the SDK *is* available).
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
/*                       LAZY-LOAD THE SDK WHEN POSSIBLE                      */
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

  const req: NodeJS.Require | undefined =
    // Prefer the global require injected by Node; fall back to eval-hack for ESM runtimes
    (globalThis as any).require || (typeof eval === 'function' ? eval('require') : undefined)

  if (typeof req !== 'function') {
    // Keeps TypeScript happy (avoids TS2722) and fails fast in exotic runtimes
    throw new Error('Dynamic require is not available in this runtime')
  }

  const { Permit } = req('permitio') as { Permit: PermitCtor }

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
 * Returns `false` (fail close) when the SDK cannot be used.
 */
export async function check(
  userId: string,
  action: string,
  resource: string,
  context: Record<string, unknown> = {},
  tenant = PERMIT_TENANT_KEY,
): Promise<boolean> {
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
 * No-op in Edge runtime; never rethrows so middleware can continue.
 */
export async function ensureUserRole(
  userId: string,
  role: string,
  tenant = PERMIT_TENANT_KEY,
): Promise<void> {
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
    /* Edge runtime or other non-fatal error — log & carry on */
    console.warn('[permit.ensureUserRole] Skipped –', (err as Error).message)
  }
}
