import prisma from '../lib/prisma.js'
import { withCache, cacheDel, TTL } from '../lib/cache.js'

const DEFAULT_DEV_ADMIN_EMAIL =
  process.env.NODE_ENV !== 'production'
    ? String(process.env.DEV_ADMIN_EMAIL || 'admin@elewen.local')
        .trim()
        .toLowerCase()
    : ''

const ADMIN_EMAILS = new Set(
  String(process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map(value => value.trim().toLowerCase())
    .filter(Boolean)
)

const ADMIN_USER_IDS = new Set(
  String(process.env.ADMIN_USER_IDS ?? '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean)
)

const ALLOW_ALL_AUTHENTICATED =
  process.env.ADMIN_ALLOW_ALL_AUTHENTICATED === 'true' && process.env.NODE_ENV !== 'production'

const USE_LEGACY_ADMIN_FALLBACKS = process.env.ADMIN_ACCESS_USE_LEGACY_FALLBACKS === 'true'

function isAdminRoleName(value) {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase()

  if (!normalized) return false

  return ['admin', 'administrator', 'staff', 'manager', 'operations'].some(keyword =>
    normalized.includes(keyword)
  )
}

async function fetchAccessRowWithAdminFields(parsedUserId) {
  const [row] = await prisma.$queryRaw`
    SELECT
      u.id::text AS id,
      u.email,
      u.first_name,
      u.last_name,
      u.phone,
      u.is_admin,
      u.admin_role,
      r.name AS role_name,
      r.type AS role_type,
      EXISTS (
        SELECT 1
        FROM public.admin_users admin_u
        WHERE lower(admin_u.email) = lower(u.email)
          AND COALESCE(admin_u.blocked, false) = false
          AND COALESCE(admin_u.is_active, true) = true
      ) AS is_strapi_admin
    FROM public.up_users u
    LEFT JOIN public.up_users_role_lnk role_lnk
      ON role_lnk.user_id = u.id
    LEFT JOIN public.up_roles r
      ON r.id = role_lnk.role_id
    WHERE u.id = ${parsedUserId}
    LIMIT 1
  `

  return row ?? null
}

async function fetchAccessRowLegacy(parsedUserId) {
  const [row] = await prisma.$queryRaw`
    SELECT
      u.id::text AS id,
      u.email,
      u.first_name,
      u.last_name,
      u.phone,
      NULL::boolean AS is_admin,
      NULL::text AS admin_role,
      r.name AS role_name,
      r.type AS role_type,
      EXISTS (
        SELECT 1
        FROM public.admin_users admin_u
        WHERE lower(admin_u.email) = lower(u.email)
          AND COALESCE(admin_u.blocked, false) = false
          AND COALESCE(admin_u.is_active, true) = true
      ) AS is_strapi_admin
    FROM public.up_users u
    LEFT JOIN public.up_users_role_lnk role_lnk
      ON role_lnk.user_id = u.id
    LEFT JOIN public.up_roles r
      ON r.id = role_lnk.role_id
    WHERE u.id = ${parsedUserId}
    LIMIT 1
  `

  return row ?? null
}

async function fetchAccessRow(parsedUserId) {
  try {
    return await fetchAccessRowWithAdminFields(parsedUserId)
  } catch (err) {
    const message = String(err?.message ?? '').toLowerCase()
    if (message.includes('column') && message.includes('is_admin')) {
      return fetchAccessRowLegacy(parsedUserId)
    }

    throw err
  }
}

export async function resolveAdminAccess(userId) {
  const parsedUserId = Number.parseInt(String(userId ?? ''), 10)
  if (!Number.isFinite(parsedUserId)) {
    return { isAdmin: false, reason: 'INVALID_USER_ID', user: null }
  }

  const cacheKey = `admin:access:${parsedUserId}`
  const cached = await withCache(cacheKey, TTL.ADMIN, async () => {
    const row = await fetchAccessRow(parsedUserId)
    return row
  })
  const row = cached

  if (!row) {
    return { isAdmin: false, reason: 'USER_NOT_FOUND', user: null }
  }

  const email = String(row.email ?? '')
    .trim()
    .toLowerCase()
  const id = String(row.id ?? '')
  const isSchemaAdmin = row.is_admin === true
  const adminRole = row.admin_role ?? null

  const legacyFallbackAdmin =
    ALLOW_ALL_AUTHENTICATED ||
    email === DEFAULT_DEV_ADMIN_EMAIL ||
    ADMIN_USER_IDS.has(id) ||
    ADMIN_EMAILS.has(email) ||
    Boolean(row.is_strapi_admin) ||
    isAdminRoleName(row.role_name) ||
    isAdminRoleName(row.role_type)

  const isAdmin = isSchemaAdmin || (USE_LEGACY_ADMIN_FALLBACKS && legacyFallbackAdmin)

  return {
    isAdmin,
    reason: isAdmin
      ? isSchemaAdmin
        ? 'ADMIN_ACCESS_GRANTED_BY_USER_FLAG'
        : 'ADMIN_ACCESS_GRANTED_BY_LEGACY_FALLBACK'
      : 'ADMIN_ACCESS_DENIED',
    user: {
      id,
      email: row.email ?? '',
      first_name: row.first_name ?? null,
      last_name: row.last_name ?? null,
      phone: row.phone ?? null,
      roleName: row.role_name ?? null,
      roleType: row.role_type ?? null,
      isAdmin: isSchemaAdmin,
      adminRole,
      legacyFallbackAdmin,
      isStrapiAdmin: Boolean(row.is_strapi_admin),
    },
  }
}

export async function invalidateAdminCache(userId) {
  await cacheDel(`admin:access:${userId}`)
}

export async function requireAdmin(req, res, next) {
  try {
    const access = await resolveAdminAccess(req.user?.id)

    if (!access.isAdmin) {
      return res.status(403).json({
        error: 'Admin access required',
        code: access.reason,
      })
    }

    req.adminAccess = access
    next()
  } catch (err) {
    next(err)
  }
}
