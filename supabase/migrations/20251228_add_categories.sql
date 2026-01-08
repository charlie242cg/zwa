-- Migration: Add Categories System
-- Date: 2025-12-28
-- Description: Add categories table and link products to categories

-- 1. Create categories table
CREATE TABLE public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  icon TEXT, -- Emoji or icon name for display
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add category_id to products table
ALTER TABLE public.products 
ADD COLUMN category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;

-- 3. Add is_affiliate_enabled column if not exists (for affiliation system)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS is_affiliate_enabled BOOLEAN DEFAULT TRUE;

-- 4. Enable RLS on categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for categories
-- Everyone can view active categories
CREATE POLICY "Active categories are viewable by everyone" 
  ON public.categories FOR SELECT 
  USING (is_active = true);

-- Only admins can manage categories (insert, update, delete)
CREATE POLICY "Admins can insert categories" 
  ON public.categories FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update categories" 
  ON public.categories FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete categories" 
  ON public.categories FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 6. Insert default categories
INSERT INTO public.categories (name, icon, display_order, is_active) VALUES
  ('Électronique', '📱', 1, true),
  ('Mode', '👗', 2, true),
  ('Maison', '🏠', 3, true),
  ('Alimentaire', '🍕', 4, true),
  ('Beauté', '💄', 5, true),
  ('Sport', '⚽', 6, true);

-- 7. Create index for better query performance
CREATE INDEX idx_products_category_id ON public.products(category_id);
CREATE INDEX idx_categories_display_order ON public.categories(display_order);
CREATE INDEX idx_categories_is_active ON public.categories(is_active);
