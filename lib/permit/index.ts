import { Permit } from 'permitio'

const permit = new Permit({
  pdp: process.env.PERMIT_PDP_URL || 'https://cloudpdp.api.permit.io',
  token: process.env.PERMIT_API_KEY!,
  projectId: process.env.PERMIT_PROJECT_ID!,
})

export const check = (
  userId: string,
  action: string,
  resource: string,
  context?: Record<string, unknown>,
) => permit.check(userId, action, resource, context)

export default permit