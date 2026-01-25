-- Migration: Create KYC Requests Table
-- Date: 2026-01-24

CREATE TABLE IF NOT EXISTS public.kyc_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID REFERENCES public.profiles(id) NOT NULL,
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    id_card_url TEXT NOT NULL,
    selfie_with_id_url TEXT NOT NULL,
    whatsapp_number TEXT NOT NULL,
    notes TEXT,
    admin_notes TEXT,
    reviewed_by UUID REFERENCES public.profiles(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE public.kyc_requests ENABLE ROW LEVEL SECURITY;

-- Sellers can see their own requests
CREATE POLICY "Sellers can view own kyc requests"
ON public.kyc_requests FOR SELECT
USING (auth.uid() = seller_id);

-- Sellers can insert their own requests
CREATE POLICY "Sellers can create kyc requests"
ON public.kyc_requests FOR INSERT
WITH CHECK (auth.uid() = seller_id);

-- Sellers can update their own PENDING requests (resubmit)
CREATE POLICY "Sellers can update pending kyc requests"
ON public.kyc_requests FOR UPDATE
USING (auth.uid() = seller_id AND status IN ('pending', 'rejected'));

-- Admins can view all requests
CREATE POLICY "Admins can view all kyc requests"
ON public.kyc_requests FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Admins can update all requests (approve/reject)
CREATE POLICY "Admins can update kyc requests"
ON public.kyc_requests FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_kyc_requests_seller_id ON public.kyc_requests(seller_id);
CREATE INDEX IF NOT EXISTS idx_kyc_requests_status ON public.kyc_requests(status);
