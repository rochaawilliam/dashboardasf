CREATE TABLE IF NOT EXISTS public.financial_sheet_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year integer NOT NULL,
  month integer NOT NULL CHECK (month BETWEEN 1 AND 12),
  csv_url text NOT NULL,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(year, month)
);

GRANT SELECT ON public.financial_sheet_sources TO anon, authenticated;
GRANT ALL ON public.financial_sheet_sources TO service_role;

ALTER TABLE public.financial_sheet_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read financial_sheet_sources"
  ON public.financial_sheet_sources FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert financial_sheet_sources"
  ON public.financial_sheet_sources FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update financial_sheet_sources"
  ON public.financial_sheet_sources FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete financial_sheet_sources"
  ON public.financial_sheet_sources FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_financial_sheet_sources_updated_at
  BEFORE UPDATE ON public.financial_sheet_sources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();