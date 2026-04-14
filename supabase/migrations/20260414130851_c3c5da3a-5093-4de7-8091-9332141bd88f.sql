
CREATE TABLE public.ritual_completions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_id uuid NOT NULL,
  ritual_key text NOT NULL,
  year integer NOT NULL DEFAULT EXTRACT(YEAR FROM NOW())::integer,
  month integer NOT NULL,
  occurrence integer NOT NULL DEFAULT 1,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamp with time zone,
  completed_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (metric_id, ritual_key, year, month, occurrence)
);

ALTER TABLE public.ritual_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read ritual_completions"
  ON public.ritual_completions FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users with edit permission can insert ritual_completions"
  ON public.ritual_completions FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR user_can_edit_metric(auth.uid(), metric_id));

CREATE POLICY "Users with edit permission can update ritual_completions"
  ON public.ritual_completions FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR user_can_edit_metric(auth.uid(), metric_id));

CREATE POLICY "Users with delete permission can delete ritual_completions"
  ON public.ritual_completions FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR user_can_delete_metric(auth.uid(), metric_id));

CREATE TRIGGER update_ritual_completions_updated_at
  BEFORE UPDATE ON public.ritual_completions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
