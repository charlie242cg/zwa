-- Migration: Add product images array and promotion support
-- Date: 2026-01-01
-- Description: Add images_url array and original_price for promotion detection

-- 1. Add images_url column (array of image URLs)
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS images_url TEXT[];

-- 2. Add original_price for promotion detection
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS original_price DECIMAL(12, 2);

-- 3. Ensure is_affiliate_enabled exists (should be from previous migration but just in case)
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS is_affiliate_enabled BOOLEAN DEFAULT TRUE;

-- 4. Migrate existing image_url to images_url array (for existing products)
UPDATE public.products
SET images_url = ARRAY[image_url]::TEXT[]
WHERE images_url IS NULL AND image_url IS NOT NULL;

-- 5. Create index for better query performance on promo products
CREATE INDEX IF NOT EXISTS idx_products_on_sale ON public.products(original_price)
WHERE original_price IS NOT NULL;

-- Note: No need to backfill original_price, it will be NULL for non-promo products
