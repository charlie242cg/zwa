-- Migration: Add Notifications System and Delivery OTP
-- Date: 2026-01-11

-- 1. Update Orders table for OTP tracking
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS delivery_otp_hash TEXT,
ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP WITH TIME ZONE;

-- 2. Create Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'system', -- 'order_status', 'wallet', 'system'
    link TEXT, -- URL or path to redirect
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable RLS on Notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications (mark as read)"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Function to notify on order status change
CREATE OR REPLACE FUNCTION public.fn_notify_on_order_status_change()
RETURNS TRIGGER AS $$
DECLARE
    buyer_name TEXT;
    product_name TEXT;
    seller_name TEXT;
    commission_val DECIMAL;
BEGIN
    -- Get some data for better messages
    SELECT full_name INTO buyer_name FROM public.profiles WHERE id = NEW.buyer_id;
    SELECT name INTO product_name FROM public.products WHERE id = NEW.product_id;
    SELECT store_name INTO seller_name FROM public.profiles WHERE id = NEW.seller_id;

    -- CASE 1: Order PAID
    IF (OLD.status = 'pending' AND NEW.status = 'paid') THEN
        -- Notify Seller
        INSERT INTO public.notifications (user_id, title, message, type, link)
        VALUES (
            NEW.seller_id,
            '🎉 Nouvelle vente !',
            'Commande #' || substring(NEW.id::text, 1, 8) || ' de ' || COALESCE(buyer_name, 'un client') || ' (' || NEW.amount || ' FCFA).',
            'order_status',
            '/seller/dashboard'
        );

        -- Notify Buyer
        INSERT INTO public.notifications (user_id, title, message, type, link)
        VALUES (
            NEW.buyer_id,
            '✅ Paiement confirmé',
            'Votre commande pour ' || product_name || ' a été payée avec succès.',
            'order_status',
            '/orders'
        );

        -- Notify Affiliate (if exists)
        IF NEW.affiliate_id IS NOT NULL THEN
            INSERT INTO public.notifications (user_id, title, message, type, link)
            VALUES (
                NEW.affiliate_id,
                '💰 Nouvelle commission en attente',
                'Bravo ! Une vente a été réalisée via votre lien. Gain potentiel : ' || COALESCE(NEW.commission_amount, 0) || ' FCFA.',
                'wallet',
                '/affiliate/dashboard'
            );
        END IF;
    END IF;

    -- CASE 2: Order SHIPPED
    IF (OLD.status = 'paid' AND NEW.status = 'shipped') THEN
        -- Notify Buyer
        INSERT INTO public.notifications (user_id, title, message, type, link)
        VALUES (
            NEW.buyer_id,
            '🚀 Commande expédiée !',
            'Votre colis est en route. Votre code de retrait est disponible dans vos achats.',
            'order_status',
            '/orders'
        );
    END IF;

    -- CASE 3: Order DELIVERED
    IF (OLD.status = 'shipped' AND NEW.status = 'delivered') THEN
        -- Notify Buyer
        INSERT INTO public.notifications (user_id, title, message, type, link)
        VALUES (
            NEW.buyer_id,
            '🎁 Livraison réussie',
            'Votre commande a été livrée. N''oubliez pas de laisser un avis sur le produit !',
            'order_status',
            '/orders'
        );
        
        -- Notify Seller (Money unblocked)
        INSERT INTO public.notifications (user_id, title, message, type, link)
        VALUES (
            NEW.seller_id,
            '💸 Fonds débloqués',
            'La livraison de la commande #' || substring(NEW.id::text, 1, 8) || ' est validée. Vos fonds sont disponibles.',
            'wallet',
            '/seller/dashboard'
        );
        
        -- Notify Affiliate (Commission unblocked)
        IF NEW.affiliate_id IS NOT NULL THEN
            INSERT INTO public.notifications (user_id, title, message, type, link)
            VALUES (
                NEW.affiliate_id,
                '💵 Commission confirmée',
                'La vente est finalisée. Votre commission de ' || COALESCE(NEW.commission_amount, 0) || ' FCFA a été ajoutée à votre portefeuille.',
                'wallet',
                '/affiliate/dashboard'
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create the Trigger
DROP TRIGGER IF EXISTS tr_order_status_notification ON public.orders;
CREATE TRIGGER tr_order_status_notification
    AFTER UPDATE OF status ON public.orders
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION public.fn_notify_on_order_status_change();

-- 6. Grant basic permissions
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
