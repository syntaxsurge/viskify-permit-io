/**
 * lib/permit/edge.ts
 *
 * Lightweight stubs for the Edge runtime where the full Permit.io SDK (and
 * Node-only APIs like `module` / `createRequire`) are unavailable.
 * These helpers intentionally return conservative defaults so callers can use
 * their existing role-based fallbacks while avoiding build-time errors.
 */

export async function check(
  _userId: string,
  _action: string,
  _resource: string,
  _context: Record<string, unknown> = {},
  _tenant?: string,
): Promise<boolean> {
  // Fail-closed: indicate that the Permit check could not be executed.
  return false
}

export async function ensureUserRole(
  _userId: string,
  _role: string,
  _tenant: string = 'default',
): Promise<void> {
  // No-op on Edge – user/role will be synced by Node version where available.
}