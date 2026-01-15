-- Migration: Add stock management system
-- Date: 2026-01-10
-- Description: Add stock_quantity to products table for inventory management

-- 1. Add stock_quantity column (default 0 = unlimited/not tracked)
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;

-- 2. Add updated_at for tracking last modification
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- 3. Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_products_updated_at ON public.products;
CREATE TRIGGER trigger_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION update_products_updated_at();

-- 4. Create index for stock queries (products with stock > 0)
CREATE INDEX IF NOT EXISTS idx_products_in_stock ON public.products(stock_quantity)
WHERE stock_quantity > 0;

-- 5. Function to decrement stock safely (returns true if successful)
CREATE OR REPLACE FUNCTION decrement_product_stock(
    p_product_id UUID,
    p_quantity INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    current_stock INTEGER;
BEGIN
    -- Get current stock with row lock
    SELECT stock_quantity INTO current_stock
    FROM public.products
    WHERE id = p_product_id
    FOR UPDATE;

    -- NULL means unlimited stock
    IF current_stock IS NULL THEN
        RETURN TRUE;
    END IF;

    -- Check if enough stock
    IF current_stock >= p_quantity THEN
        -- Decrement stock
        UPDATE public.products
        SET stock_quantity = stock_quantity - p_quantity
        WHERE id = p_product_id;
        RETURN TRUE;
    ELSE
        -- Not enough stock (includes current_stock < p_quantity, handles 0)
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 6. Grant execute permission
GRANT EXECUTE ON FUNCTION decrement_product_stock TO authenticated;
