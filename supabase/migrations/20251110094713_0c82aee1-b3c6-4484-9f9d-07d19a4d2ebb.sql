-- Add new quality metrics columns to optimization_results table
ALTER TABLE optimization_results 
ADD COLUMN IF NOT EXISTS old_quality_score numeric,
ADD COLUMN IF NOT EXISTS new_quality_score numeric,
ADD COLUMN IF NOT EXISTS compression_percentage numeric,
ADD COLUMN IF NOT EXISTS quality_gain_percentage numeric,
ADD COLUMN IF NOT EXISTS quality_improvement_score numeric;

COMMENT ON COLUMN optimization_results.old_quality_score IS 'EFMNB quality score of original prompt (0-100)';
COMMENT ON COLUMN optimization_results.new_quality_score IS 'EFMNB quality score of optimized prompt (0-100)';
COMMENT ON COLUMN optimization_results.compression_percentage IS 'Token compression: 100 * (1 - final/initial)';
COMMENT ON COLUMN optimization_results.quality_gain_percentage IS 'Quality improvement: 100 * (new-old) / max(old, ε)';
COMMENT ON COLUMN optimization_results.quality_improvement_score IS 'Combined metric: 0.6 * qualityGain + 0.4 * compression';