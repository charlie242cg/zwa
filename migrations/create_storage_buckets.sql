-- ============================================
-- SUPABASE STORAGE - BUCKET DOCUMENTS KYC
-- ============================================
-- Date: 05/01/2026
-- Description: Créer le bucket pour stocker les documents KYC

-- 1. Créer le bucket 'documents' (si n'existe pas)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS Policies pour le bucket documents

-- Les vendeurs peuvent uploader LEURS documents KYC
DROP POLICY IF EXISTS "Sellers can upload their KYC documents" ON storage.objects;
CREATE POLICY "Sellers can upload their KYC documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = 'kyc'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- Tout le monde peut voir les documents (public bucket)
DROP POLICY IF EXISTS "Anyone can view documents" ON storage.objects;
CREATE POLICY "Anyone can view documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents');

-- Les vendeurs peuvent mettre à jour LEURS documents
DROP POLICY IF EXISTS "Sellers can update their documents" ON storage.objects;
CREATE POLICY "Sellers can update their documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = 'kyc'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- Les admins peuvent supprimer n'importe quel document
DROP POLICY IF EXISTS "Admins can delete any document" ON storage.objects;
CREATE POLICY "Admins can delete any document"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- ============================================
-- VÉRIFICATION
-- ============================================

SELECT
    'Storage bucket created ✅' as status,
    id,
    name,
    public
FROM storage.buckets
WHERE id = 'documents';

-- ============================================
-- NOTES IMPORTANTES
-- ============================================
-- Structure des fichiers:
-- documents/kyc/{seller_id}_id_card_{timestamp}.jpg
-- documents/kyc/{seller_id}_selfie_{timestamp}.jpg
--
-- Exemple:
-- documents/kyc/abc123_id_card_1704461234567.jpg
-- documents/kyc/abc123_selfie_1704461234589.jpg
-- ============================================
