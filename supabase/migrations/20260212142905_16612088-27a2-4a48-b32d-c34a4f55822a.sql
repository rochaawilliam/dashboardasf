
-- Function to check if a user has edit permission for a specific metric's category
CREATE OR REPLACE FUNCTION public.user_can_edit_metric(_user_id uuid, _metric_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_tab_permissions utp
    JOIN public.metrics m ON m.category::text = utp.tab_key
    WHERE utp.user_id = _user_id
      AND utp.permission_type = 'edit'
      AND m.id = _metric_id
  )
$$;

-- Function to check if user has delete permission for a metric's category
CREATE OR REPLACE FUNCTION public.user_can_delete_metric(_user_id uuid, _metric_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_tab_permissions utp
    JOIN public.metrics m ON m.category::text = utp.tab_key
    WHERE utp.user_id = _user_id
      AND utp.permission_type = 'delete'
      AND m.id = _metric_id
  )
$$;

-- Update metric_history policies
DROP POLICY "Admins can insert metric_history" ON public.metric_history;
CREATE POLICY "Users with edit permission can insert metric_history"
ON public.metric_history FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR user_can_edit_metric(auth.uid(), metric_id)
);

DROP POLICY "Admins can update metric_history" ON public.metric_history;
CREATE POLICY "Users with edit permission can update metric_history"
ON public.metric_history FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR user_can_edit_metric(auth.uid(), metric_id)
);

DROP POLICY "Admins can delete metric_history" ON public.metric_history;
CREATE POLICY "Users with delete permission can delete metric_history"
ON public.metric_history FOR DELETE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR user_can_delete_metric(auth.uid(), metric_id)
);

-- Update metrics policies
DROP POLICY "Admins can update metrics" ON public.metrics;
CREATE POLICY "Users with edit permission can update metrics"
ON public.metrics FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR user_can_edit_metric(auth.uid(), id)
);

DROP POLICY "Admins can delete metrics" ON public.metrics;
CREATE POLICY "Users with delete permission can delete metrics"
ON public.metrics FOR DELETE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR user_can_delete_metric(auth.uid(), id)
);

-- Update monthly_targets policies
DROP POLICY "Admins can insert monthly_targets" ON public.monthly_targets;
CREATE POLICY "Users with edit permission can insert monthly_targets"
ON public.monthly_targets FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR user_can_edit_metric(auth.uid(), metric_id)
);

DROP POLICY "Admins can update monthly_targets" ON public.monthly_targets;
CREATE POLICY "Users with edit permission can update monthly_targets"
ON public.monthly_targets FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR user_can_edit_metric(auth.uid(), metric_id)
);

DROP POLICY "Admins can delete monthly_targets" ON public.monthly_targets;
CREATE POLICY "Users with delete permission can delete monthly_targets"
ON public.monthly_targets FOR DELETE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR user_can_delete_metric(auth.uid(), metric_id)
);
