-- ===============================================
-- FIX RLS (Row Level Security) pour la table ORDERS
-- ===============================================
-- Ce script corrige les permissions pour que les acheteurs
-- puissent voir leurs commandes après paiement
-- ===============================================

-- 1. Vérifier les politiques actuelles
SELECT
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'orders';

-- 2. SUPPRIMER les anciennes politiques (si elles existent)
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Buyers can view their orders" ON orders;
DROP POLICY IF EXISTS "Sellers can view their orders" ON orders;
DROP POLICY IF EXISTS "Users can insert orders" ON orders;
DROP POLICY IF EXISTS "Users can update their orders" ON orders;

-- 3. CRÉER les nouvelles politiques CORRECTES

-- POLICY 1: Les acheteurs peuvent VOIR leurs commandes
CREATE POLICY "Buyers can view their own orders"
ON orders
FOR SELECT
USING (
    auth.uid() = buyer_id
);

-- POLICY 2: Les vendeurs peuvent VOIR leurs commandes
CREATE POLICY "Sellers can view their own orders"
ON orders
FOR SELECT
USING (
    auth.uid() = seller_id
);

-- POLICY 3: Les affiliés peuvent VOIR les commandes liées
CREATE POLICY "Affiliates can view their orders"
ON orders
FOR SELECT
USING (
    auth.uid() = affiliate_id
);

-- POLICY 4: Les utilisateurs authentifiés peuvent CRÉER des commandes
-- (si buyer_id ou seller_id correspond)
CREATE POLICY "Users can create orders"
ON orders
FOR INSERT
WITH CHECK (
    auth.uid() = buyer_id OR auth.uid() = seller_id
);

-- POLICY 5: Les acheteurs peuvent METTRE À JOUR leurs commandes (pour le paiement)
CREATE POLICY "Buyers can update their orders"
ON orders
FOR UPDATE
USING (
    auth.uid() = buyer_id
)
WITH CHECK (
    auth.uid() = buyer_id
);

-- POLICY 6: Les vendeurs peuvent METTRE À JOUR leurs commandes (pour expédition/livraison)
CREATE POLICY "Sellers can update their orders"
ON orders
FOR UPDATE
USING (
    auth.uid() = seller_id
)
WITH CHECK (
    auth.uid() = seller_id
);

-- 4. VÉRIFIER que RLS est activé
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 5. AFFICHER les nouvelles politiques
SELECT
    tablename,
    policyname,
    permissive,
    cmd,
    CASE
        WHEN qual IS NOT NULL THEN 'USING: ' || qual::text
        ELSE 'No USING clause'
    END as using_clause,
    CASE
        WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check::text
        ELSE 'No WITH CHECK clause'
    END as with_check_clause
FROM pg_policies
WHERE tablename = 'orders'
ORDER BY policyname;

-- ===============================================
-- COMMENT UTILISER CE SCRIPT :
-- ===============================================
-- 1. Aller dans Supabase Dashboard
-- 2. Cliquer sur "SQL Editor"
-- 3. Coller ce script
-- 4. Cliquer "Run"
-- 5. Vérifier que les 6 policies ont été créées
-- ===============================================
