import prisma from '../lib/prisma.js'

// Admin assigns a vendor to a booking.
export const createAssignment = async (req, res, next) => {
  try {
    const { bookingId, vendorId, serviceId } = req.body
    const adminId = String(req.user.id)

    if (!bookingId || !vendorId) {
      return res.status(400).json({ error: 'bookingId and vendorId are required' })
    }

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } })
    if (!booking) return res.status(404).json({ error: 'Booking not found' })

    const existingAssignment = await prisma.vendorAssignment.findFirst({
      where: {
        bookingId,
        vendorId: String(vendorId),
        status: {
          in: ['assigned', 'confirmed'],
        },
      },
    })

    if (existingAssignment) {
      return res
        .status(409)
        .json({ error: 'This vendor is already actively assigned to the booking' })
    }

    const assignment = await prisma.vendorAssignment.create({
      data: {
        bookingId,
        vendorId: String(vendorId),
        serviceId: serviceId ? String(serviceId) : null,
        assignedBy: adminId,
        status: 'assigned',
      },
    })

    res.status(201).json({ assignment })
  } catch (err) {
    next(err)
  }
}

// List assignments, optionally filtered by bookingId or vendorId.
export const getAssignments = async (req, res, next) => {
  try {
    const { bookingId, vendorId } = req.query
    const where = {}

    if (bookingId) where.bookingId = bookingId
    if (vendorId) where.vendorId = String(vendorId)

    const assignments = await prisma.vendorAssignment.findMany({
      where,
      orderBy: { assignedAt: 'desc' },
    })

    res.json({ assignments })
  } catch (err) {
    next(err)
  }
}

// Update assignment status: assigned -> confirmed -> completed -> reassigned.
export const updateAssignment = async (req, res, next) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const allowed = ['assigned', 'confirmed', 'completed', 'reassigned']
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${allowed.join(', ')}` })
    }

    const assignment = await prisma.vendorAssignment.findUnique({ where: { id } })
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' })

    const updated = await prisma.vendorAssignment.update({
      where: { id },
      data: { status },
    })

    res.json({ assignment: updated })
  } catch (err) {
    next(err)
  }
}

// Reassign an active vendor assignment to a new booking in one transaction.
export const reassignAssignment = async (req, res, next) => {
  try {
    const { id } = req.params
    const { bookingId } = req.body
    const adminId = String(req.user.id)

    if (!bookingId) {
      return res.status(400).json({ error: 'bookingId is required' })
    }

    const assignment = await prisma.vendorAssignment.findUnique({ where: { id } })
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' })

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } })
    if (!booking) return res.status(404).json({ error: 'Booking not found' })

    const existingAssignment = await prisma.vendorAssignment.findFirst({
      where: {
        bookingId,
        vendorId: String(assignment.vendorId),
        status: {
          in: ['assigned', 'confirmed'],
        },
      },
    })

    if (existingAssignment) {
      return res
        .status(409)
        .json({ error: 'This vendor is already actively assigned to the booking' })
    }

    const result = await prisma.$transaction(async tx => {
      const previousAssignment = await tx.vendorAssignment.update({
        where: { id },
        data: { status: 'reassigned' },
      })

      const reassignedAssignment = await tx.vendorAssignment.create({
        data: {
          bookingId,
          vendorId: String(assignment.vendorId),
          serviceId: assignment.serviceId ? String(assignment.serviceId) : null,
          assignedBy: adminId,
          status: 'assigned',
        },
      })

      return {
        previousAssignment,
        assignment: reassignedAssignment,
      }
    })

    res.json(result)
  } catch (err) {
    next(err)
  }
}

// Remove a vendor assignment from a booking.
export const deleteAssignment = async (req, res, next) => {
  try {
    const { id } = req.params

    const assignment = await prisma.vendorAssignment.findUnique({ where: { id } })
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' })

    await prisma.vendorAssignment.delete({ where: { id } })

    res.json({ message: 'Assignment removed' })
  } catch (err) {
    next(err)
  }
}

// Get bank/payout info for a vendor.
export const getBankInfo = async (req, res, next) => {
  try {
    const { vendorId } = req.params

    const info = await prisma.vendorBankInfo.findUnique({
      where: { vendorId: String(vendorId) },
    })

    res.json({ bankInfo: info ?? null })
  } catch (err) {
    next(err)
  }
}

// Upsert bank info for a vendor (vendor self-service or admin).
export const upsertBankInfo = async (req, res, next) => {
  try {
    const { vendorId, bankName, accountNumber, ifscCode, accountHolderName, paymentPreference } =
      req.body

    if (!vendorId) return res.status(400).json({ error: 'vendorId is required' })

    const bankInfo = await prisma.vendorBankInfo.upsert({
      where: { vendorId: String(vendorId) },
      update: { bankName, accountNumber, ifscCode, accountHolderName, paymentPreference },
      create: {
        vendorId: String(vendorId),
        bankName,
        accountNumber,
        ifscCode,
        accountHolderName,
        paymentPreference,
      },
    })

    res.json({ bankInfo })
  } catch (err) {
    next(err)
  }
}
