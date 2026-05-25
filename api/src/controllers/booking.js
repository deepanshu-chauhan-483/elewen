import prisma from '../lib/prisma.js'
import { strapiGet, strapiServerGet, strapiServerPost, strapiAdminPut } from '../lib/strapi.js'
import { notify } from '../lib/notify.js'
import { enrichBookings, filterBookingsByType } from '../lib/dashboardData.js'
import { createOperationalAlert } from '../lib/alerts.js'
import {
  calculateBookingRefundPreview,
  getCancellationPolicyData,
} from '../lib/cancellationPolicy.js'
import { invalidateDashboardCache } from './dashboard.js'

const DEFAULT_ADVANCE_PCT = 30

const BOOKING_TIMELINE_STEPS = [
  {
    key: 'inquiry',
    title: 'Inquiry / Booking Placed',
    description: 'Your booking request has been received and logged in the system.',
  },
  {
    key: 'internal_review',
    title: 'Internal Review & Confirmation',
    description: 'Our team is reviewing the booking details and confirming the next steps.',
  },
  {
    key: 'information_collection',
    title: 'Information Collection',
    description: 'We are collecting any booking details needed before planning begins.',
  },
  {
    key: 'planning_preparation',
    title: 'Planning & Preparation',
    description: 'Vendor coordination, logistics, and event preparation are underway.',
  },
  {
    key: 'pre_event_final_checks',
    title: 'Pre-event Final Checks',
    description: 'Final checks are in progress before the event day execution begins.',
  },
  {
    key: 'event_day_execution',
    title: 'Event Day / Execution',
    description: 'Your event is now in live execution with the on-ground team.',
  },
  {
    key: 'event_complete',
    title: 'Event Complete',
    description: 'The event has concluded and wrap-up is now in progress.',
  },
  {
    key: 'post_event_follow_up',
    title: 'Post Event Follow Up',
    description: 'Final follow-ups, feedback, and any closing items are being completed.',
  },
]

const STATUS_TO_TIMELINE_INDEX = {
  new: 0,
  confirmed: 1,
  info_collection: 2,
  planning: 3,
  pre_event: 4,
  execution: 5,
  post_event: 7,
}

const TIMELINE_STEP_INDEX_BY_TITLE = new Map(
  BOOKING_TIMELINE_STEPS.map((step, index) => [step.title, index])
)

const createBadRequestError = message => {
  const error = new Error(message)
  error.status = 400
  return error
}

const toCurrencyNumber = value => {
  if (value == null) return 0
  if (typeof value?.toNumber === 'function') return value.toNumber()

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const roundCurrency = value => Number(toCurrencyNumber(value).toFixed(2))

const normalizeSearchText = value =>
  String(value ?? '')
    .trim()
    .toLowerCase()

function bookingMatchesSearch(booking, search) {
  const normalizedSearch = normalizeSearchText(search)
  if (!normalizedSearch) return true

  const haystack = [
    booking?.id,
    booking?.event?.name,
    booking?.package?.title,
    booking?.detailSubtitle,
    booking?.locationSummary,
    booking?.status,
    booking?.statusLabel,
    booking?.specialRequest,
    booking?.latestStatusLog?.note,
    ...(booking?.items ?? []).map(item => item?.title),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return haystack.includes(normalizedSearch)
}

const normalizeTimelineStatus = status => {
  if (status === 'completed') return 'completed'
  if (status === 'blocked') return 'blocked'
  if (status === 'in_progress') return 'in_progress'
  return 'pending'
}

function getTimelineStepDate(stepKey, booking) {
  if (!booking?.eventDate) return null

  const eventDate = new Date(booking.eventDate)
  if (Number.isNaN(eventDate.getTime())) return null

  const day = 24 * 60 * 60 * 1000
  const date = new Date(eventDate)

  switch (stepKey) {
    case 'pre_event_final_checks':
      date.setTime(date.getTime() - 2 * day)
      return date
    case 'event_day_execution':
    case 'event_complete':
      return date
    case 'post_event_follow_up':
      date.setTime(date.getTime() + 2 * day)
      return date
    default:
      return null
  }
}

function getTimelineStatesForBooking(booking, paymentSummary = null) {
  if (!booking) return BOOKING_TIMELINE_STEPS.map(() => 'pending')

  if (booking.status === 'completed') {
    return BOOKING_TIMELINE_STEPS.map(() => 'completed')
  }

  const timelineStates = BOOKING_TIMELINE_STEPS.map(() => 'pending')

  if (booking.status === 'cancelled') {
    const previousStatus = String(booking?.statusLogs?.[0]?.previousStatus ?? '').trim()
    const previousIndex = STATUS_TO_TIMELINE_INDEX[previousStatus]

    if (Number.isInteger(previousIndex)) {
      timelineStates.forEach((_, index) => {
        if (index < previousIndex) timelineStates[index] = 'completed'
      })
      timelineStates[previousIndex] = 'blocked'
    }

    return timelineStates
  }

  const currentIndex = STATUS_TO_TIMELINE_INDEX[booking.status]
  if (!Number.isInteger(currentIndex)) return timelineStates

  timelineStates.forEach((_, index) => {
    if (index < currentIndex) timelineStates[index] = 'completed'
    if (index === currentIndex) timelineStates[index] = 'in_progress'
  })

  if (booking.status === 'pre_event' && paymentSummary && Number(paymentSummary.amountDue) > 0) {
    timelineStates[currentIndex] = 'blocked'
  }

  if (booking.status === 'post_event') {
    timelineStates[6] = 'completed'
    timelineStates[7] = 'in_progress'
  }

  return timelineStates
}

async function ensureBookingTimeline(tx, booking) {
  const existingEntries = await tx.bookingTimeline.findMany({
    where: { bookingId: booking.id },
    orderBy: [{ timelineDate: 'asc' }, { createdAt: 'asc' }],
  })

  const existingMap = new Map(existingEntries.map(entry => [entry.title, entry]))

  if (existingEntries.length < BOOKING_TIMELINE_STEPS.length) {
    const missingEntries = BOOKING_TIMELINE_STEPS.filter(step => !existingMap.has(step.title)).map(
      step => ({
        bookingId: booking.id,
        title: step.title,
        description: step.description,
        timelineDate: getTimelineStepDate(step.key, booking),
        status: 'pending',
      })
    )

    if (missingEntries.length) {
      await tx.bookingTimeline.createMany({ data: missingEntries })
    }
  }

  const paymentSummary = {
    amountDue: Math.max(
      toCurrencyNumber(booking.totalPrice) -
        toCurrencyNumber(
          (
            await tx.payment.aggregate({
              where: {
                bookingId: booking.id,
                status: 'success',
              },
              _sum: {
                amount: true,
              },
            })
          )._sum.amount
        ),
      0
    ),
  }

  const statusLogs =
    booking.statusLogs ??
    (await tx.bookingStatusLog.findMany({
      where: { bookingId: booking.id },
      orderBy: { createdAt: 'desc' },
      take: 1,
    }))
  const bookingWithLogs = { ...booking, statusLogs }
  const timelineStates = getTimelineStatesForBooking(bookingWithLogs, paymentSummary)
  const timelineEntries = await tx.bookingTimeline.findMany({
    where: { bookingId: booking.id },
    orderBy: [{ createdAt: 'asc' }],
  })

  await Promise.all(
    timelineEntries.map(entry => {
      const stepIndex = TIMELINE_STEP_INDEX_BY_TITLE.get(entry.title)
      if (!Number.isInteger(stepIndex)) {
        return Promise.resolve(null)
      }

      const step = BOOKING_TIMELINE_STEPS[stepIndex]
      const nextStatus = normalizeTimelineStatus(timelineStates[stepIndex])
      const nextDescription =
        booking.status === 'pre_event' &&
        step?.key === 'pre_event_final_checks' &&
        paymentSummary.amountDue > 0
          ? 'Final checks are in progress. Remaining payment must be completed before execution can begin.'
          : entry.description || step?.description || null
      const nextTimelineDate = entry.timelineDate ?? getTimelineStepDate(step?.key, booking)

      return tx.bookingTimeline.update({
        where: { id: entry.id },
        data: {
          status: nextStatus,
          description: nextDescription,
          timelineDate: nextTimelineDate,
        },
      })
    })
  )
}

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
const validateCoupon = async (couponId, subtotal, userId) => {
  try {
    const { data: coupons } = await strapiGet('/coupons', {
      'filters[id][$eq]': couponId,
    })
    const coupon = coupons?.[0]
    if (!coupon?.is_active) return { valid: false, discount: 0, couponId: null }

    if (userId) {
      const existingUsage = await prisma.couponUsage.findFirst({
        where: {
          couponId: String(coupon.id),
          userId: String(userId),
        },
        select: { id: true },
      })

      if (existingUsage) {
        return { valid: false, discount: 0, couponId: null }
      }
    }

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
      const couponResult = await validateCoupon(cart.couponId, subtotal, userId)
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
        const existingUsage = await tx.couponUsage.findFirst({
          where: {
            couponId: validCouponId,
            userId,
          },
          select: { id: true },
        })

        if (existingUsage) {
          throw createBadRequestError('You have already used this coupon')
        }

        await tx.couponUsage.create({
          data: {
            couponId: validCouponId,
            bookingId: newBooking.id,
            userId,
          },
        })
      }

      await ensureBookingTimeline(tx, {
        ...newBooking,
        statusLogs: [{ previousStatus: null }],
      })

      return newBooking
    })

    // Increment coupon used_count in Strapi (outside transaction — non-critical)
    if (validCouponId) {
      try {
        const { data: coupons } = await strapiGet('/coupons', {
          'filters[id][$eq]': validCouponId,
        })
        const coupon = coupons?.[0]
        if (coupon?.documentId) {
          const nextUsedCount = Number(coupon.used_count ?? 0) + 1
          const maxUses =
            coupon.max_uses === null || coupon.max_uses === undefined
              ? null
              : Number(coupon.max_uses)

          await strapiAdminPut(`/api/coupons/${coupon.documentId}`, {
            data: {
              used_count: nextUsedCount,
              ...(maxUses !== null && nextUsedCount >= maxUses ? { is_active: false } : {}),
            },
          })
        }
      } catch {
        // Non-critical — coupon usage still recorded in coupon_usage table
      }
    }

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

    invalidateDashboardCache(userId).catch(() => {})
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
    const search = normalizeSearchText(req.query?.search)
    const page = Math.max(1, Number(req.query?.page ?? 1))
    const limit = Math.min(50, Math.max(1, Number(req.query?.limit ?? 20)))
    const baseWhere = {
      userId,
      payments: {
        some: { status: 'success' },
      },
    }

    const bookings = await prisma.booking.findMany({
      where: baseWhere,
      include: {
        items: {
          select: { id: true, title: true, quantity: true, unitPrice: true, totalPrice: true },
        },
        notes: {
          where: { isInternal: false },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        statusLogs: { orderBy: { createdAt: 'desc' }, take: 1 },
        payments: {
          where: { status: 'success' },
          orderBy: { createdAt: 'desc' },
          select: { id: true, amount: true, paymentType: true, status: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const enrichedBookings = await enrichBookings(bookings)
    const filteredBookings = filterBookingsByType(enrichedBookings, type).filter(booking =>
      bookingMatchesSearch(booking, search)
    )
    const total = filteredBookings.length
    const totalPages = Math.max(1, Math.ceil(total / limit))
    const safePage = Math.min(page, totalPages)
    const skip = (safePage - 1) * limit
    const paginatedBookings = filteredBookings.slice(skip, skip + limit)

    res.json({
      bookings: paginatedBookings,
      pagination: {
        page: safePage,
        limit,
        total,
        totalPages,
        hasNext: skip + limit < total,
      },
    })
  } catch (err) {
    if (err?.status === 400) {
      return res.status(400).json({ error: err.message })
    }
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
        notes: {
          where: { isInternal: false },
          orderBy: { createdAt: 'desc' },
        },
        statusLogs: { orderBy: { createdAt: 'asc' } },
        timeline: { orderBy: { timelineDate: 'asc' } },
        vendorAssignments: true,
        payments: { orderBy: { createdAt: 'desc' } },
        cancellation: true,
      },
    })

    if (!booking) return res.status(404).json({ error: 'Booking not found' })
    if (booking.userId !== userId) return res.status(403).json({ error: 'Forbidden' })
    if (
      !Array.isArray(booking.payments) ||
      !booking.payments.some(payment => payment.status === 'success')
    ) {
      return res.status(404).json({ error: 'Booking not found' })
    }

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

    if (booking.status === 'pre_event' && status === 'execution') {
      const successfulPayments = await prisma.payment.findMany({
        where: {
          bookingId: id,
          status: 'success',
        },
      })

      const amountPaid = successfulPayments.reduce(
        (sum, payment) => sum + toCurrencyNumber(payment.amount),
        0
      )
      const totalPrice = toCurrencyNumber(booking.totalPrice)
      const remainingAmount = Math.max(totalPrice - amountPaid, 0)

      if (remainingAmount > 0) {
        return res.status(400).json({
          error: 'Remaining payment must be completed before moving to execution stage.',
          code: 'PAYMENT_PENDING',
          paymentSummary: {
            totalPrice: Number(totalPrice.toFixed(2)),
            amountPaid: Number(amountPaid.toFixed(2)),
            remainingAmount: Number(remainingAmount.toFixed(2)),
            isFullyPaid: false,
          },
        })
      }
    }

    const updated = await prisma.$transaction(async tx => {
      const updatedBooking = await tx.booking.update({
        where: { id },
        data: { status },
      })
      const statusLog = await tx.bookingStatusLog.create({
        data: {
          bookingId: id,
          previousStatus: booking.status,
          newStatus: status,
          changedBy: userId,
          note: note ?? null,
        },
      })
      await ensureBookingTimeline(tx, {
        ...updatedBooking,
        statusLogs: [statusLog],
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

    invalidateDashboardCache(userId).catch(() => {})
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
      include: {
        cancellation: true,
        payments: {
          include: {
            refunds: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!booking) return res.status(404).json({ error: 'Booking not found' })
    if (booking.userId !== userId) return res.status(403).json({ error: 'Forbidden' })
    if (booking.status === 'cancelled')
      return res.status(400).json({ error: 'Booking is already cancelled' })
    if (booking.status === 'completed')
      return res.status(400).json({ error: 'Completed bookings cannot be cancelled' })
    if (booking.cancellation)
      return res.status(400).json({ error: 'A cancellation request already exists' })

    const cancellationPolicy = await getCancellationPolicyData()
    const refundPreview = calculateBookingRefundPreview(booking, cancellationPolicy)
    const successfulPayments = (Array.isArray(booking.payments) ? booking.payments : []).filter(
      payment => payment?.status === 'success'
    )
    let remainingRefundAmount = roundCurrency(refundPreview.refundableAmount)
    const refundEntries = []

    for (const payment of successfulPayments) {
      if (remainingRefundAmount <= 0) break

      const hasOpenRefund = (Array.isArray(payment.refunds) ? payment.refunds : []).some(refund =>
        ['requested', 'processing', 'completed'].includes(String(refund?.status ?? ''))
      )
      if (hasOpenRefund) continue

      const paymentAmount = roundCurrency(payment.amount)
      const refundAmount = roundCurrency(Math.min(paymentAmount, remainingRefundAmount))
      if (refundAmount <= 0) continue

      refundEntries.push({
        paymentId: payment.id,
        bookingId: id,
        amount: refundAmount,
        reason:
          reason ??
          `Auto-created from cancellation policy (${refundPreview.windowLabel || 'booking cancellation'})`,
      })
      remainingRefundAmount = roundCurrency(remainingRefundAmount - refundAmount)
    }

    await prisma.$transaction(async tx => {
      await tx.cancellation.create({
        data: {
          bookingId: id,
          requestedBy: userId,
          reason: reason ?? null,
          policyAcknowledged,
          status: 'approved',
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

      await createOperationalAlert(tx, {
        alertType: 'booking_cancelled',
        severity: refundEntries.length > 0 ? 'medium' : 'low',
        message:
          refundEntries.length > 0
            ? `Booking ${id} was cancelled and has ${refundEntries.length} refund request${refundEntries.length === 1 ? '' : 's'} pending.`
            : `Booking ${id} was cancelled by the customer.`,
        metadata: {
          bookingId: id,
          reason,
          refundsCreated: refundEntries.length,
          refundWindow: refundPreview.windowKey || null,
        },
        relatedEntityType: 'booking',
        relatedEntityId: id,
      })

      for (const refundEntry of refundEntries) {
        const refund = await tx.refund.create({
          data: {
            paymentId: refundEntry.paymentId,
            bookingId: refundEntry.bookingId,
            amount: refundEntry.amount,
            reason: refundEntry.reason,
            status: 'requested',
          },
        })

        await tx.paymentLog.create({
          data: {
            paymentId: refundEntry.paymentId,
            action: 'refund_requested',
            performedBy: userId,
            metadata: {
              refundId: refund.id,
              reason: refundEntry.reason,
              source: 'booking_cancellation',
              refundWindow: refundPreview.windowKey || null,
            },
          },
        })

        await createOperationalAlert(tx, {
          alertType: 'refund_requested',
          severity: 'medium',
          message: `Refund requested from cancellation for booking ${id}. Review payment ${refundEntry.paymentId}.`,
          metadata: {
            bookingId: id,
            paymentId: refundEntry.paymentId,
            refundId: refund.id,
            reason: refundEntry.reason,
            source: 'booking_cancellation',
            refundWindow: refundPreview.windowKey || null,
          },
          relatedEntityType: 'payment',
          relatedEntityId: refundEntry.paymentId,
        })
      }
    })

    notify(userId, {
      type: 'booking_update',
      title: 'Booking Cancelled',
      message:
        refundEntries.length > 0
          ? 'Your booking has been cancelled and the refund request is ready for processing.'
          : 'Your booking has been cancelled successfully.',
      linkUrl: `/dashboard/bookings/${id}`,
      emailTemplate: 'booking_cancelled',
      emailData: { bookingId: id, reason },
    }).catch(() => {})

    invalidateDashboardCache(userId).catch(() => {})

    res.json({
      ok: true,
      message: 'Booking cancelled successfully',
      refundPreview,
      refundsCreated: refundEntries.length,
    })
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

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        statusLogs: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    })
    if (!booking) return res.status(404).json({ error: 'Booking not found' })
    if (booking.userId !== userId) return res.status(403).json({ error: 'Forbidden' })

    const timeline = await prisma.$transaction(async tx => {
      await ensureBookingTimeline(tx, booking)
      const entries = await tx.bookingTimeline.findMany({
        where: { bookingId: id },
        orderBy: [{ createdAt: 'asc' }],
      })

      return entries.sort((left, right) => {
        const leftIndex = TIMELINE_STEP_INDEX_BY_TITLE.get(left.title) ?? Number.MAX_SAFE_INTEGER
        const rightIndex = TIMELINE_STEP_INDEX_BY_TITLE.get(right.title) ?? Number.MAX_SAFE_INTEGER
        return leftIndex - rightIndex
      })
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
