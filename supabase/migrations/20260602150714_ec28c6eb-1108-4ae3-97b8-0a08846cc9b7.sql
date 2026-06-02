ALTER TABLE public.financial_sheet_sources
ADD COLUMN IF NOT EXISTS forecast_locked_value numeric,
ADD COLUMN IF NOT EXISTS forecast_locked_at timestamptz;