import { Router } from 'express'
import { createConsultation } from '../controllers/consultation.js'
import { validate } from '../middleware/validate.js'
import { createConsultationSchema } from '../schemas/consultation.js'

const router = Router()

/**
 * @openapi
 * /consultations:
 *   post:
 *     tags: [Leads]
 *     summary: Submit a Book a Consultation enquiry
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [full_name, email, phone]
 *             properties:
 *               full_name: { type: string }
 *               email: { type: string, format: email }
 *               phone: { type: string }
 *               event_type: { type: string }
 *               event_date: { type: string, format: date }
 *               guest_count: { type: string }
 *               city: { type: string }
 *               budget_range: { type: string }
 *               vision_notes: { type: string }
 *     responses:
 *       201:
 *         description: Consultation request received
 *       400:
 *         description: Required fields missing
 */
router.post('/', validate(createConsultationSchema), createConsultation)

export default router
