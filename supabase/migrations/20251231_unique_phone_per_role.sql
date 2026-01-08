-- Migration: Contrainte unique phone_number par rôle
-- Date: 2024-12-31
-- Objectif: Empêcher les doublons de numéro sur le même rôle
--          Mais permettre le même numéro sur différents rôles (buyer, seller, affiliate)

-- Supprimer l'ancienne contrainte si elle existe
DROP INDEX IF EXISTS unique_phone_per_role;

-- Créer contrainte unique composite (phone_number, role)
CREATE UNIQUE INDEX unique_phone_per_role
ON public.profiles(phone_number, role)
WHERE phone_number IS NOT NULL;

COMMENT ON INDEX unique_phone_per_role IS
'Contrainte unique: un numéro de téléphone ne peut être utilisé qu''une seule fois par type de compte.
Exemples:
- ✅ +242 06 123 1244 sur 1 buyer + 1 seller + 1 affiliate = OK
- ❌ +242 06 123 1244 sur 2 sellers différents = ERREUR
Objectif: Prévenir les comptes inactifs multiples avec le même numéro';
