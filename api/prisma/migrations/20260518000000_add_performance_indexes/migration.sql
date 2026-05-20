-- Performance indexes migration
-- Covers the most frequent query patterns: userId lookups, status filters, read/unread counts

-- user_sessions
CREATE INDEX IF NOT EXISTS "user_sessions_userId_idx" ON "user_sessions"("userId");
CREATE INDEX IF NOT EXISTS "user_sessions_expiresAt_idx" ON "user_sessions"("expiresAt");

-- oauth_accounts
CREATE INDEX IF NOT EXISTS "oauth_accounts_userId_idx" ON "oauth_accounts"("userId");

-- carts
CREATE INDEX IF NOT EXISTS "carts_userId_idx" ON "carts"("userId");

-- bookings  (most critical — powers listBookings, dashboard counts, type filters)
CREATE INDEX IF NOT EXISTS "bookings_userId_idx" ON "bookings"("userId");
CREATE INDEX IF NOT EXISTS "bookings_userId_status_idx" ON "bookings"("userId", "status");
CREATE INDEX IF NOT EXISTS "bookings_userId_createdAt_idx" ON "bookings"("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "bookings_status_idx" ON "bookings"("status");
CREATE INDEX IF NOT EXISTS "bookings_createdAt_idx" ON "bookings"("createdAt" DESC);

-- sample_taste_bookings
CREATE INDEX IF NOT EXISTS "sample_taste_bookings_userId_idx" ON "sample_taste_bookings"("userId");
CREATE INDEX IF NOT EXISTS "sample_taste_bookings_userId_status_idx" ON "sample_taste_bookings"("userId", "status");

-- payments
CREATE INDEX IF NOT EXISTS "payments_bookingId_status_idx" ON "payments"("bookingId", "status");
CREATE INDEX IF NOT EXISTS "payments_status_idx" ON "payments"("status");

-- support_tickets
CREATE INDEX IF NOT EXISTS "support_tickets_userId_idx" ON "support_tickets"("userId");
CREATE INDEX IF NOT EXISTS "support_tickets_userId_status_idx" ON "support_tickets"("userId", "status");

-- notifications  (powers unread count — runs on every dashboard load)
CREATE INDEX IF NOT EXISTS "notifications_userId_idx" ON "notifications"("userId");
CREATE INDEX IF NOT EXISTS "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");
CREATE INDEX IF NOT EXISTS "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt" DESC);

-- alerts
CREATE INDEX IF NOT EXISTS "alerts_status_idx" ON "alerts"("status");
CREATE INDEX IF NOT EXISTS "alerts_severity_status_idx" ON "alerts"("severity", "status");
CREATE INDEX IF NOT EXISTS "alerts_createdAt_idx" ON "alerts"("createdAt" DESC);