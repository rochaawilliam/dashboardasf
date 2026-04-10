
-- Create new metrics for Online funnel (missing ones)
INSERT INTO public.metrics (id, name, category, unit, target_value, polarity, description) VALUES
  ('a1b2c3d4-4444-4aaa-bbbb-444444444444', 'Reuniões Online ASF', 'experiencia_cliente', 'número', 0, 'higher_is_better', 'Reuniões agendadas via canal online'),
  ('a1b2c3d4-5555-4aaa-bbbb-555555555555', 'Propostas Online ASF', 'experiencia_cliente', 'número', 0, 'higher_is_better', 'Propostas elaboradas via canal online'),
  ('a1b2c3d4-6666-4aaa-bbbb-666666666666', 'Valor Gerado Online', 'experiencia_cliente', 'R$', 0, 'higher_is_better', 'Valor total gerado pelo canal online'),
  ('a1b2c3d4-7777-4aaa-bbbb-777777777777', 'ROI Online', 'experiencia_cliente', '%', 0, 'higher_is_better', 'Retorno sobre investimento do canal online');

-- Create new metrics for Offline funnel (missing ones)
INSERT INTO public.metrics (id, name, category, unit, target_value, polarity, description) VALUES
  ('b2c3d4e5-1111-4bbb-cccc-111111111111', 'Valor Investido Offline', 'experiencia_cliente', 'R$', 0, 'higher_is_better', 'Valor investido no canal offline'),
  ('b2c3d4e5-2222-4bbb-cccc-222222222222', 'Prospects Offline', 'experiencia_cliente', 'número', 0, 'higher_is_better', 'Prospects identificados via canal offline'),
  ('b2c3d4e5-3333-4bbb-cccc-333333333333', 'Leads Offline', 'experiencia_cliente', 'número', 0, 'higher_is_better', 'Total de leads do canal offline'),
  ('b2c3d4e5-4444-4bbb-cccc-444444444444', 'Reuniões Offline', 'experiencia_cliente', 'número', 0, 'higher_is_better', 'Reuniões agendadas via canal offline'),
  ('b2c3d4e5-5555-4bbb-cccc-555555555555', 'Propostas Offline', 'experiencia_cliente', 'número', 0, 'higher_is_better', 'Propostas elaboradas via canal offline'),
  ('b2c3d4e5-6666-4bbb-cccc-666666666666', 'Valor Gerado Offline', 'experiencia_cliente', 'R$', 0, 'higher_is_better', 'Valor total gerado pelo canal offline'),
  ('b2c3d4e5-7777-4bbb-cccc-777777777777', 'ROI Offline', 'experiencia_cliente', '%', 0, 'higher_is_better', 'Retorno sobre investimento do canal offline');

-- Create two new subcategories for the funnels
INSERT INTO public.metric_subcategories (id, category, name, sort_order) VALUES
  ('f1f1f1f1-1111-4aaa-aaaa-111111111111', 'experiencia_cliente', 'Funil Online', 0),
  ('f2f2f2f2-2222-4bbb-bbbb-222222222222', 'experiencia_cliente', 'Funil Offline', 1);

-- Update existing subcategories sort_order to come after the funnels
UPDATE public.metric_subcategories 
SET sort_order = sort_order + 10 
WHERE category = 'experiencia_cliente' 
  AND id NOT IN ('f1f1f1f1-1111-4aaa-aaaa-111111111111', 'f2f2f2f2-2222-4bbb-bbbb-222222222222');

-- Assign Online funnel metrics (in funnel order)
INSERT INTO public.metric_subcategory_assignments (metric_id, subcategory_id, sort_order) VALUES
  ('036e92ce-4bc3-417d-922f-936c1aba7421', 'f1f1f1f1-1111-4aaa-aaaa-111111111111', 0),  -- Valor Investido ASF
  ('12574c46-d6c0-4e18-9e7e-a42b05b8fcfe', 'f1f1f1f1-1111-4aaa-aaaa-111111111111', 1),  -- Impressões
  ('54a2c98b-52e6-4b8a-850c-d7a38492d030', 'f1f1f1f1-1111-4aaa-aaaa-111111111111', 2),  -- Alcance
  ('ca49be98-52c9-4da8-a580-6a681b54aeba', 'f1f1f1f1-1111-4aaa-aaaa-111111111111', 3),  -- Conversas
  ('dc434066-4bd6-4c89-a22e-04ba5ea1dd9c', 'f1f1f1f1-1111-4aaa-aaaa-111111111111', 4),  -- Leads Online
  ('a1b2c3d4-4444-4aaa-bbbb-444444444444', 'f1f1f1f1-1111-4aaa-aaaa-111111111111', 5),  -- Reuniões Online
  ('a1b2c3d4-5555-4aaa-bbbb-555555555555', 'f1f1f1f1-1111-4aaa-aaaa-111111111111', 6),  -- Propostas Online
  ('1d927738-a02b-4867-8a7a-a7a2331773ec', 'f1f1f1f1-1111-4aaa-aaaa-111111111111', 7),  -- Contratos Online
  ('a1b2c3d4-6666-4aaa-bbbb-666666666666', 'f1f1f1f1-1111-4aaa-aaaa-111111111111', 8),  -- Valor Gerado Online
  ('a1b2c3d4-7777-4aaa-bbbb-777777777777', 'f1f1f1f1-1111-4aaa-aaaa-111111111111', 9)   -- ROI Online
ON CONFLICT (metric_id) DO UPDATE SET subcategory_id = EXCLUDED.subcategory_id, sort_order = EXCLUDED.sort_order;

-- Assign Offline funnel metrics (in funnel order)
INSERT INTO public.metric_subcategory_assignments (metric_id, subcategory_id, sort_order) VALUES
  ('b2c3d4e5-1111-4bbb-cccc-111111111111', 'f2f2f2f2-2222-4bbb-bbbb-222222222222', 0),  -- Valor Investido Offline
  ('b2c3d4e5-2222-4bbb-cccc-222222222222', 'f2f2f2f2-2222-4bbb-bbbb-222222222222', 1),  -- Prospects
  ('b2c3d4e5-3333-4bbb-cccc-333333333333', 'f2f2f2f2-2222-4bbb-bbbb-222222222222', 2),  -- Leads Offline
  ('b2c3d4e5-4444-4bbb-cccc-444444444444', 'f2f2f2f2-2222-4bbb-bbbb-222222222222', 3),  -- Reuniões Offline
  ('b2c3d4e5-5555-4bbb-cccc-555555555555', 'f2f2f2f2-2222-4bbb-bbbb-222222222222', 4),  -- Propostas Offline
  ('7ea4560c-5f42-4982-9b27-b68f2475b838', 'f2f2f2f2-2222-4bbb-bbbb-222222222222', 5),  -- Contratos Offline
  ('b2c3d4e5-6666-4bbb-cccc-666666666666', 'f2f2f2f2-2222-4bbb-bbbb-222222222222', 6),  -- Valor Gerado Offline
  ('b2c3d4e5-7777-4bbb-cccc-777777777777', 'f2f2f2f2-2222-4bbb-bbbb-222222222222', 7)   -- ROI Offline
ON CONFLICT (metric_id) DO UPDATE SET subcategory_id = EXCLUDED.subcategory_id, sort_order = EXCLUDED.sort_order;
