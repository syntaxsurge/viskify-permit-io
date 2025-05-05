/**
 * scripts/sync-permit.ts
 * Idempotently seeds core roles, resources, and demo users using the Permit.io
 * Node.js SDK. Uses createRequire to load the CommonJS build of the SDK to
 * avoid Node 22 ESM resolution issues.
 */

import 'dotenv/config'
import { createRequire } from 'module'

// ---------------------------------------------------------------------------
//  Load Permit SDK using CommonJS require (works on Node ≥18, 20, 22)
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Permit } = createRequire(import.meta.url)('permitio') as {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Permit: any
}

/* -------------------------------------------------------------------------- */
/*  Configuration                                                             */
/* -------------------------------------------------------------------------- */

const {
  PERMIT_API_KEY,
  PERMIT_PDP_URL = 'https://cloudpdp.api.permit.io',
  PERMIT_TENANT_KEY = 'default',
} = process.env

if (!PERMIT_API_KEY) {
  console.error('❌  PERMIT_API_KEY must be provided in the environment')
  process.exit(1)
}

const permit = new Permit({
  token: PERMIT_API_KEY,
  pdp: PERMIT_PDP_URL,
})

/* -------------------------------------------------------------------------- */
/*  Domain Definitions                                                        */
/* -------------------------------------------------------------------------- */

const ROLES = [
  { key: 'admin',     name: 'Admin',     description: 'Platform administrator' },
  { key: 'candidate', name: 'Candidate', description: 'Job seeker'            },
  { key: 'recruiter', name: 'Recruiter', description: 'Talent recruiter'      },
  { key: 'issuer',    name: 'Issuer',    description: 'Credential issuer'     },
] as const

const RESOURCES = [
  {
    key: 'dashboard',
    name: 'Dashboard',
    actions: {
      view: { name: 'view' },
    },
  },
  {
    key: 'admin_stats',
    name: 'Admin Stats',
    actions: {
      read: { name: 'read' },
    },
  },
] as const

const DEMO_USERS = [
  { key: 'admin@test.com',     email: 'admin@test.com',     first_name: 'Platform', last_name: 'Admin',     role: 'admin'     },
  { key: 'candidate@test.com', email: 'candidate@test.com', first_name: 'Test',     last_name: 'Candidate', role: 'candidate' },
  { key: 'issuer@test.com',    email: 'issuer@test.com',    first_name: 'Test',     last_name: 'Issuer',    role: 'issuer'    },
  { key: 'recruiter@test.com', email: 'recruiter@test.com', first_name: 'Test',     last_name: 'Recruiter', role: 'recruiter' },
] as const

/* -------------------------------------------------------------------------- */
/*  Helper Utilities                                                          */
/* -------------------------------------------------------------------------- */

async function ensureRole(role: (typeof ROLES)[number]) {
  try {
    await permit.api.roles.create(role)
    console.log(`🆕  Role '${role.key}' created`)
  } catch (err: any) {
    if (err?.response?.status === 409 || /exists|duplicate/i.test(err?.message ?? '')) {
      console.log(`ℹ️  Role '${role.key}' already exists`)
    } else {
      throw err
    }
  }
}

async function ensureResource(res: (typeof RESOURCES)[number]) {
  try {
    await permit.api.resources.create(res)
    console.log(`🆕  Resource '${res.key}' created`)
  } catch (err: any) {
    if (err?.response?.status === 409 || /exists|duplicate/i.test(err?.message ?? '')) {
      console.log(`ℹ️  Resource '${res.key}' already exists`)
    } else {
      throw err
    }
  }
}

async function ensureRolePermissions() {
  for (const role of ROLES) {
    for (const res of RESOURCES) {
      const permissions =
        role.key === 'admin'
          ? Object.keys(res.actions).map((a) => `${res.key}:${a}`)
          : ['candidate', 'recruiter', 'issuer'].includes(role.key) && res.key === 'dashboard'
            ? ['dashboard:view']
            : []

      if (permissions.length === 0) continue

      try {
        await permit.api.roles.assignPermissions(role.key, permissions)
        console.log(`✅  Permissions ${permissions.join(', ')} assigned to role '${role.key}'`)
      } catch (err: any) {
        if (err?.response?.status === 409 || /exists|duplicate/i.test(err?.message ?? '')) {
          console.log(`ℹ️  Permissions for role '${role.key}' already set`)
        } else {
          throw err
        }
      }
    }
  }
}

async function syncUser(user: (typeof DEMO_USERS)[number]) {
  await permit.api.users.sync({
    key: user.key,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
  })

  try {
    await permit.api.roleAssignments.assign({
      user: user.key,
      role: user.role,
      tenant: PERMIT_TENANT_KEY,
    })
    console.log(`✅  Synced & assigned '${user.role}' to ${user.email}`)
  } catch (err: any) {
    if (err?.response?.status === 409 || /already.*exists/i.test(err?.message ?? '')) {
      console.log(`ℹ️  Role '${user.role}' already assigned to ${user.email}`)
    } else {
      throw err
    }
  }
}

/* -------------------------------------------------------------------------- */
/*  Main Execution                                                            */
/* -------------------------------------------------------------------------- */

async function main() {
  console.log('🚀  Seeding Permit roles, resources and demo users…')

  for (const res of RESOURCES) await ensureResource(res)
  for (const role of ROLES) await ensureRole(role)
  await ensureRolePermissions()
  for (const user of DEMO_USERS) await syncUser(user)

  console.log('🎉  Permit seed complete')
  process.exit(0)
}

main().catch((err) => {
  console.error('❌  Permit seeding failed:', err)
  process.exit(1)
})