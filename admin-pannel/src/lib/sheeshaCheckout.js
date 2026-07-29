export function isCodPayment(payment) {
  if (!payment) return false
  return (
    payment.provider === 'manual' &&
    payment.paymentMethod === 'offline' &&
    payment.providerOrderId === 'COD'
  )
}

export function isCodPendingPayment(payment) {
  return isCodPayment(payment) && payment.status === 'pending'
}

export function bookingHasHookahCod(booking) {
  return (Array.isArray(booking?.payments) ? booking.payments : []).some(isCodPayment)
}

export function bookingHasPendingHookahCod(booking) {
  return (Array.isArray(booking?.payments) ? booking.payments : []).some(isCodPendingPayment)
}
