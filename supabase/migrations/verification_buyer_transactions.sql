-- ============================================
-- VERIFICATION: État actuel des transactions buyers
-- ============================================
-- Exécute cette requête AVANT d'appliquer la migration
-- pour vérifier si les transactions existent déjà

-- 1. Compter les commandes livrées par buyer
SELECT
  'ORDERS DELIVERED' as type,
  o.buyer_id,
  pr.full_name as buyer_name,
  pr.role,
  COUNT(*) as delivered_orders_count,
  COALESCE(SUM(o.amount), 0) as total_amount
FROM orders o
LEFT JOIN profiles pr ON o.buyer_id = pr.id
WHERE o.status = 'delivered'
  AND o.buyer_id IS NOT NULL
GROUP BY o.buyer_id, pr.full_name, pr.role
ORDER BY delivered_orders_count DESC;

-- 2. Compter les transactions purchase existantes par buyer
SELECT
  'TRANSACTIONS PURCHASE' as type,
  t.user_id as buyer_id,
  pr.full_name as buyer_name,
  pr.role,
  COUNT(*) as purchase_transactions_count,
  COALESCE(SUM(ABS(t.amount)), 0) as total_amount
FROM transactions t
LEFT JOIN profiles pr ON t.user_id = pr.id
WHERE t.type = 'purchase'
GROUP BY t.user_id, pr.full_name, pr.role
ORDER BY purchase_transactions_count DESC;

-- 3. Comparaison: Commandes livrées VS Transactions purchase
SELECT
  pr.id as buyer_id,
  pr.full_name as buyer_name,
  pr.role,
  (SELECT COUNT(*) FROM orders WHERE buyer_id = pr.id AND status = 'delivered') as delivered_orders,
  (SELECT COUNT(*) FROM transactions WHERE user_id = pr.id AND type = 'purchase') as purchase_transactions,
  (SELECT COUNT(*) FROM orders WHERE buyer_id = pr.id AND status = 'delivered') -
  (SELECT COUNT(*) FROM transactions WHERE user_id = pr.id AND type = 'purchase') as missing_transactions
FROM profiles pr
WHERE pr.role = 'buyer'
  AND (SELECT COUNT(*) FROM orders WHERE buyer_id = pr.id AND status = 'delivered') > 0
ORDER BY missing_transactions DESC;

-- 4. Liste des commandes livrées SANS transaction purchase
SELECT
  o.id as order_id,
  o.buyer_id,
  pr.full_name as buyer_name,
  o.amount,
  p.name as product_name,
  o.status,
  o.created_at,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM transactions t
      WHERE t.order_id = o.id AND t.type = 'purchase' AND t.user_id = o.buyer_id
    ) THEN 'HAS TRANSACTION ✅'
    ELSE 'MISSING TRANSACTION ❌'
  END as transaction_status
FROM orders o
LEFT JOIN profiles pr ON o.buyer_id = pr.id
LEFT JOIN products p ON o.product_id = p.id
WHERE o.status = 'delivered'
  AND o.buyer_id IS NOT NULL
ORDER BY o.created_at DESC;

-- 5. Résumé global
SELECT
  'SUMMARY' as type,
  (SELECT COUNT(*) FROM orders WHERE status = 'delivered' AND buyer_id IS NOT NULL) as total_delivered_orders,
  (SELECT COUNT(*) FROM transactions WHERE type = 'purchase') as total_purchase_transactions,
  (SELECT COUNT(*) FROM orders WHERE status = 'delivered' AND buyer_id IS NOT NULL) -
  (SELECT COUNT(*) FROM transactions WHERE type = 'purchase') as total_missing_transactions;

-- ============================================
-- INTERPRETATION:
-- ============================================
-- Si "total_missing_transactions" > 0 : Il faut appliquer la migration
-- Si "total_missing_transactions" = 0 : La migration a déjà été appliquée
-- ============================================
