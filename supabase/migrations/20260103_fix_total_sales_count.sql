-- Migration: Fix total_sales_count for all sellers
-- Date: 2026-01-03
-- Description: Recalculate total_sales_count based on actual delivered orders

-- ============================================
-- RECALCULATE TOTAL_SALES_COUNT FOR ALL SELLERS
-- ============================================

-- Update total_sales_count for all sellers based on actual delivered orders
UPDATE profiles
SET total_sales_count = (
  SELECT COUNT(*)
  FROM orders
  WHERE seller_id = profiles.id
    AND status = 'delivered'
)
WHERE role = 'seller';

-- ============================================
-- VERIFICATION
-- ============================================

-- Show sellers with their real vs stored sales count
SELECT
  p.id,
  p.full_name,
  p.store_name,
  p.total_sales_count as stored_count,
  (SELECT COUNT(*)
   FROM orders
   WHERE seller_id = p.id AND status = 'delivered') as real_count,
  (SELECT COUNT(*)
   FROM orders
   WHERE seller_id = p.id AND status = 'delivered') - p.total_sales_count as difference
FROM profiles p
WHERE p.role = 'seller'
ORDER BY real_count DESC;

-- ============================================
-- DONE! total_sales_count corrected for all sellers.
-- ============================================
