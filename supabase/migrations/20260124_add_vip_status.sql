-- Migration: Add VIP Status to Profiles
-- Date: 2026-01-24

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS vip_request_status TEXT CHECK (vip_request_status IN ('pending', 'approved', 'rejected', 'none')) DEFAULT 'none',
ADD COLUMN IF NOT EXISTS social_links TEXT,
ADD COLUMN IF NOT EXISTS is_vip_influencer BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.profiles.vip_request_status IS 'État de la demande VIP: pending, approved, rejected, none';
COMMENT ON COLUMN public.profiles.social_links IS 'Liens réseaux sociaux pour la demande VIP';
