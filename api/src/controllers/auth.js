import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import prisma from '../lib/prisma.js'
import {
  strapiPost,
  strapiGetMe,
  strapiAdminPut,
  strapiFindUserByEmail,
  strapiCreateUser,
} from '../lib/strapi.js'

const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days
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
    const { jwt: strapiJwt, user } = await strapiPost('/api/auth/local/register', {
      username,
      email,
      password,
    })

    // Step 2: Update profile fields via admin API token — Strapi rejects these on /register
    const updatedUser = await strapiAdminPut(`/api/users/${user.id}`, {
      first_name,
      last_name,
      phone,
    })

    await createSession(res, user.id, req.ip, req.headers['user-agent'])

    res.status(201).json({ jwt: strapiJwt, user: sanitizeUser({ ...user, ...updatedUser }) })
  } catch (err) {
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

    const { jwt: strapiJwt, user } = await strapiPost('/api/auth/local', {
      identifier: email,
      password,
    })

    await createSession(res, user.id, req.ip, req.headers['user-agent'])

    res.json({ jwt: strapiJwt, user: sanitizeUser(user) })
  } catch (err) {
    // Map Strapi's generic "invalid credentials" to a safe message
    if (err.status === 400) {
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
// Returns current user from Strapi using the JWT in Authorization header
export const me = async (req, res, next) => {
  try {
    const user = await strapiGetMe(req.token)
    res.json({ user: sanitizeUser(user) })
  } catch (err) {
    next(err)
  }
}

// ─── POST /auth/forgot-password ───────────────────────────────────────────────
export const forgotPassword = async (req, res, next) => {
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

    await strapiPost('/api/auth/reset-password', { code, password, passwordConfirmation })

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

    if (access_token.startsWith('eyJ')) {
      // Already a Strapi JWT — verify and get user directly
      user = await strapiGetMe(access_token)
      strapiJwt = access_token
    } else {
      // Raw Google access token — verify with Google's tokeninfo endpoint
      const tokenInfoRes = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?access_token=${access_token}`
      )
      const tokenInfo = await tokenInfoRes.json()

      if (!tokenInfoRes.ok || !tokenInfo.email || tokenInfo.email_verified !== 'true') {
        return res.status(401).json({ error: 'Invalid or expired Google token' })
      }

      // Find existing Strapi user by email
      user = await strapiFindUserByEmail(tokenInfo.email)

      if (!user) {
        // First-time Google login — create Strapi user
        const username = `${tokenInfo.email.split('@')[0]}_${crypto.randomBytes(3).toString('hex')}`
        user = await strapiCreateUser({
          username,
          email: tokenInfo.email,
          provider: 'google',
          confirmed: true,
          password: crypto.randomBytes(20).toString('hex'),
        })
      }

      // Sign a Strapi-compatible JWT
      strapiJwt = jwt.sign({ id: user.id }, process.env.STRAPI_JWT_SECRET, { expiresIn: '7d' })
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
