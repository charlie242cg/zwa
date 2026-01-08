-- Migration: Add store-related fields to profiles table
-- Date: 2026-01-03
-- Objectif: Ajouter les champs pour les boutiques (nom, logo, bannière, etc.)

-- Ajouter les colonnes pour les informations de boutique
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS store_name TEXT,
ADD COLUMN IF NOT EXISTS store_slug TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS store_banner_url TEXT,
ADD COLUMN IF NOT EXISTS store_bio TEXT,
ADD COLUMN IF NOT EXISTS store_location TEXT,
ADD COLUMN IF NOT EXISTS total_sales_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;

-- Créer un index pour accélérer les recherches par slug
CREATE INDEX IF NOT EXISTS idx_profiles_store_slug ON public.profiles(store_slug);

-- Commentaires
COMMENT ON COLUMN public.profiles.store_name IS 'Nom de la boutique pour les vendeurs';
COMMENT ON COLUMN public.profiles.store_slug IS 'URL slug unique pour la boutique';
COMMENT ON COLUMN public.profiles.store_banner_url IS 'Image de bannière de la boutique';
COMMENT ON COLUMN public.profiles.store_bio IS 'Description de la boutique';
COMMENT ON COLUMN public.profiles.store_location IS 'Localisation de la boutique';
COMMENT ON COLUMN public.profiles.total_sales_count IS 'Nombre total de ventes';
COMMENT ON COLUMN public.profiles.average_rating IS 'Note moyenne de la boutique';
COMMENT ON COLUMN public.profiles.total_reviews IS 'Nombre total d\'avis';
