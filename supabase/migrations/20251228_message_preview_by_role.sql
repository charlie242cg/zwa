-- ============================================
-- MIGRATION : Aperçu Messages par Rôle
-- Date: 2025-12-28
-- Description: Ajoute colonnes séparées pour acheteur/vendeur
-- ============================================

-- 1. AJOUTER NOUVELLES COLONNES
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS last_message_for_buyer TEXT,
ADD COLUMN IF NOT EXISTS last_message_for_seller TEXT,
ADD COLUMN IF NOT EXISTS last_message_for_buyer_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_message_for_seller_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_media_type_for_buyer VARCHAR(10),
ADD COLUMN IF NOT EXISTS last_media_type_for_seller VARCHAR(10);

-- 2. SUPPRIMER ANCIEN TRIGGER
DROP TRIGGER IF EXISTS on_message_sent ON public.messages;
DROP FUNCTION IF EXISTS update_conversation_last_message();

-- 3. CRÉER NOUVELLE FONCTION TRIGGER
CREATE OR REPLACE FUNCTION update_conversation_last_message_v2()
RETURNS TRIGGER AS $$
DECLARE
    conv RECORD;
BEGIN
    -- Récupérer la conversation
    SELECT buyer_id, seller_id INTO conv
    FROM public.conversations
    WHERE id = NEW.conversation_id;
    
    -- Si message du vendeur → Mettre à jour aperçu pour acheteur
    IF NEW.sender_id = conv.seller_id THEN
        UPDATE public.conversations
        SET 
            last_message_for_buyer = CASE 
                WHEN NEW.content IS NOT NULL AND NEW.content != '' 
                THEN LEFT(NEW.content, 100)
                ELSE NULL
            END,
            last_message_for_buyer_at = NEW.created_at,
            last_media_type_for_buyer = NEW.media_type
        WHERE id = NEW.conversation_id;
    END IF;
    
    -- Si message de l'acheteur → Mettre à jour aperçu pour vendeur
    IF NEW.sender_id = conv.buyer_id THEN
        UPDATE public.conversations
        SET 
            last_message_for_seller = CASE 
                WHEN NEW.content IS NOT NULL AND NEW.content != '' 
                THEN LEFT(NEW.content, 100)
                ELSE NULL
            END,
            last_message_for_seller_at = NEW.created_at,
            last_media_type_for_seller = NEW.media_type
        WHERE id = NEW.conversation_id;
    END IF;
    
    -- Garder aussi last_message_at pour tri général
    UPDATE public.conversations
    SET last_message_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. CRÉER NOUVEAU TRIGGER
CREATE TRIGGER on_message_sent
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_last_message_v2();

-- 5. BACKFILL DONNÉES EXISTANTES
UPDATE public.conversations c
SET 
    -- Dernier message du vendeur pour l'acheteur
    last_message_for_buyer = (
        SELECT LEFT(COALESCE(content, ''), 100)
        FROM public.messages
        WHERE conversation_id = c.id 
          AND sender_id = c.seller_id
        ORDER BY created_at DESC
        LIMIT 1
    ),
    last_message_for_buyer_at = (
        SELECT created_at
        FROM public.messages
        WHERE conversation_id = c.id 
          AND sender_id = c.seller_id
        ORDER BY created_at DESC
        LIMIT 1
    ),
    last_media_type_for_buyer = (
        SELECT media_type
        FROM public.messages
        WHERE conversation_id = c.id 
          AND sender_id = c.seller_id
        ORDER BY created_at DESC
        LIMIT 1
    ),
    -- Dernier message de l'acheteur pour le vendeur
    last_message_for_seller = (
        SELECT LEFT(COALESCE(content, ''), 100)
        FROM public.messages
        WHERE conversation_id = c.id 
          AND sender_id = c.buyer_id
        ORDER BY created_at DESC
        LIMIT 1
    ),
    last_message_for_seller_at = (
        SELECT created_at
        FROM public.messages
        WHERE conversation_id = c.id 
          AND sender_id = c.buyer_id
        ORDER BY created_at DESC
        LIMIT 1
    ),
    last_media_type_for_seller = (
        SELECT media_type
        FROM public.messages
        WHERE conversation_id = c.id 
          AND sender_id = c.buyer_id
        ORDER BY created_at DESC
        LIMIT 1
    );

-- 6. CRÉER INDEX POUR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_conversations_buyer_message_at 
ON public.conversations(last_message_for_buyer_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_conversations_seller_message_at 
ON public.conversations(last_message_for_seller_at DESC NULLS LAST);

-- 7. COMMENTAIRES
COMMENT ON COLUMN public.conversations.last_message_for_buyer IS 'Dernier message du vendeur visible par l''acheteur';
COMMENT ON COLUMN public.conversations.last_message_for_seller IS 'Dernier message de l''acheteur visible par le vendeur';
COMMENT ON COLUMN public.conversations.last_media_type_for_buyer IS 'Type de média (image/video) du dernier message pour acheteur';
COMMENT ON COLUMN public.conversations.last_media_type_for_seller IS 'Type de média (image/video) du dernier message pour vendeur';

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================
