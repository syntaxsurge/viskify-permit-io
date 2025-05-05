import { asc, desc, ilike, or } from 'drizzle-orm'

import { db } from '../drizzle'
import { users } from '../schema/core'

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

export type AdminUserRow = {
  id: number
  name: string | null
  email: string
  role: string
  createdAt: Date
}

/* -------------------------------------------------------------------------- */
/*                              PAGINATED QUERY                               */
/* -------------------------------------------------------------------------- */

/**
 * Return a page of users with optional full-text search, sorting and pagination.
 */
export async function getAdminUsersPage(
  page: number,
  pageSize = 10,
  sortBy: 'name' | 'email' | 'role' | 'createdAt' = 'createdAt',
  order: 'asc' | 'desc' = 'desc',
  searchTerm = '',
): Promise<{ users: AdminUserRow[]; hasNext: boolean }> {
  const offset = (page - 1) * pageSize

  /* --------------------------- ORDER BY helper --------------------------- */
  const orderBy =
    sortBy === 'name'
      ? order === 'asc'
        ? asc(users.name)
        : desc(users.name)
      : sortBy === 'email'
        ? order === 'asc'
          ? asc(users.email)
          : desc(users.email)
        : sortBy === 'role'
          ? order === 'asc'
            ? asc(users.role)
            : desc(users.role)
          : order === 'asc'
            ? asc(users.createdAt)
            : desc(users.createdAt)

  /* ----------------------------- WHERE clause ---------------------------- */
  const trimmed = searchTerm.trim()
  const whereCondition =
    trimmed.length === 0
      ? undefined
      : or(ilike(users.name, `%${trimmed}%`), ilike(users.email, `%${trimmed}%`))

  /* ------------------------------ QUERY BUILD ---------------------------- */
  const baseQuery = db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)

  const query = whereCondition ? baseQuery.where(whereCondition) : baseQuery

  /* ------------------------------ EXECUTION ------------------------------ */
  const rows = await query
    .orderBy(orderBy)
    .limit(pageSize + 1)
    .offset(offset)

  const hasNext = rows.length > pageSize
  if (hasNext) rows.pop()

  return { users: rows, hasNext }
}
