/*
 * Central Permit.io helper
 * - check():  PDP allow/deny
 * - ensureUserRole():  sync user + role via Permit REST API
 * The implementation avoids importing the faulty `permitio` SDK so the build succeeds
 * with Turbopack while still providing full RBAC capability.
 */

const TOKEN = process.env.PERMIT_API_KEY ?? ''
const PDP_URL = process.env.PERMIT_PDP_URL || 'https://cloudpdp.api.permit.io'
const PROJECT_ID = process.env.PERMIT_PROJECT_ID ?? ''
const ENV_ID = process.env.PERMIT_ENV_ID || 'default'
const API_URL = 'https://api.permit.io/v2'

/* -------------------------------------------------------------------------- */
/*                               ROLE SYNCHRONISER                            */
/* -------------------------------------------------------------------------- */

/**
 * Idempotently creates or updates a user in Permit and assigns a top-level role.
 * Uses the default tenant key "default".
 */
export async function ensureUserRole(
  userId: string,
  role: string,
  tenant = 'default',
): Promise<void> {
  if (!TOKEN || !PROJECT_ID) return // silent no-op in local dev without keys

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${TOKEN}`,
  }

  try {
    /* Sync user (creates if missing) */
    await fetch(`${API_URL}/facts/${PROJECT_ID}/${ENV_ID}/users`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ key: userId }),
    })

    /* Assign role */
    await fetch(`${API_URL}/facts/${PROJECT_ID}/${ENV_ID}/role_assignments`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ user: userId, role, tenant }),
    })
  } catch (err) {
    console.error('[permit] ensureUserRole REST error:', err)
  }
}

/* -------------------------------------------------------------------------- */
/*                              PDP CHECK HELPER                              */
/* -------------------------------------------------------------------------- */

/**
 * Calls the PDP /​v2/check endpoint to evaluate a policy decision.
 * Returns true when permitted; false otherwise (network errors included).
 */
export async function check(
  userId: string,
  action: string,
  resource: string,
  context: Record<string, unknown> = {},
): Promise<boolean> {
  if (!TOKEN) {
    console.warn('[permit] PERMIT_API_KEY is not set – denying by default')
    return false
  }

  try {
    const res = await fetch(`${PDP_URL}/v2/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TOKEN}`,
      },
      body: JSON.stringify({
        user: String(userId),
        action,
        resource,
        context,
      }),
    })

    if (!res.ok) {
      console.error('[permit] PDP responded with status', res.status)
      return false
    }

    const json = (await res.json()) as { allow?: boolean }
    return json.allow === true
  } catch (err) {
    console.error('[permit] PDP check failed:', err)
    return false
  }
}

export default { check, ensureUserRole }