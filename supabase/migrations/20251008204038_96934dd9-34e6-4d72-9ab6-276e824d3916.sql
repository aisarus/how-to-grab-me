-- Security Fix: Replace shared_results_public view with a secure function-based approach
-- Views cannot have RLS policies, so we implement access control via a SECURITY DEFINER function

-- Drop the existing view
DROP VIEW IF EXISTS public.shared_results_public CASCADE;

-- Create a secure function that enforces access control for shared results
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
    -- Anonymous users: only valid public shares
    (auth.uid() IS NULL AND sr.is_public = true AND (sr.expires_at IS NULL OR sr.expires_at > now()))
    OR
    -- Authenticated users: their own shares (any state) OR valid public shares
    (auth.uid() IS NOT NULL AND (
      sr.user_id = auth.uid()
      OR (sr.is_public = true AND (sr.expires_at IS NULL OR sr.expires_at > now()))
    ));
$$;

COMMENT ON FUNCTION public.get_shared_results_public() IS 
  'Securely retrieves shared results with built-in access control. Anonymous users see only valid public shares; authenticated users see their own shares plus valid public shares. This function enforces security without requiring RLS on views.';

-- Recreate the view as a simple wrapper for backward compatibility
-- This ensures existing code that queries shared_results_public still works
CREATE VIEW public.shared_results_public 
WITH (security_invoker = true) AS
  SELECT * FROM public.get_shared_results_public();

COMMENT ON VIEW public.shared_results_public IS 
  'Backward-compatible view wrapper for get_shared_results_public(). All access control is enforced by the underlying security definer function. Use this view or the function interchangeably - both are secure.';

-- Update the get_public_share function to use the secure function instead of the view
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
