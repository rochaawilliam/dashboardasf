
-- Add source column to metric_history for tracking origin (online/offline)
ALTER TABLE public.metric_history ADD COLUMN source text DEFAULT NULL;

-- Add index for efficient filtering by source
CREATE INDEX idx_metric_history_source ON public.metric_history(source) WHERE source IS NOT NULL;
