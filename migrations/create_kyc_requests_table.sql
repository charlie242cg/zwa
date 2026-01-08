-- ============================================
-- TABLE KYC REQUESTS - DEMANDES DE VÉRIFICATION
-- ============================================

-- 1. Créer la table pour les demandes KYC
CREATE TABLE IF NOT EXISTS public.kyc_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    id_card_url TEXT, -- URL de la pièce d'identité
    selfie_with_id_url TEXT, -- URL du selfie avec pièce
    whatsapp_number TEXT,
    notes TEXT, -- Notes du vendeur
    admin_notes TEXT, -- Notes de l'admin (raison rejet, etc.)
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE
);

-- 2. Index pour performance
CREATE INDEX IF NOT EXISTS idx_kyc_requests_seller_id ON public.kyc_requests(seller_id);
CREATE INDEX IF NOT EXISTS idx_kyc_requests_status ON public.kyc_requests(status);

-- 3. RLS (Row Level Security)
ALTER TABLE public.kyc_requests ENABLE ROW LEVEL SECURITY;

-- Les vendeurs peuvent voir uniquement LEURS demandes
DROP POLICY IF EXISTS "Sellers can view their own KYC requests" ON public.kyc_requests;
CREATE POLICY "Sellers can view their own KYC requests"
ON public.kyc_requests FOR SELECT
USING (seller_id = auth.uid());

-- Les vendeurs peuvent créer LEURS propres demandes
DROP POLICY IF EXISTS "Sellers can create their own KYC requests" ON public.kyc_requests;
CREATE POLICY "Sellers can create their own KYC requests"
ON public.kyc_requests FOR INSERT
WITH CHECK (seller_id = auth.uid());

-- Les admins peuvent tout voir et gérer
DROP POLICY IF EXISTS "Admins can manage all KYC requests" ON public.kyc_requests;
CREATE POLICY "Admins can manage all KYC requests"
ON public.kyc_requests FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- 4. Commentaires
COMMENT ON TABLE public.kyc_requests IS 'Demandes de vérification KYC des vendeurs';
COMMENT ON COLUMN public.kyc_requests.status IS 'Statut: pending (en attente), approved (approuvé), rejected (rejeté)';
COMMENT ON COLUMN public.kyc_requests.id_card_url IS 'URL Supabase Storage de la photo de la pièce d''identité';
COMMENT ON COLUMN public.kyc_requests.selfie_with_id_url IS 'URL Supabase Storage du selfie avec pièce';

-- 5. Fonction pour auto-attribuer badge vérifié si profil complet
CREATE OR REPLACE FUNCTION public.check_and_verify_seller()
RETURNS TRIGGER AS $$
BEGIN
  -- Si le vendeur a un profil complet, on lui donne le badge vérifié automatiquement
  IF NEW.store_name IS NOT NULL
     AND NEW.phone_number IS NOT NULL
     AND NEW.avatar_url IS NOT NULL THEN
    NEW.is_verified_seller := true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger sur les updates de profiles
DROP TRIGGER IF EXISTS auto_verify_seller_on_profile_complete ON public.profiles;
CREATE TRIGGER auto_verify_seller_on_profile_complete
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (OLD.role = 'seller' AND NEW.role = 'seller')
  EXECUTE FUNCTION public.check_and_verify_seller();
