-- Booking lifecycle email log (idempotency) + personalization payloads

CREATE TABLE IF NOT EXISTS "api"."booking_email_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "bookingId" UUID NOT NULL,
    "emailType" VARCHAR(50) NOT NULL,
    "subject" VARCHAR(255),
    "metadata" JSONB,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "booking_email_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "booking_email_logs_bookingId_emailType_key"
  ON "api"."booking_email_logs"("bookingId", "emailType");

CREATE INDEX IF NOT EXISTS "booking_email_logs_emailType_sentAt_idx"
  ON "api"."booking_email_logs"("emailType", "sentAt");

CREATE TABLE IF NOT EXISTS "api"."booking_personalizations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "bookingId" UUID NOT NULL,
    "serviceName" VARCHAR(255) NOT NULL,
    "designImage1" TEXT,
    "designImage2" TEXT,
    "designImage3" TEXT,
    "responseDeadline" DATE,
    "status" VARCHAR(30) NOT NULL DEFAULT 'pending',
    "customerChoice" VARCHAR(20),
    "customerText" TEXT,
    "customerNotes" TEXT,
    "sentAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "booking_personalizations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "booking_personalizations_bookingId_idx"
  ON "api"."booking_personalizations"("bookingId");

CREATE INDEX IF NOT EXISTS "bookings_eventDate_idx" ON "api"."bookings"("eventDate");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'booking_email_logs_bookingId_fkey'
  ) THEN
    ALTER TABLE "api"."booking_email_logs"
      ADD CONSTRAINT "booking_email_logs_bookingId_fkey"
      FOREIGN KEY ("bookingId") REFERENCES "api"."bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'booking_personalizations_bookingId_fkey'
  ) THEN
    ALTER TABLE "api"."booking_personalizations"
      ADD CONSTRAINT "booking_personalizations_bookingId_fkey"
      FOREIGN KEY ("bookingId") REFERENCES "api"."bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
