-- Migration: Add Reviews & Rating System (Alibaba-style)
-- Date: 2026-01-01
-- Description: Add reviews table with auto-calculated ratings for sellers and products

-- ============================================
-- 1. CREATE REVIEWS TABLE
-- ============================================
CREATE TABLE public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Relations (one review per order)
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE UNIQUE,
  buyer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,

  -- Ratings (1-5 stars)
  seller_rating INTEGER CHECK (seller_rating >= 1 AND seller_rating <= 5),
  product_rating INTEGER CHECK (product_rating >= 1 AND product_rating <= 5),

  -- Comments
  seller_comment TEXT,
  product_comment TEXT,

  -- Review images uploaded by buyer (max 3)
  review_images TEXT[],

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- At least one rating must be provided
  CONSTRAINT at_least_one_rating CHECK (
    seller_rating IS NOT NULL OR product_rating IS NOT NULL
  )
);

-- ============================================
-- 2. ADD RATING COLUMNS TO PROFILES (SELLERS)
-- ============================================
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_sales_count INTEGER DEFAULT 0;

-- ============================================
-- 3. ADD RATING COLUMNS TO PRODUCTS
-- ============================================
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;

-- ============================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_reviews_order_id ON public.reviews(order_id);
CREATE INDEX idx_reviews_buyer_id ON public.reviews(buyer_id);
CREATE INDEX idx_reviews_seller_id ON public.reviews(seller_id);
CREATE INDEX idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX idx_reviews_created_at ON public.reviews(created_at DESC);

-- ============================================
-- 5. FUNCTION: UPDATE SELLER RATING
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
-- 6. FUNCTION: UPDATE PRODUCT RATING
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
-- 7. TRIGGERS: AUTO-UPDATE RATINGS
-- ============================================
-- Trigger on INSERT
CREATE TRIGGER on_review_created
AFTER INSERT ON reviews
FOR EACH ROW EXECUTE FUNCTION update_seller_rating();

CREATE TRIGGER on_product_review_created
AFTER INSERT ON reviews
FOR EACH ROW EXECUTE FUNCTION update_product_rating();

-- Trigger on UPDATE (if user edits review)
CREATE TRIGGER on_review_updated
AFTER UPDATE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_seller_rating();

CREATE TRIGGER on_product_review_updated
AFTER UPDATE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_product_rating();

-- Trigger on DELETE (if review is deleted)
CREATE TRIGGER on_review_deleted
AFTER DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_seller_rating();

CREATE TRIGGER on_product_review_deleted
AFTER DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_product_rating();

-- ============================================
-- 8. RLS POLICIES FOR REVIEWS
-- ============================================
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Everyone can read reviews
CREATE POLICY "Reviews are viewable by everyone"
  ON public.reviews FOR SELECT
  USING (true);

-- Only the buyer of the delivered order can create a review
CREATE POLICY "Buyers can create reviews for their delivered orders"
  ON public.reviews FOR INSERT
  WITH CHECK (
    auth.uid() = buyer_id
    AND EXISTS (
      SELECT 1 FROM public.orders
      WHERE id = order_id
      AND buyer_id = auth.uid()
      AND status = 'delivered'
    )
  );

-- Buyers can update their own reviews (optional, can be disabled)
CREATE POLICY "Buyers can update their own reviews"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = buyer_id);

-- ============================================
-- 9. FUNCTION: COUNT TOTAL SALES FOR SELLERS
-- ============================================
-- Update total_sales_count when order is delivered
CREATE OR REPLACE FUNCTION update_seller_sales_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Only increment if status changed to 'delivered'
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') THEN
    UPDATE profiles
    SET total_sales_count = total_sales_count + 1
    WHERE id = NEW.seller_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_order_delivered
AFTER INSERT OR UPDATE ON orders
FOR EACH ROW
WHEN (NEW.status = 'delivered')
EXECUTE FUNCTION update_seller_sales_count();

-- ============================================
-- DONE! Reviews system is ready.
-- ============================================
