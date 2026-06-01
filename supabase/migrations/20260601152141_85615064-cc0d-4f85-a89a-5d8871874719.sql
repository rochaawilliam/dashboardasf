
-- Tabela de snapshots mensais por fonte de dados externa
CREATE TABLE public.month_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source TEXT NOT NULL, -- 'pipeline' | 'traffic_funnel'
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  payload JSONB NOT NULL,
  closed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_by UUID,
  auto_closed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source, year, month)
);

GRANT SELECT ON public.month_snapshots TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.month_snapshots TO authenticated;
GRANT ALL ON public.month_snapshots TO service_role;

ALTER TABLE public.month_snapshots ENABLE ROW LEVEL SECURITY;

-- Todos autenticados podem ler (para overlay no front e edge functions)
CREATE POLICY "Anyone can read month_snapshots"
ON public.month_snapshots FOR SELECT
USING (true);

-- Apenas admins podem fechar/reabrir meses
CREATE POLICY "Admins can insert month_snapshots"
ON public.month_snapshots FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update month_snapshots"
ON public.month_snapshots FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete month_snapshots"
ON public.month_snapshots FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_month_snapshots_source_year ON public.month_snapshots (source, year, month);

CREATE TRIGGER trg_month_snapshots_updated_at
BEFORE UPDATE ON public.month_snapshots
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
