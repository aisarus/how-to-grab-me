-- Rename quality_improvement_score to reasoning_gain_index
ALTER TABLE public.optimization_results 
RENAME COLUMN quality_improvement_score TO reasoning_gain_index;

-- Add comment explaining the new metric
COMMENT ON COLUMN public.optimization_results.reasoning_gain_index IS 'Reasoning Gain Index (RGI): Quality improvement per additional token, calculated as (NewScore - OldScore) / max((FinalTokens - InitialTokens), ε)';