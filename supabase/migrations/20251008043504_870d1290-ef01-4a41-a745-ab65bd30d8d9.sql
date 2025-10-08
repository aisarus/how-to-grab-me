-- Fix security definer view issue
-- Enable SECURITY INVOKER mode on the shared_results_public view
ALTER VIEW public.shared_results_public SET (security_invoker = on);