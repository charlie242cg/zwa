-- Migration: Créer table transactions pour l'historique des paiements
-- Date: 2024-12-31

-- Créer la table transactions
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('purchase', 'sale', 'commission', 'withdrawal')),
    amount DECIMAL(10, 2) NOT NULL,
    balance_after DECIMAL(10, 2) NOT NULL,
    order_id UUID REFERENCES public.orders(id),

    -- Détails produit (pour achats/ventes)
    product_name TEXT,
    product_image TEXT,
    quantity INTEGER,
    unit_price DECIMAL(10, 2),

    -- Commission (pour affiliés)
    commission_rate DECIMAL(5, 2),

    -- Retrait (pour tous)
    withdrawal_method TEXT,
    withdrawal_number TEXT,
    withdrawal_fee DECIMAL(10, 2),

    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_order_id ON public.transactions(order_id);

-- RLS Policies
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir leurs propres transactions
CREATE POLICY "Users can view own transactions"
ON public.transactions
FOR SELECT
USING (auth.uid() = user_id);

-- Seul le système peut créer des transactions
CREATE POLICY "Service can create transactions"
ON public.transactions
FOR INSERT
WITH CHECK (true);

-- Empêcher modification
CREATE POLICY "Transactions are read-only"
ON public.transactions
FOR UPDATE
USING (false);

-- Empêcher suppression
CREATE POLICY "Transactions cannot be deleted"
ON public.transactions
FOR DELETE
USING (false);

-- Commentaires
COMMENT ON TABLE public.transactions IS 'Historique complet des transactions financières (achats, ventes, commissions, retraits)';
COMMENT ON COLUMN public.transactions.type IS 'Type de transaction : purchase (achat), sale (vente), commission (affilié), withdrawal (retrait)';
COMMENT ON COLUMN public.transactions.amount IS 'Montant de la transaction (positif pour crédit, négatif pour débit)';
COMMENT ON COLUMN public.transactions.balance_after IS 'Solde du wallet après cette transaction';
COMMENT ON COLUMN public.transactions.product_name IS 'Nom du produit concerné (si applicable)';
COMMENT ON COLUMN public.transactions.product_image IS 'URL de l''image du produit pour factures';
COMMENT ON COLUMN public.transactions.commission_rate IS 'Taux de commission en % (pour transactions affilié)';
COMMENT ON COLUMN public.transactions.withdrawal_method IS 'Méthode de retrait (Mobile Money, Bank, etc.)';
COMMENT ON COLUMN public.transactions.withdrawal_fee IS 'Frais de retrait appliqués';
