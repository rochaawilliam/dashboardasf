-- Insert marketing subcategories for organizing cards in the Marketing tab
INSERT INTO public.metric_subcategories (category, name, sort_order)
VALUES
  ('marketing', 'Site', 1),
  ('marketing', 'Instagram', 2),
  ('marketing', 'Outras Redes Sociais', 3),
  ('marketing', 'Parceiros', 4),
  ('marketing', 'Eventos', 5)
ON CONFLICT DO NOTHING;
