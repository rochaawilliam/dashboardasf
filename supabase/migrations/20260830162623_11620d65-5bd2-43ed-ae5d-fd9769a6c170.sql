DELETE FROM public.metric_subcategory_assignments WHERE metric_id IN ('c4496b6e-7a8e-4d28-9463-f32e3f1aa71d','d7c1396e-aed1-47f1-84f7-71c2b16860ff');
DELETE FROM public.metric_history WHERE metric_id IN ('c4496b6e-7a8e-4d28-9463-f32e3f1aa71d','d7c1396e-aed1-47f1-84f7-71c2b16860ff');
DELETE FROM public.monthly_targets WHERE metric_id IN ('c4496b6e-7a8e-4d28-9463-f32e3f1aa71d','d7c1396e-aed1-47f1-84f7-71c2b16860ff');
DELETE FROM public.metrics WHERE id IN ('c4496b6e-7a8e-4d28-9463-f32e3f1aa71d','d7c1396e-aed1-47f1-84f7-71c2b16860ff');
DELETE FROM public.metric_subcategories WHERE id = 'a0000001-0000-4000-a000-000000000006';

INSERT INTO public.metrics (id, name, category, target_value, current_value, unit, polarity, description)
VALUES ('b0000001-0000-4000-b000-000000000004', 'Parcerias Totais Ativas', 'marketing', 7, 0, 'parcerias', 'higher_is_better', 'Total acumulado de parcerias formalizadas somando todos os meses do ano.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.metric_subcategory_assignments (metric_id, subcategory_id, sort_order)
VALUES ('b0000001-0000-4000-b000-000000000004', '6333a7b9-5b53-49a8-a3be-ab5b971fe3f0', 2)
ON CONFLICT DO NOTHING;