-- Migration: Fix buyer purchase transactions
-- Date: 2026-01-05
-- Description: Create missing purchase transactions for buyers with delivered orders
-- IDEMPOTENT: Safe to run multiple times (won't create duplicates)

-- ============================================
-- VERIFICATION AVANT MIGRATION
-- ============================================

-- Afficher combien de transactions manquantes vont être créées
DO $$
DECLARE
  missing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO missing_count
  FROM orders o
  WHERE o.buyer_id IS NOT NULL
    AND o.status = 'delivered'
    AND NOT EXISTS (
      SELECT 1 FROM transactions t
      WHERE t.order_id = o.id
        AND t.type = 'purchase'
        AND t.user_id = o.buyer_id
    );

  RAISE NOTICE '📊 Nombre de transactions purchase à créer: %', missing_count;

  IF missing_count = 0 THEN
    RAISE NOTICE '✅ Aucune transaction manquante. Migration déjà appliquée ou pas de commandes livrées.';
  ELSE
    RAISE NOTICE '⚠️  % transactions purchase vont être créées.', missing_count;
  END IF;
END $$;

-- ============================================
-- CREATE MISSING PURCHASE TRANSACTIONS FOR BUYERS
-- ============================================

-- Create purchase transactions for all delivered orders that don't have one
-- IMPORTANT: Le NOT EXISTS empêche les doublons
INSERT INTO transactions (
  id,
  user_id,
  type,
  amount,
  balance_after,
  order_id,
  product_name,
  product_image,
  quantity,
  unit_price,
  description,
  created_at
)
SELECT
  gen_random_uuid(),
  o.buyer_id,
  'purchase',
  -ABS(o.amount), -- Négatif (débit pour l'acheteur)
  -- Balance after pour buyer (toujours 0 car les buyers ne gardent pas de solde)
  0,
  o.id,
  p.name,
  p.image_url,
  o.quantity,
  o.amount / NULLIF(o.quantity, 0),
  CONCAT('Achat de ', o.quantity, 'x ', p.name),
  o.created_at
FROM orders o
LEFT JOIN products p ON o.product_id = p.id
WHERE o.buyer_id IS NOT NULL
  AND o.status = 'delivered'
  AND NOT EXISTS (
    SELECT 1 FROM transactions t
    WHERE t.order_id = o.id
      AND t.type = 'purchase'
      AND t.user_id = o.buyer_id
  )
ORDER BY o.created_at ASC;

-- ============================================
-- VERIFICATION
-- ============================================

-- Show buyers with their purchase transactions
SELECT
  p.id,
  p.full_name,
  p.role,
  (SELECT COUNT(*) FROM orders WHERE buyer_id = p.id AND status = 'delivered') as delivered_orders,
  (SELECT COUNT(*) FROM transactions WHERE user_id = p.id AND type = 'purchase') as purchase_transactions,
  (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE user_id = p.id AND type = 'purchase') as total_spent
FROM profiles p
WHERE p.role = 'buyer'
ORDER BY p.created_at DESC;

-- Show all purchase transactions created
SELECT
  t.id,
  t.user_id,
  pr.full_name as buyer_name,
  t.product_name,
  t.amount,
  t.quantity,
  t.created_at
FROM transactions t
LEFT JOIN profiles pr ON t.user_id = pr.id
WHERE t.type = 'purchase'
ORDER BY t.created_at DESC;

-- ============================================
-- DONE! Buyer purchase transactions corrected.
-- ============================================
