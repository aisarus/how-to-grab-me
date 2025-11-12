-- Add new columns to optimization_results for module controls and priority scoring
ALTER TABLE public.optimization_results
ADD COLUMN IF NOT EXISTS priority_score numeric,
ADD COLUMN IF NOT EXISTS optimized_by_default boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS smart_queue_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS explain_mode_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS versioning_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS cumulative_explanation text;

-- Create prompt_versions table for versioning and review system
CREATE TABLE IF NOT EXISTS public.prompt_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  optimization_result_id uuid REFERENCES public.optimization_results(id) ON DELETE CASCADE,
  original_id text NOT NULL,
  new_id text NOT NULL,
  iteration_number integer NOT NULL,
  previous_content_hash text,
  content_hash text NOT NULL,
  prompt_content text NOT NULL,
  reviewer_action text DEFAULT 'pending' CHECK (reviewer_action IN ('pending', 'accept', 'reject', 'rollback')),
  timestamp timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Create prompt_explanations table for explain mode
CREATE TABLE IF NOT EXISTS public.prompt_explanations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  optimization_result_id uuid REFERENCES public.optimization_results(id) ON DELETE CASCADE,
  version_id uuid REFERENCES public.prompt_versions(id) ON DELETE CASCADE,
  iteration_number integer NOT NULL,
  main_issues text[],
  key_transformations text[],
  expected_effects text[],
  full_explanation text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_prompt_versions_optimization_result 
  ON public.prompt_versions(optimization_result_id);
CREATE INDEX IF NOT EXISTS idx_prompt_versions_new_id 
  ON public.prompt_versions(new_id);
CREATE INDEX IF NOT EXISTS idx_prompt_explanations_optimization_result 
  ON public.prompt_explanations(optimization_result_id);
CREATE INDEX IF NOT EXISTS idx_prompt_explanations_version 
  ON public.prompt_explanations(version_id);

-- Enable RLS
ALTER TABLE public.prompt_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_explanations ENABLE ROW LEVEL SECURITY;

-- RLS policies for prompt_versions
CREATE POLICY "Users can view their own prompt versions"
  ON public.prompt_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.optimization_results
      WHERE optimization_results.id = prompt_versions.optimization_result_id
      AND optimization_results.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own prompt versions"
  ON public.prompt_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.optimization_results
      WHERE optimization_results.id = prompt_versions.optimization_result_id
      AND optimization_results.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own prompt versions"
  ON public.prompt_versions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.optimization_results
      WHERE optimization_results.id = prompt_versions.optimization_result_id
      AND optimization_results.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own prompt versions"
  ON public.prompt_versions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.optimization_results
      WHERE optimization_results.id = prompt_versions.optimization_result_id
      AND optimization_results.user_id = auth.uid()
    )
  );

-- RLS policies for prompt_explanations
CREATE POLICY "Users can view their own prompt explanations"
  ON public.prompt_explanations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.optimization_results
      WHERE optimization_results.id = prompt_explanations.optimization_result_id
      AND optimization_results.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own prompt explanations"
  ON public.prompt_explanations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.optimization_results
      WHERE optimization_results.id = prompt_explanations.optimization_result_id
      AND optimization_results.user_id = auth.uid()
    )
  );