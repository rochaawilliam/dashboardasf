
-- New subcategory: Contratos Contencioso (place after Contratos Consultoria)
INSERT INTO public.metric_subcategories (id, name, category, sort_order)
VALUES ('d1c0d1c0-cc01-4aaa-aaaa-000000000001', 'Contratos Contencioso', 'experiencia_cliente', 16)
ON CONFLICT (id) DO NOTHING;

-- Bump subsequent subcategories to make room
UPDATE public.metric_subcategories SET sort_order = sort_order + 1
WHERE category = 'experiencia_cliente' AND sort_order >= 16 AND id <> 'd1c0d1c0-cc01-4aaa-aaaa-000000000001';

-- 4 new metrics for Contencioso (Empresarial, Trabalhista, Tributário, Ambiental)
INSERT INTO public.metrics (id, name, category, unit, target_value, current_value)
VALUES
  ('d1c0d1c0-cc01-4bbb-bbbb-000000000001', 'Novos Contratos Contencioso Empresarial', 'experiencia_cliente', 'contratos', 0, 0),
  ('d1c0d1c0-cc01-4bbb-bbbb-000000000002', 'Novos Contratos Contencioso Trabalhista', 'experiencia_cliente', 'contratos', 0, 0),
  ('d1c0d1c0-cc01-4bbb-bbbb-000000000003', 'Novos Contratos Contencioso Tributário', 'experiencia_cliente', 'contratos', 0, 0),
  ('d1c0d1c0-cc01-4bbb-bbbb-000000000004', 'Novos Contratos Contencioso Ambiental', 'experiencia_cliente', 'contratos', 0, 0)
ON CONFLICT (id) DO NOTHING;

-- Assign the 4 new metrics to the new subcategory
INSERT INTO public.metric_subcategory_assignments (metric_id, subcategory_id, sort_order)
VALUES
  ('d1c0d1c0-cc01-4bbb-bbbb-000000000001', 'd1c0d1c0-cc01-4aaa-aaaa-000000000001', 0),
  ('d1c0d1c0-cc01-4bbb-bbbb-000000000002', 'd1c0d1c0-cc01-4aaa-aaaa-000000000001', 1),
  ('d1c0d1c0-cc01-4bbb-bbbb-000000000003', 'd1c0d1c0-cc01-4aaa-aaaa-000000000001', 2),
  ('d1c0d1c0-cc01-4bbb-bbbb-000000000004', 'd1c0d1c0-cc01-4aaa-aaaa-000000000001', 3)
ON CONFLICT DO NOTHING;
