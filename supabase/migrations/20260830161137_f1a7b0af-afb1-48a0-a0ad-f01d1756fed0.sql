
DELETE FROM public.month_snapshots WHERE source = 'financial_cashflow' AND year = 2026 AND month IN (7, 8);

UPDATE public.metric_subcategories SET name = 'Outras Redes Sociais' WHERE id = 'e5eb9e06-3af1-4197-bba9-4776c9ddf958';

INSERT INTO public.metric_subcategories (id, category, name, sort_order)
VALUES ('a0000001-0000-4000-a000-000000000006', 'marketing', 'Investimentos', 6)
ON CONFLICT DO NOTHING;

INSERT INTO public.metrics (id, name, category, target_value, current_value, unit, polarity, description) VALUES
  ('b0000001-0000-4000-b000-000000000001', 'Participação em Eventos', 'marketing', 12, 0, 'eventos', 'higher_is_better', 'Número de eventos em que a ASF participou no período. Meta de 1 evento por mês.'),
  ('b0000001-0000-4000-b000-000000000002', 'Palestras Ministradas', 'marketing', 12, 0, 'palestras', 'higher_is_better', 'Número de palestras ministradas por integrantes da ASF no período. Meta de 1 palestra por mês.'),
  ('b0000001-0000-4000-b000-000000000003', 'Viagens Realizadas', 'marketing', 12, 0, 'viagens', 'higher_is_better', 'Número de viagens realizadas para eventos, visitas ou ativações no período. Meta de 1 viagem por mês.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.monthly_targets (metric_id, year, month, target_value)
SELECT m.id, 2026, g.month, 1
FROM (VALUES
  ('b0000001-0000-4000-b000-000000000001'::uuid),
  ('b0000001-0000-4000-b000-000000000002'::uuid),
  ('b0000001-0000-4000-b000-000000000003'::uuid)) AS m(id)
CROSS JOIN generate_series(1, 12) AS g(month)
ON CONFLICT DO NOTHING;

INSERT INTO public.metric_subcategory_assignments (metric_id, subcategory_id, sort_order) VALUES
  ('e4b899d1-8b6b-4017-8b17-dda419c9a5f1', '70eaddd7-135d-4390-99cf-1910bf0b599b', 1),
  ('33d37ba5-2494-4cea-908c-e0a9a1ed0d84', '70eaddd7-135d-4390-99cf-1910bf0b599b', 2),
  ('872794b9-37d4-4fff-b4b4-2192492ed954', '70eaddd7-135d-4390-99cf-1910bf0b599b', 3),
  ('f5331c88-23c2-47b8-b35f-74f9d032fe54', '7ae946a8-99c8-4446-933b-fca066516e83', 1),
  ('0410b12f-d5c8-4af6-ac3c-5a0b60b1000d', '7ae946a8-99c8-4446-933b-fca066516e83', 2),
  ('b495c3d7-80f2-4cf5-94b4-97d8788901b2', '7ae946a8-99c8-4446-933b-fca066516e83', 3),
  ('18046da8-481d-4108-8027-c1537521db2e', '7ae946a8-99c8-4446-933b-fca066516e83', 4),
  ('5027c638-ed07-4c0d-81fe-c1b51a5e8ed4', 'e5eb9e06-3af1-4197-bba9-4776c9ddf958', 1),
  ('3c702de3-5981-49c5-a44a-3f82b311809e', 'e5eb9e06-3af1-4197-bba9-4776c9ddf958', 2),
  ('95317c7c-bf03-47d8-878a-a2c43cc7d5ac', 'e5eb9e06-3af1-4197-bba9-4776c9ddf958', 3),
  ('5c66b8e3-2c1a-4d84-bfe4-a1608e1f9f22', '6333a7b9-5b53-49a8-a3be-ab5b971fe3f0', 1),
  ('2b32e074-e78c-4bf3-a228-29ce95cb97e3', '6333a7b9-5b53-49a8-a3be-ab5b971fe3f0', 2),
  ('b0000001-0000-4000-b000-000000000001', '30a4c784-b156-4016-8b20-c21220a2b113', 1),
  ('b0000001-0000-4000-b000-000000000002', '30a4c784-b156-4016-8b20-c21220a2b113', 2),
  ('b0000001-0000-4000-b000-000000000003', '30a4c784-b156-4016-8b20-c21220a2b113', 3),
  ('c4496b6e-7a8e-4d28-9463-f32e3f1aa71d', 'a0000001-0000-4000-a000-000000000006', 1),
  ('d7c1396e-aed1-47f1-84f7-71c2b16860ff', 'a0000001-0000-4000-a000-000000000006', 2)
ON CONFLICT DO NOTHING;
