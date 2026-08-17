-- Register financial sheet source for August 2026 if it doesn't exist
-- Note: Reusing the July spreadsheet gid pattern as a fallback or starting point,
-- but the user will likely update it via the Admin panel if the gid differs.
INSERT INTO public.financial_sheet_sources (month, year, csv_url)
VALUES (8, 2026, 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ7pbmT3trZAd5iIi1N4wWsipyEDuoNlMXXQ_pQcQoshcdYGRlIqfUEDEJwQwNzMQ/pub?gid=0&single=true&output=csv')
ON CONFLICT (month, year) DO NOTHING;

-- Also update the target for Fluxo de Caixa Operacional for August 2026
INSERT INTO public.monthly_targets (metric_id, month, year, target_value)
VALUES ('d2f3a4b5-c6d7-4e8f-9a0b-1c2d3e4f5a6b', 8, 2026, '108459.97')
ON CONFLICT (metric_id, month, year) DO UPDATE 
SET target_value = EXCLUDED.target_value,
    updated_at = NOW();