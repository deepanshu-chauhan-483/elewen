import { Router } from 'express'
import { createConsultation } from '../controllers/consultation.js'

const router = Router()

/**
 * @openapi
 * /consultations:
 *   post:
 *     tags: [Leads]
 *     summary: Submit a Book a Consultation enquiry
 *     description: >
 *       Stores the enquiry in Strapi under Planner Leads with `lead_type = consultation`.
 *       Only full_name, email, and phone are required — all event detail fields are optional.
 *       No authentication required.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [full_name, email, phone]
 *             properties:
 *               full_name:
 *                 type: string
 *                 example: Meera Nair
 *               email:
 *                 type: string
 *                 format: email
 *                 example: meera@example.com
 *               phone:
 *                 type: string
 *                 example: "9123456789"
 *               event_type:
 *                 type: string
 *                 example: Birthday Party
 *               event_date:
 *                 type: string
 *                 format: date
 *                 example: "2026-12-20"
 *               guest_count:
 *                 type: string
 *                 example: "20-50"
 *               city:
 *                 type: string
 *                 example: Bangalore
 *               budget_range:
 *                 type: string
 *                 example: "₹1L – ₹3L"
 *               vision_notes:
 *                 type: string
 *                 example: Cosy intimate gathering with fairy lights
 *     responses:
 *       201:
 *         description: Consultation request received
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Required fields missing
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 */
router.post('/', createConsultation)

export default router
