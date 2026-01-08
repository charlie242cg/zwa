-- Migration: Backfill Missing Transactions
-- Date: 2026-01-02
-- Description: Crée les transactions manquantes pour toutes les commandes déjà livrées
--              qui n'ont pas encore de transactions associées

-- ============================================
-- BACKFILL TRANSACTIONS FOR DELIVERED ORDERS
-- ============================================

DO $$
DECLARE
  order_record RECORD;
  product_record RECORD;
  buyer_wallet DECIMAL(10, 2);
  seller_wallet DECIMAL(10, 2);
  affiliate_wallet DECIMAL(10, 2);
  commission_amount DECIMAL(10, 2);
  net_amount DECIMAL(10, 2);
  unit_price DECIMAL(10, 2);
BEGIN
  RAISE NOTICE 'Starting transaction backfill for delivered orders...';

  -- Loop through all delivered orders that don't have transactions yet
  FOR order_record IN
    SELECT o.*
    FROM orders o
    LEFT JOIN transactions t ON t.order_id = o.id
    WHERE o.status = 'delivered'
    AND t.id IS NULL
    ORDER BY o.created_at ASC
  LOOP
    RAISE NOTICE 'Processing order: %', order_record.id;

    -- Get product details
    SELECT name, image_url, default_commission
    INTO product_record
    FROM products
    WHERE id = order_record.product_id;

    -- Calculate amounts
    commission_amount := COALESCE(order_record.commission_amount, 0);
    net_amount := order_record.amount - commission_amount;
    unit_price := order_record.amount / NULLIF(order_record.quantity, 0);

    -- Get current wallet balances
    SELECT wallet_balance INTO buyer_wallet
    FROM profiles WHERE id = order_record.buyer_id;

    SELECT wallet_balance INTO seller_wallet
    FROM profiles WHERE id = order_record.seller_id;

    -- 1. Create PURCHASE transaction for buyer
    INSERT INTO transactions (
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
    ) VALUES (
      order_record.buyer_id,
      'purchase',
      -ABS(order_record.amount),  -- Negative (debit)
      COALESCE(buyer_wallet, 0),
      order_record.id,
      COALESCE(product_record.name, 'Produit'),
      product_record.image_url,
      order_record.quantity,
      unit_price,
      'Achat de ' || order_record.quantity || 'x ' || COALESCE(product_record.name, 'Produit'),
      order_record.created_at
    );

    RAISE NOTICE '  ✅ Purchase transaction created for buyer: %', order_record.buyer_id;

    -- 2. Create SALE transaction for seller
    INSERT INTO transactions (
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
    ) VALUES (
      order_record.seller_id,
      'sale',
      ABS(net_amount),  -- Positive (credit)
      COALESCE(seller_wallet, 0),
      order_record.id,
      COALESCE(product_record.name, 'Produit'),
      product_record.image_url,
      order_record.quantity,
      unit_price,
      'Vente de ' || order_record.quantity || 'x ' || COALESCE(product_record.name, 'Produit') ||
        CASE WHEN commission_amount > 0 THEN ' (Commission: -' || commission_amount || ' FCFA)' ELSE '' END,
      order_record.created_at
    );

    RAISE NOTICE '  ✅ Sale transaction created for seller: %', order_record.seller_id;

    -- 3. Create COMMISSION transaction for affiliate (if applicable)
    IF order_record.affiliate_id IS NOT NULL AND commission_amount > 0 THEN
      SELECT wallet_balance INTO affiliate_wallet
      FROM profiles WHERE id = order_record.affiliate_id;

      INSERT INTO transactions (
        user_id,
        type,
        amount,
        balance_after,
        order_id,
        product_name,
        commission_rate,
        description,
        created_at
      ) VALUES (
        order_record.affiliate_id,
        'commission',
        ABS(commission_amount),  -- Positive (credit)
        COALESCE(affiliate_wallet, 0),
        order_record.id,
        COALESCE(product_record.name, 'Produit'),
        COALESCE(product_record.default_commission, 0),
        'Commission ' || COALESCE(product_record.default_commission, 0) || '% sur vente de ' ||
          order_record.amount || ' FCFA',
        order_record.created_at
      );

      RAISE NOTICE '  ✅ Commission transaction created for affiliate: %', order_record.affiliate_id;
    END IF;

    RAISE NOTICE '  ✅ All transactions created for order: %', order_record.id;
  END LOOP;

  RAISE NOTICE '✅ Transaction backfill completed!';
END $$;

-- ============================================
-- VERIFICATION - Check Results
-- ============================================

-- Check transaction counts
SELECT
  'Total delivered orders' as metric,
  COUNT(*) as count
FROM orders
WHERE status = 'delivered'

UNION ALL

SELECT
  'Total transactions created' as metric,
  COUNT(*) as count
FROM transactions

UNION ALL

SELECT
  'Delivered orders with transactions' as metric,
  COUNT(DISTINCT order_id) as count
FROM transactions
WHERE order_id IS NOT NULL;

-- Sample of created transactions
SELECT
  t.id,
  t.user_id,
  t.type,
  t.amount,
  t.product_name,
  t.created_at,
  o.id as order_id
FROM transactions t
LEFT JOIN orders o ON o.id = t.order_id
ORDER BY t.created_at DESC
LIMIT 10;

-- ============================================
-- DONE! Missing transactions backfilled.
-- ============================================
