import Permit from 'permitio'

const permit = new Permit({
  token: process.env.PERMIT_API_KEY!,
  config: {
    projectId: process.env.PERMIT_PROJECT_ID!,
  },
})

export const check = (
  userId: string,
  action: string,
  resource: string,
  context?: Record<string, unknown>
) => permit.check(userId, action, resource, context)

export default permit