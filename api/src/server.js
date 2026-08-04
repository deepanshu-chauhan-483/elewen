import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import { readFileSync } from 'fs'
import { join, resolve } from 'path'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import vendorRoutes from './routes/vendor.js'
import plannerLeadRoutes from './routes/plannerLead.js'
import consultationRoutes from './routes/consultation.js'
import contactRoutes from './routes/contact.js'
import cartRoutes from './routes/cart.js'
import bookingRoutes from './routes/booking.js'
import sampleTasteRoutes from './routes/sampleTaste.js'
import paymentRoutes from './routes/payment.js'
import vendorAssignmentRoutes from './routes/vendorAssignment.js'
import messagingRoutes from './routes/messaging.js'
import supportRoutes from './routes/support.js'
import packageRoutes from './routes/package.js'
import notificationRoutes from './routes/notification.js'
import wishlistRoutes from './routes/wishlist.js'
import dashboardRoutes from './routes/dashboard.js'
import adminRoutes from './routes/admin.js'
import jobsRoutes from './routes/jobs.js'
import couponRoutes from './routes/coupons.js'
import { handleWebhook } from './controllers/payment.js'
import { swaggerSpec } from './swagger.js'
import { errorHandler } from './middleware/errorHandler.js'
import { bootstrapDefaultAdmin, getDefaultAdminCredentials } from './lib/bootstrapAdmin.js'
import { connectRedis, disconnectRedis } from './lib/cache.js'
import { startBookingEmailScheduler } from './jobs/bookingEmailCron.js'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
// Load only api/.env so local dev does not pick up root docker-compose .env
dotenv.config({ path: resolve(__dirname, '../.env'), override: true })

const app = express()
const PORT = Number(process.env.PORT || 3000)

function parseAllowedOrigins() {
  const defaults = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:3000',
    'http://localhost:80',
  ]

  const configured = String(process.env.CORS_ORIGIN ?? '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean)

  return [...new Set([...defaults, ...configured])]
}

const allowedOrigins = parseAllowedOrigins()

// ─── Security & parsing ────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false })) // CSP disabled so Swagger UI loads
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true)
      }

      return callback(new Error(`CORS blocked for origin ${origin}`))
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204,
  })
)

// ─── Cashfree webhook (MUST be before express.json) ───────────────────────────
// Cashfree signature verification requires the raw request body (Buffer).
// express.json() would parse and discard the raw body, breaking HMAC verification.
app.post('/payments/webhook', express.raw({ type: 'application/json' }), handleWebhook)

app.use(express.json({ limit: '15mb' }))
app.use(cookieParser())

// ─── Swagger UI (CDN-served, no package dependency) ───────────────────────────
app.get('/api-docs.json', (_req, res) => res.json(swaggerSpec))
app.get('/api-docs', (_req, res) => {
  res.setHeader('Content-Type', 'text/html')
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Elewen API Docs</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: '/api-docs.json',
      dom_id: '#swagger-ui',
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
      layout: 'BaseLayout',
      deepLinking: true,
      persistAuthorization: true,
    })
  </script>
</body>
</html>`)
})

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/auth', authRoutes)
app.use('/vendor', vendorRoutes)
app.use('/planner-leads', plannerLeadRoutes)
app.use('/consultations', consultationRoutes)
app.use('/contact', contactRoutes)
app.use('/cart', cartRoutes)
app.use('/bookings', bookingRoutes)
app.use('/sample-taste', sampleTasteRoutes)
app.use('/payments', paymentRoutes)
app.use('/vendor-assignments', vendorAssignmentRoutes)
app.use('/messages', messagingRoutes)
app.use('/support', supportRoutes)
app.use('/packages', packageRoutes)
app.use('/notifications', notificationRoutes)
app.use('/wishlist', wishlistRoutes)
app.use('/dashboard', dashboardRoutes)
app.use('/admin', adminRoutes)
app.use('/jobs', jobsRoutes)
app.use('/coupons', couponRoutes)

// ─── Dev-only test pages ──────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.get('/test-payment', (_req, res) => {
    const html = readFileSync(join(process.cwd(), 'test-payment.html'), 'utf8')
    res.setHeader('Content-Type', 'text/html')
    res.send(html)
  })
}

// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ ok: true }))
app.get('/healthz', (_req, res) => res.json({ ok: true }))

// ─── Error handler (must be last) ─────────────────────────────────────────────
app.use(errorHandler)

// ─── Start ────────────────────────────────────────────────────────────────────
let server = null

async function start() {
  await connectRedis()

  const credentials = getDefaultAdminCredentials()
  let defaultAdminState = null

  try {
    defaultAdminState = await bootstrapDefaultAdmin()
  } catch (err) {
    console.error('[server.start] Default admin bootstrap warning:', err)
  }

  server = app.listen(PORT, () => {
    console.log(`API running on port ${PORT}`)
    console.log(`Swagger docs: http://localhost:${PORT}/api-docs`)

    startBookingEmailScheduler()

    if (process.env.NODE_ENV !== 'production' && defaultAdminState?.user?.id) {
      console.log(`[admin-bootstrap] Login email: ${credentials.email}`)
      if (defaultAdminState.credentialsReady) {
        console.log(`[admin-bootstrap] Login password: ${credentials.password}`)
      } else {
        console.log(
          "[admin-bootstrap] Existing user detected. Default password could not be enforced, so use that account's current password or change DEV_ADMIN_EMAIL."
        )
      }
    }
  })
}

const shutdown = async () => {
  await disconnectRedis()

  if (!server) {
    process.exit(0)
  }

  server.close(() => process.exit(0))
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

start()
