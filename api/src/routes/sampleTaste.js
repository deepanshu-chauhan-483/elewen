import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import {
  createSampleTaste,
  listSampleTastes,
  getSampleTaste,
  updateStatus,
  recordDecision,
} from '../controllers/sampleTaste.js'

const router = Router()

router.use(requireAuth)

/**
 * @openapi
 * /sample-taste:
 *   post:
 *     tags: [Sample Taste]
 *     summary: Request a sample taste booking
 *     description: Creates a new sample taste request. Status starts at 'new'. Expires in 7 days by default.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               packageId: { type: string, description: "Strapi package ID (numeric)", example: "4" }
 *               eventId: { type: string, description: "Strapi event ID (numeric)", example: "2" }
 *               guestCount: { type: integer, example: 50 }
 *               bookingDate: { type: string, format: date, example: "2026-05-10" }
 *     responses:
 *       201:
 *         description: Sample taste booking created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sample:
 *                   $ref: '#/components/schemas/SampleTaste'
 *       400:
 *         description: Package not found
 *   get:
 *     tags: [Sample Taste]
 *     summary: List all sample taste bookings for current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of sample taste bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 samples:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SampleTaste'
 */
router.post('/', createSampleTaste)
router.get('/', listSampleTastes)

/**
 * @openapi
 * /sample-taste/{id}:
 *   get:
 *     tags: [Sample Taste]
 *     summary: Get sample taste booking detail
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Sample taste booking detail with vendors
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
router.get('/:id', getSampleTaste)

/**
 * @openapi
 * /sample-taste/{id}/status:
 *   patch:
 *     tags: [Sample Taste]
 *     summary: Transition sample taste status
 *     description: "Valid transitions: new→assigned, assigned→delivered, delivered→completed. Any non-completed → cancelled."
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [assigned, delivered, completed, cancelled] }
 *               vendorId: { type: string, description: "Required when status=assigned. Strapi vendor ID." }
 *               menuItems: { type: object, description: "Optional menu items JSON when assigning vendor" }
 *     responses:
 *       200:
 *         description: Updated sample taste booking
 *       400:
 *         description: Invalid transition or missing vendorId
 *       403:
 *         description: Forbidden
 */
router.patch('/:id/status', updateStatus)

/**
 * @openapi
 * /sample-taste/{id}/decision:
 *   post:
 *     tags: [Sample Taste]
 *     summary: Record client decision after sample taste delivery
 *     description: Must be in 'delivered' status. Sets decision and marks as completed.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [decision]
 *             properties:
 *               decision: { type: string, enum: [convert_full, save, cancel, expired] }
 *               decisionNotes: { type: string }
 *               vendorId: { type: string, description: "Strapi vendor ID to attach feedback to" }
 *               rating: { type: integer, minimum: 1, maximum: 5 }
 *               feedbackText: { type: string }
 *     responses:
 *       200:
 *         description: Decision recorded, status set to completed
 *       400:
 *         description: Invalid decision or booking not in delivered status
 *       403:
 *         description: Forbidden
 */
router.post('/:id/decision', recordDecision)

export default router
