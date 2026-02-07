-- =====================================================
-- Fix Overly Permissive RLS Policies
-- Restrict write operations to admins only
-- Keep read access for all authenticated users
-- =====================================================

-- =====================================================
-- 1. METRICS TABLE - Admin-only writes
-- =====================================================

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Authenticated users can insert metrics" ON public.metrics;
DROP POLICY IF EXISTS "Authenticated users can update metrics" ON public.metrics;
DROP POLICY IF EXISTS "Authenticated users can read metrics" ON public.metrics;

-- Create new policies: Read for all, Write for admins only
CREATE POLICY "Authenticated users can read metrics"
ON public.metrics FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can insert metrics"
ON public.metrics FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update metrics"
ON public.metrics FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete metrics"
ON public.metrics FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- 2. METRIC_HISTORY TABLE - Admin-only writes
-- =====================================================

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Authenticated users can insert metric_history" ON public.metric_history;
DROP POLICY IF EXISTS "Authenticated users can update metric_history" ON public.metric_history;
DROP POLICY IF EXISTS "Authenticated users can delete metric_history" ON public.metric_history;
DROP POLICY IF EXISTS "Authenticated users can read metric_history" ON public.metric_history;

-- Create new policies: Read for all, Write for admins only
CREATE POLICY "Authenticated users can read metric_history"
ON public.metric_history FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can insert metric_history"
ON public.metric_history FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update metric_history"
ON public.metric_history FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete metric_history"
ON public.metric_history FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- 3. TRAINING_HOURS TABLE - Admin-only writes
-- =====================================================

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Authenticated users can insert training_hours" ON public.training_hours;
DROP POLICY IF EXISTS "Authenticated users can update training_hours" ON public.training_hours;
DROP POLICY IF EXISTS "Authenticated users can read training_hours" ON public.training_hours;

-- Create new policies: Read for all, Write for admins only
CREATE POLICY "Authenticated users can read training_hours"
ON public.training_hours FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can insert training_hours"
ON public.training_hours FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update training_hours"
ON public.training_hours FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete training_hours"
ON public.training_hours FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));