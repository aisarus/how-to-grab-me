-- Add user_id columns to existing tables
ALTER TABLE public.optimization_results 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.favorite_configs 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop existing public policies
DROP POLICY IF EXISTS "Anyone can view optimization results" ON public.optimization_results;
DROP POLICY IF EXISTS "Anyone can insert optimization results" ON public.optimization_results;
DROP POLICY IF EXISTS "Anyone can view favorite configs" ON public.favorite_configs;
DROP POLICY IF EXISTS "Anyone can insert favorite configs" ON public.favorite_configs;
DROP POLICY IF EXISTS "Anyone can delete favorite configs" ON public.favorite_configs;

-- Create secure RLS policies for optimization_results
CREATE POLICY "Users can view their own optimization results"
ON public.optimization_results
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own optimization results"
ON public.optimization_results
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own optimization results"
ON public.optimization_results
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own optimization results"
ON public.optimization_results
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create secure RLS policies for favorite_configs
CREATE POLICY "Users can view their own favorite configs"
ON public.favorite_configs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorite configs"
ON public.favorite_configs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own favorite configs"
ON public.favorite_configs
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorite configs"
ON public.favorite_configs
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);