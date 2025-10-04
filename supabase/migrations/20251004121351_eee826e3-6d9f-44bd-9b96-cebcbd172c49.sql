-- Create table for favorite configurations
CREATE TABLE public.favorite_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  a_parameter NUMERIC NOT NULL,
  b_parameter NUMERIC NOT NULL,
  max_iterations INTEGER NOT NULL,
  convergence_threshold NUMERIC NOT NULL,
  use_efmnb BOOLEAN NOT NULL DEFAULT true,
  use_erikson BOOLEAN NOT NULL DEFAULT true,
  use_proposer_critic_verifier BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE public.favorite_configs ENABLE ROW LEVEL SECURITY;

-- Anyone can view favorite configs
CREATE POLICY "Anyone can view favorite configs"
ON public.favorite_configs
FOR SELECT
USING (true);

-- Anyone can insert favorite configs
CREATE POLICY "Anyone can insert favorite configs"
ON public.favorite_configs
FOR INSERT
WITH CHECK (true);

-- Anyone can delete favorite configs
CREATE POLICY "Anyone can delete favorite configs"
ON public.favorite_configs
FOR DELETE
USING (true);