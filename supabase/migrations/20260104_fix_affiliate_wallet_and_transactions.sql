-- Migration: Fix affiliate wallet and create missing commission transactions
-- Date: 2026-01-04
-- Description: Recalculate affiliate wallet_balance and create missing commission transactions

-- ============================================
-- STEP 1: RECALCULATE AFFILIATE WALLET BALANCE
-- ============================================

-- Update wallet_balance for all affiliates based on delivered orders
UPDATE profiles
SET wallet_balance = (
  SELECT COALESCE(SUM(commission_amount), 0)
  FROM orders
  WHERE affiliate_id = profiles.id
    AND status = 'delivered'
)
WHERE role = 'affiliate';

-- ============================================
-- STEP 2: CREATE MISSING COMMISSION TRANSACTIONS
-- ============================================

-- Create commission transactions for all delivered orders that don't have one
INSERT INTO transactions (
  id,
  user_id,
  type,
  amount,
  balance_after,
  order_id,
  product_name,
  commission_rate,
  description,
  created_at
)
SELECT
  gen_random_uuid(),
  o.affiliate_id,
  'commission',
  o.commission_amount,
  -- Calculate running balance (sum of all commissions up to this point)
  (
    SELECT COALESCE(SUM(o2.commission_amount), 0)
    FROM orders o2
    WHERE o2.affiliate_id = o.affiliate_id
      AND o2.status = 'delivered'
      AND o2.created_at <= o.created_at
  ),
  o.id,
  p.name,
  p.default_commission,
  CONCAT('Commission sur vente de ', p.name),
  o.created_at
FROM orders o
LEFT JOIN products p ON o.product_id = p.id
WHERE o.affiliate_id IS NOT NULL
  AND o.status = 'delivered'
  AND o.commission_amount > 0
  AND NOT EXISTS (
    SELECT 1 FROM transactions t
    WHERE t.order_id = o.id
      AND t.type = 'commission'
      AND t.user_id = o.affiliate_id
  )
ORDER BY o.created_at ASC;

-- ============================================
-- STEP 3: VERIFICATION
-- ============================================

-- Show affiliate wallets with comparison
SELECT
  p.id,
  p.full_name,
  p.role,
  p.wallet_balance as current_wallet,
  (SELECT COUNT(*) FROM orders WHERE affiliate_id = p.id AND status = 'delivered') as delivered_orders,
  (SELECT COALESCE(SUM(commission_amount), 0) FROM orders WHERE affiliate_id = p.id AND status = 'delivered') as calculated_balance,
  (SELECT COUNT(*) FROM transactions WHERE user_id = p.id AND type = 'commission') as commission_transactions
FROM profiles p
WHERE p.role = 'affiliate'
ORDER BY p.created_at DESC;

-- ============================================
-- DONE! Affiliate wallets and transactions corrected.
-- ============================================
