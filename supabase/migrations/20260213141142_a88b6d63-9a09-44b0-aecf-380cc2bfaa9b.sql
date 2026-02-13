
-- Insert 3 new Patenteia metrics for execucao_comercial
INSERT INTO public.metrics (name, category, unit, target_value, current_value, description)
VALUES
  ('Número de alcance Patenteia', 'execucao_comercial', 'número', 486000, 0, 'Alcance mensal Patenteia'),
  ('Número de conversas iniciadas Patenteia', 'execucao_comercial', 'número', 900, 0, 'Conversas iniciadas Patenteia'),
  ('Número de impressões Patenteia', 'execucao_comercial', 'número', 975600, 0, 'Impressões mensais Patenteia');

-- Insert monthly targets for the new metrics (all 12 months of 2026)
INSERT INTO public.monthly_targets (metric_id, year, month, target_value)
SELECT m.id, 2026, g.month, 40500
FROM public.metrics m, generate_series(1, 12) AS g(month)
WHERE m.name = 'Número de alcance Patenteia';

INSERT INTO public.monthly_targets (metric_id, year, month, target_value)
SELECT m.id, 2026, g.month, 75
FROM public.metrics m, generate_series(1, 12) AS g(month)
WHERE m.name = 'Número de conversas iniciadas Patenteia';

INSERT INTO public.monthly_targets (metric_id, year, month, target_value)
SELECT m.id, 2026, g.month, 81300
FROM public.metrics m, generate_series(1, 12) AS g(month)
WHERE m.name = 'Número de impressões Patenteia';
