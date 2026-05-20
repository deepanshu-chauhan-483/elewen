import prisma from '../lib/prisma.js'

export const getOrCreateThread = async (req, res, next) => {
  try {
    const { bookingId } = req.body
    const userId = String(req.user.id)

    if (!bookingId) return res.status(400).json({ error: 'bookingId is required' })

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } })
    if (!booking) return res.status(404).json({ error: 'Booking not found' })
    if (booking.userId !== userId) return res.status(403).json({ error: 'Forbidden' })

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

export const getThread = async (req, res, next) => {
  try {
    const { bookingId } = req.params
    const userId = String(req.user.id)

    const thread = await prisma.messageThread.findUnique({
      where: { bookingId },
      include: {
        booking: true,
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { attachments: true, readStatus: true },
        },
      },
    })

    if (!thread) return res.status(404).json({ error: 'Thread not found' })
    if (thread.booking?.userId !== userId) return res.status(403).json({ error: 'Forbidden' })

    const unreadIds = thread.messages
      .filter(message => {
        return (
          message.senderId !== userId &&
          !message.readStatus.some(readStatus => readStatus.userId === userId)
        )
      })
      .map(message => message.id)

    if (unreadIds.length > 0) {
      await prisma.messageReadStatus.createMany({
        data: unreadIds.map(messageId => ({ messageId, userId })),
        skipDuplicates: true,
      })
    }

    res.json({
      thread: {
        ...thread,
        booking: undefined,
      },
    })
  } catch (err) {
    next(err)
  }
}

export const sendMessage = async (req, res, next) => {
  try {
    const { threadId, messageText, messageType = 'text', attachments = [] } = req.body
    const userId = String(req.user.id)

    if (!threadId) return res.status(400).json({ error: 'threadId is required' })
    if (!messageText && attachments.length === 0) {
      return res.status(400).json({ error: 'messageText or at least one attachment is required' })
    }

    const thread = await prisma.messageThread.findUnique({
      where: { id: threadId },
      include: { booking: true },
    })
    if (!thread) return res.status(404).json({ error: 'Thread not found' })
    if (thread.booking?.userId !== userId) return res.status(403).json({ error: 'Forbidden' })
    if (['completed', 'cancelled'].includes(String(thread.booking?.status ?? '').toLowerCase())) {
      return res.status(400).json({ error: 'Completed or cancelled bookings are read-only' })
    }

    const validTypes = ['text', 'system', 'status_update']
    const finalType = validTypes.includes(messageType) ? messageType : 'text'

    const message = await prisma.message.create({
      data: {
        threadId,
        senderId: userId,
        messageText: messageText ?? null,
        messageType: finalType,
        readStatus: {
          create: {
            userId,
          },
        },
        attachments:
          attachments.length > 0
            ? {
                create: attachments.map(attachment => ({
                  fileUrl: attachment.fileUrl,
                  fileType: attachment.fileType ?? null,
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

export const markRead = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = String(req.user.id)

    const message = await prisma.message.findUnique({
      where: { id },
      include: {
        thread: {
          include: { booking: true },
        },
      },
    })

    if (!message) return res.status(404).json({ error: 'Message not found' })
    if (message.thread?.booking?.userId !== userId)
      return res.status(403).json({ error: 'Forbidden' })

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

export const getUnreadCount = async (req, res, next) => {
  try {
    const userId = String(req.user.id)

    const count = await prisma.message.count({
      where: {
        senderId: { not: userId },
        readStatus: { none: { userId } },
        thread: {
          is: {
            booking: {
              is: {
                userId,
              },
            },
          },
        },
      },
    })

    res.json({ unreadCount: count })
  } catch (err) {
    next(err)
  }
}
