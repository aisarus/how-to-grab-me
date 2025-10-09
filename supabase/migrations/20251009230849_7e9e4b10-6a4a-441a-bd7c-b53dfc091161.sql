-- Add telemetry fields for Success@1 tracking to optimization_results table

ALTER TABLE public.optimization_results
ADD COLUMN accepted boolean DEFAULT false,
ADD COLUMN accepted_iter integer,
ADD COLUMN tta_sec numeric,
ADD COLUMN cost_cents numeric,
ADD COLUMN cost_variance_cents numeric,
ADD COLUMN tokens_breakdown jsonb;

COMMENT ON COLUMN public.optimization_results.accepted IS 'Whether the optimized result was accepted';
COMMENT ON COLUMN public.optimization_results.accepted_iter IS 'Iteration number when result was accepted';
COMMENT ON COLUMN public.optimization_results.tta_sec IS 'Time to acceptable answer in seconds';
COMMENT ON COLUMN public.optimization_results.cost_cents IS 'Cost of optimization in cents';
COMMENT ON COLUMN public.optimization_results.cost_variance_cents IS 'Cost variance in cents';
COMMENT ON COLUMN public.optimization_results.tokens_breakdown IS 'Token breakdown: {orig, refine, final}';