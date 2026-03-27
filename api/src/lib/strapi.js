const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337'

/**
 * POST to Strapi (unauthenticated — used for auth endpoints)
 */
export const strapiPost = async (path, body) => {
  const res = await fetch(`${STRAPI_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) {
    const err = new Error(data?.error?.message || 'Strapi request failed')
    err.status = res.status
    err.strapiError = data?.error
    throw err
  }
  return data
}

/**
 * Find a Strapi user by email using the API token.
 * Returns the user object or null if not found.
 */
export const strapiFindUserByEmail = async (email) => {
  const res = await fetch(
    `${STRAPI_URL}/api/users?filters[email][$eq]=${encodeURIComponent(email)}&populate=role`,
    { headers: { Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}` } }
  )
  const data = await res.json()
  if (!res.ok) return null
  return Array.isArray(data) ? (data[0] ?? null) : null
}

/**
 * Create a Strapi user via the admin API token.
 * Automatically fetches and assigns the Authenticated role.
 */
export const strapiCreateUser = async (userData) => {
  // Get the Authenticated role ID
  const rolesRes = await fetch(`${STRAPI_URL}/api/users-permissions/roles`, {
    headers: { Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}` },
  })
  const rolesData = await rolesRes.json()
  const authenticatedRole = rolesData?.roles?.find(r => r.type === 'authenticated')
  if (!authenticatedRole) {
    const err = new Error('Could not find Authenticated role in Strapi')
    err.status = 500
    throw err
  }

  const res = await fetch(`${STRAPI_URL}/api/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}`,
    },
    body: JSON.stringify({ ...userData, role: authenticatedRole.id }),
  })
  const data = await res.json()
  if (!res.ok) {
    const err = new Error(data?.error?.message || 'Failed to create user')
    err.status = res.status
    throw err
  }
  return data
}

/**
 * GET from Strapi with a user JWT (used to verify tokens and fetch user data)
 */
export const strapiGetMe = async (jwt) => {
  const res = await fetch(`${STRAPI_URL}/api/users/me`, {
    headers: { Authorization: `Bearer ${jwt}` },
  })
  const data = await res.json()
  if (!res.ok) {
    const err = new Error('Invalid or expired token')
    err.status = 401
    throw err
  }
  return data
}

/**
 * POST to Strapi using the server API token.
 * Use this for any server-to-server write that should NOT be allowed by the Public role.
 * e.g. creating vendor entries, sending admin notifications.
 */
export const strapiServerPost = async (path, body) => {
  const res = await fetch(`${STRAPI_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}`,
    },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) {
    const err = new Error(data?.error?.message || 'Strapi request failed')
    err.status = res.status
    err.strapiError = data?.error
    throw err
  }
  return data
}

/**
 * PUT to Strapi with admin API token (used for server-side user updates)
 */
export const strapiAdminPut = async (path, body) => {
  const res = await fetch(`${STRAPI_URL}${path}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}`,
    },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) {
    const err = new Error(data?.error?.message || 'Strapi admin request failed')
    err.status = res.status
    throw err
  }
  return data
}
