-- Migration: Recalculate All Ratings (One-time fix)
-- Date: 2026-01-02
-- Description: Recalculate all existing ratings for sellers and products
--              Run this AFTER applying 20260102_fix_reviews_triggers.sql

-- ============================================
-- 1. RECALCULATE ALL SELLER RATINGS
-- ============================================
DO $$
DECLARE
  seller_record RECORD;
BEGIN
  -- Loop through all sellers who have reviews
  FOR seller_record IN
    SELECT DISTINCT seller_id FROM reviews WHERE seller_rating IS NOT NULL
  LOOP
    -- Update each seller's rating
    UPDATE profiles
    SET
      average_rating = COALESCE(
        (SELECT AVG(seller_rating)::DECIMAL(3,2)
         FROM reviews
         WHERE seller_id = seller_record.seller_id
         AND seller_rating IS NOT NULL),
        0.00
      ),
      total_reviews = (
        SELECT COUNT(*)
        FROM reviews
        WHERE seller_id = seller_record.seller_id
        AND seller_rating IS NOT NULL
      )
    WHERE id = seller_record.seller_id;

    RAISE NOTICE 'Updated seller: %', seller_record.seller_id;
  END LOOP;

  RAISE NOTICE 'All seller ratings recalculated!';
END $$;

-- ============================================
-- 2. RECALCULATE ALL PRODUCT RATINGS
-- ============================================
DO $$
DECLARE
  product_record RECORD;
BEGIN
  -- Loop through all products that have reviews
  FOR product_record IN
    SELECT DISTINCT product_id FROM reviews WHERE product_rating IS NOT NULL
  LOOP
    -- Update each product's rating
    UPDATE products
    SET
      average_rating = COALESCE(
        (SELECT AVG(product_rating)::DECIMAL(3,2)
         FROM reviews
         WHERE product_id = product_record.product_id
         AND product_rating IS NOT NULL),
        0.00
      ),
      total_reviews = (
        SELECT COUNT(*)
        FROM reviews
        WHERE product_id = product_record.product_id
        AND product_rating IS NOT NULL
      )
    WHERE id = product_record.product_id;

    RAISE NOTICE 'Updated product: %', product_record.product_id;
  END LOOP;

  RAISE NOTICE 'All product ratings recalculated!';
END $$;

-- ============================================
-- 3. VERIFICATION - Check Results
-- ============================================
-- Check seller ratings
SELECT
  p.id,
  p.full_name,
  p.average_rating,
  p.total_reviews,
  p.total_sales_count,
  (SELECT COUNT(*) FROM reviews WHERE seller_id = p.id AND seller_rating IS NOT NULL) as actual_review_count
FROM profiles p
WHERE p.total_reviews > 0
ORDER BY p.average_rating DESC;

-- Check product ratings
SELECT
  pr.id,
  pr.name,
  pr.average_rating,
  pr.total_reviews,
  (SELECT COUNT(*) FROM reviews WHERE product_id = pr.id AND product_rating IS NOT NULL) as actual_review_count
FROM products pr
WHERE pr.total_reviews > 0
ORDER BY pr.average_rating DESC;

-- ============================================
-- DONE! All ratings recalculated.
-- ============================================
