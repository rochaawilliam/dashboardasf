
INSERT INTO public.monthly_targets (metric_id, year, month, target_value)
VALUES 
  ('d2f3a4b5-c6d7-4e8f-9a0b-1c2d3e4f5a6b', 2026, 1, 81600),
  ('d2f3a4b5-c6d7-4e8f-9a0b-1c2d3e4f5a6b', 2026, 2, 85800),
  ('d2f3a4b5-c6d7-4e8f-9a0b-1c2d3e4f5a6b', 2026, 3, 97600),
  ('d2f3a4b5-c6d7-4e8f-9a0b-1c2d3e4f5a6b', 2026, 4, 133400),
  ('d2f3a4b5-c6d7-4e8f-9a0b-1c2d3e4f5a6b', 2026, 5, 96025),
  ('d2f3a4b5-c6d7-4e8f-9a0b-1c2d3e4f5a6b', 2026, 6, 111980),
  ('d2f3a4b5-c6d7-4e8f-9a0b-1c2d3e4f5a6b', 2026, 7, 124850),
  ('d2f3a4b5-c6d7-4e8f-9a0b-1c2d3e4f5a6b', 2026, 8, 121800),
  ('d2f3a4b5-c6d7-4e8f-9a0b-1c2d3e4f5a6b', 2026, 9, 138100),
  ('d2f3a4b5-c6d7-4e8f-9a0b-1c2d3e4f5a6b', 2026, 10, 153500),
  ('d2f3a4b5-c6d7-4e8f-9a0b-1c2d3e4f5a6b', 2026, 11, 167000),
  ('d2f3a4b5-c6d7-4e8f-9a0b-1c2d3e4f5a6b', 2026, 12, 178800)
ON CONFLICT (metric_id, year, month) 
DO UPDATE SET target_value = EXCLUDED.target_value, updated_at = now();
