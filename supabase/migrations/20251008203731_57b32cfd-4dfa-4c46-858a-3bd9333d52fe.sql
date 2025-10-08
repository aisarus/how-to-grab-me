-- Security Fix: Secure shared_results_public view access via security definer function
-- Since views don't support RLS directly, we create a secure function that enforces access control

-- Drop the existing public view (we'll replace it with a secure function)
DROP VIEW IF EXISTS public.shared_results_public CASCADE;

-- Create a secure function that returns only authorized share data
-- This replaces the view and enforces proper access control
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
    id,
    created_at,
    view_count,
    share_token,
    title,
    description,
    expires_at,
    optimization_result_id,
    is_public
  FROM public.shared_results
  WHERE 
    -- Public users can only see valid public shares
    (
      auth.role() = 'anon' 
      AND is_public = true 
      AND (expires_at IS NULL OR expires_at > now())
    )
    -- Authenticated users can see their own shares + valid public shares
    OR (
      auth.role() = 'authenticated'
      AND (
        user_id = auth.uid()
        OR (is_public = true AND (expires_at IS NULL OR expires_at > now()))
      )
    );
$$;

-- Add helpful documentation
COMMENT ON FUNCTION public.get_shared_results_public() IS 
  'Securely retrieves shared results with proper access control. Anonymous users see only valid public shares; authenticated users see their own shares plus valid public shares. This replaces the shared_results_public view with enforced security.';

-- Recreate the view as a wrapper for backward compatibility with existing code
-- This ensures existing queries to shared_results_public still work
CREATE OR REPLACE VIEW public.shared_results_public 
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