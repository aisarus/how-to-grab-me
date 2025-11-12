-- Add new mode-free metric columns to optimization_results table
ALTER TABLE public.optimization_results 
ADD COLUMN IF NOT EXISTS judge_votes jsonb,
ADD COLUMN IF NOT EXISTS delta_q numeric,
ADD COLUMN IF NOT EXISTS delta_t numeric,
ADD COLUMN IF NOT EXISTS compactness_percentage numeric,
ADD COLUMN IF NOT EXISTS efficiency_score numeric,
ADD COLUMN IF NOT EXISTS efficiency_percentage numeric,
ADD COLUMN IF NOT EXISTS lambda_tradeoff numeric DEFAULT 0.2;

-- Add comment explaining the new metrics
COMMENT ON COLUMN public.optimization_results.judge_votes IS 'Array of pairwise comparison votes [-1.0 to +1.0] comparing OLD vs NEW prompt';
COMMENT ON COLUMN public.optimization_results.delta_q IS 'Mean of judge_votes, measuring quality change';
COMMENT ON COLUMN public.optimization_results.delta_t IS 'Relative length change: (Tf - Ti) / max(Ti, 1)';
COMMENT ON COLUMN public.optimization_results.compactness_percentage IS '-100 * delta_t';
COMMENT ON COLUMN public.optimization_results.efficiency_score IS 'delta_q - lambda * delta_t';
COMMENT ON COLUMN public.optimization_results.lambda_tradeoff IS 'Tradeoff parameter for efficiency calculation (default 0.2)';