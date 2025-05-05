import { createRequire } from 'node:module'
import type { IPermitConfig } from 'permitio'

/* -------------------------------------------------------------------------- */
/*                         D Y N A M I C   I M P O R T                        */
/* -------------------------------------------------------------------------- */

/**
 * Turbopack fails to bundle the ESM build of the Permit.io SDK because some
 * nested paths are not published; we therefore load the CommonJS bundle at
 * runtime using Node's createRequire, which circumvents the static analyser
 * while preserving full type-safety via a separate type-only import.
 */
const require = createRequire(import.meta.url)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Permit } = require('permitio') as typeof import('permitio')

/* -------------------------------------------------------------------------- */
/*                           S D K   I N S T A N C E                          */
/* -------------------------------------------------------------------------- */

const config: Partial<IPermitConfig> = {
  // In production you may point this at your own PDP deployment.
  pdp: process.env.PERMIT_PDP_URL || 'https://cloudpdp.api.permit.io',
  token: process.env.PERMIT_API_KEY!,
  projectId: process.env.PERMIT_PROJECT_ID!,
}

const permit = new Permit(config)

/* -------------------------------------------------------------------------- */
/*                             E X P O R T S                                  */
/* -------------------------------------------------------------------------- */

/**
 * Check if a user is authorised to perform an action on a resource.
 *
 * @param userId   – unique identifier for the user (string or numeric as string)
 * @param action   – action key, e.g. "read" | "write"
 * @param resource – resource key, e.g. "admin_stats"
 * @param context  – optional contextual ABAC attributes
 */
export const check = (
  userId: string,
  action: string,
  resource: string,
  context?: Record<string, unknown>,
) => permit.check(userId, action, resource, context)

export default permit