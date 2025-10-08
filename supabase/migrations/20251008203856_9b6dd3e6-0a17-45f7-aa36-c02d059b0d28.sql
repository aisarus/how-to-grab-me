-- Security Fix: Replace shared_results_public view with a security definer function
-- Views in PostgreSQL don't support RLS, so we use a function with built-in access control

-- Drop the existing view that has no access control
DROP VIEW IF EXISTS public.shared_results_public CASCADE;

-- Create a security definer function that enforces access control
CREATE OR REPLACE FUNCTION public.get_shared_results_public()
RETURNS TABLE (
  id uuid,
  created_at timestamp with time zone,
  view_count integer,
  share_token text,
  title text,
  description text,
  expires_at timestamp with time zone,
  optimization_result_id uuid,
  is_public boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- For anonymous users: only return valid, non-expired public shares
  -- For authenticated users: return their own shares + valid public shares
  SELECT 
    sr.id,
    sr.created_at,
    sr.view_count,
    sr.share_token,
    sr.title,
    sr.description,
    sr.expires_at,
    sr.optimization_result_id,
    sr.is_public
  FROM public.shared_results sr
  WHERE 
    -- Public shares that are valid and not expired
    (sr.is_public = true AND (sr.expires_at IS NULL OR sr.expires_at > now()))
    OR
    -- User's own shares (if authenticated)
    (auth.uid() IS NOT NULL AND sr.user_id = auth.uid());
$$;

-- Add helpful documentation
COMMENT ON FUNCTION public.get_shared_results_public() IS 
  'Securely retrieves shared results with proper access control. Anonymous users see only valid public shares; authenticated users see their own shares plus valid public shares. This replaces the shared_results_public view to enforce security without RLS on views.';

-- Recreate the view as a simple wrapper for backward compatibility
-- This ensures existing code that queries shared_results_public still works
CREATE VIEW public.shared_results_public 
WITH (security_barrier = true) AS
  SELECT * FROM public.get_shared_results_public();

-- Update the existing get_public_share function to use the secure function
CREATE OR REPLACE FUNCTION public.get_public_share(share_token_param text)
RETURNS TABLE (
  id uuid,
  created_at timestamp with time zone,
  view_count integer,
  share_token text,
  title text,
  description text,
  expires_at timestamp with time zone,
  optimization_result_id uuid,
  is_public boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    created_at,
    view_count,
    share_token,
    title,
    description,
    expires_at,
    optimization_result_id,
    is_public
  FROM public.get_shared_results_public()
  WHERE share_token = share_token_param;
$$;