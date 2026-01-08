-- Ajouter le champ phone_number à la table profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone_number TEXT;

COMMENT ON COLUMN public.profiles.phone_number IS 'Numéro de téléphone du vendeur (affiché sur la boutique)';
