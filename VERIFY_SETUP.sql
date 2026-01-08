-- ============================================
-- VÉRIFICATION COMPLÈTE DE LA CONFIGURATION ADMIN
-- ============================================
-- Utilisez ce script pour vérifier que tout est bien configuré

-- 1️⃣ Vérifier que la colonne status existe dans transactions
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'transactions' AND column_name = 'status';
-- ✅ Vous devriez voir: status | text | 'completed'::text


-- 2️⃣ Vérifier que la colonne kyc_verified existe dans profiles
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'kyc_verified';
-- ✅ Vous devriez voir: kyc_verified | boolean | false


-- 3️⃣ Vérifier que la table cities existe
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'cities';
-- ✅ Vous devriez voir: cities


-- 4️⃣ Vérifier que la table global_settings existe
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'global_settings';
-- ✅ Vous devriez voir: global_settings


-- 5️⃣ Vérifier les paramètres globaux par défaut
SELECT commission_rate, aggregator_rate, withdrawal_min, withdrawal_max
FROM public.global_settings;
-- ✅ Vous devriez voir: 5.00 | 2.00 | 5000.00 | 1000000.00


-- 6️⃣ Vérifier les admins existants
SELECT u.email, p.full_name, p.role, p.kyc_verified
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.role = 'admin';
-- ✅ Vous devriez voir votre utilisateur admin avec kyc_verified = true


-- 7️⃣ Vérifier les index créés
SELECT indexname
FROM pg_indexes
WHERE tablename IN ('profiles', 'products', 'transactions')
AND indexname LIKE 'idx_%'
ORDER BY indexname;
-- ✅ Vous devriez voir plusieurs index (idx_profiles_kyc_verified, etc.)


-- ============================================
-- ✅ SI TOUTES LES VÉRIFICATIONS PASSENT :
-- Vous êtes prêt à accéder au dashboard admin !
-- http://localhost:5173/admin
-- ============================================
