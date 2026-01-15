-- Migration pour ajouter les délais d'expiration et d'expédition aux commandes
-- Date: 2026-01-15

-- Ajout des colonnes à la table orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS shipping_timeline TEXT DEFAULT '7 jours';

-- Commentaire pour expliquer l'utilité
COMMENT ON COLUMN orders.expires_at IS 'Date et heure d''expiration du lien de paiement';
COMMENT ON COLUMN orders.shipping_timeline IS 'Délai d''expédition promis par le vendeur (ex: "Immédiat", "3 jours", etc.)';
