-- Migration: Global Platform Settings
-- Date: 2026-01-05
-- Description: Table pour stocker les paramètres globaux de la plateforme

-- 1. Création de la table global_settings
CREATE TABLE IF NOT EXISTS public.global_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    commission_rate NUMERIC(5,2) DEFAULT 5.00 NOT NULL CHECK (commission_rate >= 0 AND commission_rate <= 100),
    aggregator_rate NUMERIC(5,2) DEFAULT 2.00 NOT NULL CHECK (aggregator_rate >= 0 AND aggregator_rate <= 100),
    withdrawal_min NUMERIC(12,2) DEFAULT 5000.00 NOT NULL CHECK (withdrawal_min >= 0),
    withdrawal_max NUMERIC(12,2) DEFAULT 1000000.00 NOT NULL CHECK (withdrawal_max >= withdrawal_min),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 2. Insertion des valeurs par défaut (une seule ligne de settings)
INSERT INTO public.global_settings (commission_rate, aggregator_rate, withdrawal_min, withdrawal_max)
VALUES (5.00, 2.00, 5000.00, 1000000.00)
ON CONFLICT (id) DO NOTHING;

-- 3. RLS (Row Level Security)
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

-- Supprimer les policies existantes si elles existent
DROP POLICY IF EXISTS "Settings are viewable by everyone" ON public.global_settings;
DROP POLICY IF EXISTS "Only admins can update settings" ON public.global_settings;

-- Lecture publique (tous peuvent voir les taux)
CREATE POLICY "Settings are viewable by everyone"
ON public.global_settings FOR SELECT
USING (true);

-- Modification uniquement par les admins
CREATE POLICY "Only admins can update settings"
ON public.global_settings FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- 4. Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_global_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer le trigger existant s'il existe
DROP TRIGGER IF EXISTS trigger_update_global_settings_timestamp ON public.global_settings;

CREATE TRIGGER trigger_update_global_settings_timestamp
BEFORE UPDATE ON public.global_settings
FOR EACH ROW
EXECUTE FUNCTION update_global_settings_updated_at();

-- 5. Commentaires
COMMENT ON TABLE public.global_settings IS 'Paramètres globaux de la plateforme Zwa (commission, limites de retrait)';
COMMENT ON COLUMN public.global_settings.commission_rate IS 'Taux de commission Zwa en pourcentage (0-100)';
COMMENT ON COLUMN public.global_settings.aggregator_rate IS 'Taux des frais d''agrégateur Mobile Money en pourcentage (0-100)';
COMMENT ON COLUMN public.global_settings.withdrawal_min IS 'Montant minimum de retrait autorisé en FCFA';
COMMENT ON COLUMN public.global_settings.withdrawal_max IS 'Montant maximum de retrait autorisé en FCFA';
