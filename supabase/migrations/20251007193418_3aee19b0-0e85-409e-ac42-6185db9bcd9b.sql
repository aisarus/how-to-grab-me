-- Add erikson_stage column to optimization_results table
ALTER TABLE public.optimization_results
ADD COLUMN IF NOT EXISTS erikson_stage integer;

-- Add comment for documentation
COMMENT ON COLUMN public.optimization_results.erikson_stage IS 'Erikson psychosocial development stage (1-8) used during S-block stabilization, if any';