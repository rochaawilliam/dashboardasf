-- Remove the check constraint that limits target_value to values <= 100
ALTER TABLE public.metrics DROP CONSTRAINT IF EXISTS metrics_target_value_check;