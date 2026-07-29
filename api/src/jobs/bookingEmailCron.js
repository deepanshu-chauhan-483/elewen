import { runScheduledBookingEmails } from '../lib/bookingEmailService.js'

const DEFAULT_INTERVAL_MS = 60 * 60 * 1000 // hourly

/**
 * Lightweight in-process scheduler for booking lifecycle emails.
 * Prefer external cron hitting POST /jobs/booking-emails in production,
 * but this keeps Mail 3 / Mail 4 working without extra infra.
 */
export function startBookingEmailScheduler() {
  if (String(process.env.BOOKING_EMAIL_CRON_ENABLED || 'true').toLowerCase() === 'false') {
    console.log('[booking-email-cron] disabled via BOOKING_EMAIL_CRON_ENABLED=false')
    return null
  }

  const intervalMs = Math.max(
    5 * 60 * 1000,
    Number(process.env.BOOKING_EMAIL_CRON_INTERVAL_MS || DEFAULT_INTERVAL_MS) || DEFAULT_INTERVAL_MS
  )

  const tick = async () => {
    try {
      const result = await runScheduledBookingEmails()
      const preSent = result.preEvent.filter(r => r?.sent).length
      const postSent = result.postEvent.filter(r => r?.sent).length
      if (preSent || postSent) {
        console.log(
          `[booking-email-cron] sent preEvent=${preSent} postEvent=${postSent} (IST ${result.todayKey})`
        )
      }
    } catch (err) {
      console.error('[booking-email-cron] failed:', err?.message || err)
    }
  }

  // Delay first run so the server finishes booting
  const startupTimer = setTimeout(tick, 20_000)
  const intervalTimer = setInterval(tick, intervalMs)

  console.log(`[booking-email-cron] started (every ${Math.round(intervalMs / 60000)} min)`)

  return () => {
    clearTimeout(startupTimer)
    clearInterval(intervalTimer)
  }
}
