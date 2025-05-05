/**
 * Lightweight edge-compatible Permit.io helper that calls the PDP REST API directly.
 * Avoids Node.js core modules so it can run in both Edge and Node runtimes.
 */

const PDP_URL = process.env.PERMIT_PDP_URL || 'https://cloudpdp.api.permit.io'
const TOKEN = process.env.PERMIT_API_KEY ?? ''

/**
 * Perform an authorization check for a given user, action and resource.
 *
 * @param userId   Unique user identifier (string or number).
 * @param action   Action key, e.g. "read".
 * @param resource Resource key, e.g. "admin_stats".
 * @param context  Optional contextual attributes for ABAC policies.
 * @returns        Promise resolving to true when permitted, false otherwise.
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
        user: typeof userId === 'number' ? String(userId) : userId,
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
    console.error('[permit] PDP check failed', err)
    return false
  }
}

/* Default export keeps backwards compatibility with previous code. */
const permit = { check }
export default permit