
ALTER TABLE public.metrics DISABLE TRIGGER sync_monthly_targets_trigger;

UPDATE public.metrics SET target_value = 480 WHERE id = 'e1f2a3b4-1111-4eee-ffff-111111111111';
UPDATE public.metrics SET target_value = 270 WHERE id = 'e1f2a3b4-2222-4eee-ffff-222222222222';

ALTER TABLE public.metrics ENABLE TRIGGER sync_monthly_targets_trigger;

-- Reafirma metas mensais 2026 (garante que jul–dez = 20 e jan–jun preservados)
INSERT INTO public.monthly_targets (metric_id, year, month, target_value)
SELECT m.id, 2026, mo, 20
FROM (VALUES ('e1f2a3b4-1111-4eee-ffff-111111111111'::uuid), ('e1f2a3b4-2222-4eee-ffff-222222222222'::uuid)) AS m(id),
     generate_series(7,12) AS mo
ON CONFLICT (metric_id, year, month) DO UPDATE SET target_value = 20, updated_at = now();
