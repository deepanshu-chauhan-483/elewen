import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import {
  createBooking,
  listBookings,
  getBooking,
  confirmCodBooking,
  updateStatus,
  cancelBooking,
  addTimeline,
  getTimeline,
  addNote,
  getNotes,
  addFile,
  getFiles,
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
 * /bookings/{id}/confirm-cod:
 *   post:
 *     tags: [Bookings]
 *     summary: Confirm a Hookah-only booking with pay-on-delivery (COD)
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/confirm-cod', confirmCodBooking)

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

/**
 * @openapi
 * /bookings/{id}/notes:
 *   post:
 *     tags: [Bookings]
 *     summary: Add a note to a booking
 *     description: Customer-submitted notes are stored with isInternal false and are readable by both customer and admin.
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
 *             required: [note]
 *             properties:
 *               note: { type: string }
 *     responses:
 *       201:
 *         description: Note created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 note:
 *                   $ref: '#/components/schemas/BookingNote'
 *       400:
 *         description: note is required
 *       403:
 *         description: Forbidden
 *   get:
 *     tags: [Bookings]
 *     summary: List non-internal notes for a booking
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Array of notes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notes:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BookingNote'
 */
router.post('/:id/notes', addNote)
router.get('/:id/notes', getNotes)

/**
 * @openapi
 * /bookings/{id}/files:
 *   post:
 *     tags: [Bookings]
 *     summary: Attach a file URL to a booking
 *     description: Client pre-uploads to Strapi media library or Cloudinary, then passes the URL here.
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
 *             required: [fileUrl]
 *             properties:
 *               fileUrl: { type: string, example: 'https://res.cloudinary.com/elewen/image/upload/...' }
 *               fileType: { type: string, enum: [document, contract, image] }
 *     responses:
 *       201:
 *         description: File record created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 file:
 *                   $ref: '#/components/schemas/BookingFile'
 *       400:
 *         description: fileUrl is required or invalid fileType
 *       403:
 *         description: Forbidden
 *   get:
 *     tags: [Bookings]
 *     summary: List all files attached to a booking
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Array of file records
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 files:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BookingFile'
 */
router.post('/:id/files', addFile)
router.get('/:id/files', getFiles)

export default router
