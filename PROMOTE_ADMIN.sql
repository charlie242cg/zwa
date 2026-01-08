-- ============================================
-- SCRIPT DÉFINITIF: Promouvoir un utilisateur ADMIN
-- ============================================
-- Copiez-collez ce script dans Supabase SQL Editor
-- https://supabase.com/dashboard > Votre projet > SQL Editor

-- ============================================
-- ÉTAPE 1: Voir vos utilisateurs existants
-- ============================================

SELECT
    u.email,
    p.full_name,
    p.role as role_actuel,
    u.created_at as inscrit_le
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC;

-- ⬆️ Regardez les résultats ci-dessus
-- ⬆️ Notez l'EMAIL de l'utilisateur à promouvoir


-- ============================================
-- ÉTAPE 2: PROMOUVOIR L'UTILISATEUR ADMIN
-- ============================================
-- ⚠️ DÉCOMMENTEZ les 3 lignes ci-dessous (retirez les --)
-- ⚠️ REMPLACEZ 'votre-email@example.com' par le BON email

-- UPDATE public.profiles SET role = 'admin', kyc_verified = true, updated_at = NOW()
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'votre-email@example.com' LIMIT 1);


-- ============================================
-- ÉTAPE 3: Vérifier que ça a marché
-- ============================================

SELECT
    u.email,
    p.full_name,
    p.role,
    p.kyc_verified
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.role = 'admin';

-- ✅ Si vous voyez votre email avec role = 'admin', c'est BON !
-- ✅ Déconnectez-vous et reconnectez-vous sur votre app
-- ✅ Allez sur: http://localhost:5173/admin
