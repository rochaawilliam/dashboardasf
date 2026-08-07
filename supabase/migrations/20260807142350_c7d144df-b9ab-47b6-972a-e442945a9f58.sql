INSERT INTO public.metric_subcategories (id, category, name, sort_order)
VALUES ('a9a9a9a9-3333-4ccc-aaaa-333333333333', 'experiencia_cliente', 'Qualificação de Leads', 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.metrics (id, name, category, target_value, current_value, unit, description, polarity)
VALUES
 ('d3d3d3d3-1111-4ddd-aaaa-111111111111', 'MQL', 'experiencia_cliente', 384, 0, 'número', 'Leads qualificados por marketing (MQL) no mês', 'higher_is_better'),
 ('d3d3d3d3-2222-4ddd-aaaa-222222222222', 'SQL', 'experiencia_cliente', 588, 0, 'número', 'Leads qualificados por vendas (SQL) no mês', 'higher_is_better')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.metric_subcategory_assignments (metric_id, subcategory_id, sort_order)
VALUES
 ('d3d3d3d3-1111-4ddd-aaaa-111111111111', 'a9a9a9a9-3333-4ccc-aaaa-333333333333', 0),
 ('d3d3d3d3-2222-4ddd-aaaa-222222222222', 'a9a9a9a9-3333-4ccc-aaaa-333333333333', 1);

INSERT INTO public.monthly_targets (metric_id, year, month, target_value)
VALUES
 ('d3d3d3d3-1111-4ddd-aaaa-111111111111', 2026, 8, 32),
 ('d3d3d3d3-2222-4ddd-aaaa-222222222222', 2026, 8, 49)
ON CONFLICT (metric_id, year, month) DO UPDATE SET target_value = EXCLUDED.target_value, updated_at = now();