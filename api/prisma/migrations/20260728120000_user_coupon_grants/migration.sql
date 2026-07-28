-- User-assigned coupon grants + cart/booking grant linkage
ALTER TABLE "api"."carts" ADD COLUMN IF NOT EXISTS "couponGrantId" UUID;

ALTER TABLE "api"."bookings" ADD COLUMN IF NOT EXISTS "couponGrantId" UUID;

ALTER TABLE "api"."coupon_usage" ALTER COLUMN "couponId" DROP NOT NULL;
ALTER TABLE "api"."coupon_usage" ADD COLUMN IF NOT EXISTS "grantId" UUID;

CREATE TABLE IF NOT EXISTS "api"."user_coupon_grants" (
  "id" UUID NOT NULL,
  "userId" VARCHAR(50) NOT NULL,
  "assignedByAdminId" VARCHAR(50),
  "sourceBookingId" UUID,
  "templateKey" VARCHAR(100) NOT NULL,
  "code" VARCHAR(50) NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "discount_type" VARCHAR(20) NOT NULL,
  "discount_value" DECIMAL(12,2) NOT NULL,
  "min_order_value" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "max_order_value" DECIMAL(12,2),
  "max_discount_amount" DECIMAL(12,2),
  "terms_customer" TEXT,
  "first_order_only" BOOLEAN NOT NULL DEFAULT false,
  "service_filter" VARCHAR(20) NOT NULL DEFAULT 'all',
  "is_shareable" BOOLEAN NOT NULL DEFAULT true,
  "valid_from" TIMESTAMP(3) NOT NULL,
  "valid_to" TIMESTAMP(3) NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'active',
  "sent_at" TIMESTAMP(3),
  "used_at" TIMESTAMP(3),
  "used_by_user_id" VARCHAR(50),
  "used_on_booking_id" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "user_coupon_grants_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_coupon_grants_code_key" ON "api"."user_coupon_grants"("code");
CREATE INDEX IF NOT EXISTS "user_coupon_grants_userId_status_idx" ON "api"."user_coupon_grants"("userId", "status");
CREATE INDEX IF NOT EXISTS "user_coupon_grants_code_idx" ON "api"."user_coupon_grants"("code");

ALTER TABLE "api"."coupon_usage"
  ADD CONSTRAINT "coupon_usage_grantId_fkey"
  FOREIGN KEY ("grantId") REFERENCES "api"."user_coupon_grants"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Extend Strapi public.coupons with rule/T&C fields (safe if already present)
ALTER TABLE "public"."coupons" ADD COLUMN IF NOT EXISTS "title" VARCHAR(255);
ALTER TABLE "public"."coupons" ADD COLUMN IF NOT EXISTS "coupon_kind" VARCHAR(50);
ALTER TABLE "public"."coupons" ADD COLUMN IF NOT EXISTS "terms_customer" TEXT;
ALTER TABLE "public"."coupons" ADD COLUMN IF NOT EXISTS "admin_notes" TEXT;
ALTER TABLE "public"."coupons" ADD COLUMN IF NOT EXISTS "min_order_value" DECIMAL(12,2) DEFAULT 0;
ALTER TABLE "public"."coupons" ADD COLUMN IF NOT EXISTS "max_order_value" DECIMAL(12,2);
ALTER TABLE "public"."coupons" ADD COLUMN IF NOT EXISTS "max_discount_amount" DECIMAL(12,2);
ALTER TABLE "public"."coupons" ADD COLUMN IF NOT EXISTS "first_order_only" BOOLEAN DEFAULT false;
ALTER TABLE "public"."coupons" ADD COLUMN IF NOT EXISTS "service_filter" VARCHAR(20) DEFAULT 'all';
ALTER TABLE "public"."coupons" ADD COLUMN IF NOT EXISTS "validity_days" INTEGER;
ALTER TABLE "public"."coupons" ADD COLUMN IF NOT EXISTS "is_user_specific" BOOLEAN DEFAULT false;
ALTER TABLE "public"."coupons" ADD COLUMN IF NOT EXISTS "is_shareable" BOOLEAN DEFAULT true;
