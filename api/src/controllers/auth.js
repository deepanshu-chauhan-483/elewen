import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import prisma from '../lib/prisma.js'
import {
  strapiPost,
  strapiAdminPut,
  strapiServerGet,
  strapiServerPost,
  strapiServerPut,
  strapiGetMe,
  strapiFindUserByEmail,
  strapiCreateUser,
} from '../lib/strapi.js'

const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

// ─── Customer profile helpers ─────────────────────────────────────────────────

/** Find existing customer profile for a Strapi user ID */
const findCustomerProfile = async userId => {
  const { data } = await strapiServerGet(
    `/api/customer-profiles?filters[user][id][$eq]=${userId}&populate=profile_photo`
  )
  return data?.[0] ?? null
}

/**
 * Create a customer profile in Strapi.
 * profile_photo_url: Google CDN URL (string) — used when no uploaded photo exists.
 * If null, frontend shows a placeholder illustration.
 */
const createCustomerProfile = async ({ userId, firstName, lastName, profilePhotoUrl = null }) => {
  try {
    await strapiServerPost('/api/customer-profiles', {
      data: {
        user: userId,
        first_name: firstName ?? null,
        last_name: lastName ?? null,
        profile_photo_url: profilePhotoUrl,
        preferred_language: 'en',
      },
    })
  } catch {
    // Non-fatal — profile creation failure should not block login/register
  }
}
const REFRESH_COOKIE = 'elewen_refresh'

const cookieOpts = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: REFRESH_TOKEN_TTL_MS,
  path: '/auth',
}

/** Strip internal Strapi fields before sending user to frontend */
const sanitizeUser = user => ({
  id: user.id,
  email: user.email,
  first_name: user.first_name ?? null,
  last_name: user.last_name ?? null,
  phone: user.phone ?? null,
  confirmed: user.confirmed,
})

/**
 * Shape customer profile for API responses.
 * photoUrl priority: uploaded profile_photo (Strapi media) > profile_photo_url (Google CDN) > null (frontend shows placeholder)
 */
const sanitizeProfile = profile => {
  if (!profile) return null
  const attrs = profile.attributes ?? profile // handle both Strapi v4 and v5 shapes
  const uploadedPhoto =
    attrs.profile_photo?.data?.attributes?.url ?? attrs.profile_photo?.url ?? null
  return {
    id: profile.id,
    documentId: profile.documentId ?? null,
    first_name: attrs.first_name ?? null,
    last_name: attrs.last_name ?? null,
    date_of_birth: attrs.date_of_birth ?? null,
    preferred_language: attrs.preferred_language ?? 'en',
    // photoUrl: uploaded photo takes priority over Google CDN URL
    photoUrl: uploadedPhoto ?? attrs.profile_photo_url ?? null,
    hasUploadedPhoto: !!uploadedPhoto,
  }
}

const isJwtLike = token => typeof token === 'string' && token.split('.').length === 3

const isVerifiedGoogleEmail = value => value === true || value === 'true'

const isGoogleProvider = provider =>
  String(provider ?? '')
    .trim()
    .toLowerCase() === 'google'

const isStrapiCredentialError = err =>
  (err?.status === 401 || err?.status === 403) &&
  /missing or invalid credentials/i.test(String(err?.message ?? ''))

const mapUserRow = row => {
  if (!row) return null

  return {
    id: Number(row.id),
    email: row.email,
    provider: row.provider,
    confirmed: Boolean(row.confirmed),
    blocked: Boolean(row.blocked),
    first_name: row.first_name ?? null,
    last_name: row.last_name ?? null,
    phone: row.phone ?? null,
  }
}

const findUserByEmailFromDatabase = async email => {
  const [row] = await prisma.$queryRaw`
    SELECT id, email, provider, confirmed, blocked, first_name, last_name, phone
    FROM public.up_users
    WHERE lower(email) = lower(${email})
    LIMIT 1
  `

  return mapUserRow(row)
}

const findUserByEmailForAuth = async email => {
  try {
    return await strapiFindUserByEmail(email)
  } catch (err) {
    if (!isStrapiCredentialError(err)) {
      throw err
    }

    return findUserByEmailFromDatabase(email)
  }
}

const extractGoogleProfile = payload => {
  const fullName = typeof payload?.name === 'string' ? payload.name.trim() : ''
  const nameParts = fullName ? fullName.split(/\s+/) : []

  return {
    firstName: payload?.given_name ?? payload?.givenName ?? nameParts[0] ?? null,
    lastName:
      payload?.family_name ??
      payload?.familyName ??
      (nameParts.length > 1 ? nameParts.slice(1).join(' ') : null),
    picture: payload?.picture ?? null,
  }
}

const exchangeGoogleAccessTokenForStrapiSession = async accessToken => {
  const url = new URL(
    '/api/auth/google/callback',
    process.env.STRAPI_URL || 'http://localhost:1337'
  )
  url.searchParams.set('access_token', accessToken)

  try {
    const res = await fetch(url.toString(), { redirect: 'manual' })
    console.log(
      '[exchangeGoogleAccessTokenForStrapiSession] Status:',
      res.status,
      'URL:',
      url.toString()
    )

    const redirectLocation = res.headers.get('location')
    if (redirectLocation) {
      const redirectUrl = new URL(redirectLocation, url.toString())
      const redirectedToken = redirectUrl.searchParams.get('access_token')

      if (isJwtLike(redirectedToken)) {
        const user = await strapiGetMe(redirectedToken)
        console.log(
          '[exchangeGoogleAccessTokenForStrapiSession] Success via redirect token, got user:',
          user?.email
        )
        return { jwt: redirectedToken, user }
      }
    }

    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      console.error('[exchangeGoogleAccessTokenForStrapiSession] Failed:', res.status, errText)
      return null
    }

    const payload = await res.json().catch(() => null)
    console.log(
      '[exchangeGoogleAccessTokenForStrapiSession] Success, got user:',
      payload?.user?.email
    )

    if (!payload?.jwt || !payload?.user) {
      console.error('[exchangeGoogleAccessTokenForStrapiSession] Missing jwt or user in response')
      return null
    }

    return payload
  } catch (err) {
    console.error('[exchangeGoogleAccessTokenForStrapiSession] Error:', err.message)
    return null
  }
}

const verifyGoogleToken = async token => {
  const tokenInfoUrls = isJwtLike(token)
    ? [
        `https://oauth2.googleapis.com/tokeninfo?id_token=${token}`,
        `https://oauth2.googleapis.com/tokeninfo?access_token=${token}`,
      ]
    : [
        `https://oauth2.googleapis.com/tokeninfo?access_token=${token}`,
        `https://oauth2.googleapis.com/tokeninfo?id_token=${token}`,
      ]

  console.log('[verifyGoogleToken] Starting verification, isJwt:', isJwtLike(token))

  for (const url of tokenInfoUrls) {
    try {
      const res = await fetch(url)
      const payload = await res.json().catch(() => null)
      console.log('[verifyGoogleToken] URL:', url.split('=')[0] + '=...', 'Status:', res.status)

      if (
        res.ok &&
        payload?.email &&
        isVerifiedGoogleEmail(payload?.email_verified ?? payload?.verified_email ?? true)
      ) {
        console.log('[verifyGoogleToken] ✓ Token verified for:', payload.email)
        return payload
      }
    } catch (err) {
      console.error('[verifyGoogleToken] Fetch error:', err.message)
    }
  }

  console.error('[verifyGoogleToken] ✗ All verification attempts failed')
  return null
}

/** Create a UserSession row and set the refresh token cookie */
const createSession = async (res, userId, ipAddress, userAgent) => {
  const refreshToken = crypto.randomBytes(40).toString('hex')
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS)

  await prisma.userSession.create({
    data: {
      userId: String(userId),
      refreshToken,
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
      expiresAt,
    },
  })

  res.cookie(REFRESH_COOKIE, refreshToken, cookieOpts)
  return refreshToken
}

// ─── POST /auth/register ───────────────────────────────────────────────────────
export const register = async (req, res, next) => {
  try {
    const { email, password, first_name, last_name, phone } = req.body

    if (!email || !password || !first_name || !last_name || !phone) {
      return res.status(400).json({
        error: 'All fields are required',
        fields: {
          ...(!email && { email: 'Required' }),
          ...(!password && { password: 'Required' }),
          ...(!first_name && { first_name: 'Required' }),
          ...(!last_name && { last_name: 'Required' }),
          ...(!phone && { phone: 'Required' }),
        },
      })
    }

    // Auto-generate username — never shown to user
    const username = `${email.split('@')[0]}_${crypto.randomBytes(3).toString('hex')}`

    // Step 1: Register with Strapi — only accepts username/email/password
    // When email confirmation is enabled, Strapi sends the confirmation email and
    // returns { user } with no jwt. When disabled, it returns { jwt, user }.
    const result = await strapiPost('/api/auth/local/register', {
      username,
      email,
      password,
    })

    // Step 2: Best-effort profile sync — account creation should still succeed
    // even if the server token cannot update extended user fields.
    if (result.user?.id) {
      try {
        await strapiAdminPut(`/api/users/${result.user.id}`, { first_name, last_name, phone })
      } catch (profileSyncErr) {
        console.error('[auth.register] Failed to sync Strapi user profile fields:', profileSyncErr)
      }

      // Create customer profile — no photo for email users (frontend shows placeholder)
      await createCustomerProfile({
        userId: result.user.id,
        firstName: first_name,
        lastName: last_name,
        profilePhotoUrl: null,
      })
    }

    // Email confirmation pending — no JWT yet
    if (!result.jwt) {
      return res.status(200).json({
        pending: true,
        message: 'Check your email to verify your account.',
      })
    }

    // Email confirmation disabled — session created immediately
    await createSession(res, result.user.id, req.ip, req.headers['user-agent'])
    res.status(201).json({ jwt: result.jwt, user: sanitizeUser(result.user) })
  } catch (err) {
    if (err.strapiError?.details?.errors?.some(e => e.path?.includes('email'))) {
      return res.status(409).json({ error: 'An account with this email already exists' })
    }
    next(err)
  }
}

// ─── POST /auth/login ──────────────────────────────────────────────────────────
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const existingUser = await findUserByEmailForAuth(email)
    if (existingUser && isGoogleProvider(existingUser.provider)) {
      return res.status(409).json({
        error: 'This account was created with Google. Please continue with Google to sign in.',
        code: 'GOOGLE_ACCOUNT_USE_GOOGLE',
      })
    }

    const { jwt: strapiJwt, user } = await strapiPost('/api/auth/local', {
      identifier: email,
      password,
    })

    await createSession(res, user.id, req.ip, req.headers['user-agent'])

    res.json({ jwt: strapiJwt, user: sanitizeUser(user) })
  } catch (err) {
    if (err.status === 400) {
      const msg = err.message?.toLowerCase() ?? ''
      if (msg.includes('confirmed')) {
        return res.status(403).json({ error: 'Please confirm your email before logging in.' })
      }
      return res.status(401).json({ error: 'Incorrect email or password' })
    }
    next(err)
  }
}

// ─── POST /auth/refresh ────────────────────────────────────────────────────────
// Exchanges a valid refresh token cookie for a new Strapi JWT
export const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.[REFRESH_COOKIE]
    if (!token) return res.status(401).json({ error: 'No refresh token' })

    const session = await prisma.userSession.findUnique({
      where: { refreshToken: token },
    })

    if (!session || session.expiresAt < new Date()) {
      res.clearCookie(REFRESH_COOKIE, { path: '/auth' })
      return res.status(401).json({ error: 'Session expired — please log in again' })
    }

    // Sign a fresh Strapi-compatible JWT using the same secret
    const newJwt = jwt.sign({ id: parseInt(session.userId, 10) }, process.env.STRAPI_JWT_SECRET, {
      expiresIn: '7d',
    })

    // Rotate the refresh token
    const newRefreshToken = crypto.randomBytes(40).toString('hex')
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS)

    await prisma.userSession.update({
      where: { id: session.id },
      data: { refreshToken: newRefreshToken, expiresAt },
    })

    res.cookie(REFRESH_COOKIE, newRefreshToken, cookieOpts)
    res.json({ jwt: newJwt })
  } catch (err) {
    next(err)
  }
}

// ─── POST /auth/logout ─────────────────────────────────────────────────────────
export const logout = async (req, res, next) => {
  try {
    const token = req.cookies?.[REFRESH_COOKIE]

    if (token) {
      await prisma.userSession.deleteMany({ where: { refreshToken: token } })
    }

    res.clearCookie(REFRESH_COOKIE, { path: '/auth' })
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}

// ─── GET /auth/me ──────────────────────────────────────────────────────────────
export const me = async (req, res, next) => {
  try {
    const user = await strapiGetMe(req.token)
    let profile = null

    try {
      profile = await findCustomerProfile(user.id)
    } catch (err) {
      if (!isStrapiCredentialError(err)) {
        throw err
      }
    }

    res.json({ user: sanitizeUser(user), profile: sanitizeProfile(profile) })
  } catch (err) {
    next(err)
  }
}

// ─── GET /auth/profile ────────────────────────────────────────────────────────
export const getProfile = async (req, res, next) => {
  try {
    const userId = String(req.user.id)
    const profile = await findCustomerProfile(userId)
    if (!profile) return res.status(404).json({ error: 'Profile not found' })
    res.json({ profile: sanitizeProfile(profile) })
  } catch (err) {
    next(err)
  }
}

// ─── PATCH /auth/profile ──────────────────────────────────────────────────────
export const updateProfile = async (req, res, next) => {
  try {
    const userId = String(req.user.id)
    const { first_name, last_name, phone, date_of_birth, preferred_language, profile_photo_url } =
      req.body

    const existing = await findCustomerProfile(userId)

    const profileData = {
      ...(first_name !== undefined && { first_name }),
      ...(last_name !== undefined && { last_name }),
      ...(date_of_birth !== undefined && { date_of_birth }),
      ...(preferred_language !== undefined && { preferred_language }),
      ...(profile_photo_url !== undefined && { profile_photo_url }),
    }

    let updated
    if (!existing) {
      // Create profile if somehow missing (e.g. legacy accounts)
      const result = await strapiServerPost('/api/customer-profiles', {
        data: { user: parseInt(userId, 10), preferred_language: 'en', ...profileData },
      })
      updated = result.data
    } else {
      const result = await strapiServerPut(`/api/customer-profiles/${existing.documentId}`, {
        data: profileData,
      })
      updated = result.data
    }

    // Also sync shared customer fields back to the Strapi user record for consistency.
    if (first_name !== undefined || last_name !== undefined || phone !== undefined) {
      try {
        await strapiAdminPut(`/api/users/${userId}`, {
          ...(first_name !== undefined && { first_name }),
          ...(last_name !== undefined && { last_name }),
          ...(phone !== undefined && { phone }),
        })
      } catch (err) {
        if (!isStrapiCredentialError(err)) {
          throw err
        }
      }
    }

    res.json({ profile: sanitizeProfile(updated) })
  } catch (err) {
    next(err)
  }
}

// ─── POST /auth/forgot-password ───────────────────────────────────────────────
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ error: 'Email is required' })

    // Strapi sends the reset email — we just proxy the call
    await strapiPost('/api/auth/forgot-password', { email })

    // Always return success regardless of whether email exists (security)
    res.json({ ok: true, message: 'If that email is registered, a reset link has been sent.' })
  } catch (err) {
    // Swallow Strapi errors — same response either way
    res.json({ ok: true, message: 'If that email is registered, a reset link has been sent.' })
  }
}

// ─── POST /auth/reset-password ────────────────────────────────────────────────
// Frontend receives code from email link (?code=xxx), submits with new password
export const resetPassword = async (req, res, next) => {
  try {
    const { code, password, passwordConfirmation } = req.body

    if (!code || !password || !passwordConfirmation) {
      return res
        .status(400)
        .json({ error: 'code, password, and passwordConfirmation are required' })
    }

    if (password !== passwordConfirmation) {
      return res.status(400).json({ error: 'Passwords do not match' })
    }

    const result = await strapiPost('/api/auth/reset-password', {
      code,
      password,
      passwordConfirmation,
    })

    // Completing a password reset proves email ownership — confirm the user if not already
    if (result?.user?.id) {
      try {
        await strapiAdminPut(`/api/users/${result.user.id}`, { confirmed: true })
      } catch (confirmErr) {
        console.error(
          '[auth.resetPassword] Failed to sync confirmed=true after password reset:',
          confirmErr
        )
      }
    }

    res.json({ ok: true })
  } catch (err) {
    if (err.status === 400) {
      return res.status(400).json({ error: 'Reset link is invalid or has expired' })
    }
    next(err)
  }
}

// ─── POST /auth/google/session ─────────────────────────────────────────────────
// Called by frontend AFTER Strapi completes the Google OAuth redirect.
//
// Flow:
//   1. Frontend redirects browser → http://localhost:1337/api/connect/google
//   2. Strapi ↔ Google OAuth handshake
//   3. Strapi redirects → http://localhost:5173/auth/callback?access_token=<jwt>
//   4. Frontend extracts access_token from URL, POST it here
//   5. We verify it, create a UserSession, return { jwt, user }
export const googleSession = async (req, res, next) => {
  try {
    const { access_token } = req.body
    if (!access_token) {
      return res.status(400).json({ error: 'access_token is required' })
    }

    let user
    let strapiJwt
    let googleName = {} // { firstName, lastName, picture } — populated for raw token path

    if (isJwtLike(access_token)) {
      try {
        // First try the simplest case: Strapi already redirected back with its own JWT.
        user = await strapiGetMe(access_token)
        strapiJwt = access_token
      } catch (err) {
        // Not a Strapi JWT — fall through and verify it as a Google token instead.
        if (err.status && err.status !== 401 && err.status !== 403) {
          throw err
        }
      }
    }

    if (!user || !strapiJwt) {
      // Raw Google token (or Google JWT/id_token).
      // First let Strapi complete the provider callback exchange, which returns
      // the app JWT + user without requiring admin-only /api/users access.
      console.log('[googleSession] Attempting Strapi OAuth callback exchange...')
      const strapiOAuthSession = await exchangeGoogleAccessTokenForStrapiSession(access_token)
      if (strapiOAuthSession?.jwt && strapiOAuthSession?.user) {
        strapiJwt = strapiOAuthSession.jwt
        user = strapiOAuthSession.user
        console.log('[googleSession] ✓ Got user from Strapi OAuth:', user.email)
      } else {
        console.error(
          '[googleSession] ✗ Strapi OAuth callback failed. Token may be invalid or Strapi Google OAuth not configured.'
        )
      }
    }

    if (!user || !strapiJwt) {
      // Fallback for environments where Strapi returns a raw Google token and
      // the provider callback exchange is unavailable.
      console.log('[googleSession] Fallback: Verifying token directly with Google API...')
      const tokenInfo = await verifyGoogleToken(access_token)

      if (!tokenInfo) {
        console.error('[googleSession] ✗ Google token verification failed - all methods exhausted')
        return res.status(401).json({ error: 'Invalid or expired Google token' })
      }

      console.log('[googleSession] ✓ Token verified with Google:', tokenInfo.email)

      googleName = extractGoogleProfile(tokenInfo)

      // Find existing Strapi user by email
      user = await findUserByEmailForAuth(tokenInfo.email)

      if (user && !isGoogleProvider(user.provider)) {
        return res.status(409).json({
          error:
            'This email is already registered with password login. Please sign in with your password.',
          code: 'LOCAL_ACCOUNT_USE_PASSWORD',
        })
      }

      if (!user) {
        // First-time Google login — create Strapi user
        const username = `${tokenInfo.email.split('@')[0]}_${crypto.randomBytes(3).toString('hex')}`
        user = await strapiCreateUser({
          username,
          email: tokenInfo.email,
          provider: 'google',
          confirmed: true,
          password: crypto.randomBytes(20).toString('hex'),
          first_name: googleName.firstName,
          last_name: googleName.lastName,
        })
      }

      // Sign a Strapi-compatible JWT
      strapiJwt = jwt.sign({ id: user.id }, process.env.STRAPI_JWT_SECRET, { expiresIn: '7d' })
    }

    if (user && !isGoogleProvider(user.provider)) {
      return res.status(409).json({
        error:
          'This email is already registered with password login. Please sign in with your password.',
        code: 'LOCAL_ACCOUNT_USE_PASSWORD',
      })
    }

    // Ensure customer profile exists — create on first login, skip if already present
    let existingProfile = null
    try {
      existingProfile = await findCustomerProfile(user.id)
    } catch (err) {
      if (!isStrapiCredentialError(err)) {
        throw err
      }

      console.warn(
        '[googleSession] Skipping customer profile lookup because Strapi server credentials are unavailable'
      )
    }
    if (!existingProfile) {
      await createCustomerProfile({
        userId: user.id,
        firstName: googleName.firstName ?? user.first_name ?? null,
        lastName: googleName.lastName ?? user.last_name ?? null,
        profilePhotoUrl: googleName.picture ?? null,
      })
    }

    // Store OAuthAccount record (idempotent)
    await prisma.oAuthAccount.upsert({
      where: { provider_providerUserId: { provider: 'google', providerUserId: String(user.id) } },
      create: {
        userId: String(user.id),
        provider: 'google',
        providerUserId: String(user.id),
      },
      update: {},
    })

    await createSession(res, user.id, req.ip, req.headers['user-agent'])

    res.json({ jwt: strapiJwt, user: sanitizeUser(user) })
  } catch (err) {
    next(err)
  }
}
