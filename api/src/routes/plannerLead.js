import { Router } from 'express'
import { createPlannerLead } from '../controllers/plannerLead.js'

const router = Router()

/**
 * @openapi
 * /planner-leads:
 *   post:
 *     tags: [Leads]
 *     summary: Submit an In-House Event Planner enquiry
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [full_name, email, phone, city, event_type, guest_count, venue_type]
 *             properties:
 *               full_name: { type: string }
 *               email: { type: string, format: email }
 *               phone: { type: string }
 *               city: { type: string }
 *               event_type: { type: string }
 *               event_date: { type: string, format: date }
 *               guest_count: { type: string, example: "50-100" }
 *               venue_type: { type: string }
 *               support_types: { type: array, items: { type: string } }
 *               vision_notes: { type: string }
 *     responses:
 *       201:
 *         description: Lead received
 *       400:
 *         description: Required fields missing
 */
router.post('/', createPlannerLead)

export default router
