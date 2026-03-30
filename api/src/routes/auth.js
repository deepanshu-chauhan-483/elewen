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
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 6 }
 *               first_name: { type: string }
 *               last_name: { type: string }
 *               phone: { type: string }
 *     responses:
 *       201:
 *         description: Account created — returns JWT + user, sets refresh cookie
 *       200:
 *         description: Email confirmation pending
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already registered
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
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login successful — returns JWT + user, sets refresh cookie
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Incorrect email or password
 *       403:
 *         description: Email not confirmed
 */
router.post('/login', login)

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Exchange refresh cookie for a new JWT
 *     responses:
 *       200:
 *         description: New JWT issued, refresh token rotated
 *       401:
 *         description: No refresh token or session expired
 */
router.post('/refresh', refresh)

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout — deletes session and clears refresh cookie
 *     responses:
 *       200:
 *         description: Logged out
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
 *       401:
 *         description: Missing or invalid JWT
 */
router.get('/me', requireAuth, me)

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Send password reset email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200:
 *         description: Reset link sent (always succeeds — no email enumeration)
 */
router.post('/forgot-password', forgotPassword)

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password using code from email link
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, password, passwordConfirmation]
 *             properties:
 *               code: { type: string }
 *               password: { type: string, minLength: 8 }
 *               passwordConfirmation: { type: string, minLength: 8 }
 *     responses:
 *       200:
 *         description: Password updated, user confirmed
 *       400:
 *         description: Reset link invalid or expired
 */
router.post('/reset-password', resetPassword)

/**
 * @openapi
 * /auth/google/session:
 *   post:
 *     tags: [Auth]
 *     summary: Complete Google OAuth — exchange access_token for session
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [access_token]
 *             properties:
 *               access_token: { type: string }
 *     responses:
 *       200:
 *         description: Session created — returns JWT + user, sets refresh cookie
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid Google token
 */
router.post('/google/session', googleSession)

export default router
