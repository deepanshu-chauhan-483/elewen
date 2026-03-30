-- Fix all columns that reference Strapi integer PKs.
-- Strapi uses auto-increment integer PKs (1, 2, 3...), not UUIDs.
-- PostgreSQL UUID type rejects integer strings — VARCHAR(50) accepts both.
-- user_sessions.userId already fixed in migration 20260327000000.

-- oauth_accounts
ALTER TABLE "oauth_accounts" ALTER COLUMN "userId" TYPE VARCHAR(50) USING "userId"::text;

-- carts
ALTER TABLE "carts" ALTER COLUMN "userId" TYPE VARCHAR(50) USING "userId"::text;
ALTER TABLE "carts" ALTER COLUMN "couponId" TYPE VARCHAR(50) USING "couponId"::text;

-- cart_items
ALTER TABLE "cart_items" ALTER COLUMN "packageId" TYPE VARCHAR(50) USING "packageId"::text;
ALTER TABLE "cart_items" ALTER COLUMN "packageElementId" TYPE VARCHAR(50) USING "packageElementId"::text;
ALTER TABLE "cart_items" ALTER COLUMN "addonId" TYPE VARCHAR(50) USING "addonId"::text;

-- bookings
ALTER TABLE "bookings" ALTER COLUMN "userId" TYPE VARCHAR(50) USING "userId"::text;
ALTER TABLE "bookings" ALTER COLUMN "packageId" TYPE VARCHAR(50) USING "packageId"::text;
ALTER TABLE "bookings" ALTER COLUMN "eventId" TYPE VARCHAR(50) USING "eventId"::text;
ALTER TABLE "bookings" ALTER COLUMN "eventAddressId" TYPE VARCHAR(50) USING "eventAddressId"::text;
ALTER TABLE "bookings" ALTER COLUMN "couponId" TYPE VARCHAR(50) USING "couponId"::text;

-- booking_items
ALTER TABLE "booking_items" ALTER COLUMN "packageElementId" TYPE VARCHAR(50) USING "packageElementId"::text;
ALTER TABLE "booking_items" ALTER COLUMN "addonId" TYPE VARCHAR(50) USING "addonId"::text;

-- booking_status_logs
ALTER TABLE "booking_status_logs" ALTER COLUMN "changedBy" TYPE VARCHAR(50) USING "changedBy"::text;

-- booking_notes
ALTER TABLE "booking_notes" ALTER COLUMN "adminId" TYPE VARCHAR(50) USING "adminId"::text;

-- cancellations
ALTER TABLE "cancellations" ALTER COLUMN "requestedBy" TYPE VARCHAR(50) USING "requestedBy"::text;

-- booking_files
ALTER TABLE "booking_files" ALTER COLUMN "uploadedBy" TYPE VARCHAR(50) USING "uploadedBy"::text;

-- sample_taste_bookings (bookingId stays UUID — references Booking.id)
ALTER TABLE "sample_taste_bookings" ALTER COLUMN "userId" TYPE VARCHAR(50) USING "userId"::text;
ALTER TABLE "sample_taste_bookings" ALTER COLUMN "packageId" TYPE VARCHAR(50) USING "packageId"::text;
ALTER TABLE "sample_taste_bookings" ALTER COLUMN "eventId" TYPE VARCHAR(50) USING "eventId"::text;

-- sample_taste_vendors (sampleBookingId stays UUID)
ALTER TABLE "sample_taste_vendors" ALTER COLUMN "vendorId" TYPE VARCHAR(50) USING "vendorId"::text;

-- refunds (paymentId and bookingId stay UUID — reference custom Express tables)
ALTER TABLE "refunds" ALTER COLUMN "processedBy" TYPE VARCHAR(50) USING "processedBy"::text;

-- payment_logs (paymentId stays UUID)
ALTER TABLE "payment_logs" ALTER COLUMN "performedBy" TYPE VARCHAR(50) USING "performedBy"::text;

-- vendor_assignments (bookingId stays UUID)
ALTER TABLE "vendor_assignments" ALTER COLUMN "vendorId" TYPE VARCHAR(50) USING "vendorId"::text;
ALTER TABLE "vendor_assignments" ALTER COLUMN "serviceId" TYPE VARCHAR(50) USING "serviceId"::text;
ALTER TABLE "vendor_assignments" ALTER COLUMN "assignedBy" TYPE VARCHAR(50) USING "assignedBy"::text;

-- vendor_payouts (bookingId stays UUID — references Booking.id)
ALTER TABLE "vendor_payouts" ALTER COLUMN "vendorId" TYPE VARCHAR(50) USING "vendorId"::text;

-- vendor_bank_info (unique index must be dropped and re-created after type change)
DROP INDEX IF EXISTS "vendor_bank_info_vendorId_key";
ALTER TABLE "vendor_bank_info" ALTER COLUMN "vendorId" TYPE VARCHAR(50) USING "vendorId"::text;
CREATE UNIQUE INDEX "vendor_bank_info_vendorId_key" ON "vendor_bank_info"("vendorId");

-- coupon_usage (bookingId stays UUID)
ALTER TABLE "coupon_usage" ALTER COLUMN "couponId" TYPE VARCHAR(50) USING "couponId"::text;
ALTER TABLE "coupon_usage" ALTER COLUMN "userId" TYPE VARCHAR(50) USING "userId"::text;

-- message_threads (bookingId stays UUID)
ALTER TABLE "message_threads" ALTER COLUMN "createdBy" TYPE VARCHAR(50) USING "createdBy"::text;

-- messages (threadId stays UUID)
ALTER TABLE "messages" ALTER COLUMN "senderId" TYPE VARCHAR(50) USING "senderId"::text;

-- message_read_status (messageId stays UUID; unique index must be rebuilt)
DROP INDEX IF EXISTS "message_read_status_messageId_userId_key";
ALTER TABLE "message_read_status" ALTER COLUMN "userId" TYPE VARCHAR(50) USING "userId"::text;
CREATE UNIQUE INDEX "message_read_status_messageId_userId_key" ON "message_read_status"("messageId", "userId");

-- support_tickets (bookingId stays UUID)
ALTER TABLE "support_tickets" ALTER COLUMN "userId" TYPE VARCHAR(50) USING "userId"::text;

-- support_messages (ticketId stays UUID)
ALTER TABLE "support_messages" ALTER COLUMN "senderId" TYPE VARCHAR(50) USING "senderId"::text;

-- notifications
ALTER TABLE "notifications" ALTER COLUMN "userId" TYPE VARCHAR(50) USING "userId"::text;

-- alerts
ALTER TABLE "alerts" ALTER COLUMN "resolvedBy" TYPE VARCHAR(50) USING "resolvedBy"::text;
ALTER TABLE "alerts" ALTER COLUMN "relatedEntityId" TYPE VARCHAR(50) USING "relatedEntityId"::text;
