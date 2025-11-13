-- Fix function search_path mutable issues
-- Update all security definer functions to have fixed search_path

-- 1. Fix handle_new_user function
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

-- 2. Fix increment_share_view_count function
DROP FUNCTION IF EXISTS public.increment_share_view_count(text) CASCADE;
CREATE OR REPLACE FUNCTION public.increment_share_view_count(share_token_param text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.shared_results
  SET view_count = view_count + 1
  WHERE share_token = share_token_param
    AND is_public = true
    AND (expires_at IS NULL OR expires_at > now());
END;
$$;

-- 3. Fix get_public_share function
DROP FUNCTION IF EXISTS public.get_public_share(text) CASCADE;
CREATE OR REPLACE FUNCTION public.get_public_share(share_token_param text)
RETURNS TABLE(
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
  FROM public.get_shared_results_public() sr
  WHERE sr.share_token = share_token_param;
$$;

-- 4. Fix get_shared_results_public function
DROP FUNCTION IF EXISTS public.get_shared_results_public() CASCADE;
CREATE OR REPLACE FUNCTION public.get_shared_results_public()
RETURNS TABLE(
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

-- Drop the shared_results_public table as it's redundant
-- The get_shared_results_public() function already provides this functionality securely
DROP TABLE IF EXISTS public.shared_results_public CASCADE;