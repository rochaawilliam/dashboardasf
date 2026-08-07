
-- Metas indutoras de agosto/2026 (funil 70% offline / 30% online)
INSERT INTO public.monthly_targets (metric_id, year, month, target_value) VALUES
  ('b2c3d4e5-2222-4bbb-cccc-222222222222', 2026, 8, 125), -- Prospects Offline
  ('b2c3d4e5-4444-4bbb-cccc-444444444444', 2026, 8, 38),  -- Reuniões Offline
  ('b2c3d4e5-5555-4bbb-cccc-555555555555', 2026, 8, 25),  -- Propostas Offline
  ('7ea4560c-5f42-4982-9b27-b68f2475b838', 2026, 8, 10),  -- Novos Contratos Off-line ASF
  ('dc434066-4bd6-4c89-a22e-04ba5ea1dd9c', 2026, 8, 80),  -- Leads no Funil Online
  ('a1b2c3d4-4444-4aaa-bbbb-444444444444', 2026, 8, 15),  -- Reuniões Online ASF
  ('a1b2c3d4-5555-4aaa-bbbb-555555555555', 2026, 8, 12),  -- Propostas Online ASF
  ('1d927738-a02b-4867-8a7a-a7a2331773ec', 2026, 8, 4),   -- Novos Contratos On-line ASF
  ('b94952b3-b811-4200-872e-810b215240f6', 2026, 8, 184700) -- Receita Total Mensal
ON CONFLICT (metric_id, year, month) DO UPDATE SET target_value = EXCLUDED.target_value, updated_at = now();
