import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import {
  getOrCreateThread,
  getThread,
  sendMessage,
  markRead,
  getUnreadCount,
} from '../controllers/messaging.js'

const router = Router()
router.use(requireAuth)

/**
 * @openapi
 * /messages/unread-count:
 *   get:
 *     tags: [Messaging]
 *     summary: Get total unread message count for the current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 unreadCount:
 *                   type: integer
 *                   example: 3
 */
router.get('/unread-count', getUnreadCount)

/**
 * @openapi
 * /messages/threads:
 *   post:
 *     tags: [Messaging]
 *     summary: Get or create a message thread for a booking (idempotent)
 *     description: |
 *       Creates a thread if one doesn't exist for the booking, or returns the existing thread
 *       with all messages. Safe to call multiple times.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bookingId]
 *             properties:
 *               bookingId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Thread with messages
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 thread:
 *                   $ref: '#/components/schemas/MessageThread'
 *       404:
 *         description: Booking not found
 */
router.post('/threads', getOrCreateThread)

/**
 * @openapi
 * /messages/threads/{bookingId}:
 *   get:
 *     tags: [Messaging]
 *     summary: Get thread and all messages for a booking
 *     description: Also marks all unread messages as read for the current user.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: bookingId, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Thread with messages and attachments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 thread:
 *                   $ref: '#/components/schemas/MessageThread'
 *       404:
 *         description: Thread not found
 */
router.get('/threads/:bookingId', getThread)

/**
 * @openapi
 * /messages:
 *   post:
 *     tags: [Messaging]
 *     summary: Send a message to a thread
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [threadId]
 *             properties:
 *               threadId:
 *                 type: string
 *                 format: uuid
 *               messageText:
 *                 type: string
 *               messageType:
 *                 type: string
 *                 enum: [text, system, status_update]
 *                 default: text
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     fileUrl:
 *                       type: string
 *                     fileType:
 *                       type: string
 *                       enum: [image, document, media]
 *     responses:
 *       201:
 *         description: Message sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   $ref: '#/components/schemas/Message'
 *       400:
 *         description: Missing threadId or content
 *       404:
 *         description: Thread not found
 */
router.post('/', sendMessage)

/**
 * @openapi
 * /messages/{id}/read:
 *   patch:
 *     tags: [Messaging]
 *     summary: Mark a message as read by the current user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Marked as read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Marked as read
 *       404:
 *         description: Message not found
 */
router.patch('/:id/read', markRead)

export default router
