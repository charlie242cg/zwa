-- ============================================
-- PROMOUVOIR joapassy@gmail.com EN ADMIN
-- ============================================
-- Copiez-collez ce script dans Supabase SQL Editor et cliquez RUN

-- Promouvoir l'utilisateur
UPDATE public.profiles
SET
    role = 'admin',
    kyc_verified = true,
    updated_at = NOW()
WHERE id = (
    SELECT id FROM auth.users
    WHERE email = 'joapassy@gmail.com'
    LIMIT 1
);

-- Vérifier que ça a marché
SELECT
    u.email,
    p.full_name,
    p.role,
    p.kyc_verified,
    p.updated_at
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'joapassy@gmail.com';

-- ✅ Vous devriez voir:
-- email: joapassy@gmail.com
-- role: admin
-- kyc_verified: true
