-- Requête pour vérifier les données des profils
-- Copier et exécuter dans Supabase SQL Editor pour voir les données

-- Voir tous les vendeurs avec leurs informations de boutique
SELECT
    id,
    role,
    full_name,
    store_name,
    avatar_url,
    store_banner_url,
    store_location
FROM profiles
WHERE role = 'seller'
LIMIT 10;

-- Voir tous les clients (buyers)
SELECT
    id,
    role,
    full_name,
    avatar_url
FROM profiles
WHERE role = 'buyer'
LIMIT 10;

-- Statistiques rapides
SELECT
    role,
    COUNT(*) as total,
    COUNT(store_name) as with_store_name,
    COUNT(avatar_url) as with_avatar
FROM profiles
GROUP BY role;
