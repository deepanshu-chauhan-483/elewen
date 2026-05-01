import { Router } from 'express'
import { createContact } from '../controllers/contact.js'

const router = Router()

/**
 * @openapi
 * /contact:
 *   post:
 *     tags: [Leads]
 *     summary: Submit a Contact Us enquiry
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, email, phone, message]
 *             properties:
 *               firstName: { type: string }
 *               lastName: { type: string }
 *               email: { type: string, format: email }
 *               phone: { type: string }
 *               message: { type: string }
 *     responses:
 *       201:
 *         description: Contact request received
 *       400:
 *         description: Required fields missing
 */
router.post('/', createContact)

export default router
