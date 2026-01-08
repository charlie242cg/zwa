-- ============================================
-- AJOUTS AUX TABLES EXISTANTES
-- Date: 2025-12-28
-- ============================================

-- 1. AJOUTER COLONNES À LA TABLE CONVERSATIONS
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS last_message_preview TEXT,
ADD COLUMN IF NOT EXISTS last_sender_id UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS hidden_for_buyer BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS hidden_for_seller BOOLEAN DEFAULT FALSE;

-- 2. AJOUTER COLONNES À LA TABLE MESSAGES
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;

-- 3. CRÉER INDEX POUR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON public.conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON public.messages(conversation_id, is_read, sender_id) WHERE is_read = FALSE;

-- 4. FONCTION TRIGGER AUTO-UPDATE
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET 
    last_message_at = NEW.created_at,
    last_message_preview = LEFT(COALESCE(NEW.content, ''), 100),
    last_sender_id = NEW.sender_id
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. CRÉER TRIGGER
DROP TRIGGER IF EXISTS on_message_sent ON public.messages;
CREATE TRIGGER on_message_sent
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_last_message();

-- 6. REMPLIR DONNÉES EXISTANTES
UPDATE public.conversations c
SET 
  last_message_at = m.created_at,
  last_message_preview = LEFT(COALESCE(m.content, ''), 100),
  last_sender_id = m.sender_id
FROM (
  SELECT DISTINCT ON (conversation_id)
    conversation_id, created_at, content, sender_id
  FROM public.messages
  ORDER BY conversation_id, created_at DESC
) m
WHERE c.id = m.conversation_id;
