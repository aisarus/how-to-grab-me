-- Create table for optimization results and metrics
CREATE TABLE IF NOT EXISTS public.optimization_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Prompts
  original_prompt TEXT NOT NULL,
  optimized_prompt TEXT NOT NULL,
  
  -- Metrics
  original_tokens INTEGER,
  optimized_tokens INTEGER,
  improvement_percentage DECIMAL(5,2),
  
  -- Configuration used
  a_parameter DECIMAL(5,2),
  b_parameter DECIMAL(5,2),
  iterations INTEGER,
  convergence_threshold DECIMAL(5,3),
  
  -- A/B test results (optional)
  ab_test_winner TEXT CHECK (ab_test_winner IN ('original', 'optimized', 'tie', NULL)),
  ab_test_notes TEXT
);

-- Enable Row Level Security
ALTER TABLE public.optimization_results ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read results (for public dashboard)
CREATE POLICY "Anyone can view optimization results" 
ON public.optimization_results 
FOR SELECT 
USING (true);

-- Allow anyone to insert results (public endpoint)
CREATE POLICY "Anyone can insert optimization results" 
ON public.optimization_results 
FOR INSERT 
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_optimization_results_created_at ON public.optimization_results(created_at DESC);
CREATE INDEX idx_optimization_results_improvement ON public.optimization_results(improvement_percentage DESC);