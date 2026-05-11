import prisma from '../lib/prisma.js'
import { strapiServerGet, strapiServerPost, strapiAdminPut } from '../lib/strapi.js'
import { notify } from '../lib/notify.js'
import { enrichBookings, filterBookingsByType } from '../lib/dashboardData.js'

const DEFAULT_ADVANCE_PCT = 30

// ─── Valid status transitions (customer-facing + system) ─────────────────────
const ALLOWED_TRANSITIONS = {
  new: ['confirmed', 'cancelled'],
  confirmed: ['info_collection', 'cancelled'],
  info_collection: ['planning', 'cancelled'],
  planning: ['pre_event', 'cancelled'],
  pre_event: ['execution', 'cancelled'],
  execution: ['completed', 'post_event'],
  post_event: ['completed'],
  completed: [],
  cancelled: [],
}

// ─── Helper: fetch advance payment percentage from Strapi global settings ─────
const getAdvancePct = async () => {
  try {
    const { data } = await strapiServerGet('/api/global-setting')
    return Number(data?.advance_payment_percentage ?? DEFAULT_ADVANCE_PCT)
  } catch {
    return DEFAULT_ADVANCE_PCT
  }
}

// ─── Helper: re-validate coupon before booking ────────────────────────────────
const validateCoupon = async (couponId, subtotal) => {
  try {
    const { data: coupons } = await strapiServerGet(`/api/coupons?filters[id][$eq]=${couponId}`)
    const coupon = coupons?.[0]
    if (!coupon?.is_active) return { valid: false, discount: 0, couponId: null }

    const now = new Date()
    if (coupon.valid_from && new Date(coupon.valid_from) > now)
      return { valid: false, discount: 0, couponId: null }
    if (coupon.valid_to && new Date(coupon.valid_to) < now)
      return { valid: false, discount: 0, couponId: null }
    if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses)
      return { valid: false, discount: 0, couponId: null }

    let discount = 0
    if (coupon.discount_type === 'percentage') {
      discount = (subtotal * Number(coupon.discount_value)) / 100
    } else {
      discount = Math.min(Number(coupon.discount_value), subtotal)
    }

    return { valid: true, discount, couponId: String(coupon.id) }
  } catch {
    return { valid: false, discount: 0, couponId: null }
  }
}

// ─── POST /bookings ────────────────────────────────────────────────────────────
// Creates a booking from the user's current cart.
// Cart must have at least one item and eventDate + guestCount set.
export const createBooking = async (req, res, next) => {
  try {
    const userId = String(req.user.id)
    const isSampleTastingCheckout = String(req.body?.checkoutMode ?? '').trim() === 'sample-tasting'
    const fallbackEventDate = req.body?.eventDate ? new Date(req.body.eventDate) : null
    const fallbackGuestCount = Number(req.body?.guestCount ?? 0)

    const cart = await prisma.cart.findFirst({
      where: { userId },
      include: { items: true },
    })

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' })
    }
    const resolvedEventDate =
      cart.eventDate ??
      (isSampleTastingCheckout && fallbackEventDate && !Number.isNaN(fallbackEventDate.getTime())
        ? fallbackEventDate
        : null)
    const resolvedGuestCount =
      cart.guestCount ?? (isSampleTastingCheckout ? Math.max(1, fallbackGuestCount || 1) : null)

    if (!resolvedEventDate) {
      return res.status(400).json({ error: 'Event date is required — update your cart first' })
    }
    if (!resolvedGuestCount) {
      return res.status(400).json({ error: 'Guest count is required — update your cart first' })
    }

    // Use packageId from the first cart item (primary package)
    const packageId = cart.items[0].packageId

    const subtotal = Number(cart.subtotal)

    // Re-validate coupon (race condition protection — someone else may have exhausted it)
    let discountAmount = 0
    let validCouponId = null
    if (cart.couponId) {
      const couponResult = await validateCoupon(cart.couponId, subtotal)
      if (couponResult.valid) {
        discountAmount = couponResult.discount
        validCouponId = couponResult.couponId
      }
      // If coupon is now invalid, proceed without discount (don't block booking)
    }

    const totalPrice = Math.max(0, subtotal - discountAmount)

    // Fetch advance payment percentage from global settings
    const advancePct = await getAdvancePct()
    const advanceAmount = (totalPrice * advancePct) / 100
    const remainingAmount = totalPrice - advanceAmount

    // Create booking + items + status log in a transaction
    const booking = await prisma.$transaction(async tx => {
      const newBooking = await tx.booking.create({
        data: {
          userId,
          packageId,
          eventDate: resolvedEventDate,
          guestCount: resolvedGuestCount,
          status: 'new',
          totalPrice: totalPrice.toFixed(2),
          advanceAmount: advanceAmount.toFixed(2),
          remainingAmount: remainingAmount.toFixed(2),
          couponId: validCouponId,
          discountAmount: discountAmount.toFixed(2),
          infoStatus: 'waiting',
        },
      })

      // Snapshot cart items into booking_items
      await tx.bookingItem.createMany({
        data: cart.items.map(item => ({
          bookingId: newBooking.id,
          packageElementId: item.packageElementId,
          addonId: item.addonId,
          title: item.title,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        })),
      })

      // Initial status log
      await tx.bookingStatusLog.create({
        data: {
          bookingId: newBooking.id,
          previousStatus: null,
          newStatus: 'new',
          changedBy: userId,
          note: 'Booking created',
        },
      })

      // Record coupon usage if applicable
      if (validCouponId) {
        await tx.couponUsage.create({
          data: {
            couponId: validCouponId,
            bookingId: newBooking.id,
            userId,
          },
        })
      }

      return newBooking
    })

    // Increment coupon used_count in Strapi (outside transaction — non-critical)
    if (validCouponId) {
      try {
        const { data: coupons } = await strapiServerGet(
          `/api/coupons?filters[id][$eq]=${validCouponId}`
        )
        const coupon = coupons?.[0]
        await strapiAdminPut(`/api/coupons/${coupon.documentId}`, {
          data: { used_count: (coupon.used_count ?? 0) + 1 },
        })
      } catch {
        // Non-critical — coupon usage still recorded in coupon_usage table
      }
    }

    // Clear cart after successful booking
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } })
    await prisma.cart.update({
      where: { id: cart.id },
      data: {
        subtotal: 0,
        discountAmount: 0,
        total: 0,
        couponId: null,
        eventDate: null,
        guestCount: null,
      },
    })

    // Return full booking with items
    const fullBooking = await prisma.booking.findUnique({
      where: { id: booking.id },
      include: {
        items: true,
        statusLogs: { orderBy: { createdAt: 'asc' } },
      },
    })

    // Fire-and-forget notifications — never block the response
    notify(userId, {
      type: 'booking_update',
      title: 'Booking Placed',
      message: 'Your booking has been received. Complete the advance payment to confirm.',
      linkUrl: `/dashboard/bookings/${booking.id}`,
      emailTemplate: 'booking_created',
      emailData: {
        bookingId: booking.id,
        totalPrice: booking.totalPrice,
        advanceAmount: booking.advanceAmount,
        eventDate: booking.eventDate,
        guestCount: booking.guestCount,
      },
    }).catch(() => {})

    res.status(201).json({ booking: fullBooking })
  } catch (err) {
    next(err)
  }
}

// ─── GET /bookings ─────────────────────────────────────────────────────────────
export const listBookings = async (req, res, next) => {
  try {
    const userId = String(req.user.id)
    const type = String(req.query?.type ?? 'all')
      .trim()
      .toLowerCase()

    const bookings = await prisma.booking.findMany({
      where: { userId },
      include: {
        items: true,
        statusLogs: { orderBy: { createdAt: 'desc' }, take: 1 },
        payments: {
          where: { status: 'success' },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const enrichedBookings = await enrichBookings(bookings)
    const filteredBookings = filterBookingsByType(enrichedBookings, type)

    res.json({ bookings: filteredBookings })
  } catch (err) {
    next(err)
  }
}

// ─── GET /bookings/:id ─────────────────────────────────────────────────────────
export const getBooking = async (req, res, next) => {
  try {
    const userId = String(req.user.id)
    const { id } = req.params

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        items: true,
        statusLogs: { orderBy: { createdAt: 'asc' } },
        timeline: { orderBy: { timelineDate: 'asc' } },
        vendorAssignments: true,
        payments: { orderBy: { createdAt: 'desc' } },
        cancellation: true,
      },
    })

    if (!booking) return res.status(404).json({ error: 'Booking not found' })
    if (booking.userId !== userId) return res.status(403).json({ error: 'Forbidden' })

    const [enrichedBooking] = await enrichBookings([booking])

    res.json({ booking: enrichedBooking })
  } catch (err) {
    next(err)
  }
}

// ─── PATCH /bookings/:id/status ────────────────────────────────────────────────
// Enforces state machine transitions. Customers can only cancel.
// Full admin transitions are handled here too — role check can be layered later.
export const updateStatus = async (req, res, next) => {
  try {
    const userId = String(req.user.id)
    const { id } = req.params
    const { status, note } = req.body

    if (!status) return res.status(400).json({ error: 'status is required' })

    const booking = await prisma.booking.findUnique({ where: { id } })
    if (!booking) return res.status(404).json({ error: 'Booking not found' })
    if (booking.userId !== userId) return res.status(403).json({ error: 'Forbidden' })

    const allowed = ALLOWED_TRANSITIONS[booking.status] ?? []
    if (!allowed.includes(status)) {
      return res.status(400).json({
        error: `Cannot transition from '${booking.status}' to '${status}'`,
        allowed,
      })
    }

    const updated = await prisma.$transaction(async tx => {
      const updatedBooking = await tx.booking.update({
        where: { id },
        data: { status },
      })
      await tx.bookingStatusLog.create({
        data: {
          bookingId: id,
          previousStatus: booking.status,
          newStatus: status,
          changedBy: userId,
          note: note ?? null,
        },
      })
      return updatedBooking
    })

    // Notify on every status transition
    const statusLabels = {
      confirmed: 'Booking Confirmed',
      info_collection: 'Information Required',
      planning: 'Event Planning Started',
      pre_event: 'Almost There!',
      execution: 'Event Day',
      completed: 'Event Completed',
      post_event: 'Post-Event Follow Up',
      cancelled: 'Booking Cancelled',
    }
    notify(userId, {
      type: 'booking_update',
      title: statusLabels[status] || `Booking status: ${status}`,
      message: `Your booking status has been updated to ${status.replace('_', ' ')}.`,
      linkUrl: `/dashboard/bookings/${id}`,
      emailTemplate: status === 'confirmed' ? 'booking_confirmed' : 'booking_status_update',
      emailData: {
        bookingId: id,
        previousStatus: booking.status,
        newStatus: status,
        eventDate: booking.eventDate,
        totalPrice: booking.totalPrice,
        guestCount: booking.guestCount,
      },
    }).catch(() => {})

    res.json({ booking: updated })
  } catch (err) {
    next(err)
  }
}

// ─── POST /bookings/:id/cancel ─────────────────────────────────────────────────
export const cancelBooking = async (req, res, next) => {
  try {
    const userId = String(req.user.id)
    const { id } = req.params
    const { reason, policyAcknowledged = false } = req.body

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { cancellation: true },
    })

    if (!booking) return res.status(404).json({ error: 'Booking not found' })
    if (booking.userId !== userId) return res.status(403).json({ error: 'Forbidden' })
    if (booking.status === 'cancelled')
      return res.status(400).json({ error: 'Booking is already cancelled' })
    if (booking.status === 'completed')
      return res.status(400).json({ error: 'Completed bookings cannot be cancelled' })
    if (booking.cancellation)
      return res.status(400).json({ error: 'A cancellation request already exists' })

    await prisma.$transaction(async tx => {
      await tx.cancellation.create({
        data: {
          bookingId: id,
          requestedBy: userId,
          reason: reason ?? null,
          policyAcknowledged,
          status: 'requested',
        },
      })
      await tx.booking.update({ where: { id }, data: { status: 'cancelled' } })
      await tx.bookingStatusLog.create({
        data: {
          bookingId: id,
          previousStatus: booking.status,
          newStatus: 'cancelled',
          changedBy: userId,
          note: reason ?? 'Cancelled by customer',
        },
      })
    })

    notify(userId, {
      type: 'booking_update',
      title: 'Booking Cancelled',
      message: 'Your cancellation request has been submitted.',
      linkUrl: `/dashboard/bookings/${id}`,
      emailTemplate: 'booking_cancelled',
      emailData: { bookingId: id, reason },
    }).catch(() => {})

    res.json({ ok: true, message: 'Cancellation request submitted' })
  } catch (err) {
    next(err)
  }
}

// ─── POST /bookings/:id/timeline ───────────────────────────────────────────────
export const addTimeline = async (req, res, next) => {
  try {
    const userId = String(req.user.id)
    const { id } = req.params
    const { title, description, timelineDate, status = 'pending' } = req.body

    if (!title) return res.status(400).json({ error: 'title is required' })

    const booking = await prisma.booking.findUnique({ where: { id } })
    if (!booking) return res.status(404).json({ error: 'Booking not found' })
    if (booking.userId !== userId) return res.status(403).json({ error: 'Forbidden' })

    const entry = await prisma.bookingTimeline.create({
      data: {
        bookingId: id,
        title,
        description: description ?? null,
        timelineDate: timelineDate ? new Date(timelineDate) : null,
        status,
      },
    })

    res.status(201).json({ timeline: entry })
  } catch (err) {
    next(err)
  }
}

// ─── GET /bookings/:id/timeline ────────────────────────────────────────────────
export const getTimeline = async (req, res, next) => {
  try {
    const userId = String(req.user.id)
    const { id } = req.params

    const booking = await prisma.booking.findUnique({ where: { id } })
    if (!booking) return res.status(404).json({ error: 'Booking not found' })
    if (booking.userId !== userId) return res.status(403).json({ error: 'Forbidden' })

    const timeline = await prisma.bookingTimeline.findMany({
      where: { bookingId: id },
      orderBy: { timelineDate: 'asc' },
    })

    res.json({ timeline })
  } catch (err) {
    next(err)
  }
}

// ─── POST /bookings/:id/notes ──────────────────────────────────────────────────
// Customers submit a note (isInternal: false). Admin notes set isInternal: true.
export const addNote = async (req, res, next) => {
  try {
    const userId = String(req.user.id)
    const { id } = req.params
    const { note } = req.body

    if (!note?.trim()) return res.status(400).json({ error: 'note is required' })

    const booking = await prisma.booking.findUnique({ where: { id } })
    if (!booking) return res.status(404).json({ error: 'Booking not found' })
    if (booking.userId !== userId) return res.status(403).json({ error: 'Forbidden' })

    const entry = await prisma.bookingNote.create({
      data: {
        bookingId: id,
        adminId: userId,
        note: note.trim(),
        isInternal: false,
      },
    })

    res.status(201).json({ note: entry })
  } catch (err) {
    next(err)
  }
}

// ─── GET /bookings/:id/notes ───────────────────────────────────────────────────
// Customers see only non-internal notes.
export const getNotes = async (req, res, next) => {
  try {
    const userId = String(req.user.id)
    const { id } = req.params

    const booking = await prisma.booking.findUnique({ where: { id } })
    if (!booking) return res.status(404).json({ error: 'Booking not found' })
    if (booking.userId !== userId) return res.status(403).json({ error: 'Forbidden' })

    const notes = await prisma.bookingNote.findMany({
      where: { bookingId: id, isInternal: false },
      orderBy: { createdAt: 'asc' },
    })

    res.json({ notes })
  } catch (err) {
    next(err)
  }
}

// ─── POST /bookings/:id/files ──────────────────────────────────────────────────
// Client pre-uploads to Strapi/Cloudinary and passes back the URL.
export const addFile = async (req, res, next) => {
  try {
    const userId = String(req.user.id)
    const { id } = req.params
    const { fileUrl, fileType } = req.body

    if (!fileUrl?.trim()) return res.status(400).json({ error: 'fileUrl is required' })

    const VALID_TYPES = ['document', 'contract', 'image']
    if (fileType && !VALID_TYPES.includes(fileType)) {
      return res.status(400).json({ error: `fileType must be one of: ${VALID_TYPES.join(', ')}` })
    }

    const booking = await prisma.booking.findUnique({ where: { id } })
    if (!booking) return res.status(404).json({ error: 'Booking not found' })
    if (booking.userId !== userId) return res.status(403).json({ error: 'Forbidden' })

    const file = await prisma.bookingFile.create({
      data: {
        bookingId: id,
        fileUrl: fileUrl.trim(),
        fileType: fileType ?? null,
        uploadedBy: userId,
      },
    })

    res.status(201).json({ file })
  } catch (err) {
    next(err)
  }
}

// ─── GET /bookings/:id/files ───────────────────────────────────────────────────
export const getFiles = async (req, res, next) => {
  try {
    const userId = String(req.user.id)
    const { id } = req.params

    const booking = await prisma.booking.findUnique({ where: { id } })
    if (!booking) return res.status(404).json({ error: 'Booking not found' })
    if (booking.userId !== userId) return res.status(403).json({ error: 'Forbidden' })

    const files = await prisma.bookingFile.findMany({
      where: { bookingId: id },
      orderBy: { createdAt: 'asc' },
    })

    res.json({ files })
  } catch (err) {
    next(err)
  }
}
