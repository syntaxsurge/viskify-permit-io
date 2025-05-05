/**
 * Centralised Permit.io helper built around the official Node SDK.
 * The SDK is loaded lazily with CommonJS require to sidestep missing
 * sub-path exports and to keep Edge-runtime builds free of Node core
 * dependencies.
 */

/* -------------------------------------------------------------------------- */
/*                               Configuration                                */
/* -------------------------------------------------------------------------- */

const {
  PERMIT_API_KEY = '',
  PERMIT_PDP_URL = 'https://cloudpdp.api.permit.io', // Cloud PDP by default
  PERMIT_TENANT_KEY = 'default',
} = process.env

if (!PERMIT_API_KEY) {
  throw new Error('PERMIT_API_KEY environment variable must be provided')
}

/* -------------------------------------------------------------------------- */
/*                       Lazy initialisation of the SDK                       */
/* -------------------------------------------------------------------------- */

type PermitType = typeof import('permitio').Permit
let _permit: InstanceType<PermitType> | null = null

/**
 * Dynamically loads the CommonJS build of the Permit SDK the first time it is
 * needed.  Using eval('require') avoids bundling Node core modules, keeping
 * Edge runtimes happy while still working in Node.js.
 */
async function getPermit() {
  if (_permit) return _permit

  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const requireFn: NodeRequire | undefined = (globalThis as any).require || eval('require')
  if (!requireFn) {
    throw new Error('Permit SDK cannot be loaded in this runtime environment')
  }

  const { Permit } = requireFn('permitio') as { Permit: PermitType }
  _permit = new Permit({
    token: PERMIT_API_KEY,
    pdp: PERMIT_PDP_URL,
    log: { level: 'debug' }, // For verbose logging
  })

  return _permit
}

/* -------------------------------------------------------------------------- */
/*                          Permission enforcement API                        */
/* -------------------------------------------------------------------------- */

/**
 * Returns `true` when the user is permitted to perform the action on the
 * resource within the given tenant; denies by default on errors.
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
    return await permit.check({ key: userId }, action, resource, { tenant, ...context })
  } catch {
    return false // fail-closed
  }
}

/* -------------------------------------------------------------------------- */
/*                   User synchronisation & role assignment                   */
/* -------------------------------------------------------------------------- */

export async function ensureUserRole(
  userId: string,
  role: string,
  tenant = PERMIT_TENANT_KEY,
): Promise<void> {
  const permit = await getPermit()

  // Upsert user
  await permit.api.users.sync({ key: userId })

  // Assign role; ignore conflicts
  try {
    await permit.api.roleAssignments.assign({ user: userId, role, tenant })
  } catch (err: any) {
    if (err?.response?.status !== 409) throw err
  }
}