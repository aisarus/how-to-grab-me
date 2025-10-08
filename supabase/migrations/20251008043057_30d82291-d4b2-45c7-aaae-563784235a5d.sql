-- PHASE 1: CRITICAL SECURITY FIXES

-- Fix 1: Email Harvesting Vulnerability in profiles table
-- Drop old policy and create restrictive one for authenticated users only
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Revoke all public/anonymous access to profiles
REVOKE SELECT ON public.profiles FROM anon;
REVOKE SELECT ON public.profiles FROM public;

-- Create restrictive policy for authenticated users only
CREATE POLICY "Authenticated users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Fix 2: Function Search Path Immutability
-- Update handle_new_user function with immutable search path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

-- Update increment_share_view_count function with immutable search path
CREATE OR REPLACE FUNCTION public.increment_share_view_count(share_token_param text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  UPDATE public.shared_results
  SET view_count = view_count + 1
  WHERE share_token = share_token_param
    AND is_public = true
    AND (expires_at IS NULL OR expires_at > now());
END;
$$;

-- Fix 3: Protect User IDs in shared_results
-- Create a public view that excludes user_id to prevent user enumeration
CREATE OR REPLACE VIEW public.shared_results_public AS
SELECT 
  id,
  created_at,
  description,
  expires_at,
  is_public,
  optimization_result_id,
  share_token,
  title,
  view_count
FROM public.shared_results
WHERE is_public = true 
  AND (expires_at IS NULL OR expires_at > now());

-- Grant SELECT on the view to anon and authenticated roles
GRANT SELECT ON public.shared_results_public TO anon;
GRANT SELECT ON public.shared_results_public TO authenticated;