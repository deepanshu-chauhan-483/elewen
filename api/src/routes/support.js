import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import {
  createTicket,
  getTickets,
  getTicket,
  addMessage,
  updateTicket,
} from '../controllers/support.js'

const router = Router()
router.use(requireAuth)

/**
 * @openapi
 * /support:
 *   post:
 *     tags: [Support]
 *     summary: Create a support ticket
 *     description: Customer opens a ticket, optionally linked to a booking. First message is included in the request.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [subject, message]
 *             properties:
 *               subject:
 *                 type: string
 *               message:
 *                 type: string
 *                 description: Opening message body
 *               bookingId:
 *                 type: string
 *                 format: uuid
 *                 description: Optional — link ticket to a booking
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 default: medium
 *     responses:
 *       201:
 *         description: Ticket created with opening message
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ticket:
 *                   $ref: '#/components/schemas/SupportTicket'
 *       400:
 *         description: Missing subject or message
 *       403:
 *         description: Booking belongs to another user
 *   get:
 *     tags: [Support]
 *     summary: List support tickets
 *     description: |
 *       Customers see only their own tickets.
 *       Pass `all=true` to return all tickets (admin use).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: query, name: all, schema: { type: boolean }, description: "Admin: return all tickets" }
 *       - { in: query, name: status, schema: { type: string, enum: [open, in_progress, resolved, closed] } }
 *       - { in: query, name: priority, schema: { type: string, enum: [low, medium, high] } }
 *       - { in: query, name: page, schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, default: 20 } }
 *     responses:
 *       200:
 *         description: Paginated ticket list with latest message preview
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tickets:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SupportTicket'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 pages:
 *                   type: integer
 */
router.post('/', createTicket)
router.get('/', getTickets)

/**
 * @openapi
 * /support/{id}:
 *   get:
 *     tags: [Support]
 *     summary: Get a ticket with all messages
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Ticket with full message history
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ticket:
 *                   $ref: '#/components/schemas/SupportTicket'
 *       404:
 *         description: Ticket not found
 *   patch:
 *     tags: [Support]
 *     summary: (Admin) Update ticket status or priority
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
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [open, in_progress, resolved, closed]
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *     responses:
 *       200:
 *         description: Ticket updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ticket:
 *                   $ref: '#/components/schemas/SupportTicket'
 *       404:
 *         description: Ticket not found
 */
router.get('/:id', getTicket)
router.patch('/:id', updateTicket)

/**
 * @openapi
 * /support/{id}/messages:
 *   post:
 *     tags: [Support]
 *     summary: Add a reply or internal note to a ticket
 *     description: |
 *       Customers add replies. Admins can also add internal notes (isInternalNote: true)
 *       that are not visible to the customer.
 *       If a customer replies to a resolved ticket, it automatically re-opens to in_progress.
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
 *             required: [message]
 *             properties:
 *               message:
 *                 type: string
 *               isInternalNote:
 *                 type: boolean
 *                 default: false
 *                 description: Admin only — hidden from customer
 *               attachmentUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Message added
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     ticketId:
 *                       type: string
 *                       format: uuid
 *                     senderId:
 *                       type: string
 *                     message:
 *                       type: string
 *                     isInternalNote:
 *                       type: boolean
 *                     attachmentUrl:
 *                       type: string
 *                       nullable: true
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Cannot reply to closed ticket
 *       404:
 *         description: Ticket not found
 */
router.post('/:id/messages', addMessage)

export default router
