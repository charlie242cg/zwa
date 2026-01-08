-- Migration: Add status column to affiliate_links
-- Date: 2026-01-04
-- Description: Add status management to affiliate links (active/paused/archived)

-- ============================================
-- ADD STATUS COLUMN
-- ============================================

-- Add status column with default 'active'
ALTER TABLE affiliate_links
ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived'));

-- ============================================
-- UPDATE EXISTING RECORDS
-- ============================================

-- Set all existing links to 'active'
UPDATE affiliate_links
SET status = 'active'
WHERE status IS NULL;

-- ============================================
-- CREATE INDEX FOR PERFORMANCE
-- ============================================

-- Index on (affiliate_id, status) for faster queries
CREATE INDEX idx_affiliate_links_status ON affiliate_links(affiliate_id, status);

-- ============================================
-- DONE! Status column added to affiliate_links
-- ============================================
