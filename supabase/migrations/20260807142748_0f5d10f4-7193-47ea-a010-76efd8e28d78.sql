-- remove generic MQL/SQL cards and their subcategory
DELETE FROM public.monthly_targets WHERE metric_id IN ('d3d3d3d3-1111-4ddd-aaaa-111111111111','d3d3d3d3-2222-4ddd-aaaa-222222222222');
DELETE FROM public.metric_subcategory_assignments WHERE metric_id IN ('d3d3d3d3-1111-4ddd-aaaa-111111111111','d3d3d3d3-2222-4ddd-aaaa-222222222222');
DELETE FROM public.metrics WHERE id IN ('d3d3d3d3-1111-4ddd-aaaa-111111111111','d3d3d3d3-2222-4ddd-aaaa-222222222222');
DELETE FROM public.metric_subcategories WHERE id = 'a9a9a9a9-3333-4ccc-aaaa-333333333333';

-- shift positions to open room in each funnel
UPDATE public.metric_subcategory_assignments SET sort_order = sort_order + 2
 WHERE subcategory_id = 'f1f1f1f1-1111-4aaa-aaaa-111111111111' AND sort_order >= 6;
UPDATE public.metric_subcategory_assignments SET sort_order = sort_order + 1
 WHERE subcategory_id = 'f2f2f2f2-2222-4bbb-bbbb-222222222222' AND sort_order >= 4;

INSERT INTO public.metrics (id, name, category, target_value, current_value, unit, description, polarity) VALUES
 ('e5e5e5e5-1111-4eee-aaaa-111111111111','MQL Online','experiencia_cliente',384,0,'número','Leads qualificados por marketing (MQL) do funil online','higher_is_better'),
 ('e5e5e5e5-2222-4eee-aaaa-222222222222','SQL Online','experiencia_cliente',228,0,'número','Leads qualificados por vendas (SQL) do funil online','higher_is_better'),
 ('e5e5e5e5-3333-4eee-aaaa-333333333333','SQL Offline','experiencia_cliente',360,0,'número','Leads qualificados por vendas (SQL) do funil offline','higher_is_better');

INSERT INTO public.metric_subcategory_assignments (metric_id, subcategory_id, sort_order) VALUES
 ('e5e5e5e5-1111-4eee-aaaa-111111111111','f1f1f1f1-1111-4aaa-aaaa-111111111111',6),
 ('e5e5e5e5-2222-4eee-aaaa-222222222222','f1f1f1f1-1111-4aaa-aaaa-111111111111',7),
 ('e5e5e5e5-3333-4eee-aaaa-333333333333','f2f2f2f2-2222-4bbb-bbbb-222222222222',4);

INSERT INTO public.monthly_targets (metric_id, year, month, target_value) VALUES
 ('e5e5e5e5-1111-4eee-aaaa-111111111111',2026,8,32),
 ('e5e5e5e5-2222-4eee-aaaa-222222222222',2026,8,19),
 ('e5e5e5e5-3333-4eee-aaaa-333333333333',2026,8,30)
ON CONFLICT (metric_id, year, month) DO UPDATE SET target_value = EXCLUDED.target_value, updated_at = now();