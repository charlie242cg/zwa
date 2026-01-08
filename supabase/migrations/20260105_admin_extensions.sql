-- Migration: Admin extensions (Statut transactions, Table Villes, KYC)
-- Date: 2026-01-05

-- 1. Ajout de la colonne status à la table transactions
-- On met 'completed' par défaut pour ne pas impacter les anciennes transactions
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed'
CHECK (status IN ('pending', 'completed', 'rejected'));

-- 2. Ajout de la colonne kyc_verified pour la vérification KYC des vendeurs
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS kyc_verified BOOLEAN DEFAULT false NOT NULL;

-- 3. Création de la table cities
CREATE TABLE IF NOT EXISTS public.cities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Ajout de city_id aux produits
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS city_id UUID REFERENCES public.cities(id) ON DELETE SET NULL;

-- 5. Ajout de city_id aux profils (pour les vendeurs)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS city_id UUID REFERENCES public.cities(id) ON DELETE SET NULL;

-- 6. RLS pour la table cities
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

-- Supprimer les policies existantes si elles existent
DROP POLICY IF EXISTS "Public cities are viewable by everyone" ON public.cities;
DROP POLICY IF EXISTS "Admins can maintain cities" ON public.cities;

-- Lecture publique
CREATE POLICY "Public cities are viewable by everyone"
ON public.cities FOR SELECT
USING (is_active = true);

-- Gestion par Admin uniquement
CREATE POLICY "Admins can maintain cities"
ON public.cities FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Index pour la performance
CREATE INDEX IF NOT EXISTS idx_products_city_id ON public.products(city_id);
CREATE INDEX IF NOT EXISTS idx_profiles_city_id ON public.profiles(city_id);
CREATE INDEX IF NOT EXISTS idx_profiles_kyc_verified ON public.profiles(kyc_verified);
CREATE INDEX IF NOT EXISTS idx_profiles_role_kyc ON public.profiles(role, kyc_verified);

-- Migration du statut pour les retraits existants
UPDATE public.transactions
SET status = 'pending'
WHERE type = 'withdrawal' AND status = 'completed';

-- Les admins sont automatiquement vérifiés
UPDATE public.profiles
SET kyc_verified = true
WHERE role = 'admin';

-- Commentaires
COMMENT ON COLUMN public.transactions.status IS 'État du retrait: pending (en attente), completed (validé), rejected (refusé)';
COMMENT ON COLUMN public.profiles.kyc_verified IS 'Indique si le vendeur a été vérifié par KYC (Know Your Customer). Automatiquement true pour les admins.';
COMMENT ON TABLE public.cities IS 'Villes du Congo pour le filtrage des produits';
