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
