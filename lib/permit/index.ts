/**
 * lib/permit/index.ts
 *
 * Central Permit.io helper that works in both Node and Edge runtimes.
 * The official ESM bundle of `permitio` (build/module) references internal
 * files that are missing from the published package, causing Turbopack to
 * throw "Module not found” errors. We therefore load the CommonJS build at
 * runtime with `createRequire`, which is complete and stable.
 *
 * In some production builds the CommonJS export shape differs (e.g. default
 * export, named export, or the module itself being the constructor).  We now
 * dynamically resolve the constructor to handle all shapes gracefully.
 */

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

type PermitSdk = any // avoid importing broken ESM types
let _permit: PermitSdk | null = null

async function getPermit(): Promise<PermitSdk> {
  if (IS_EDGE_RUNTIME) {
    throw new Error('Permit SDK unavailable in Edge runtime')
  }
  if (_permit) return _permit

  /* Dynamically require the CommonJS bundle */
  try {
    const { createRequire } = await import('module')
    const require = createRequire(import.meta.url)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const permitModule = require('permitio') as any

    /**
     * Support every possible export shape:
     *  1. { Permit }                  – named export
     *  2. { default: { Permit } }     – nested under default
     *  3. { default: Constructor }    – default _is_ the constructor
     *  4. Constructor                 – module itself is the constructor
     */
    const PermitCtor =
      permitModule?.Permit ??
      permitModule?.default?.Permit ??
      permitModule?.default ??
      permitModule

    if (typeof PermitCtor !== 'function') {
      throw new Error('Permit constructor not found in permitio package')
    }

    _permit = new PermitCtor({
      token: PERMIT_API_KEY,
      pdp: PERMIT_PDP_URL,
      log: { level: process.env.NODE_ENV === 'development' ? 'debug' : 'error' },
    })
    return _permit
  } catch (err) {
    console.error('[permit] Failed to load Permit SDK:', err)
    throw err
  }
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