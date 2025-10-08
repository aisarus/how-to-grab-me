-- Fix: Change the wrapper view to use security_invoker
-- The underlying function get_shared_results_public() is security definer (intentional)
-- but the view wrapper should be security invoker to respect the function's built-in access control

DROP VIEW IF EXISTS public.shared_results_public;

CREATE VIEW public.shared_results_public 
WITH (security_invoker = true) AS
  SELECT * FROM public.get_shared_results_public();

COMMENT ON VIEW public.shared_results_public IS 
  'Backward-compatible view wrapper for get_shared_results_public(). Uses security_invoker to respect the underlying function''s access control logic.';