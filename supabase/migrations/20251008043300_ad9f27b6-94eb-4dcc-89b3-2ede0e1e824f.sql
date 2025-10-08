-- Fix security definer view warning
-- Drop and recreate the view with security_invoker option
DROP VIEW IF EXISTS public.shared_results_public;

CREATE VIEW public.shared_results_public 
WITH (security_invoker = true)
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

-- Re-grant SELECT permissions
GRANT SELECT ON public.shared_results_public TO anon;
GRANT SELECT ON public.shared_results_public TO authenticated;