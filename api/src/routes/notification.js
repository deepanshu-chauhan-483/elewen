import { Router } from 'express'
import {
  clearAllNotifications,
  getNotifications,
  getUnreadCount,
  markAllRead,
  markRead,
} from '../controllers/notification.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth)

/**
 * @openapi
 * /notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: Get notifications for the authenticated user
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: unreadOnly
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: Paginated notifications with unread count
 */
router.get('/', getNotifications)

/**
 * @openapi
 * /notifications:
 *   delete:
 *     tags: [Notifications]
 *     summary: Delete all notifications for the authenticated user
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Count of notifications deleted
 */
router.delete('/', clearAllNotifications)

/**
 * @openapi
 * /notifications/unread-count:
 *   get:
 *     tags: [Notifications]
 *     summary: Get count of unread notifications
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Unread count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count: { type: integer }
 */
router.get('/unread-count', getUnreadCount)

/**
 * @openapi
 * /notifications/read-all:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark all notifications as read
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Count of notifications marked as read
 */
router.patch('/read-all', markAllRead)

/**
 * @openapi
 * /notifications/{id}/read:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark a single notification as read
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Updated notification
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Notification not found
 */
router.patch('/:id/read', markRead)

export default router
