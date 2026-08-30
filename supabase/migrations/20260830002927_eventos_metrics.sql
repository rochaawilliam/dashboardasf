-- Insert metrics for the Eventos subcategory under Marketing
INSERT INTO public.metrics (name, category, division, target_value, current_value, unit, description, polarity)
VALUES
  ('Participação em Eventos', 'marketing', 'marketing', 0, 0, 'un', 'Quantidade de eventos com participação', 'higher_is_better'),
  ('Palestras ministradas', 'marketing', 'marketing', 0, 0, 'un', 'Quantidade de palestras ministradas', 'higher_is_better'),
  ('Viagens realizadas', 'marketing', 'marketing', 0, 0, 'un', 'Quantidade de viagens realizadas', 'higher_is_better');

-- Assign the new metrics to the Eventos subcategory
INSERT INTO public.metric_subcategory_assignments (metric_id, subcategory_id, sort_order)
SELECT m.id, s.id, row_number() OVER (ORDER BY m.name) AS sort_order
FROM public.metrics m
CROSS JOIN public.metric_subcategories s
WHERE s.category = 'marketing'
  AND s.name = 'Eventos'
  AND m.category = 'marketing'
  AND m.name IN ('Participação em Eventos', 'Palestras ministradas', 'Viagens realizadas')
ON CONFLICT DO NOTHING;
