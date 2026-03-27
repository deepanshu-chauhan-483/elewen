import { Router } from 'express'
import { createPlannerLead } from '../controllers/plannerLead.js'

const router = Router()

/**
 * @openapi
 * /planner-leads:
 *   post:
 *     tags: [Leads]
 *     summary: Submit an In-House Event Planner enquiry
 *     description: >
 *       Stores the enquiry in Strapi under Planner Leads with `lead_type = planner`.
 *       No authentication required — this is a public form.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [full_name, email, phone, city, event_type, guest_count, venue_type]
 *             properties:
 *               full_name:
 *                 type: string
 *                 example: Ananya Krishnan
 *               email:
 *                 type: string
 *                 format: email
 *                 example: ananya@example.com
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *               city:
 *                 type: string
 *                 example: Chennai
 *               event_type:
 *                 type: string
 *                 example: Wedding
 *               event_date:
 *                 type: string
 *                 format: date
 *                 example: "2026-11-15"
 *               guest_count:
 *                 type: string
 *                 description: Range string from form select — lower bound stored as integer
 *                 example: "50-100"
 *               venue_type:
 *                 type: string
 *                 example: Outdoor
 *               support_types:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Decor & Styling", "Catering"]
 *               vision_notes:
 *                 type: string
 *                 example: Elegant floral theme with warm lighting
 *     responses:
 *       201:
 *         description: Lead received
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
router.post('/', createPlannerLead)

export default router
