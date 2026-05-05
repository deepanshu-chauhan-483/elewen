import prisma from '../lib/prisma.js'

export const createTicket = async (req, res, next) => {
  try {
    const { bookingId, subject, message, priority = 'medium' } = req.body
    const userId = String(req.user.id)

    if (!subject) return res.status(400).json({ error: 'subject is required' })
    if (!message) return res.status(400).json({ error: 'message is required' })

    const validPriorities = ['low', 'medium', 'high']
    if (!validPriorities.includes(priority)) {
      return res.status(400).json({ error: 'priority must be low, medium, or high' })
    }

    if (bookingId) {
      const booking = await prisma.booking.findUnique({ where: { id: bookingId } })
      if (!booking) return res.status(404).json({ error: 'Booking not found' })
      if (booking.userId !== userId) return res.status(403).json({ error: 'Forbidden' })
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        userId,
        bookingId: bookingId ?? null,
        subject,
        priority,
        status: 'open',
        messages: {
          create: {
            senderId: userId,
            message,
            isInternalNote: false,
          },
        },
      },
      include: {
        messages: {
          where: { isInternalNote: false },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    res.status(201).json({ ticket })
  } catch (err) {
    next(err)
  }
}

export const getTickets = async (req, res, next) => {
  try {
    const userId = String(req.user.id)
    const { all, status, priority, page = '1', limit = '20' } = req.query

    const where = {}
    if (all !== 'true') where.userId = userId
    if (status) where.status = status
    if (priority) where.priority = priority

    const take = Math.min(Number(limit), 50)
    const skip = (Number(page) - 1) * take

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
        include: {
          messages: {
            where: all === 'true' ? undefined : { isInternalNote: false },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
      prisma.supportTicket.count({ where }),
    ])

    res.json({ tickets, total, page: Number(page), pages: Math.ceil(total / take) })
  } catch (err) {
    next(err)
  }
}

export const getTicket = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = String(req.user.id)

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: {
        messages: {
          where: { isInternalNote: false },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!ticket) return res.status(404).json({ error: 'Ticket not found' })
    if (ticket.userId !== userId) return res.status(403).json({ error: 'Forbidden' })

    res.json({ ticket })
  } catch (err) {
    next(err)
  }
}

export const addMessage = async (req, res, next) => {
  try {
    const { id } = req.params
    const { message, attachmentUrl } = req.body
    const userId = String(req.user.id)

    if (!message) return res.status(400).json({ error: 'message is required' })

    const ticket = await prisma.supportTicket.findUnique({ where: { id } })
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' })
    if (ticket.userId !== userId) return res.status(403).json({ error: 'Forbidden' })
    if (ticket.status === 'closed') {
      return res.status(400).json({ error: 'Cannot reply to a closed ticket' })
    }

    const supportMessage = await prisma.supportMessage.create({
      data: {
        ticketId: id,
        senderId: userId,
        message,
        isInternalNote: false,
        attachmentUrl: attachmentUrl ?? null,
      },
    })

    if (ticket.status === 'resolved') {
      await prisma.supportTicket.update({
        where: { id },
        data: { status: 'in_progress' },
      })
    }

    res.status(201).json({ message: supportMessage })
  } catch (err) {
    next(err)
  }
}

export const updateTicket = async (req, res, next) => {
  try {
    const { id } = req.params
    const { status, priority } = req.body

    const validStatuses = ['open', 'in_progress', 'resolved', 'closed']
    const validPriorities = ['low', 'medium', 'high']

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${validStatuses.join(', ')}` })
    }
    if (priority && !validPriorities.includes(priority)) {
      return res
        .status(400)
        .json({ error: `priority must be one of: ${validPriorities.join(', ')}` })
    }

    const ticket = await prisma.supportTicket.findUnique({ where: { id } })
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' })

    const updated = await prisma.supportTicket.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(priority && { priority }),
      },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    })

    res.json({ ticket: updated })
  } catch (err) {
    next(err)
  }
}
