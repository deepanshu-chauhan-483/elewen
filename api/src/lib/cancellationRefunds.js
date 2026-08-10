import { createOperationalAlert } from './alerts.js'

/** Round money to 2 decimal places for refund allocation. */
export function roundRefundCurrency(value) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return 0
  return Number(amount.toFixed(2))
}

/**
 * Build refund rows for successful payments up to refundableAmount.
 * Skips payments that already have requested/processing/completed refunds.
 */
export function buildCancellationRefundEntries({
  bookingId,
  payments = [],
  refundableAmount,
  reason,
}) {
  let remainingRefundAmount = roundRefundCurrency(refundableAmount)
  const refundEntries = []
  const successfulPayments = (Array.isArray(payments) ? payments : []).filter(
    payment => payment?.status === 'success'
  )

  for (const payment of successfulPayments) {
    if (remainingRefundAmount <= 0) break

    const hasOpenRefund = (Array.isArray(payment.refunds) ? payment.refunds : []).some(refund =>
      ['requested', 'processing', 'completed'].includes(String(refund?.status ?? ''))
    )
    if (hasOpenRefund) continue

    const paymentAmount = roundRefundCurrency(payment.amount)
    const refundAmount = roundRefundCurrency(Math.min(paymentAmount, remainingRefundAmount))
    if (refundAmount <= 0) continue

    refundEntries.push({
      paymentId: payment.id,
      bookingId,
      amount: refundAmount,
      reason,
    })
    remainingRefundAmount = roundRefundCurrency(remainingRefundAmount - refundAmount)
  }

  return refundEntries
}

/**
 * Persist refund requests + payment logs + operational alerts inside a Prisma transaction.
 */
export async function persistCancellationRefunds(
  tx,
  { refundEntries, performedBy, source, refundWindow = null, bookingId }
) {
  const created = []

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
        performedBy,
        metadata: {
          refundId: refund.id,
          reason: refundEntry.reason,
          source,
          refundWindow,
        },
      },
    })

    await createOperationalAlert(tx, {
      alertType: 'refund_requested',
      severity: 'medium',
      message: `Refund requested from cancellation for booking #${String(bookingId).slice(0, 8).toUpperCase()}.`,
      metadata: {
        bookingId,
        paymentId: refundEntry.paymentId,
        refundId: refund.id,
        reason: refundEntry.reason,
        source,
        refundWindow,
      },
      relatedEntityType: 'booking',
      relatedEntityId: bookingId,
    })

    created.push(refund)
  }

  return created
}
