-- Store full customization payload (catering menu picks, etc.) outside the 255-char title column.
ALTER TABLE "cart_items" ADD COLUMN IF NOT EXISTS "selectedOptions" JSONB;
