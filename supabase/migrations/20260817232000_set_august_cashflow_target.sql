-- Set August 2026 target for Fluxo de Caixa Operacional
INSERT INTO public.monthly_targets (metric_id, month, year, target_value)
VALUES ('d2f3a4b5-c6d7-4e8f-9a0b-1c2d3e4f5a6b', 8, 2026, '108459.97')
ON CONFLICT (metric_id, month, year) DO UPDATE 
SET target_value = EXCLUDED.target_value,
    updated_at = NOW();
