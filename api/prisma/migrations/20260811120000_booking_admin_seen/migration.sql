-- Admin unseen tracking for Today's Bookings and Cancelled Bookings badges.
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "adminNewSeenAt" TIMESTAMP(3);
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "adminCancelSeenAt" TIMESTAMP(3);
