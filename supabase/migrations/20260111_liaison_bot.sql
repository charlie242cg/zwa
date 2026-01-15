-- Migration: Liaison Bot and Checkout Fields
-- Date: 2026-01-11

-- 1. Add fields to Orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS buyer_phone TEXT,
ADD COLUMN IF NOT EXISTS delivery_location TEXT;

-- 2. Function to automatically initiate liaison message in chat
CREATE OR REPLACE FUNCTION public.fn_initiate_liaison_chat()
RETURNS TRIGGER AS $$
DECLARE
    v_conversation_id UUID;
    v_product_name TEXT;
    v_buyer_name TEXT;
    v_bot_message TEXT;
BEGIN
    -- Only trigger when status changes to 'paid'
    IF (OLD.status = 'pending' AND NEW.status = 'paid') THEN
        
        -- Get product name
        SELECT name INTO v_product_name FROM public.products WHERE id = NEW.product_id;
        -- Get buyer name
        SELECT full_name INTO v_buyer_name FROM public.profiles WHERE id = NEW.buyer_id;

        -- Check if a conversation already exists between these two for this product
        -- or create a new one
        SELECT id INTO v_conversation_id 
        FROM public.conversations 
        WHERE buyer_id = NEW.buyer_id AND seller_id = NEW.seller_id
        LIMIT 1;

        IF v_conversation_id IS NULL THEN
            INSERT INTO public.conversations (buyer_id, seller_id, product_id)
            VALUES (NEW.buyer_id, NEW.seller_id, NEW.product_id)
            RETURNING id INTO v_conversation_id;
        END IF;

        -- Construct the bot message with clickable links
        -- Using HTML-like format that the frontend can parse or render
        v_bot_message := '🤖 **Message Automatique Zwa** : ' || chr(10) ||
            '✅ Paiement confirmé ! L''argent est bloqué et sécurisé.' || chr(10) || chr(10) ||
            '📦 **Commande** : ' || v_product_name || ' (x' || NEW.quantity || ')' || chr(10) ||
            '📞 **Contact Acheteur** : ' || COALESCE(NEW.buyer_phone, 'Non renseigné') || chr(10) ||
            '📍 **Lieu** : ' || COALESCE(NEW.delivery_location, 'À fixer') || chr(10) || chr(10) ||
            '👉 Vendeur, vous pouvez contacter le client ici : ' || chr(10) ||
            '[Appeler Directement](tel:' || COALESCE(NEW.buyer_phone, '') || ') | ' ||
            '[Discuter sur WhatsApp](https://wa.me/' || REPLACE(REPLACE(COALESCE(NEW.buyer_phone, ''), ' ', ''), '+', '') || ')';

        -- Insert the message into the conversation
        -- We use NULL as sender_id to signify a system/bot message or 
        -- we can use the buyer_id if we want it to come from the 'purchase' action
        INSERT INTO public.messages (conversation_id, sender_id, content)
        VALUES (v_conversation_id, NULL, v_bot_message);

    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the Trigger
DROP TRIGGER IF EXISTS tr_order_liaison_bot ON public.orders;
CREATE TRIGGER tr_order_liaison_bot
    AFTER UPDATE OF status ON public.orders
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION public.fn_initiate_liaison_chat();
