import prisma from './prisma.js'
import {
  formatBookingShortId,
  formatDurationBetween,
  formatEventDateLabel,
  formatEventTimeLabel,
  formatIstTimestamp,
  sendAdminEmails,
  sendEmail,
  templates,
} from './email.js'

const ADMIN_NEW_BOOKING_EMAIL = 'admin_new_booking_advance'
const ADMIN_CANCEL_EMAIL = 'admin_booking_cancelled'

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337'

// ─── Fetch user email from Strapi by numeric user ID ─────────────────────────
const getUserEmail = async userId => {
  try {
    const res = await fetch(`${STRAPI_URL}/api/users/${userId}`, {
      headers: { Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}` },
    })
    if (!res.ok) return null
    const user = await res.json()
    return user?.email ?? null
  } catch {
    return null
  }
}

// ─── Create in-app notification ───────────────────────────────────────────────
const createInApp = async (userId, type, title, message, linkUrl) => {
  try {
    await prisma.notification.create({
      data: {
        userId: String(userId),
        type,
        title,
        message: message ?? null,
        linkUrl: linkUrl ?? null,
      },
    })
  } catch (err) {
    console.error('[notify] Failed to create in-app notification:', err?.message)
  }
}

// ─── Main notify helper ───────────────────────────────────────────────────────
// Usage:
//   notify(userId, {
//     type: 'booking_update',          // booking_update | payment | vendor | system | message
//     title: 'Booking Created',
//     message: 'Your booking has been placed.',
//     linkUrl: '/dashboard/bookings/xxx',
//     emailTemplate: 'booking_created', // key from templates — optional
//     emailData: { bookingId, ... },    // data passed to template — optional
//   })
//
// Always fire-and-forget — never throws. Callers should NOT await this.
export const notify = async (
  userId,
  { type, title, message, linkUrl, emailTemplate, emailData, emailSubject }
) => {
  // 1. In-app notification (DB)
  await createInApp(userId, type, title, message, linkUrl)

  // 2. Email (if template provided)
  if (emailTemplate && templates[emailTemplate]) {
    const email = await getUserEmail(userId)
    if (email) {
      const subject = emailSubject || title
      const html = templates[emailTemplate](emailData || {})
      await sendEmail(email, subject, html)
    }
  }
}

/** Email customer + admin for refund request or processed refund. */
export const notifyRefund = async (
  userId,
  { kind, bookingId, amount, reason = null }
) => {
  const amountNum = Number(amount?.toNumber?.() ?? amount ?? 0)
  const shortId = String(bookingId).slice(0, 8).toUpperCase()
  const customerEmail = userId ? await getUserEmail(userId) : null

  if (kind === 'requested') {
    if (userId) {
      await notify(userId, {
        type: 'payment',
        title: 'Refund Requested',
        message: `₹${amountNum.toLocaleString('en-IN')} refund request has been recorded for booking #${shortId}.`,
        linkUrl: `/dashboard/bookings/${bookingId}`,
        emailTemplate: 'refund_requested',
        emailData: { bookingId, amount: amountNum, reason },
      })
    }
    if (templates.refund_requested_admin) {
      await sendAdminEmails(
        `Refund requested — #${shortId}`,
        templates.refund_requested_admin({
          bookingId,
          amount: amountNum,
          reason,
          customerEmail,
        })
      )
    }
    return
  }

  if (kind === 'processed') {
    if (userId) {
      await notify(userId, {
        type: 'payment',
        title: 'Refund Initiated',
        message: `₹${amountNum.toLocaleString('en-IN')} refund has been processed and will reflect in 5–7 business days.`,
        linkUrl: `/dashboard/bookings/${bookingId}`,
        emailTemplate: 'refund_processed',
        emailData: { bookingId, amount: amountNum },
      })
    }
    if (templates.refund_processed_admin) {
      await sendAdminEmails(
        `Refund processed — #${shortId}`,
        templates.refund_processed_admin({
          bookingId,
          amount: amountNum,
          customerEmail,
        })
      )
    }
  }
}

async function loadCustomerProfile(userId) {
  const parsedId = Number.parseInt(String(userId ?? ''), 10)
  if (!Number.isFinite(parsedId)) return { name: '', phone: '', email: '' }

  const [row] = await prisma.$queryRaw`
    SELECT email, first_name, last_name, phone
    FROM public.up_users
    WHERE id = ${parsedId}
    LIMIT 1
  `

  const name = [row?.first_name, row?.last_name].filter(Boolean).join(' ').trim()
  return {
    name,
    phone: String(row?.phone ?? '').trim(),
    email: String(row?.email ?? '').trim(),
  }
}

function packageNameFromItems(items) {
  const titles = [...new Set((items ?? []).map(item => String(item?.title ?? '').trim()).filter(Boolean))]
  return titles.join(', ')
}

async function claimAdminEmail(bookingId, emailType, subject) {
  try {
    await prisma.bookingEmailLog.create({
      data: { bookingId, emailType, subject },
    })
    return true
  } catch (err) {
    if (err?.code === 'P2002') return false
    throw err
  }
}

async function loadAdminBookingMail(bookingId) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { items: { select: { title: true } } },
  })
  if (!booking) return null

  const customer = await loadCustomerProfile(booking.userId)
  return {
    booking,
    packageName: packageNameFromItems(booking.items) || 'Package booking',
    eventDate: formatEventDateLabel(booking.eventDate),
    eventTime: formatEventTimeLabel(booking.eventTime),
    guestCount: booking.guestCount == null ? '' : String(booking.guestCount),
    bookingId: formatBookingShortId(booking.id),
    customerName: customer.name,
    phone: customer.phone,
    email: customer.email,
  }
}

/** Admin mail after successful advance payment. Safe to call twice — sent once per booking. */
export async function notifyAdminAdvancePaid(bookingId) {
  try {
    if (!bookingId) return { sent: false, reason: 'missing_booking' }
    const payload = await loadAdminBookingMail(bookingId)
    if (!payload || !templates.booking_received_admin) {
      return { sent: false, reason: 'missing_booking' }
    }

    const subject = `New booking received — ${payload.bookingId}`
    const claimed = await claimAdminEmail(bookingId, ADMIN_NEW_BOOKING_EMAIL, subject)
    if (!claimed) return { sent: false, reason: 'already_sent' }

    return sendAdminEmails(subject, templates.booking_received_admin(payload))
  } catch (err) {
    console.error('[notify] admin new booking email failed', bookingId, err?.message)
    return { sent: false, reason: 'error' }
  }
}

/** Admin mail when a customer cancels. Safe to call twice — sent once per booking. */
export async function notifyAdminBookingCancelled(bookingId, cancelledAt = new Date()) {
  try {
    if (!bookingId) return { sent: false, reason: 'missing_booking' }
    const payload = await loadAdminBookingMail(bookingId)
    if (!payload || !templates.booking_cancelled_admin) {
      return { sent: false, reason: 'missing_booking' }
    }

    const subject = `Booking cancelled — ${payload.bookingId}`
    const claimed = await claimAdminEmail(bookingId, ADMIN_CANCEL_EMAIL, subject)
    if (!claimed) return { sent: false, reason: 'already_sent' }

    const cancelledDate = cancelledAt instanceof Date ? cancelledAt : new Date(cancelledAt)
    return sendAdminEmails(
      subject,
      templates.booking_cancelled_admin({
        ...payload,
        bookedAt: formatIstTimestamp(payload.booking.createdAt),
        cancelledAt: formatIstTimestamp(cancelledDate),
        durationLabel: formatDurationBetween(payload.booking.createdAt, cancelledDate),
      })
    )
  } catch (err) {
    console.error('[notify] admin cancel email failed', bookingId, err?.message)
    return { sent: false, reason: 'error' }
  }
}

export { getUserEmail }
