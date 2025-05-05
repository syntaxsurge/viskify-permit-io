import { asc, desc, eq, ilike, or } from 'drizzle-orm'

import { db } from '../drizzle'
import {
  candidateCredentials as credsT,
  candidates as candT,
  CredentialStatus,
} from '../schema/candidate'
import { users as usersT } from '../schema/core'
import { issuers as issuersT } from '../schema/issuer'

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

export type AdminCredentialRow = {
  id: number
  title: string
  status: CredentialStatus
  candidate: string | null
  issuer: string | null
}

/* -------------------------------------------------------------------------- */
/*                            PAGINATED QUERY FUNCTON                         */
/* -------------------------------------------------------------------------- */

/**
 * Return a page of credentials with full-text search, sorting and pagination.
 */
export async function getAdminCredentialsPage(
  page: number,
  pageSize = 10,
  sortBy: 'title' | 'candidate' | 'issuer' | 'status' | 'id' = 'id',
  order: 'asc' | 'desc' = 'desc',
  searchTerm = '',
): Promise<{ credentials: AdminCredentialRow[]; hasNext: boolean }> {
  const offset = (page - 1) * pageSize

  /* --------------------------- ORDER BY helper --------------------------- */
  const orderBy =
    sortBy === 'title'
      ? order === 'asc'
        ? asc(credsT.title)
        : desc(credsT.title)
      : sortBy === 'candidate'
        ? order === 'asc'
          ? asc(usersT.email)
          : desc(usersT.email)
        : sortBy === 'issuer'
          ? order === 'asc'
            ? asc(issuersT.name)
            : desc(issuersT.name)
          : sortBy === 'status'
            ? order === 'asc'
              ? asc(credsT.status)
              : desc(credsT.status)
            : /* id fallback */ order === 'asc'
              ? asc(credsT.id)
              : desc(credsT.id)

  /* ----------------------------- WHERE clause ---------------------------- */
  const whereCondition =
    searchTerm.trim().length === 0
      ? undefined
      : or(
          ilike(credsT.title, `%${searchTerm}%`),
          ilike(usersT.email, `%${searchTerm}%`),
          ilike(issuersT.name, `%${searchTerm}%`),
        )

  /* ------------------------------ BASE QUERY ----------------------------- */
  const baseQuery = db
    .select({
      id: credsT.id,
      title: credsT.title,
      status: credsT.status,
      candidate: usersT.email,
      issuer: issuersT.name,
    })
    .from(credsT)
    .leftJoin(candT, eq(credsT.candidateId, candT.id))
    .leftJoin(usersT, eq(candT.userId, usersT.id))
    .leftJoin(issuersT, eq(credsT.issuerId, issuersT.id))

  /* ------------------------------ APPLY WHERE ---------------------------- */
  const query = whereCondition ? baseQuery.where(whereCondition) : baseQuery

  /* ------------------------------ EXECUTION ------------------------------ */
  const rows = await query
    .orderBy(orderBy)
    .limit(pageSize + 1)
    .offset(offset)

  const hasNext = rows.length > pageSize
  const slicedRows = hasNext ? rows.slice(0, pageSize) : rows

  /* ---------------------------- TYPE MAPPING ----------------------------- */
  const credentials: AdminCredentialRow[] = slicedRows.map((r) => ({
    id: r.id,
    title: r.title,
    status: r.status as CredentialStatus,
    candidate: r.candidate,
    issuer: r.issuer,
  }))

  return { credentials, hasNext }
}
