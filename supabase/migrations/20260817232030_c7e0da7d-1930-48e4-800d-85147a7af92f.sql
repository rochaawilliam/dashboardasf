DELETE FROM public.monthly_targets 
WHERE metric_id = 'd2f3a4b5-c6d7-4e8f-9a0b-1c2d3e4f5a6b' 
AND month = 8 
AND year = 2026;

UPDATE public.financial_sheet_sources
SET forecast_locked_value = NULL,
    forecast_locked_at = NULL
WHERE month = 8 AND year = 2026;