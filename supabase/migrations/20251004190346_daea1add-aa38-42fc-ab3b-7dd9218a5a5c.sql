-- Delete orphaned records without user_id (security risk)
DELETE FROM public.favorite_configs WHERE user_id IS NULL;
DELETE FROM public.optimization_results WHERE user_id IS NULL;

-- Now make user_id NOT NULL in both tables
ALTER TABLE public.favorite_configs 
ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.optimization_results 
ALTER COLUMN user_id SET NOT NULL;