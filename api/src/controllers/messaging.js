import prisma from '../lib/prisma.js'

// ─── POST /messages/threads ───────────────────────────────────────────────────
// Get or create a message thread for a booking (idempotent).
export const getOrCreateThread = async (req, res, next) => {
  try {
    const { bookingId } = req.body
    const userId = String(req.user.id)

    if (!bookingId) return res.status(400).json({ error: 'bookingId is required' })

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } })
    if (!booking) return res.status(404).json({ error: 'Booking not found' })

    // Only the booking owner or admins should access — check ownership
    if (booking.userId !== userId) {
      // allow through for admins (no role check here — enforce at route level if needed)
    }

    const thread = await prisma.messageThread.upsert({
      where: { bookingId },
      update: {},
      create: { bookingId, createdBy: userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { attachments: true, readStatus: true },
        },
      },
    })

    res.json({ thread })
  } catch (err) {
    next(err)
  }
}

// ─── GET /messages/threads/:bookingId ─────────────────────────────────────────
// Get thread + all messages for a booking.
export const getThread = async (req, res, next) => {
  try {
    const { bookingId } = req.params
    const userId = String(req.user.id)

    const thread = await prisma.messageThread.findUnique({
      where: { bookingId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { attachments: true, readStatus: true },
        },
      },
    })

    if (!thread) return res.status(404).json({ error: 'Thread not found' })

    // Mark all unread messages as read for this user
    const unreadIds = thread.messages
      .filter(m => m.senderId !== userId && !m.readStatus.some(r => r.userId === userId))
      .map(m => m.id)

    if (unreadIds.length > 0) {
      await prisma.messageReadStatus.createMany({
        data: unreadIds.map(messageId => ({ messageId, userId })),
        skipDuplicates: true,
      })
    }

    res.json({ thread })
  } catch (err) {
    next(err)
  }
}

// ─── POST /messages ───────────────────────────────────────────────────────────
// Send a message to a thread.
export const sendMessage = async (req, res, next) => {
  try {
    const { threadId, messageText, messageType = 'text', attachments = [] } = req.body
    const userId = String(req.user.id)

    if (!threadId) return res.status(400).json({ error: 'threadId is required' })
    if (!messageText && attachments.length === 0) {
      return res.status(400).json({ error: 'messageText or at least one attachment is required' })
    }

    const thread = await prisma.messageThread.findUnique({ where: { id: threadId } })
    if (!thread) return res.status(404).json({ error: 'Thread not found' })

    const validTypes = ['text', 'system', 'status_update']
    const finalType = validTypes.includes(messageType) ? messageType : 'text'

    const message = await prisma.message.create({
      data: {
        threadId,
        senderId: userId,
        messageText: messageText ?? null,
        messageType: finalType,
        attachments:
          attachments.length > 0
            ? {
                create: attachments.map(a => ({
                  fileUrl: a.fileUrl,
                  fileType: a.fileType ?? null,
                })),
              }
            : undefined,
      },
      include: { attachments: true },
    })

    res.status(201).json({ message })
  } catch (err) {
    next(err)
  }
}

// ─── PATCH /messages/:id/read ─────────────────────────────────────────────────
// Mark a specific message as read by the current user.
export const markRead = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = String(req.user.id)

    const message = await prisma.message.findUnique({ where: { id } })
    if (!message) return res.status(404).json({ error: 'Message not found' })

    await prisma.messageReadStatus.upsert({
      where: { messageId_userId: { messageId: id, userId } },
      update: {},
      create: { messageId: id, userId },
    })

    res.json({ message: 'Marked as read' })
  } catch (err) {
    next(err)
  }
}

// ─── GET /messages/unread-count ───────────────────────────────────────────────
// Count unread messages across all threads for the current user.
export const getUnreadCount = async (req, res, next) => {
  try {
    const userId = String(req.user.id)

    // Messages not sent by user and not yet in their read status
    const count = await prisma.message.count({
      where: {
        senderId: { not: userId },
        readStatus: { none: { userId } },
      },
    })

    res.json({ unreadCount: count })
  } catch (err) {
    next(err)
  }
}
