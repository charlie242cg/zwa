-- Migration: Fix RLS Policies for Profiles Table
-- Date: 2025-12-31
-- Objectif: Permettre aux utilisateurs de lire leur propre profil

-- Drop existing policies (if any)
DROP POLICY IF EXISTS "Users can read their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can read their own profile
CREATE POLICY "Users can read their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Policy 2: Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- Policy 3: Public profiles are viewable by everyone (for store pages)
CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles
FOR SELECT
USING (true);

-- Grant access to authenticated users
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE ON public.profiles TO authenticated;

-- Comment
COMMENT ON POLICY "Users can read their own profile" ON public.profiles IS
'Allows users to read their own profile data';

COMMENT ON POLICY "Users can update their own profile" ON public.profiles IS
'Allows users to update their own profile data';

COMMENT ON POLICY "Public profiles are viewable by everyone" ON public.profiles IS
'Allows anyone to view public profile information for store pages and product listings';
