import prisma from './prisma.js'
import { sendEmail, templates } from './email.js'

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
export const notify = async (userId, { type, title, message, linkUrl, emailTemplate, emailData }) => {
  // 1. In-app notification (DB)
  await createInApp(userId, type, title, message, linkUrl)

  // 2. Email (if template provided)
  if (emailTemplate && templates[emailTemplate]) {
    const email = await getUserEmail(userId)
    if (email) {
      const subject = title
      const html = templates[emailTemplate](emailData || {})
      await sendEmail(email, subject, html)
    }
  }
}
