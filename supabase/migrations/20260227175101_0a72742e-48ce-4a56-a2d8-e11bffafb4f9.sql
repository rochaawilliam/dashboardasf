-- Add polarity column to metrics: 'higher_is_better' (default) or 'lower_is_better'
ALTER TABLE public.metrics 
ADD COLUMN polarity text NOT NULL DEFAULT 'higher_is_better' 
CHECK (polarity IN ('higher_is_better', 'lower_is_better'));

-- Set known inverse metrics to lower_is_better
UPDATE public.metrics SET polarity = 'lower_is_better' WHERE name ILIKE '%churn%' OR name ILIKE '%turnover%';
