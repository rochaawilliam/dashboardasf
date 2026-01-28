-- Drop existing public policies
DROP POLICY IF EXISTS "Allow public read access to metrics" ON public.metrics;
DROP POLICY IF EXISTS "Allow public insert to metrics" ON public.metrics;
DROP POLICY IF EXISTS "Allow public update to metrics" ON public.metrics;

DROP POLICY IF EXISTS "Allow public read access to metric_history" ON public.metric_history;
DROP POLICY IF EXISTS "Allow public insert to metric_history" ON public.metric_history;
DROP POLICY IF EXISTS "Allow public update to metric_history" ON public.metric_history;
DROP POLICY IF EXISTS "Allow public delete from metric_history" ON public.metric_history;

DROP POLICY IF EXISTS "Allow public read access to training_hours" ON public.training_hours;
DROP POLICY IF EXISTS "Allow public insert to training_hours" ON public.training_hours;
DROP POLICY IF EXISTS "Allow public update to training_hours" ON public.training_hours;

-- Create new policies requiring authentication for metrics
CREATE POLICY "Authenticated users can read metrics"
ON public.metrics FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert metrics"
ON public.metrics FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update metrics"
ON public.metrics FOR UPDATE
TO authenticated
USING (true);

-- Create new policies requiring authentication for metric_history
CREATE POLICY "Authenticated users can read metric_history"
ON public.metric_history FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert metric_history"
ON public.metric_history FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update metric_history"
ON public.metric_history FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete metric_history"
ON public.metric_history FOR DELETE
TO authenticated
USING (true);

-- Create new policies requiring authentication for training_hours
CREATE POLICY "Authenticated users can read training_hours"
ON public.training_hours FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert training_hours"
ON public.training_hours FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update training_hours"
ON public.training_hours FOR UPDATE
TO authenticated
USING (true);

-- Add server-side validation with CHECK constraints
ALTER TABLE public.metrics
ADD CONSTRAINT metrics_current_value_check 
CHECK (current_value >= 0 AND current_value < 1000000);

ALTER TABLE public.metrics
ADD CONSTRAINT metrics_target_value_check 
CHECK (target_value >= 0 AND target_value < 1000000);

ALTER TABLE public.training_hours
ADD CONSTRAINT training_hours_current_check 
CHECK (current_hours >= 0 AND current_hours <= 1000);

ALTER TABLE public.training_hours
ADD CONSTRAINT training_hours_target_check 
CHECK (target_hours >= 0 AND target_hours <= 1000);

ALTER TABLE public.metric_history
ADD CONSTRAINT metric_history_value_check 
CHECK (value >= -1000000 AND value <= 1000000);