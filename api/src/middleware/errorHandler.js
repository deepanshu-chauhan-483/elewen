/**
 * Central error handler — must be registered last in Express.
 * Handles Strapi-forwarded errors, validation errors, and generic errors.
 */
export const errorHandler = (err, req, res, next) => {
  // Strapi error forwarded from lib/strapi.js
  if (err.strapiError) {
    const status = err.status || 400
    const details = err.strapiError.details?.errors
    const strapiErrorName = err.strapiError?.name || ''

    if (status === 429 || strapiErrorName === 'RateLimitError') {
      return res.status(429).json({
        error: 'Too many sign-in attempts. Please wait a minute and try again.',
        code: 'RATE_LIMITED',
      })
    }

    // Field-level validation errors from Strapi
    if (details?.length) {
      const fields = {}
      details.forEach(({ path, message }) => {
        const field = path?.[0] || 'unknown'
        fields[field] = message
      })
      return res.status(status).json({ error: err.message, fields })
    }

    return res.status(status).json({ error: err.message })
  }

  // Known operational errors (e.g. thrown with err.status set)
  if (err.status) {
    return res.status(err.status).json({ error: err.message })
  }

  // Unexpected errors — don't leak internals
  console.error('[Express Error]', err)
  res.status(500).json({ error: 'Internal server error' })
}
