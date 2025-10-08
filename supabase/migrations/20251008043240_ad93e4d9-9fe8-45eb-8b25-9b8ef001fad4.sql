-- Fix security definer view issue
-- Drop and recreate the view with SECURITY INVOKER mode
DROP VIEW IF EXISTS public.shared_results_public;

CREATE VIEW public.shared_results_public
WITH (security_invoker=on)
AS
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