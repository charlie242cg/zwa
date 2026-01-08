-- Migration: Fix Reviews Triggers for DELETE operations
-- Date: 2026-01-02
-- Description: Corriger les triggers existants pour gérer DELETE et utiliser COALESCE

-- ============================================
-- 1. UPDATE SELLER RATING FUNCTION (Fix for DELETE)
-- ============================================
CREATE OR REPLACE FUNCTION update_seller_rating()
RETURNS TRIGGER AS $$
DECLARE
  v_seller_id UUID;
BEGIN
  -- Get seller_id from NEW (INSERT/UPDATE) or OLD (DELETE)
  v_seller_id := COALESCE(NEW.seller_id, OLD.seller_id);

  -- Update seller's average rating and total reviews
  UPDATE profiles
  SET
    average_rating = COALESCE(
      (SELECT AVG(seller_rating)::DECIMAL(3,2)
       FROM reviews
       WHERE seller_id = v_seller_id AND seller_rating IS NOT NULL),
      0.00
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM reviews
      WHERE seller_id = v_seller_id AND seller_rating IS NOT NULL
    )
  WHERE id = v_seller_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 2. UPDATE PRODUCT RATING FUNCTION (Fix for DELETE)
-- ============================================
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
DECLARE
  v_product_id UUID;
BEGIN
  -- Get product_id from NEW (INSERT/UPDATE) or OLD (DELETE)
  v_product_id := COALESCE(NEW.product_id, OLD.product_id);

  -- Update product's average rating and total reviews
  UPDATE products
  SET
    average_rating = COALESCE(
      (SELECT AVG(product_rating)::DECIMAL(3,2)
       FROM reviews
       WHERE product_id = v_product_id AND product_rating IS NOT NULL),
      0.00
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM reviews
      WHERE product_id = v_product_id AND product_rating IS NOT NULL
    )
  WHERE id = v_product_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. ADD MISSING DELETE TRIGGERS
-- ============================================
-- Check if triggers exist before creating them
DO $$
BEGIN
  -- Trigger for seller rating on DELETE
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_review_deleted'
  ) THEN
    CREATE TRIGGER on_review_deleted
    AFTER DELETE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_seller_rating();
  END IF;

  -- Trigger for product rating on DELETE
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_product_review_deleted'
  ) THEN
    CREATE TRIGGER on_product_review_deleted
    AFTER DELETE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_product_rating();
  END IF;
END $$;

-- ============================================
-- DONE! Triggers fixed and ready.
-- ============================================
