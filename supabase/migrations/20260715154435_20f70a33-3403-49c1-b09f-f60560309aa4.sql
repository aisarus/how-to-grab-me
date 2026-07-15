
-- 1. profiles: convert the ineffective permissive "deny anon" policy into a RESTRICTIVE one.
-- A PERMISSIVE policy with USING (false) does nothing because permissive policies are OR'd.
DROP POLICY IF EXISTS "Deny public access to profiles" ON public.profiles;
CREATE POLICY "Deny anon access to profiles"
  ON public.profiles
  AS RESTRICTIVE
  FOR SELECT
  TO anon
  USING (false);

-- Also revoke any anon table grant to be defensive.
REVOKE ALL ON public.profiles FROM anon;

-- 2. data-room-documents storage bucket: remove the overly broad
-- "any authenticated user can access anything in this bucket" policies.
-- The per-folder policies (auth.uid() == first path segment) remain.
DROP POLICY IF EXISTS "Authenticated users can view data room documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload data room documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update data room documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete data room documents" ON storage.objects;

-- 3. shared_results: drop the direct public SELECT policy on the base table so
-- callers can't join through to sensitive columns (user_id, etc.). Public
-- consumers must go through the existing security-definer RPCs
-- get_public_share / get_shared_results_public, which only expose safe columns.
DROP POLICY IF EXISTS "Public shares are viewable by anyone" ON public.shared_results;

-- Revoke anon grant on the base table to enforce the RPC-only path.
REVOKE ALL ON public.shared_results FROM anon;

-- Ensure the public RPCs remain callable by anon (they are SECURITY DEFINER).
GRANT EXECUTE ON FUNCTION public.get_public_share(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_shared_results_public() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_share_view_count(text) TO anon, authenticated;
