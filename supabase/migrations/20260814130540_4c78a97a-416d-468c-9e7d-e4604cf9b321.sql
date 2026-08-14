CREATE TABLE public.daily_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tab_key text NOT NULL,
  period_label text NOT NULL,
  analysis_date date NOT NULL DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo')::date,
  content text NOT NULL,
  overall numeric,
  generated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tab_key, period_label, analysis_date)
);

GRANT SELECT ON public.daily_analyses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_analyses TO authenticated;
GRANT ALL ON public.daily_analyses TO service_role;

ALTER TABLE public.daily_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read daily analyses"
  ON public.daily_analyses FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create the daily analysis"
  ON public.daily_analyses FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update daily analyses"
  ON public.daily_analyses FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete daily analyses"
  ON public.daily_analyses FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_daily_analyses_updated_at
  BEFORE UPDATE ON public.daily_analyses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();