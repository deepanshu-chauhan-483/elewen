-- Homepage discount banner toggle (admin Share Banner)
ALTER TABLE "public"."coupons" ADD COLUMN IF NOT EXISTS "banner_shared" BOOLEAN DEFAULT false;
