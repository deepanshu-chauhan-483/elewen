import prisma from './prisma.js'
import { strapiFindUserByEmail } from './strapi.js'

function mapUserRow(row) {
  if (!row) return null

  return {
    id: Number(row.id),
    email: row.email,
    provider: row.provider ?? null,
    confirmed: Boolean(row.confirmed),
    blocked: Boolean(row.blocked),
    first_name: row.first_name ?? null,
    last_name: row.last_name ?? null,
    phone: row.phone ?? null,
  }
}

function normalizeStrapiUsersList(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (payload?.id != null) return [payload]
  return []
}

async function findUserByEmailFromDatabase(email) {
  const normalized = String(email ?? '').trim()
  if (!normalized) return null

  const [row] = await prisma.$queryRaw`
    SELECT id, email, provider, confirmed, blocked, first_name, last_name, phone
    FROM public.up_users
    WHERE lower(email) = lower(${normalized})
    LIMIT 1
  `

  return mapUserRow(row)
}

/**
 * Resolve a Strapi customer by email for admin flows (coupon share, etc.).
 * Tries Strapi REST first, then falls back to shared Postgres up_users (same as auth).
 */
export async function findCustomerByEmail(email) {
  const normalized = String(email ?? '').trim().toLowerCase()
  if (!normalized) return null

  try {
    const strapiUser = await strapiFindUserByEmail(normalized)
    if (strapiUser?.id != null) {
      return {
        id: Number(strapiUser.id),
        email: strapiUser.email ?? normalized,
        first_name: strapiUser.first_name ?? null,
        last_name: strapiUser.last_name ?? null,
        phone: strapiUser.phone ?? null,
      }
    }
  } catch {
    // Fall through to database lookup.
  }

  return findUserByEmailFromDatabase(normalized)
}

export { normalizeStrapiUsersList, findUserByEmailFromDatabase }
