-- Create shared_results table for sharing optimized prompts
CREATE TABLE IF NOT EXISTS public.shared_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  optimization_result_id UUID NOT NULL,
  share_token TEXT NOT NULL UNIQUE,
  title TEXT,
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT fk_user
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_optimization_result
    FOREIGN KEY (optimization_result_id)
    REFERENCES public.optimization_results(id)
    ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.shared_results ENABLE ROW LEVEL SECURITY;

-- Users can view their own shares
CREATE POLICY "Users can view their own shares"
ON public.shared_results
FOR SELECT
USING (auth.uid() = user_id);

-- Anyone can view public shares (if not expired)
CREATE POLICY "Public shares are viewable by anyone"
ON public.shared_results
FOR SELECT
USING (
  is_public = true 
  AND (expires_at IS NULL OR expires_at > now())
);

-- Users can create their own shares
CREATE POLICY "Users can create their own shares"
ON public.shared_results
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own shares
CREATE POLICY "Users can update their own shares"
ON public.shared_results
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own shares
CREATE POLICY "Users can delete their own shares"
ON public.shared_results
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster lookups by share_token
CREATE INDEX idx_shared_results_share_token ON public.shared_results(share_token);

-- Create index for faster lookups by user_id
CREATE INDEX idx_shared_results_user_id ON public.shared_results(user_id);

-- Function to increment view count
CREATE OR REPLACE FUNCTION public.increment_share_view_count(share_token_param TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.shared_results
  SET view_count = view_count + 1
  WHERE share_token = share_token_param
    AND is_public = true
    AND (expires_at IS NULL OR expires_at > now());
END;
$$;