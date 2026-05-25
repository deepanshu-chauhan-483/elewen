import crypto from 'crypto'
import prisma from '../lib/prisma.js'
import razorpay from '../lib/razorpay.js'
import { createOperationalAlert } from '../lib/alerts.js'
import { notify } from '../lib/notify.js'
import { invalidateDashboardCache } from './dashboard.js'

const TEST_PAYMENT_KEY_ID = process.env.RAZORPAY_TEST_KEY_ID || 'rzp_test_elewen_dashboard_bypass'
const TEST_MODE_ENABLED =
  process.env.ENABLE_TEST_PAYMENT_BYPASS === 'true' ||
  !process.env.RAZORPAY_KEY_ID ||
  String(process.env.RAZORPAY_KEY_ID).toLowerCase().includes('placeholder') ||
  String(process.env.RAZORPAY_KEY_SECRET).toLowerCase().includes('placeholder')

const toNumberAmount = value => {
  if (value == null) return 0
  if (typeof value?.toNumber === 'function') return value.toNumber()
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const getSuccessfulPaidAmount = booking =>
  Array.isArray(booking?.payments)
    ? booking.payments
        .filter(payment => payment.status === 'success')
        .reduce((sum, payment) => sum + toNumberAmount(payment.amount), 0)
    : 0

async function clearUserCart(userId) {
  if (!userId) return

  const cart = await prisma.cart.findFirst({
    where: { userId: String(userId) },
    select: { id: true },
  })

  if (!cart) return

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
}

function resolvePaymentAmount(booking, paymentType) {
  const totalPrice = toNumberAmount(booking?.totalPrice)
  const advanceAmount = toNumberAmount(booking?.advanceAmount)
  const remainingAmount = toNumberAmount(booking?.remainingAmount)
  const amountPaid = getSuccessfulPaidAmount(booking)

  if (paymentType === 'advance') {
    if (amountPaid >= advanceAmount || booking.status === 'confirmed') {
      throw new Error('Advance payment has already been recorded for this booking')
    }
    return advanceAmount
  }

  if (paymentType === 'remaining') {
    if (amountPaid < advanceAmount && advanceAmount > 0) {
      throw new Error('Advance payment must be completed before paying the remaining balance')
    }
    if (remainingAmount <= 0) {
      throw new Error('No remaining balance is due for this booking')
    }
    return remainingAmount
  }

  const outstanding = Math.max(totalPrice - amountPaid, 0)
  if (outstanding <= 0) {
    throw new Error('This booking has already been fully paid')
  }
  return outstanding
}

async function ensureConfirmedBooking(payment, userId, note) {
  const booking = await prisma.booking.findUnique({ where: { id: payment.bookingId } })
  if (!booking) return null

  if (
    booking.status === 'new' &&
    (payment.paymentType === 'advance' || payment.paymentType === 'full')
  ) {
    await prisma.booking.update({
      where: { id: payment.bookingId },
      data: { status: 'confirmed' },
    })
    await prisma.bookingStatusLog.create({
      data: {
        bookingId: payment.bookingId,
        previousStatus: 'new',
        newStatus: 'confirmed',
        changedBy: userId,
        note,
      },
    })
  }

  return prisma.booking.findUnique({ where: { id: payment.bookingId } })
}

// ─── Helper: verify Razorpay payment signature ─────────────────────────────────
const verifyPaymentSignature = (orderId, paymentId, signature) => {
  const body = `${orderId}|${paymentId}`
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex')
  return expected === signature
}

// ─── Helper: verify Razorpay webhook signature ────────────────────────────────
const verifyWebhookSignature = (rawBody, signature) => {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex')
  return expected === signature
}

// ─── POST /payments/create-order ──────────────────────────────────────────────
// Creates a Razorpay order for a booking's advance or remaining payment.
// Returns the Razorpay order details for the frontend to open the payment modal.
export const createOrder = async (req, res, next) => {
  try {
    const { bookingId, paymentType } = req.body
    const userId = req.user?.id ? String(req.user.id) : null

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payments: { where: { status: 'success' } } },
    })

    if (!booking) return res.status(404).json({ error: 'Booking not found' })
    if (booking.userId !== userId) return res.status(403).json({ error: 'Forbidden' })

    let amount
    try {
      amount = resolvePaymentAmount(booking, paymentType)
    } catch (validationErr) {
      return res.status(400).json({ error: validationErr.message })
    }

    const existingPendingPayment = await prisma.payment.findFirst({
      where: {
        bookingId,
        paymentType,
        status: 'pending',
      },
      orderBy: { createdAt: 'desc' },
    })

    const isTestMode = TEST_MODE_ENABLED || !razorpay

    if (existingPendingPayment) {
      return res.status(200).json({
        paymentId: existingPendingPayment.id,
        razorpayOrderId:
          existingPendingPayment.providerOrderId ||
          `test_order_${existingPendingPayment.id.replace(/-/g, '')}`,
        amount,
        currency: 'INR',
        keyId: isTestMode ? TEST_PAYMENT_KEY_ID : process.env.RAZORPAY_KEY_ID,
        testMode: isTestMode,
      })
    }

    const payment = await prisma.payment.create({
      data: {
        bookingId,
        paymentType,
        amount,
        status: 'pending',
        provider: isTestMode ? 'manual' : 'razorpay',
      },
    })

    let providerOrderId = `test_order_${payment.id.replace(/-/g, '')}`

    if (!isTestMode) {
      const order = await razorpay.orders.create({
        amount: Math.round(amount * 100),
        currency: 'INR',
        receipt: payment.id,
        notes: {
          paymentId: payment.id,
          bookingId,
          userId,
        },
      })
      providerOrderId = order.id
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: { providerOrderId },
    })

    await prisma.paymentLog.create({
      data: {
        paymentId: payment.id,
        action: 'created',
        performedBy: userId,
        metadata: { bookingId, paymentType, amount, testMode: isTestMode },
      },
    })

    return res.status(201).json({
      paymentId: payment.id,
      razorpayOrderId: providerOrderId,
      amount,
      currency: 'INR',
      keyId: isTestMode ? TEST_PAYMENT_KEY_ID : process.env.RAZORPAY_KEY_ID,
      testMode: isTestMode,
    })
  } catch (err) {
    console.error('createOrder error:', err)
    return res.status(500).json({ error: err.message || 'Internal server error' })
  }
}

// ─── POST /payments/verify ────────────────────────────────────────────────────
// Verifies Razorpay signature after customer completes payment in the modal.
// On success: marks payment as success, confirms booking if advance payment.
export const verifyPayment = async (req, res, next) => {
  try {
    const {
      paymentId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      paymentMethod,
      testBypass = false,
    } = req.body
    const userId = String(req.user.id)

    // Find the Payment record
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { booking: true },
    })
    if (!payment) return res.status(404).json({ error: 'Payment not found' })
    if (payment.booking.userId !== userId) return res.status(403).json({ error: 'Forbidden' })
    if (payment.status === 'success') {
      // Payment already verified (e.g. by webhook before verify was called).
      // Still confirm booking in case the webhook's async booking update failed.
      const booking = await ensureConfirmedBooking(
        payment,
        userId,
        'Confirmed on re-verify (webhook may have set payment success first)'
      )
      return res.json({ message: 'Payment already verified', payment, booking })
    }
    if (payment.providerOrderId !== razorpayOrderId) {
      return res.status(400).json({ error: 'Order ID mismatch' })
    }

    const allowTestBypass =
      Boolean(testBypass) &&
      (payment.provider === 'manual' || razorpayOrderId.startsWith('test_order_'))

    const isValid = allowTestBypass
      ? true
      : verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)

    if (!isValid) {
      // Mark as failed and log
      await prisma.payment.update({ where: { id: paymentId }, data: { status: 'failed' } })
      await prisma.paymentLog.create({
        data: {
          paymentId,
          action: 'failed',
          performedBy: userId,
          metadata: { reason: 'Signature mismatch', razorpayOrderId, razorpayPaymentId },
        },
      })
      return res.status(400).json({ error: 'Payment verification failed: invalid signature' })
    }

    // Fetch full payment details from Razorpay for the transaction record
    let gatewayPaymentData = {}
    if (allowTestBypass) {
      gatewayPaymentData = {
        id: razorpayPaymentId || `test_payment_${payment.id.replace(/-/g, '')}`,
        order_id: razorpayOrderId,
        method: paymentMethod || 'offline',
        status: 'captured',
        testMode: true,
      }
    } else {
      try {
        gatewayPaymentData = await razorpay.payments.fetch(razorpayPaymentId)
      } catch {
        gatewayPaymentData = { id: razorpayPaymentId, order_id: razorpayOrderId }
      }
    }

    // Resolve paymentMethod from gateway response or request body
    const resolvedMethod =
      paymentMethod ||
      (gatewayPaymentData.method === 'netbanking' ? 'netbanking' : gatewayPaymentData.method) ||
      'card'
    const validMethods = ['card', 'upi', 'netbanking', 'offline']
    const finalMethod = validMethods.includes(resolvedMethod) ? resolvedMethod : 'card'

    // Update Payment to success
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'success',
        providerPaymentId:
          razorpayPaymentId ||
          gatewayPaymentData.id ||
          `test_payment_${payment.id.replace(/-/g, '')}`,
        paymentMethod: finalMethod,
      },
    })

    // Store full gateway response in payment_transactions
    await prisma.paymentTransaction.create({
      data: {
        paymentId,
        gatewayResponse: gatewayPaymentData,
        status: 'success',
      },
    })

    // Audit log
    await prisma.paymentLog.create({
      data: {
        paymentId,
        action: 'verified',
        performedBy: userId,
        metadata: { razorpayPaymentId, method: finalMethod },
      },
    })

    // Auto-confirm booking on advance payment (new → confirmed)
    const confirmedBooking = await ensureConfirmedBooking(
      payment,
      userId,
      allowTestBypass
        ? 'Auto-confirmed via test payment bypass'
        : 'Auto-confirmed after advance payment received'
    )

    // Notify on successful payment
    notify(payment.booking.userId, {
      type: 'payment',
      title: 'Payment Received',
      message: `₹${(payment.amount.toNumber?.() ?? Number(payment.amount)).toLocaleString('en-IN')} ${payment.paymentType} payment confirmed.`,
      linkUrl: `/dashboard/bookings/${payment.bookingId}`,
      emailTemplate: 'payment_success',
      emailData: {
        bookingId: payment.bookingId,
        amount: payment.amount,
        paymentType: payment.paymentType,
      },
    }).catch(() => {})

    await clearUserCart(payment.booking.userId).catch(() => {})
    await invalidateDashboardCache(payment.booking.userId).catch(() => {})

    res.json({ payment: updatedPayment, booking: confirmedBooking })
  } catch (err) {
    next(err)
  }
}

// ─── POST /payments/webhook ───────────────────────────────────────────────────
// Handles Razorpay server-side events. Must receive raw body (Buffer).
// CRITICAL: This route must be registered BEFORE express.json() in server.js.
export const handleWebhook = async (req, res) => {
  const signature = req.headers['x-razorpay-signature']
  const rawBody = req.body.toString() // Buffer → string

  if (
    !process.env.RAZORPAY_WEBHOOK_SECRET ||
    process.env.RAZORPAY_WEBHOOK_SECRET === 'set_this_in_razorpay_dashboard'
  ) {
    console.warn(
      '[webhook] RAZORPAY_WEBHOOK_SECRET not configured — skipping signature verification'
    )
  } else if (!verifyWebhookSignature(rawBody, signature)) {
    return res.status(400).json({ error: 'Invalid webhook signature' })
  }

  let event
  try {
    event = JSON.parse(rawBody)
  } catch {
    return res.status(400).json({ error: 'Invalid JSON payload' })
  }

  // Always respond 200 immediately — process async to not block Razorpay retry
  res.json({ received: true })

  try {
    const eventType = event.event

    if (eventType === 'payment.captured') {
      // Webhook confirmation of payment — sync DB if verify endpoint was missed
      const razorpayOrderId = event.payload?.payment?.entity?.order_id
      const razorpayPaymentId = event.payload?.payment?.entity?.id
      const method = event.payload?.payment?.entity?.method

      if (razorpayOrderId) {
        const payment = await prisma.payment.findFirst({
          where: { providerOrderId: razorpayOrderId, status: 'pending' },
        })
        if (payment) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: 'success',
              providerPaymentId: razorpayPaymentId,
              paymentMethod: method || 'card',
            },
          })
          await prisma.paymentTransaction.create({
            data: {
              paymentId: payment.id,
              gatewayResponse: event.payload?.payment?.entity ?? {},
              status: 'captured',
            },
          })
          await prisma.paymentLog.create({
            data: {
              paymentId: payment.id,
              action: 'webhook_captured',
              metadata: { razorpayPaymentId, eventType },
            },
          })
          const booking = await prisma.booking.findUnique({ where: { id: payment.bookingId } })

          // Auto-confirm booking if advance
          if (payment.paymentType === 'advance') {
            if (booking?.status === 'new') {
              await prisma.booking.update({
                where: { id: payment.bookingId },
                data: { status: 'confirmed' },
              })
              await prisma.bookingStatusLog.create({
                data: {
                  bookingId: payment.bookingId,
                  previousStatus: 'new',
                  newStatus: 'confirmed',
                  note: 'Auto-confirmed via payment.captured webhook',
                },
              })
              notify(booking.userId, {
                type: 'payment',
                title: 'Payment Received',
                message: `₹${(payment.amount.toNumber?.() ?? Number(payment.amount)).toLocaleString('en-IN')} advance payment confirmed.`,
                linkUrl: `/dashboard/bookings/${payment.bookingId}`,
                emailTemplate: 'payment_success',
                emailData: {
                  bookingId: payment.bookingId,
                  amount: payment.amount,
                  paymentType: payment.paymentType,
                },
              }).catch(() => {})
            }
          }

          if (payment.paymentType === 'full') {
            await ensureConfirmedBooking(
              payment,
              booking?.userId ?? null,
              'Auto-confirmed via payment.captured webhook'
            )
          }

          await clearUserCart(booking?.userId).catch(() => {})
          await invalidateDashboardCache(booking?.userId).catch(() => {})
        }
      }
    }

    if (eventType === 'payment.failed') {
      const razorpayOrderId = event.payload?.payment?.entity?.order_id
      const errorDescription = event.payload?.payment?.entity?.error_description

      if (razorpayOrderId) {
        const payment = await prisma.payment.findFirst({
          where: { providerOrderId: razorpayOrderId, status: 'pending' },
        })
        if (payment) {
          await prisma.payment.update({ where: { id: payment.id }, data: { status: 'failed' } })
          await prisma.paymentLog.create({
            data: {
              paymentId: payment.id,
              action: 'webhook_failed',
              metadata: { errorDescription, eventType },
            },
          })
          // Notify user of failed payment
          const failedBooking = await prisma.booking.findUnique({
            where: { id: payment.bookingId },
          })
          if (failedBooking) {
            notify(failedBooking.userId, {
              type: 'payment',
              title: 'Payment Failed',
              message: 'Your payment could not be processed. Please try again.',
              linkUrl: `/dashboard/bookings/${payment.bookingId}`,
              emailTemplate: 'payment_failed',
              emailData: { bookingId: payment.bookingId, amount: payment.amount },
            }).catch(() => {})
          }

          await createOperationalAlert(prisma, {
            alertType: 'failed_payment',
            severity: 'high',
            message: `Payment failed for booking ${payment.bookingId}. Reason: ${errorDescription || 'Unknown'}`,
            metadata: {
              bookingId: payment.bookingId,
              paymentId: payment.id,
              reason: errorDescription,
            },
            relatedEntityType: 'payment',
            relatedEntityId: payment.id,
          })
        }
      }
    }

    if (eventType === 'refund.processed') {
      const gatewayRefundId = event.payload?.refund?.entity?.id
      const gatewayStatus = event.payload?.refund?.entity?.status

      if (gatewayRefundId && gatewayStatus === 'processed') {
        const refund = await prisma.refund.findFirst({ where: { gatewayRefundId } })
        if (refund) {
          await prisma.refund.update({ where: { id: refund.id }, data: { status: 'completed' } })
          await prisma.payment.update({
            where: { id: refund.paymentId },
            data: { status: 'refunded' },
          })
          await prisma.paymentLog.create({
            data: {
              paymentId: refund.paymentId,
              action: 'refund_completed',
              metadata: { gatewayRefundId, eventType },
            },
          })
        }
      }
    }
  } catch (err) {
    console.error('[webhook] Error processing event:', event?.event, err)
  }
}

// ─── GET /payments?bookingId=xxx ──────────────────────────────────────────────
// Returns all payments for a specific booking. User can only see their own.
export const getPayments = async (req, res, next) => {
  try {
    const { bookingId } = req.query
    const userId = String(req.user.id)

    if (!bookingId) return res.status(400).json({ error: 'bookingId query param is required' })

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } })
    if (!booking) return res.status(404).json({ error: 'Booking not found' })
    if (booking.userId !== userId) return res.status(403).json({ error: 'Forbidden' })

    const payments = await prisma.payment.findMany({
      where: { bookingId },
      include: { refunds: true },
      orderBy: { createdAt: 'asc' },
    })

    res.json({ payments })
  } catch (err) {
    next(err)
  }
}

// ─── GET /payments/all (admin) ────────────────────────────────────────────────
// Returns paginated list of all payments across all bookings.
export const getAllPayments = async (req, res, next) => {
  try {
    const { status, paymentType, page = 1, limit = 20 } = req.query
    const skip = (Number(page) - 1) * Number(limit)

    const where = {}
    if (status) where.status = status
    if (paymentType) where.paymentType = paymentType

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: { refunds: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.payment.count({ where }),
    ])

    res.json({ payments, total, page: Number(page), pages: Math.ceil(total / Number(limit)) })
  } catch (err) {
    next(err)
  }
}

// ─── POST /refunds ────────────────────────────────────────────────────────────
// Customer or admin requests a refund for a successful payment.
export const requestRefund = async (req, res, next) => {
  try {
    const { paymentId, reason } = req.body
    const userId = String(req.user.id)

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { booking: true, refunds: true },
    })
    if (!payment) return res.status(404).json({ error: 'Payment not found' })
    if (payment.booking.userId !== userId) return res.status(403).json({ error: 'Forbidden' })
    if (payment.status !== 'success') {
      return res.status(400).json({ error: 'Can only refund a successful payment' })
    }
    const openRefund = payment.refunds.find(r => ['requested', 'processing'].includes(r.status))
    if (openRefund) {
      return res.status(400).json({ error: 'A refund is already in progress for this payment' })
    }

    const refund = await prisma.refund.create({
      data: {
        paymentId,
        bookingId: payment.bookingId,
        amount: payment.amount,
        reason,
        status: 'requested',
      },
    })

    await prisma.paymentLog.create({
      data: {
        paymentId,
        action: 'refund_requested',
        performedBy: userId,
        metadata: { refundId: refund.id, reason },
      },
    })

    await createOperationalAlert(prisma, {
      alertType: 'refund_requested',
      severity: 'medium',
      message: `Refund requested for booking ${payment.bookingId}. Review payment ${paymentId}.`,
      metadata: {
        bookingId: payment.bookingId,
        paymentId,
        refundId: refund.id,
        reason,
      },
      relatedEntityType: 'payment',
      relatedEntityId: paymentId,
    })

    res.status(201).json({ refund })
  } catch (err) {
    next(err)
  }
}

// ─── PATCH /refunds/:id ───────────────────────────────────────────────────────
// Admin approves (calls Razorpay refund API) or rejects a refund request.
export const processRefund = async (req, res, next) => {
  try {
    const { id } = req.params
    const normalizedAction = String(req.body?.action ?? 'pay_refund')
      .trim()
      .toLowerCase()
    const adminId = String(req.user.id)

    const refund = await prisma.refund.findUnique({
      where: { id },
      include: { payment: true },
    })
    if (!refund) return res.status(404).json({ error: 'Refund not found' })
    if (refund.status !== 'requested') {
      return res.status(400).json({ error: `Refund is already ${refund.status}` })
    }

    if (normalizedAction === 'reject') {
      const updated = await prisma.refund.update({
        where: { id },
        data: { status: 'rejected', processedBy: adminId },
      })
      await prisma.paymentLog.create({
        data: {
          paymentId: refund.paymentId,
          action: 'refund_rejected',
          performedBy: adminId,
          metadata: { refundId: id },
        },
      })
      return res.json({ refund: updated })
    }

    // Pay refund to the same original payment credentials via the stored provider payment id.
    if (!refund.payment.providerPaymentId) {
      return res
        .status(400)
        .json({ error: 'No Razorpay payment ID on record — cannot initiate gateway refund' })
    }

    await prisma.refund.update({
      where: { id },
      data: { status: 'processing', processedBy: adminId },
    })

    let gatewayRefundId = null
    try {
      const razorpayRefund = await razorpay.payments.refund(refund.payment.providerPaymentId, {
        amount: Math.round((refund.amount.toNumber?.() ?? Number(refund.amount)) * 100), // paise
        notes: { refundId: id, bookingId: refund.bookingId },
      })
      gatewayRefundId = razorpayRefund.id
    } catch (razorpayErr) {
      // Rollback processing status and surface error
      await prisma.refund.update({
        where: { id },
        data: { status: 'requested', processedBy: null },
      })
      await createOperationalAlert(prisma, {
        alertType: 'refund_failed',
        severity: 'high',
        message: `Refund failed for booking ${refund.bookingId}. Reason: ${razorpayErr.message}`,
        metadata: {
          bookingId: refund.bookingId,
          paymentId: refund.paymentId,
          refundId: id,
          reason: razorpayErr.message,
        },
        relatedEntityType: 'payment',
        relatedEntityId: refund.paymentId,
      })
      return res.status(502).json({ error: 'Razorpay refund failed', detail: razorpayErr.message })
    }

    const updated = await prisma.refund.update({
      where: { id },
      data: { gatewayRefundId, status: 'processing' },
    })

    await prisma.paymentLog.create({
      data: {
        paymentId: refund.paymentId,
        action: 'refund_initiated',
        performedBy: adminId,
        metadata: { refundId: id, gatewayRefundId },
      },
    })

    // Notify user when refund is approved and being processed
    if (normalizedAction !== 'reject') {
      const refundBooking = await prisma.booking.findUnique({ where: { id: updated.bookingId } })
      if (refundBooking) {
        notify(refundBooking.userId, {
          type: 'payment',
          title: 'Refund Initiated',
          message: `₹${(updated.amount.toNumber?.() ?? Number(updated.amount)).toLocaleString('en-IN')} refund has been processed and will reflect in 5–7 business days.`,
          linkUrl: `/dashboard/bookings/${updated.bookingId}`,
          emailTemplate: 'refund_processed',
          emailData: { bookingId: updated.bookingId, amount: updated.amount },
        }).catch(() => {})
      }
    }

    res.json({ refund: updated })
  } catch (err) {
    next(err)
  }
}

// ─── GET /refunds ─────────────────────────────────────────────────────────────
// List refunds. Optionally filter by bookingId or status.
export const getRefunds = async (req, res, next) => {
  try {
    const { bookingId, status } = req.query
    const where = {}
    if (bookingId) where.bookingId = bookingId
    if (status) where.status = status

    const refunds = await prisma.refund.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    res.json({ refunds })
  } catch (err) {
    next(err)
  }
}

// ─── POST /vendor-payouts ─────────────────────────────────────────────────────
// Admin creates a payout record for a vendor against a completed booking.
export const createVendorPayout = async (req, res, next) => {
  try {
    const { vendorId, bookingId, amount, paymentMethod } = req.body

    const validMethods = ['portal', 'offline']
    const method = validMethods.includes(paymentMethod) ? paymentMethod : 'offline'

    const payout = await prisma.vendorPayout.create({
      data: {
        vendorId: String(vendorId),
        bookingId,
        amount,
        status: 'pending',
        paymentMethod: method,
      },
    })

    res.status(201).json({ payout })
  } catch (err) {
    next(err)
  }
}

// ─── PATCH /vendor-payouts/:id ────────────────────────────────────────────────
// Admin marks a vendor payout as paid or failed.
export const updateVendorPayout = async (req, res, next) => {
  try {
    const { id } = req.params
    const { status, referenceId } = req.body

    const payout = await prisma.vendorPayout.findUnique({ where: { id } })
    if (!payout) return res.status(404).json({ error: 'Vendor payout not found' })
    if (payout.status !== 'pending') {
      return res.status(400).json({ error: `Payout is already ${payout.status}` })
    }

    const updated = await prisma.vendorPayout.update({
      where: { id },
      data: {
        status,
        referenceId: referenceId ?? null,
        paidAt: status === 'paid' ? new Date() : null,
      },
    })

    res.json({ payout: updated })
  } catch (err) {
    next(err)
  }
}

// ─── GET /vendor-payouts ──────────────────────────────────────────────────────
// List vendor payouts. Filter by vendorId, bookingId, or status.
export const getVendorPayouts = async (req, res, next) => {
  try {
    const { vendorId, bookingId, status } = req.query
    const where = {}
    if (vendorId) where.vendorId = String(vendorId)
    if (bookingId) where.bookingId = bookingId
    if (status) where.status = status

    const payouts = await prisma.vendorPayout.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    res.json({ payouts })
  } catch (err) {
    next(err)
  }
}
