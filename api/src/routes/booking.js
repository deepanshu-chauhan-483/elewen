import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import {
  createBooking,
  listBookings,
  getBooking,
  updateStatus,
  cancelBooking,
  addTimeline,
  getTimeline,
} from '../controllers/booking.js'

const router = Router()

router.use(requireAuth)

/**
 * @openapi
 * /bookings:
 *   post:
 *     tags: [Bookings]
 *     summary: Create a booking from current cart
 *     description: Cart must have items + eventDate + guestCount. Advance/remaining split from Global Settings (default 30%). Cart cleared on success.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Booking created with items and initial status log
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 booking:
 *                   $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Cart empty, or missing eventDate / guestCount
 *   get:
 *     tags: [Bookings]
 *     summary: List all bookings for current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 bookings:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Booking'
 */
router.post('/', createBooking)
router.get('/', listBookings)

/**
 * @openapi
 * /bookings/{id}:
 *   get:
 *     tags: [Bookings]
 *     summary: Get booking detail with items, timeline, vendor assignments, payments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Full booking detail
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Booking not found
 */
router.get('/:id', getBooking)

/**
 * @openapi
 * /bookings/{id}/status:
 *   patch:
 *     tags: [Bookings]
 *     summary: Transition booking status (state machine enforced)
 *     description: "Valid transitions: new→confirmed→info_collection→planning→pre_event→execution→completed. Any status can go to cancelled except completed."
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
 *               status: { type: string, example: confirmed }
 *               note: { type: string }
 *     responses:
 *       200:
 *         description: Updated booking
 *       400:
 *         description: Invalid transition
 *       403:
 *         description: Forbidden
 */
router.patch('/:id/status', updateStatus)

/**
 * @openapi
 * /bookings/{id}/cancel:
 *   post:
 *     tags: [Bookings]
 *     summary: Request booking cancellation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason: { type: string }
 *               policyAcknowledged: { type: boolean, default: false }
 *     responses:
 *       200:
 *         description: Cancellation submitted, booking marked cancelled
 *       400:
 *         description: Already cancelled/completed or cancellation already exists
 */
router.post('/:id/cancel', cancelBooking)

/**
 * @openapi
 * /bookings/{id}/timeline:
 *   post:
 *     tags: [Bookings]
 *     summary: Add a timeline entry to a booking
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
 *             required: [title]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               timelineDate: { type: string, format: date-time }
 *               status: { type: string, enum: [pending, completed], default: pending }
 *     responses:
 *       201:
 *         description: Timeline entry created
 *   get:
 *     tags: [Bookings]
 *     summary: Get all timeline entries for a booking
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Timeline entries ordered by date
 */
router.post('/:id/timeline', addTimeline)
router.get('/:id/timeline', getTimeline)

export default router
