import prisma from '../lib/prisma.js'

// ─── POST /vendor-assignments ─────────────────────────────────────────────────
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

// ─── GET /vendor-assignments ──────────────────────────────────────────────────
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

// ─── PATCH /vendor-assignments/:id ───────────────────────────────────────────
// Update assignment status: assigned → confirmed → completed → reassigned.
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

// ─── DELETE /vendor-assignments/:id ──────────────────────────────────────────
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

// ─── GET /vendor-assignments/bank-info/:vendorId ──────────────────────────────
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

// ─── PUT /vendor-assignments/bank-info ───────────────────────────────────────
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
