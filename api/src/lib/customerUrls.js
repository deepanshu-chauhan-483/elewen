/** Customer-facing site URLs (must match frontend React Router paths). */

export const appBaseUrl = () => String(process.env.APP_URL || 'https://elewen.co.in').replace(/\/$/, '')

export const customerBookingDetailsPath = bookingId =>
  `/user-dashboard/details?bookingId=${encodeURIComponent(String(bookingId ?? ''))}`

export const customerBookingDetailsUrl = bookingId =>
  `${appBaseUrl()}${customerBookingDetailsPath(bookingId)}`

export const customerProfileCouponsPath = () => '/user-dashboard/profile#my-coupons'

export const customerProfileCouponsUrl = () => `${appBaseUrl()}${customerProfileCouponsPath()}`

export const customerSupportPath = (ticketId = '') =>
  ticketId
    ? `/user-dashboard/support?ticketId=${encodeURIComponent(String(ticketId))}`
    : '/user-dashboard/support'

export const customerMessagesPath = (bookingId = '') =>
  bookingId
    ? `/user-dashboard/messages?bookingId=${encodeURIComponent(String(bookingId))}`
    : '/user-dashboard/messages'

/** Cashfree replaces `{order_id}` in this URL after payment (max 250 chars). */
export const customerPaymentReturnPath = () => '/payment/return?order_id={order_id}'

export const customerPaymentReturnUrl = () =>
  `${appBaseUrl()}${customerPaymentReturnPath()}`

export const cashfreeWebhookUrl = () => {
  const apiBase = String(process.env.PUBLIC_API_URL || 'https://api.elewen.co.in').replace(/\/$/, '')
  return `${apiBase}/payments/webhook`
}

/** Fallback when Cashfree dashboard still points at the API host (APISIX → redirect to SPA). */
export const apiPaymentReturnRedirectUrl = () => {
  const apiBase = String(process.env.PUBLIC_API_URL || 'https://api.elewen.co.in').replace(/\/$/, '')
  return `${apiBase}/payments/return?order_id={order_id}`
}
