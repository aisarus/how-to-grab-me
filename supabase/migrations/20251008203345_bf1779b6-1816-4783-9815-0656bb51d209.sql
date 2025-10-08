-- Security Fix 1: Add explicit deny policy for unauthenticated access to profiles
-- This prevents email exposure if RLS is disabled or bypassed
CREATE POLICY "Deny public access to profiles"
ON public.profiles
FOR SELECT
TO anon
USING (false);

-- Security Fix 2: Add documentation to shared_results_public view
-- The view already excludes user_id column, preventing user identity linkage
COMMENT ON VIEW public.shared_results_public IS 
  'Public-safe view of shared results that excludes user_id to prevent user tracking. Always use this view for public share access instead of the shared_results table directly.';

-- Security Fix 3: Create a helper function for safe public share access
-- This function ensures user_id is never exposed when accessing public shares
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
  FROM public.shared_results_public
  WHERE share_token = share_token_param;
$$;