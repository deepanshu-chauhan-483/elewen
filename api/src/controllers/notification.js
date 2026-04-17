import prisma from '../lib/prisma.js'

// ─── GET /notifications ────────────────────────────────────────────────────────
// Returns paginated notifications for the authenticated user, newest first.
export const getNotifications = async (req, res, next) => {
  try {
    const userId = String(req.user.id)
    const { page = 1, limit = 20, unreadOnly } = req.query
    const skip = (Number(page) - 1) * Number(limit)

    const where = { userId }
    if (unreadOnly === 'true') where.isRead = false

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ])

    res.json({
      notifications,
      unreadCount,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    })
  } catch (err) {
    next(err)
  }
}

// ─── PATCH /notifications/:id/read ────────────────────────────────────────────
export const markRead = async (req, res, next) => {
  try {
    const userId = String(req.user.id)
    const { id } = req.params

    const notification = await prisma.notification.findUnique({ where: { id } })
    if (!notification) return res.status(404).json({ error: 'Notification not found' })
    if (notification.userId !== userId) return res.status(403).json({ error: 'Forbidden' })

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    })

    res.json({ notification: updated })
  } catch (err) {
    next(err)
  }
}

// ─── PATCH /notifications/read-all ────────────────────────────────────────────
export const markAllRead = async (req, res, next) => {
  try {
    const userId = String(req.user.id)

    const { count } = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    })

    res.json({ ok: true, markedRead: count })
  } catch (err) {
    next(err)
  }
}

// ─── GET /notifications/unread-count ──────────────────────────────────────────
export const getUnreadCount = async (req, res, next) => {
  try {
    const userId = String(req.user.id)
    const count = await prisma.notification.count({ where: { userId, isRead: false } })
    res.json({ count })
  } catch (err) {
    next(err)
  }
}
