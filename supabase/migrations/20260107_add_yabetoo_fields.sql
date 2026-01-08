-- Migration : Ajouter les champs YabetooPay à la table orders
-- Description : Permet de suivre les intentions de paiement et les URLs de redirection.

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS yabetoo_intent_id TEXT,
ADD COLUMN IF NOT EXISTS yabetoo_payment_url TEXT,
ADD COLUMN IF NOT EXISTS yabetoo_status TEXT DEFAULT 'pending';

-- Ajout d'index pour faciliter la recherche lors des webhooks
CREATE INDEX IF NOT EXISTS idx_orders_yabetoo_intent_id ON public.orders(yabetoo_intent_id);

COMMENT ON COLUMN public.orders.yabetoo_intent_id IS 'ID de l''intention de paiement généré par YabetooPay';
COMMENT ON COLUMN public.orders.yabetoo_payment_url IS 'URL de redirection vers la page de paiement YabetooPay';
COMMENT ON COLUMN public.orders.yabetoo_status IS 'Statut interne du paiement côté Yabetoo';
