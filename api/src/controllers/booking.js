import prisma from '../lib/prisma.js'
import { computeCartItemsWithDeliveryCharges } from '../lib/deliveryChargePricing.js'
import { strapiGet, strapiServerGet, strapiServerPost, strapiAdminPut } from '../lib/strapi.js'
import { notify, notifyRefund } from '../lib/notify.js'
import { resolveAppliedCoupon } from '../lib/coupons.js'
import { enrichBookings, filterBookingsByType, buildInfoCollectionNote, getBookingMetaFromNotes } from '../lib/dashboardData.js'
import { createOperationalAlert } from '../lib/alerts.js'
import {
  calculateBookingRefundPreview,
  getCancellationPolicyData,
} from '../lib/cancellationPolicy.js'
import {
  buildCancellationRefundEntries,
  persistCancellationRefunds,
} from '../lib/cancellationRefunds.js'
import { invalidateDashboardCache } from './dashboard.js'
import { sendHookahBookingPlacedEmail } from '../lib/bookingEmailService.js'
import {
  assertSheeshaOnlyCart,
  BOOKING_VISIBLE_PAYMENT_FILTER,
  classifyCartItems,
  clearUserCart,
  isCodPendingPayment,
} from '../lib/sheeshaCheckout.js'
import {
  BOOKING_TIMELINE_STEPS,
  LEGACY_TIMELINE_TITLE_INDEX,
  STATUS_TO_TIMELINE_INDEX,
  getTimelineIndexForStatus,
} from '../lib/bookingStages.js'

const DEFAULT_ADVANCE_PCT = 30

const TIMELINE_STEP_INDEX_BY_TITLE = new Map(
  BOOKING_TIMELINE_STEPS.flatMap((step, index) => [[step.title, index]])
)

function getTimelineStepIndex(title) {
  return (
    TIMELINE_STEP_INDEX_BY_TITLE.get(title) ?? LEGACY_TIMELINE_TITLE_INDEX.get(title) ?? null
  )
}

function buildTimelineStageNotes(statusLogs = []) {
  const notesByIndex = new Map()

  for (const log of Array.isArray(statusLogs) ? statusLogs : []) {
    const note = String(log?.note ?? '').trim()
    if (!note) continue
    if (!log?.previousStatus) continue
    if (note.toLowerCase().startsWith('advanced from tracker to ')) continue

    const stepIndex = getTimelineIndexForStatus(String(log?.newStatus ?? '').trim())
    if (!Number.isInteger(stepIndex)) continue

    notesByIndex.set(stepIndex, {
      note,
      createdAt: log.createdAt,
    })
  }

  return notesByIndex
}

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

export async function ensureBookingTimeline(tx, booking) {
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
      const stepIndex = getTimelineStepIndex(entry.title)
      if (!Number.isInteger(stepIndex)) {
        return Promise.resolve(null)
      }

      const step = BOOKING_TIMELINE_STEPS[stepIndex]
      const nextStatus = normalizeTimelineStatus(timelineStates[stepIndex])
      const nextDescription =
        booking.status === 'pre_event' &&
        step?.key === 'pre_event_final_checks' &&
        paymentSummary.amountDue > 0
          ? 'Please make the final payment to team Elewen before your event begins. Remaining payment must be completed before execution can begin.'
          : step?.description || null
      const nextTimelineDate = entry.timelineDate ?? getTimelineStepDate(step?.key, booking)

      return tx.bookingTimeline.update({
        where: { id: entry.id },
        data: {
          title: step.title,
          status: nextStatus,
          description: nextDescription,
          timelineDate: nextTimelineDate,
        },
      })
    })
  )
}

// ??? Valid status transitions (customer-facing + system) ?????????????????????
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

// ??? Helper: fetch advance payment percentage from Strapi global settings ?????
const getAdvancePct = async () => {
  try {
    const { data } = await strapiServerGet('/api/global-setting')
    return Number(data?.advance_payment_percentage ?? DEFAULT_ADVANCE_PCT)
  } catch {
    return DEFAULT_ADVANCE_PCT
  }
}

// ??? Helper: re-validate coupon before booking ????????????????????????????????
const validateCoupon = async (couponId, subtotal, userId, couponGrantId = null) =>
  resolveAppliedCoupon({ couponId, couponGrantId, userId, subtotal })

// ??? POST /bookings ????????????????????????????????????????????????????????????
// Creates a booking from the user's current cart.
// Cart must have at least one item and eventDate + guestCount set.
export const createBooking = async (req, res, next) => {
  try {
    const userId = String(req.user.id)
    const isSampleTastingCheckout = String(req.body?.checkoutMode ?? '').trim() === 'sample-tasting'
    const fallbackEventDate = req.body?.eventDate ? new Date(req.body.eventDate) : null
    const fallbackGuestCount = Number(req.body?.guestCount ?? 0)
    const eventTime = String(req.body?.eventTime ?? '').trim().slice(0, 20)
    const checkoutNote = String(req.body?.checkoutNote ?? req.body?.note ?? '').trim()

    const cart = await prisma.cart.findFirst({
      where: { userId },
      include: { items: true },
    })

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' })
    }

    const cartClassification = await classifyCartItems(cart.items)
    if (cartClassification.isMixedSheeshaCart) {
      return res.status(400).json({
        error:
          'Hookah needs a separate booking � it can�t be combined with other services in the same cart.',
        code: 'MIXED_SHEESHA_CART',
      })
    }

    const isSheeshaOnlyBooking = cartClassification.isSheeshaOnly
    const resolvedEventDate =
      cart.eventDate ??
      (isSampleTastingCheckout && fallbackEventDate && !Number.isNaN(fallbackEventDate.getTime())
        ? fallbackEventDate
        : null)
    const resolvedGuestCount =
      cart.guestCount ?? (isSampleTastingCheckout ? Math.max(1, fallbackGuestCount || 1) : null)

    if (!resolvedEventDate) {
      return res.status(400).json({ error: 'Event date is required � update your cart first' })
    }
    if (!resolvedGuestCount) {
      return res.status(400).json({ error: 'Guest count is required � update your cart first' })
    }

    // Use packageId from the first cart item (primary package)
    const packageId = cart.items[0].packageId

    const deliveryPincode = String(req.body?.deliveryPincode ?? req.body?.pincode ?? '').trim()
    const pricedCart = deliveryPincode
      ? await computeCartItemsWithDeliveryCharges(cart.items, deliveryPincode)
      : null
    const pricedItems = pricedCart?.adjustedItems ?? cart.items

    const subtotal = pricedCart ? Number(pricedCart.subtotal) : Number(cart.subtotal)

    // Re-validate coupon (race condition protection � someone else may have exhausted it)
    let discountAmount = 0
    let validCouponId = null
    let validCouponGrantId = null
    if (cart.couponId || cart.couponGrantId) {
      const couponResult = await resolveAppliedCoupon({
        couponId: cart.couponId,
        couponGrantId: cart.couponGrantId,
        userId,
        subtotal,
      })
      if (couponResult.valid) {
        discountAmount = couponResult.discount
        validCouponId = couponResult.couponId
        validCouponGrantId = couponResult.couponGrantId
      }
    }

    const totalPrice = Math.max(0, subtotal - discountAmount)

    // Fetch advance payment percentage from global settings
    // Hookah-only COD: no advance � full amount due on delivery.
    const advancePct = isSheeshaOnlyBooking ? 0 : await getAdvancePct()
    const advanceAmount = (totalPrice * advancePct) / 100
    const remainingAmount = totalPrice - advanceAmount

    // Create booking + items + status log in a transaction
    const booking = await prisma.$transaction(async tx => {
      const newBooking = await tx.booking.create({
        data: {
          userId,
          packageId,
          eventDate: resolvedEventDate,
          ...(eventTime ? { eventTime } : {}),
          guestCount: resolvedGuestCount,
          status: 'new',
          totalPrice: totalPrice.toFixed(2),
          advanceAmount: advanceAmount.toFixed(2),
          remainingAmount: remainingAmount.toFixed(2),
          couponId: validCouponId,
          couponGrantId: validCouponGrantId,
          discountAmount: discountAmount.toFixed(2),
          infoStatus: 'waiting',
        },
      })

      // Snapshot cart items into booking_items
      await tx.bookingItem.createMany({
        data: pricedItems.map(item => ({
          bookingId: newBooking.id,
          packageElementId: item.packageElementId,
          addonId: item.addonId,
          title: item.title,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice:
            typeof item.totalPrice === 'number' ? item.totalPrice.toFixed(2) : item.totalPrice,
        })),
      })

      // Persist checkout form details with the booking so info-collection can prefill later.
      if (checkoutNote) {
        await tx.bookingNote.create({
          data: {
            bookingId: newBooking.id,
            adminId: userId,
            note: checkoutNote,
            isInternal: false,
          },
        })
      }

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
      if (validCouponGrantId) {
        const grant = await tx.userCouponGrant.findUnique({
          where: { id: validCouponGrantId },
          select: { id: true, status: true },
        })

        if (!grant || grant.status !== 'active') {
          throw createBadRequestError('This coupon is no longer valid')
        }

        await tx.couponUsage.create({
          data: {
            grantId: validCouponGrantId,
            bookingId: newBooking.id,
            userId,
          },
        })

        await tx.userCouponGrant.update({
          where: { id: validCouponGrantId },
          data: {
            status: 'used',
            used_at: new Date(),
            used_by_user_id: userId,
            used_on_booking_id: newBooking.id,
          },
        })
      } else if (validCouponId) {
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

    // Increment coupon used_count in Strapi (outside transaction � non-critical)
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
        // Non-critical � coupon usage still recorded in coupon_usage table
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
      message: isSheeshaOnlyBooking
        ? 'Your Hookah booking has been received. Confirm pay-on-delivery to complete booking.'
        : 'Your booking has been received. Complete the advance payment to confirm.',
      linkUrl: `/dashboard/bookings/${booking.id}`,
      ...(isSheeshaOnlyBooking
        ? {}
        : {
            emailTemplate: 'booking_created',
            emailSubject: 'One Step Away from a Stress-Free Event ✨',
            emailData: {
              bookingId: booking.id,
              totalPrice: booking.totalPrice,
              advanceAmount: booking.advanceAmount,
              eventDate: booking.eventDate,
              guestCount: booking.guestCount,
            },
          }),
    }).catch(() => {})

    invalidateDashboardCache(userId).catch(() => {})
    res.status(201).json({ booking: fullBooking })
  } catch (err) {
    next(err)
  }
}

// ??? GET /bookings ?????????????????????????????????????????????????????????????
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
      payments: BOOKING_VISIBLE_PAYMENT_FILTER,
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
          where: {
            OR: [{ status: 'success' }, { status: 'pending', providerOrderId: 'COD' }],
          },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            amount: true,
            paymentType: true,
            status: true,
            provider: true,
            paymentMethod: true,
            providerOrderId: true,
            createdAt: true,
          },
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

// ??? GET /bookings/:id ?????????????????????????????????????????????????????????
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
    const hasSuccessfulPayment = booking.payments.some(payment => payment.status === 'success')
    const hasCodPendingPayment = booking.payments.some(isCodPendingPayment)
    if (!hasSuccessfulPayment && !hasCodPendingPayment) {
      return res.status(404).json({ error: 'Booking not found' })
    }

    const [enrichedBooking] = await enrichBookings([booking])

    res.json({ booking: enrichedBooking })
  } catch (err) {
    next(err)
  }
}

// ??? PATCH /bookings/:id/status ????????????????????????????????????????????????
// Enforces state machine transitions. Customers can only cancel.
// Full admin transitions are handled here too � role check can be layered later.
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

// ??? POST /bookings/:id/cancel ?????????????????????????????????????????????????
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
    const refundEntries = buildCancellationRefundEntries({
      bookingId: id,
      payments: booking.payments,
      refundableAmount: refundPreview.refundableAmount,
      reason:
        reason ??
        `Auto-created from cancellation policy (${refundPreview.windowLabel || 'booking cancellation'})`,
    })

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
            ? `Booking #${String(id).slice(0, 8).toUpperCase()} was cancelled and has ${refundEntries.length} refund request${refundEntries.length === 1 ? '' : 's'} pending.`
            : `Booking #${String(id).slice(0, 8).toUpperCase()} was cancelled by the customer.`,
        metadata: {
          bookingId: id,
          reason,
          refundsCreated: refundEntries.length,
          refundWindow: refundPreview.windowKey || null,
        },
        relatedEntityType: 'booking',
        relatedEntityId: id,
      })

      await persistCancellationRefunds(tx, {
        refundEntries,
        performedBy: userId,
        source: 'booking_cancellation',
        refundWindow: refundPreview.windowKey || null,
        bookingId: id,
      })
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

    if (refundEntries.length > 0) {
      const totalRefund = refundEntries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0)
      notifyRefund(userId, {
        kind: 'requested',
        bookingId: id,
        amount: totalRefund,
        reason: reason ?? 'Booking cancellation',
      }).catch(() => {})
    }

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

// ??? POST /bookings/:id/timeline ???????????????????????????????????????????????
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

// ??? GET /bookings/:id/timeline ????????????????????????????????????????????????
export const getTimeline = async (req, res, next) => {
  try {
    const userId = String(req.user.id)
    const { id } = req.params

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        statusLogs: { orderBy: { createdAt: 'asc' } },
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

      const stageNotes = buildTimelineStageNotes(booking.statusLogs)

      return entries
        .sort((left, right) => {
          const leftIndex = getTimelineStepIndex(left.title) ?? Number.MAX_SAFE_INTEGER
          const rightIndex = getTimelineStepIndex(right.title) ?? Number.MAX_SAFE_INTEGER
          return leftIndex - rightIndex
        })
        .map(entry => {
          const stepIndex = getTimelineStepIndex(entry.title)
          const stageNote = stageNotes.get(stepIndex)

          if (!stageNote) return entry

          return {
            ...entry,
            stageNote: stageNote.note,
            stageNoteCreatedAt: stageNote.createdAt,
          }
        })
    })

    res.json({ timeline })
  } catch (err) {
    next(err)
  }
}

// ??? POST /bookings/:id/notes ??????????????????????????????????????????????????
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

    // If this is a checkout snapshot, keep eventTime on the booking for form prefill.
    const meta = getBookingMetaFromNotes([entry])
    const nextEventTime = toTimeInputValue(meta.eventTime)
    if (nextEventTime) {
      await prisma.booking.update({
        where: { id },
        data: { eventTime: nextEventTime.slice(0, 20) },
      })
    }

    res.status(201).json({ note: entry })
  } catch (err) {
    next(err)
  }
}

// ??? GET /bookings/:id/notes ???????????????????????????????????????????????????
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

async function loadCustomerProfile(userId) {
  const parsedId = Number.parseInt(String(userId ?? ''), 10)
  if (!Number.isFinite(parsedId)) return null

  const [row] = await prisma.$queryRaw`
    SELECT id::text AS id, email, first_name, last_name, phone
    FROM public.up_users
    WHERE id = ${parsedId}
    LIMIT 1
  `

  if (!row) return null
  return {
    id: String(row.id),
    email: row.email ?? '',
    firstName: row.first_name ?? '',
    lastName: row.last_name ?? '',
    phone: row.phone ?? '',
    fullName: [row.first_name, row.last_name].filter(Boolean).join(' ').trim(),
  }
}

function toOptionalDateOnly(value) {
  const raw = String(value ?? '').trim()
  if (!raw) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const date = new Date(`${raw}T00:00:00.000Z`)
    return Number.isNaN(date.getTime()) ? null : date
  }
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return null
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

/** Normalize checkout / note values into YYYY-MM-DD for date inputs. */
function toDateInputValue(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, '0')}-${String(
      value.getUTCDate()
    ).padStart(2, '0')}`
  }

  const raw = String(value ?? '').trim()
  if (!raw || /^not provided$/i.test(raw)) return ''
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10)

  const parsedMs = Date.parse(raw)
  if (!Number.isNaN(parsedMs)) {
    const date = new Date(parsedMs)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
      date.getDate()
    ).padStart(2, '0')}`
  }

  const dmy = raw.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/)
  if (dmy) {
    const day = String(Number(dmy[1])).padStart(2, '0')
    const month = String(Number(dmy[2])).padStart(2, '0')
    return `${dmy[3]}-${month}-${day}`
  }

  const parsed = toOptionalDateOnly(raw)
  return parsed ? parsed.toISOString().slice(0, 10) : ''
}

function toTimeInputValue(value) {
  const raw = String(value ?? '').trim()
  if (!raw || /^not provided$/i.test(raw)) return ''
  const match24 = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/)
  if (match24) {
    return `${String(Number(match24[1])).padStart(2, '0')}:${match24[2]}`
  }
  const match12 = raw.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i)
  if (match12) {
    let hours = Number(match12[1])
    const minutes = match12[2]
    const meridiem = match12[3].toLowerCase()
    if (meridiem === 'pm' && hours < 12) hours += 12
    if (meridiem === 'am' && hours === 12) hours = 0
    return `${String(hours).padStart(2, '0')}:${minutes}`
  }
  const matchHourOnly = raw.match(/^(\d{1,2})\s*(am|pm)$/i)
  if (matchHourOnly) {
    let hours = Number(matchHourOnly[1])
    const meridiem = matchHourOnly[2].toLowerCase()
    if (meridiem === 'pm' && hours < 12) hours += 12
    if (meridiem === 'am' && hours === 12) hours = 0
    return `${String(hours).padStart(2, '0')}:00`
  }
  return ''
}

function cleanFormText(value) {
  const raw = String(value ?? '').trim()
  if (!raw || /^not provided$/i.test(raw)) return ''
  return raw
}

function readInfoCollectionForm(body = {}) {
  const read = key => String(body?.[key] ?? '').trim()
  return {
    fullName: read('fullName'),
    email: read('email'),
    phone: read('phone'),
    eventDate: read('eventDate'),
    eventTime: read('eventTime'),
    addressLine1: read('addressLine1'),
    addressLine2: read('addressLine2'),
    addressFloor: read('addressFloor'),
    eventAddress: read('eventAddress'),
    pinCode: read('pinCode'),
    hasLift: read('hasLift'),
    guestCount: read('guestCount'),
    setupArrivalTime: read('setupArrivalTime'),
    eventDayContactName: read('eventDayContactName'),
    eventDayContactPhone: read('eventDayContactPhone'),
    parkingInstructions: read('parkingInstructions'),
    specialRequest: read('specialRequest') || read('specialInstructions'),
  }
}

// ??? GET /bookings/:id/info-collection ?????????????????????????????????????????
export const getInfoCollection = async (req, res, next) => {
  try {
    const userId = String(req.user.id)
    const { id } = req.params

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        items: true,
        // Load every note � checkout snapshots may exist with either visibility flag.
        notes: {
          orderBy: { createdAt: 'asc' },
        },
        statusLogs: { orderBy: { createdAt: 'desc' }, take: 1 },
        payments: { orderBy: { createdAt: 'desc' } },
      },
    })

    if (!booking) return res.status(404).json({ error: 'Booking not found' })
    if (booking.userId !== userId) return res.status(403).json({ error: 'Forbidden' })

    const [enriched] = await enrichBookings([booking])
    const profile = await loadCustomerProfile(userId)
    // Parse checkout notes directly so prefill does not depend only on enrich shape.
    const noteMeta = getBookingMetaFromNotes(booking.notes)
    const info = {
      ...(enriched?.infoCollection ?? {}),
      ...Object.fromEntries(
        Object.entries(noteMeta).filter(([, value]) => cleanFormText(value))
      ),
    }
    const status = String(booking.status ?? '').toLowerCase()
    const canEdit = status === 'info_collection'
    const eventDateValue =
      toDateInputValue(info.eventDate) ||
      toDateInputValue(booking.eventDate) ||
      ''
    const address = enriched?.address ?? null
    const checkoutNotesCount = (booking.notes ?? []).filter(note =>
      /Contact name:|Event address line 1:|\[INFO_COLLECTION\]/i.test(String(note?.note ?? ''))
    ).length

    res.json({
      bookingId: booking.id,
      status: booking.status,
      statusLabel: enriched?.statusLabel ?? booking.status,
      infoStatus: booking.infoStatus,
      canEdit,
      showGuestCount: Boolean(enriched?.isCateringBooking),
      checkoutNotesCount,
      form: {
        fullName: cleanFormText(info.fullName) || profile?.fullName || '',
        email: cleanFormText(info.email) || profile?.email || '',
        phone: cleanFormText(info.phone) || profile?.phone || '',
        eventDate: eventDateValue,
        eventTime: toTimeInputValue(info.eventTime) || toTimeInputValue(booking.eventTime) || '',
        addressLine1: cleanFormText(info.addressLine1) || cleanFormText(address?.line1),
        addressLine2: cleanFormText(info.addressLine2) || cleanFormText(address?.line2),
        addressFloor: cleanFormText(info.addressFloor),
        eventAddress: cleanFormText(info.eventAddress) || cleanFormText(address?.summary),
        pinCode: cleanFormText(info.pinCode) || cleanFormText(address?.pincode),
        hasLift: cleanFormText(info.hasLift),
        guestCount:
          cleanFormText(info.guestCount) ||
          (booking.guestCount != null ? String(booking.guestCount) : ''),
        setupArrivalTime:
          toTimeInputValue(info.setupArrivalTime) || cleanFormText(info.setupArrivalTime),
        eventDayContactName: cleanFormText(info.eventDayContactName),
        eventDayContactPhone: cleanFormText(info.eventDayContactPhone),
        parkingInstructions: cleanFormText(info.parkingInstructions),
        specialRequest: cleanFormText(info.specialRequest),
      },
    })
  } catch (err) {
    next(err)
  }
}

// ??? PUT /bookings/:id/info-collection ???????????????????????????????????????
// Customer submits event logistics. Frontend requires core fields; extras stay optional.
export const submitInfoCollection = async (req, res, next) => {
  try {
    const userId = String(req.user.id)
    const { id } = req.params
    const form = readInfoCollectionForm(req.body)

    const booking = await prisma.booking.findUnique({ where: { id } })
    if (!booking) return res.status(404).json({ error: 'Booking not found' })
    if (booking.userId !== userId) return res.status(403).json({ error: 'Forbidden' })

    if (String(booking.status).toLowerCase() !== 'info_collection') {
      return res.status(400).json({
        error: 'Info collection form is only available while the booking is in Information Collection.',
      })
    }

    const noteText = buildInfoCollectionNote(form)
    const eventDate = toOptionalDateOnly(form.eventDate)
    const guestCount = Number.parseInt(form.guestCount, 10)

    await prisma.$transaction(async tx => {
      await tx.bookingNote.create({
        data: {
          bookingId: id,
          adminId: userId,
          note: noteText,
          isInternal: false,
        },
      })

      await tx.booking.update({
        where: { id },
        data: {
          infoStatus: 'submitted',
          ...(form.eventTime ? { eventTime: form.eventTime.slice(0, 20) } : {}),
          ...(eventDate ? { eventDate } : {}),
          ...(Number.isFinite(guestCount) && guestCount > 0 ? { guestCount } : {}),
        },
      })
    })

    await invalidateDashboardCache(userId).catch(() => {})

    const refreshed = await prisma.booking.findUnique({
      where: { id },
      include: {
        items: true,
        notes: {
          where: { isInternal: false },
          orderBy: { createdAt: 'desc' },
        },
        statusLogs: { orderBy: { createdAt: 'desc' }, take: 1 },
        payments: { orderBy: { createdAt: 'desc' } },
      },
    })
    const [enriched] = await enrichBookings([refreshed])

    res.json({
      ok: true,
      infoStatus: 'submitted',
      booking: enriched,
      form: enriched?.infoCollection ?? form,
    })
  } catch (err) {
    next(err)
  }
}

// ??? POST /bookings/:id/files ??????????????????????????????????????????????????
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

// ??? POST /bookings/:id/confirm-cod ???????????????????????????????????????????
// Hookah-only pay-on-delivery confirmation. Never calls Cashfree.
export const confirmCodBooking = async (req, res, next) => {
  try {
    const userId = String(req.user.id)
    const { id } = req.params
    const ageConfirmedAt = String(req.body?.ageConfirmedAt ?? '').trim()

    if (!ageConfirmedAt) {
      return res.status(400).json({ error: 'Age confirmation is required for Hookah bookings.' })
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { payments: true },
    })

    if (!booking) return res.status(404).json({ error: 'Booking not found' })
    if (booking.userId !== userId) return res.status(403).json({ error: 'Forbidden' })

    if (booking.payments.some(payment => payment.status === 'success')) {
      return res.status(400).json({ error: 'This booking has already been paid.' })
    }

    const cart = await prisma.cart.findFirst({
      where: { userId },
      include: { items: true },
    })

    await assertSheeshaOnlyCart(cart?.items ?? [])

    const existingCodPayment = booking.payments.find(isCodPendingPayment)
    const totalPrice = roundCurrency(booking.totalPrice)
    const clientIp =
      String(req.headers['x-forwarded-for'] ?? '')
        .split(',')[0]
        ?.trim() ||
      req.ip ||
      ''

    const payment = await prisma.$transaction(async tx => {
      let codPayment = existingCodPayment

      if (!codPayment) {
        codPayment = await tx.payment.create({
          data: {
            bookingId: id,
            paymentType: 'full',
            amount: totalPrice.toFixed(2),
            status: 'pending',
            provider: 'manual',
            paymentMethod: 'offline',
            providerOrderId: 'COD',
          },
        })

        await tx.paymentLog.create({
          data: {
            paymentId: codPayment.id,
            action: 'created',
            performedBy: userId,
            metadata: {
              cod: true,
              ageConfirmedAt,
              ip: clientIp,
            },
          },
        })
      }

      // Keep status as `new` until admin confirms. No Cashfree advance for Hookah COD.
      await tx.booking.update({
        where: { id },
        data: {
          advanceAmount: '0.00',
          remainingAmount: totalPrice.toFixed(2),
        },
      })

      return codPayment
    })

    await clearUserCart(userId)

    const fullBooking = await prisma.booking.findUnique({
      where: { id },
      include: {
        items: true,
        statusLogs: { orderBy: { createdAt: 'asc' } },
        payments: { orderBy: { createdAt: 'desc' } },
      },
    })

    sendHookahBookingPlacedEmail(id).catch(err =>
      console.error('[booking-email] hookah placed failed', id, err?.message)
    )

    invalidateDashboardCache(userId).catch(() => {})

    res.json({ booking: fullBooking, payment })
  } catch (err) {
    if (err?.status === 400) {
      return res.status(400).json({ error: err.message })
    }
    next(err)
  }
}

// ??? GET /bookings/:id/files ???????????????????????????????????????????????????
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
