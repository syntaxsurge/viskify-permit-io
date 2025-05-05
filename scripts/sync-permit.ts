// scripts/sync-permit.ts
// Sync local Permit.io policy YAML files with the Permit Cloud project.
// Usage: pnpm tsx scripts/sync-permit.ts

import { spawn } from 'child_process'
import path from 'path'

function run(cmd: string, args: string[], cwd = process.cwd()): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit', cwd, shell: true })
    child.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${cmd} exited with code ${code}`))
    })
  })
}

async function main() {
  const policyDir = path.resolve('permit', 'policies')
  console.log(`🛂  Applying Permit.io policies from ${policyDir}`)

  try {
    await run('pnpm', ['exec', 'permit', 'login', '--token', process.env.PERMIT_API_KEY ?? ''])
    await run('pnpm', ['exec', 'permit', 'apply', '-f', policyDir])
    console.log('✅  Permit.io policies applied successfully')
  } catch (error) {
    console.error('❌  Failed to apply Permit.io policies')
    console.error((error as Error).message)
    process.exit(1)
  }
}

main()