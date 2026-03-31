import { Router } from 'express'
import {
  register,
  login,
  refresh,
  logout,
  me,
  forgotPassword,
  resetPassword,
  googleSession,
} from '../controllers/auth.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new customer account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, first_name, last_name, phone]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: priya@example.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: SecurePass123
 *               first_name:
 *                 type: string
 *                 example: Priya
 *               last_name:
 *                 type: string
 *                 example: Sharma
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *     responses:
 *       201:
 *         description: Account created. Returns JWT + user. Refresh token set as HttpOnly cookie.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation error or email already registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 */
router.post('/register', register)

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: priya@example.com
 *               password:
 *                 type: string
 *                 example: SecurePass123
 *     responses:
 *       200:
 *         description: Login successful. Returns JWT + user. Refresh token set as HttpOnly cookie.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Incorrect email or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', login)

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Exchange refresh token cookie for a new JWT
 *     description: >
 *       Reads the `elewen_refresh` HttpOnly cookie. Returns a fresh JWT and
 *       rotates the refresh token. Call this when the JWT expires (after 7 days).
 *     responses:
 *       200:
 *         description: New JWT issued
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 jwt:
 *                   type: string
 *       401:
 *         description: No refresh token or session expired
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/refresh', refresh)

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout — invalidates the refresh token session
 *     description: Deletes the server-side session and clears the refresh cookie.
 *     responses:
 *       200:
 *         description: Logged out
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 */
router.post('/logout', logout)

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Missing or invalid JWT
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/me', requireAuth, me)

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Send password reset email
 *     description: >
 *       Triggers Strapi to send a reset link to the email via Resend.
 *       Always returns success regardless of whether the email exists (security).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: priya@example.com
 *     responses:
 *       200:
 *         description: Reset email sent (or silently ignored if email not found)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: If that email is registered, a reset link has been sent.
 */
router.post('/forgot-password', forgotPassword)

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password using code from email link
 *     description: >
 *       The reset link in the email contains `?code=xxx`. The frontend extracts
 *       this code and submits it here along with the new password.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, password, passwordConfirmation]
 *             properties:
 *               code:
 *                 type: string
 *                 description: Reset code from the email link query param
 *               password:
 *                 type: string
 *                 minLength: 8
 *               passwordConfirmation:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Reset link invalid or expired
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/reset-password', resetPassword)

/**
 * @openapi
 * /auth/google/session:
 *   post:
 *     tags: [Auth]
 *     summary: Complete Google OAuth login
 *     description: >
 *       Called by the frontend after Strapi completes the Google OAuth redirect.
 *       Flow: browser → GET /api/connect/google (Strapi) → Google → Strapi redirects to
 *       /auth/callback?access_token=JWT → frontend POSTs that token here.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [access_token]
 *             properties:
 *               access_token:
 *                 type: string
 *                 description: Strapi JWT from the OAuth callback URL query param
 *     responses:
 *       200:
 *         description: Session created. Returns JWT + user. Refresh cookie set.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: access_token missing
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/google/session', googleSession)

export default router
