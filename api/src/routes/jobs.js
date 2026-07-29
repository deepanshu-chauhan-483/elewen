import { Router } from 'express'
import { runScheduledBookingEmails } from '../lib/bookingEmailService.js'

const router = Router()

/**
 * Secure cron endpoint for lifecycle emails (Mail 3 + Mail 4).
 * Call hourly/daily with header: x-jobs-secret: <JOBS_SECRET>
 * Or query: ?secret=<JOBS_SECRET>
 */
router.post('/booking-emails', async (req, res, next) => {
  try {
    const configured = String(process.env.JOBS_SECRET || '').trim()
    const provided = String(
      req.headers['x-jobs-secret'] || req.query?.secret || req.body?.secret || ''
    ).trim()

    if (!configured) {
      return res.status(503).json({
        error: 'JOBS_SECRET is not configured on the API server.',
      })
    }

    if (!provided || provided !== configured) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const result = await runScheduledBookingEmails()
    res.json({ ok: true, ...result })
  } catch (err) {
    next(err)
  }
})

export default router
