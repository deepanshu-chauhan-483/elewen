import prisma from '../lib/prisma.js'
import {
  createCashfreeOrder,
  createCashfreeRefund,
  fetchCashfreeOrder,
  getCashfreeEnvironment,
  hasCashfreeCredentials,
  mapCashfreePaymentMethod,
  verifyCashfreeWebhookSignature,
} from '../lib/cashfree.js'
import { createOperationalAlert } from '../lib/alerts.js'
import { notify } from '../lib/notify.js'
import { invalidateDashboardCache } from './dashboard.js'
import {
  classifyCartItems,
  isCodPayment,
} from '../lib/sheeshaCheckout.js'
import { sendBookingConfirmedEmail } from '../lib/bookingEmailService.js'

const TEST_PAYMENT_APP_ID = process.env.CASHFREE_TEST_APP_ID || 'TEST_elewen_dashboard_bypass'

function isTestPaymentModeEnabled() {
  return (
    process.env.ENABLE_TEST_PAYMENT_BYPASS === 'true' ||
    !process.env.CASHFREE_APP_ID ||
    String(process.env.CASHFREE_APP_ID).toLowerCase().includes('placeholder') ||
    String(process.env.CASHFREE_SECRET_KEY).toLowerCase().includes('placeholder')
  )
}

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

  // Advance payment alone does not confirm — admin confirms after internal review.
  if (payment.paymentType !== 'full') {
    return booking
  }

  if (booking.status === 'new') {
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

    sendBookingConfirmedEmail(payment.bookingId).catch(err =>
      console.error('[booking-email] confirmed after payment failed', payment.bookingId, err?.message)
    )
  }

  return prisma.booking.findUnique({ where: { id: payment.bookingId } })
}

async function getPaymentSessionId(paymentId) {
  const log = await prisma.paymentLog.findFirst({
    where: { paymentId, action: 'created' },
    orderBy: { createdAt: 'desc' },
  })

  const sessionId = log?.metadata?.paymentSessionId
  return typeof sessionId === 'string' && sessionId ? sessionId : null
}

function buildGatewayOrderId(paymentId) {
  return `ew_${String(paymentId).replace(/-/g, '')}`
}

function isLegacyRazorpayPayment(payment) {
  if (!payment) return false
  if (payment.provider === 'razorpay') return true
  const orderId = String(payment.providerOrderId ?? '')
  return orderId.startsWith('order_')
}

function buildCreateOrderResponse({ payment, amount, paymentSessionId, isTestMode }) {
  return {
    paymentId: payment.id,
    gatewayOrderId: payment.providerOrderId || buildGatewayOrderId(payment.id),
    paymentSessionId: paymentSessionId || null,
    amount,
    currency: 'INR',
    appId: isTestMode ? TEST_PAYMENT_APP_ID : process.env.CASHFREE_APP_ID,
    environment: getCashfreeEnvironment(),
    provider: isTestMode ? 'manual' : 'cashfree',
    testMode: isTestMode,
  }
}

async function abandonPendingPayment(paymentId, userId, reason) {
  await prisma.payment.update({
    where: { id: paymentId },
    data: { status: 'failed' },
  })
  await prisma.paymentLog.create({
    data: {
      paymentId,
      action: 'abandoned',
      performedBy: userId,
      metadata: { reason },
    },
  })
}

// ─── POST /payments/create-order ──────────────────────────────────────────────
// Creates a Cashfree order for a booking's advance or remaining payment.
export const createOrder = async (req, res, next) => {
  try {
    const { bookingId, paymentType } = req.body
    const userId = req.user?.id ? String(req.user.id) : null

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payments: true },
    })

    if (!booking) return res.status(404).json({ error: 'Booking not found' })
    if (booking.userId !== userId) return res.status(403).json({ error: 'Forbidden' })

    if ((booking.payments ?? []).some(isCodPayment)) {
      return res.status(400).json({
        error: 'Online payment is not available for Hookah pay-on-delivery bookings.',
        code: 'SHEESHA_COD_ONLY',
      })
    }

    const cart = await prisma.cart.findFirst({
      where: { userId },
      include: { items: true },
    })
    const cartClassification = await classifyCartItems(cart?.items ?? [])
    if (cartClassification.isSheeshaOnly) {
      return res.status(400).json({
        error: 'Hookah bookings must use pay-on-delivery checkout.',
        code: 'SHEESHA_COD_ONLY',
      })
    }

    if (cartClassification.isMixedSheeshaCart) {
      return res.status(400).json({
        error:
          'Hookah needs a separate booking — it can’t be combined with other services in the same cart.',
        code: 'MIXED_SHEESHA_CART',
      })
    }

    let amount
    try {
      amount = resolvePaymentAmount(booking, paymentType)
    } catch (validationErr) {
      return res.status(400).json({ error: validationErr.message })
    }

    let existingPendingPayment = await prisma.payment.findFirst({
      where: {
        bookingId,
        paymentType,
        status: 'pending',
      },
      orderBy: { createdAt: 'desc' },
    })

    const isTestMode = isTestPaymentModeEnabled() || !hasCashfreeCredentials()

    if (existingPendingPayment?.id && isLegacyRazorpayPayment(existingPendingPayment)) {
      await abandonPendingPayment(
        existingPendingPayment.id,
        userId,
        'Replaced legacy Razorpay pending payment with Cashfree'
      )
      existingPendingPayment = null
    }

    if (existingPendingPayment?.id) {
      let paymentSessionId = await getPaymentSessionId(existingPendingPayment.id)

      if (!paymentSessionId && !isTestMode && existingPendingPayment.providerOrderId) {
        try {
          const existingOrder = await fetchCashfreeOrder(existingPendingPayment.providerOrderId)
          paymentSessionId = existingOrder?.payment_session_id || null
        } catch {
          await abandonPendingPayment(
            existingPendingPayment.id,
            userId,
            'Cashfree session could not be restored'
          )
          existingPendingPayment = null
          paymentSessionId = null
        }
      }

      if (existingPendingPayment?.id && (paymentSessionId || isTestMode)) {
        return res.status(200).json(
          buildCreateOrderResponse({
            payment: existingPendingPayment,
            amount,
            paymentSessionId,
            isTestMode,
          })
        )
      }

      if (existingPendingPayment?.id) {
        await abandonPendingPayment(
          existingPendingPayment.id,
          userId,
          'Creating a fresh Cashfree payment session'
        )
      }
    }

    const payment = await prisma.payment.create({
      data: {
        bookingId,
        paymentType,
        amount,
        status: 'pending',
        provider: isTestMode ? 'manual' : 'cashfree',
      },
    })

    let providerOrderId = buildGatewayOrderId(payment.id)
    let paymentSessionId = null

    if (!isTestMode) {
      const cashfreeOrder = await createCashfreeOrder({
        orderId: providerOrderId,
        amount,
        customerId: userId,
        customerPhone: '9999999999',
        note: `${paymentType} payment for booking ${bookingId}`,
      })

      providerOrderId = cashfreeOrder.order_id || providerOrderId
      paymentSessionId = cashfreeOrder.payment_session_id || null
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
        metadata: {
          bookingId,
          paymentType,
          amount,
          testMode: isTestMode,
          paymentSessionId,
        },
      },
    })

    return res.status(201).json(
      buildCreateOrderResponse({
        payment: { ...payment, providerOrderId },
        amount,
        paymentSessionId,
        isTestMode,
      })
    )
  } catch (err) {
    console.error('createOrder error:', err)
    return res.status(500).json({ error: err.message || 'Internal server error' })
  }
}

// ─── POST /payments/verify ────────────────────────────────────────────────────
// Verifies Cashfree payment after checkout completes.
export const verifyPayment = async (req, res, next) => {
  try {
    const {
      paymentId,
      gatewayOrderId,
      gatewayPaymentId,
      paymentMethod,
      testBypass = false,
    } = req.body
    const resolvedGatewayOrderId = gatewayOrderId
    const resolvedGatewayPaymentId = gatewayPaymentId
    const userId = String(req.user.id)

    if (!resolvedGatewayOrderId) {
      return res.status(400).json({ error: 'gatewayOrderId is required' })
    }

    // Find the Payment record
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { booking: true },
    })
    if (!payment) return res.status(404).json({ error: 'Payment not found' })
    if (payment.booking.userId !== userId) return res.status(403).json({ error: 'Forbidden' })
    if (payment.status === 'success') {
      const booking = await ensureConfirmedBooking(
        payment,
        userId,
        'Confirmed on re-verify after full payment (webhook may have set payment success first)'
      )
      return res.json({ message: 'Payment already verified', payment, booking })
    }
    if (payment.providerOrderId !== resolvedGatewayOrderId) {
      return res.status(400).json({ error: 'Order ID mismatch' })
    }

    const allowTestBypass =
      Boolean(testBypass) && payment.provider === 'manual' && isTestPaymentModeEnabled()

    let gatewayPaymentData = {}
    let isValid = allowTestBypass

    if (allowTestBypass) {
      gatewayPaymentData = {
        cf_payment_id:
          resolvedGatewayPaymentId || `test_payment_${payment.id.replace(/-/g, '')}`,
        order_id: resolvedGatewayOrderId,
        payment_method: paymentMethod || 'offline',
        order_status: 'PAID',
        testMode: true,
      }
    } else {
      try {
        gatewayPaymentData = await fetchCashfreeOrder(resolvedGatewayOrderId)
        isValid = String(gatewayPaymentData?.order_status ?? '').toUpperCase() === 'PAID'
      } catch {
        isValid = false
      }
    }

    if (!isValid) {
      // Mark as failed and log
      await prisma.payment.update({ where: { id: paymentId }, data: { status: 'failed' } })
      await prisma.paymentLog.create({
        data: {
          paymentId,
          action: 'failed',
          performedBy: userId,
          metadata: {
            reason: 'Gateway verification failed',
            gatewayOrderId: resolvedGatewayOrderId,
            gatewayPaymentId: resolvedGatewayPaymentId,
          },
        },
      })
      return res.status(400).json({ error: 'Payment verification failed' })
    }

    const resolvedMethod =
      paymentMethod ||
      mapCashfreePaymentMethod(gatewayPaymentData) ||
      'card'
    const validMethods = ['card', 'upi', 'netbanking', 'offline']
    const finalMethod = validMethods.includes(resolvedMethod) ? resolvedMethod : 'card'

    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'success',
        providerPaymentId:
          resolvedGatewayPaymentId ||
          gatewayPaymentData?.payments?.[0]?.cf_payment_id ||
          gatewayPaymentData?.cf_payment_id ||
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
        metadata: { gatewayPaymentId: updatedPayment.providerPaymentId, method: finalMethod },
      },
    })

    const confirmedBooking = await ensureConfirmedBooking(
      payment,
      userId,
      allowTestBypass
        ? 'Auto-confirmed via test payment bypass'
        : 'Auto-confirmed after full payment received'
    )

    // Notify on successful payment
    notify(payment.booking.userId, {
      type: 'payment',
      title: 'Payment Received',
      message:
        payment.paymentType === 'advance'
          ? `₹${(payment.amount.toNumber?.() ?? Number(payment.amount)).toLocaleString('en-IN')} advance payment confirmed. We will confirm your booking shortly.`
          : `₹${(payment.amount.toNumber?.() ?? Number(payment.amount)).toLocaleString('en-IN')} ${payment.paymentType} payment confirmed.`,
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
// Handles Cashfree server-side events. Must receive raw body (Buffer).
export const handleWebhook = async (req, res) => {
  const signature = req.headers['x-webhook-signature']
  const timestamp = req.headers['x-webhook-timestamp']
  const rawBody = req.body.toString()

  if (!hasCashfreeCredentials()) {
    console.warn('[webhook] Cashfree credentials not configured — skipping signature verification')
  } else if (!verifyCashfreeWebhookSignature(rawBody, timestamp, signature)) {
    return res.status(400).json({ error: 'Invalid webhook signature' })
  }

  let event
  try {
    event = JSON.parse(rawBody)
  } catch {
    return res.status(400).json({ error: 'Invalid JSON payload' })
  }

  res.json({ received: true })

  try {
    const eventType = event.type || event.event

    if (eventType === 'PAYMENT_SUCCESS_WEBHOOK') {
      const gatewayOrderId = event.data?.order?.order_id
      const gatewayPaymentId = event.data?.payment?.cf_payment_id
      const method = mapCashfreePaymentMethod(event.data?.payment ?? event.data?.order ?? {})

      if (gatewayOrderId) {
        const payment = await prisma.payment.findFirst({
          where: { providerOrderId: gatewayOrderId, status: 'pending' },
        })
        if (payment) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: 'success',
              providerPaymentId: gatewayPaymentId,
              paymentMethod: method || 'card',
            },
          })
          await prisma.paymentTransaction.create({
            data: {
              paymentId: payment.id,
              gatewayResponse: event.data ?? {},
              status: 'PAID',
            },
          })
          await prisma.paymentLog.create({
            data: {
              paymentId: payment.id,
              action: 'webhook_captured',
              metadata: { gatewayPaymentId, eventType },
            },
          })
          const booking = await prisma.booking.findUnique({ where: { id: payment.bookingId } })

          if (payment.paymentType === 'advance' && booking) {
            notify(booking.userId, {
              type: 'payment',
              title: 'Payment Received',
              message: `₹${(payment.amount.toNumber?.() ?? Number(payment.amount)).toLocaleString('en-IN')} advance payment confirmed. We will confirm your booking shortly.`,
              linkUrl: `/dashboard/bookings/${payment.bookingId}`,
              emailTemplate: 'payment_success',
              emailData: {
                bookingId: payment.bookingId,
                amount: payment.amount,
                paymentType: payment.paymentType,
              },
            }).catch(() => {})
          }

          if (payment.paymentType === 'full') {
            await ensureConfirmedBooking(
              payment,
              booking?.userId ?? null,
              'Auto-confirmed via Cashfree payment webhook'
            )
          }

          await clearUserCart(booking?.userId).catch(() => {})
          await invalidateDashboardCache(booking?.userId).catch(() => {})
        }
      }
    }

    if (eventType === 'PAYMENT_FAILED_WEBHOOK') {
      const gatewayOrderId = event.data?.order?.order_id
      const errorDescription =
        event.data?.payment?.payment_message || event.data?.payment?.payment_status

      if (gatewayOrderId) {
        const payment = await prisma.payment.findFirst({
          where: { providerOrderId: gatewayOrderId, status: 'pending' },
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

    if (eventType === 'REFUND_STATUS_WEBHOOK') {
      const gatewayRefundId = event.data?.refund?.cf_refund_id || event.data?.refund?.refund_id
      const gatewayStatus = String(event.data?.refund?.refund_status ?? '').toUpperCase()

      if (gatewayRefundId && gatewayStatus === 'SUCCESS') {
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
    console.error('[webhook] Error processing event:', event?.type || event?.event, err)
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
// Admin approves (calls Cashfree refund API) or rejects a refund request.
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
    if (!refund.payment.providerOrderId) {
      return res
        .status(400)
        .json({ error: 'No Cashfree order ID on record — cannot initiate gateway refund' })
    }

    await prisma.refund.update({
      where: { id },
      data: { status: 'processing', processedBy: adminId },
    })

    let gatewayRefundId = null
    try {
      const cashfreeRefund = await createCashfreeRefund(refund.payment.providerOrderId, {
        refundId: `rf_${id.replace(/-/g, '')}`,
        amount: refund.amount.toNumber?.() ?? Number(refund.amount),
        note: `Refund for booking ${refund.bookingId}`,
      })
      gatewayRefundId = cashfreeRefund.cf_refund_id || cashfreeRefund.refund_id || null
    } catch (cashfreeErr) {
      await prisma.refund.update({
        where: { id },
        data: { status: 'requested', processedBy: null },
      })
      await createOperationalAlert(prisma, {
        alertType: 'refund_failed',
        severity: 'high',
        message: `Refund failed for booking ${refund.bookingId}. Reason: ${cashfreeErr.message}`,
        metadata: {
          bookingId: refund.bookingId,
          paymentId: refund.paymentId,
          refundId: id,
          reason: cashfreeErr.message,
        },
        relatedEntityType: 'payment',
        relatedEntityId: refund.paymentId,
      })
      return res.status(502).json({ error: 'Cashfree refund failed', detail: cashfreeErr.message })
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
