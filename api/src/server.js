import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import { readFileSync } from 'fs'
import { join } from 'path'
import authRoutes from './routes/auth.js'
import vendorRoutes from './routes/vendor.js'
import plannerLeadRoutes from './routes/plannerLead.js'
import consultationRoutes from './routes/consultation.js'
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
import { handleWebhook } from './controllers/payment.js'
import { swaggerSpec } from './swagger.js'
import { errorHandler } from './middleware/errorHandler.js'

dotenv.config()

const app = express()
const PORT = Number(process.env.PORT || 3000)

// ─── Security & parsing ────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false })) // CSP disabled so Swagger UI loads
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',') || [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:80',
      'http://localhost:5174',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  })
)

// ─── Razorpay webhook (MUST be before express.json) ───────────────────────────
// Razorpay signature verification requires the raw request body (Buffer).
// express.json() would parse and discard the raw body, breaking HMAC verification.
app.post('/payments/webhook', express.raw({ type: 'application/json' }), handleWebhook)

app.use(express.json())
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
const server = app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`)
  console.log(`Swagger docs: http://localhost:${PORT}/api-docs`)
})

const shutdown = async () => {
  server.close(() => process.exit(0))
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
