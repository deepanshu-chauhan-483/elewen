import crypto from 'crypto'
import prisma from './prisma.js'
import { strapiAdminPut, strapiPost } from './strapi.js'

const DEFAULT_ADMIN_EMAIL = process.env.DEV_ADMIN_EMAIL || 'admin@elewen.local'
const DEFAULT_ADMIN_PASSWORD = process.env.DEV_ADMIN_PASSWORD || 'Admin@12345'
const DEFAULT_ADMIN_FIRST_NAME = process.env.DEV_ADMIN_FIRST_NAME || 'Elewen'
const DEFAULT_ADMIN_LAST_NAME = process.env.DEV_ADMIN_LAST_NAME || 'Admin'
const DEFAULT_ADMIN_PHONE = process.env.DEV_ADMIN_PHONE || '9999999999'

function isNonProduction() {
  return process.env.NODE_ENV !== 'production'
}

function shouldBootstrapDefaultAdmin() {
  return isNonProduction() && process.env.BOOTSTRAP_DEFAULT_ADMIN !== 'false'
}

async function findUserByEmailFromDatabase(email) {
  const [row] = await prisma.$queryRaw`
    SELECT id, email, confirmed, blocked, first_name, last_name, phone
    FROM public.up_users
    WHERE lower(email) = lower(${email})
    LIMIT 1
  `

  return row ?? null
}

async function syncUserForDefaultAdmin(userId) {
  return strapiAdminPut(`/api/users/${userId}`, {
    first_name: DEFAULT_ADMIN_FIRST_NAME,
    last_name: DEFAULT_ADMIN_LAST_NAME,
    phone: DEFAULT_ADMIN_PHONE,
    confirmed: true,
    blocked: false,
    is_admin: true,
    admin_role: 'super_admin',
    password: DEFAULT_ADMIN_PASSWORD,
  })
}

function isDuplicateCredentialError(err) {
  return (
    err?.status === 400 && /email or username are already taken/i.test(String(err?.message ?? ''))
  )
}

async function createDefaultAdminUser() {
  let lastError = null

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const username = `admin_${crypto.randomBytes(6).toString('hex')}`

    try {
      return await strapiPost('/api/auth/local/register', {
        username,
        email: DEFAULT_ADMIN_EMAIL,
        password: DEFAULT_ADMIN_PASSWORD,
      })
    } catch (err) {
      if (!isDuplicateCredentialError(err)) {
        throw err
      }

      lastError = err
      const existingUser = await findUserByEmailFromDatabase(DEFAULT_ADMIN_EMAIL)
      if (existingUser?.id) {
        return { user: existingUser, reusedExistingUser: true }
      }
    }
  }

  throw lastError || new Error('Unable to create default admin user')
}

export function getDefaultAdminCredentials() {
  return {
    email: DEFAULT_ADMIN_EMAIL,
    password: DEFAULT_ADMIN_PASSWORD,
  }
}

export async function bootstrapDefaultAdmin() {
  if (!shouldBootstrapDefaultAdmin()) {
    return { user: null, credentialsReady: false, mode: 'disabled' }
  }

  const existingUser = await findUserByEmailFromDatabase(DEFAULT_ADMIN_EMAIL)
  const baseUser = existingUser?.id
    ? existingUser
    : ((await createDefaultAdminUser())?.user ?? null)

  if (!baseUser?.id) {
    return { user: null, credentialsReady: false, mode: 'missing' }
  }

  try {
    await syncUserForDefaultAdmin(baseUser.id)
    const mode = existingUser?.id ? 'reused-existing' : 'created'
    console.log(`[admin-bootstrap] Default admin ready (${mode}): ${DEFAULT_ADMIN_EMAIL}`)
    return { user: baseUser, credentialsReady: true, mode }
  } catch (err) {
    console.warn(
      `[admin-bootstrap] Default admin found but password sync failed for ${DEFAULT_ADMIN_EMAIL}: ${err.message}`
    )
    return { user: baseUser, credentialsReady: false, mode: 'existing-password-unknown' }
  }
}
