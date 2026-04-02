import crypto from 'crypto'
import prisma from '../lib/prisma.js'
import razorpay from '../lib/razorpay.js'

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
    const userId = String(req.user.id)

    if (!bookingId || !paymentType) {
      return res.status(400).json({ error: 'bookingId and paymentType are required' })
    }
    if (!['advance', 'remaining', 'full'].includes(paymentType)) {
      return res.status(400).json({ error: 'paymentType must be advance, remaining, or full' })
    }

    // Fetch booking and verify ownership
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payments: { where: { status: 'success' } } },
    })
    if (!booking) return res.status(404).json({ error: 'Booking not found' })
    if (booking.userId !== userId) return res.status(403).json({ error: 'Forbidden' })
    if (['cancelled', 'completed'].includes(booking.status)) {
      return res.status(400).json({ error: `Cannot create payment for ${booking.status} booking` })
    }

    // Determine amount based on paymentType
    let amount
    if (paymentType === 'advance') {
      const alreadyPaidAdvance = booking.payments.some(p => p.paymentType === 'advance')
      if (alreadyPaidAdvance) return res.status(400).json({ error: 'Advance already paid' })
      amount = Number(booking.advanceAmount)
    } else if (paymentType === 'remaining') {
      const alreadyPaidAdvance = booking.payments.some(p => p.paymentType === 'advance')
      if (!alreadyPaidAdvance) return res.status(400).json({ error: 'Pay advance first' })
      const alreadyPaidRemaining = booking.payments.some(p => p.paymentType === 'remaining')
      if (alreadyPaidRemaining)
        return res.status(400).json({ error: 'Remaining amount already paid' })
      amount = Number(booking.remainingAmount)
    } else {
      // full — only allowed if no payments at all
      if (booking.payments.length > 0) {
        return res
          .status(400)
          .json({ error: 'Booking already has payments. Use advance/remaining instead.' })
      }
      amount = Number(booking.totalPrice)
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid payment amount on booking' })
    }

    // Idempotency: return existing pending order for same booking + type
    const existingPending = await prisma.payment.findFirst({
      where: { bookingId, paymentType, status: 'pending' },
      orderBy: { createdAt: 'desc' },
    })
    if (existingPending?.providerOrderId) {
      return res.json({
        paymentId: existingPending.id,
        razorpayOrderId: existingPending.providerOrderId,
        amount: Number(existingPending.amount),
        currency: 'INR',
        keyId: process.env.RAZORPAY_KEY_ID,
      })
    }

    // Create Razorpay order (amount in paise)
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `${bookingId.slice(0, 20)}_${paymentType}`,
      notes: { bookingId, paymentType, userId },
    })

    // Create pending Payment record in DB
    const payment = await prisma.payment.create({
      data: {
        bookingId,
        paymentType,
        amount,
        status: 'pending',
        provider: 'razorpay',
        providerOrderId: razorpayOrder.id,
      },
    })

    // Log creation
    await prisma.paymentLog.create({
      data: {
        paymentId: payment.id,
        action: 'created',
        performedBy: userId,
        metadata: { razorpayOrderId: razorpayOrder.id, amount, paymentType },
      },
    })

    res.status(201).json({
      paymentId: payment.id,
      razorpayOrderId: razorpayOrder.id,
      amount,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
    })
  } catch (err) {
    next(err)
  }
}

// ─── POST /payments/verify ────────────────────────────────────────────────────
// Verifies Razorpay signature after customer completes payment in the modal.
// On success: marks payment as success, confirms booking if advance payment.
export const verifyPayment = async (req, res, next) => {
  try {
    const { paymentId, razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentMethod } =
      req.body
    const userId = String(req.user.id)

    if (!paymentId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res
        .status(400)
        .json({
          error: 'paymentId, razorpayOrderId, razorpayPaymentId, razorpaySignature are required',
        })
    }

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
      if (payment.paymentType === 'advance' && payment.booking.status === 'new') {
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
            note: 'Confirmed on re-verify (webhook may have set payment success first)',
          },
        })
      }
      const booking = await prisma.booking.findUnique({ where: { id: payment.bookingId } })
      return res.json({ message: 'Payment already verified', payment, booking })
    }
    if (payment.providerOrderId !== razorpayOrderId) {
      return res.status(400).json({ error: 'Order ID mismatch' })
    }

    const isValid = verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)

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
    try {
      gatewayPaymentData = await razorpay.payments.fetch(razorpayPaymentId)
    } catch {
      // Non-fatal: we still trust the signature verification above
      gatewayPaymentData = { id: razorpayPaymentId, order_id: razorpayOrderId }
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
        providerPaymentId: razorpayPaymentId,
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
    if (payment.paymentType === 'advance' && payment.booking.status === 'new') {
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
          note: 'Auto-confirmed after advance payment received',
        },
      })
    }

    res.json({ payment: updatedPayment })
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
          // Auto-confirm booking if advance
          if (payment.paymentType === 'advance') {
            const booking = await prisma.booking.findUnique({ where: { id: payment.bookingId } })
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
            }
          }
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
          // Create a system alert for failed payment
          await prisma.alert.create({
            data: {
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
              status: 'new',
            },
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

    if (!paymentId) return res.status(400).json({ error: 'paymentId is required' })

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
    const { action } = req.body // 'approve' | 'reject'
    const adminId = String(req.user.id)

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'action must be approve or reject' })
    }

    const refund = await prisma.refund.findUnique({
      where: { id },
      include: { payment: true },
    })
    if (!refund) return res.status(404).json({ error: 'Refund not found' })
    if (refund.status !== 'requested') {
      return res.status(400).json({ error: `Refund is already ${refund.status}` })
    }

    if (action === 'reject') {
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

    // Approve: call Razorpay refund API
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
        amount: Math.round(Number(refund.amount) * 100), // paise
        notes: { refundId: id, bookingId: refund.bookingId },
      })
      gatewayRefundId = razorpayRefund.id
    } catch (razorpayErr) {
      // Rollback processing status and surface error
      await prisma.refund.update({
        where: { id },
        data: { status: 'requested', processedBy: null },
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

    if (!vendorId || !bookingId || !amount) {
      return res.status(400).json({ error: 'vendorId, bookingId, and amount are required' })
    }

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

    if (!['paid', 'failed'].includes(status)) {
      return res.status(400).json({ error: 'status must be paid or failed' })
    }

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
