-- Ensure marketing subcategories exist (idempotent)
DO $$
DECLARE
  v_site_id uuid;
  v_instagram_id uuid;
  v_outras_redes_id uuid;
  v_parceiros_id uuid;
  v_eventos_id uuid;
  v_metric_id uuid;
BEGIN
  -- Upsert subcategories
  SELECT id INTO v_site_id FROM public.metric_subcategories WHERE category = 'marketing' AND name = 'Site' LIMIT 1;
  IF v_site_id IS NULL THEN
    INSERT INTO public.metric_subcategories (category, name, sort_order) VALUES ('marketing', 'Site', 1) RETURNING id INTO v_site_id;
  END IF;

  SELECT id INTO v_instagram_id FROM public.metric_subcategories WHERE category = 'marketing' AND name = 'Instagram' LIMIT 1;
  IF v_instagram_id IS NULL THEN
    INSERT INTO public.metric_subcategories (category, name, sort_order) VALUES ('marketing', 'Instagram', 2) RETURNING id INTO v_instagram_id;
  END IF;

  SELECT id INTO v_outras_redes_id FROM public.metric_subcategories WHERE category = 'marketing' AND name = 'Outras Redes Sociais' LIMIT 1;
  IF v_outras_redes_id IS NULL THEN
    INSERT INTO public.metric_subcategories (category, name, sort_order) VALUES ('marketing', 'Outras Redes Sociais', 3) RETURNING id INTO v_outras_redes_id;
  END IF;

  SELECT id INTO v_parceiros_id FROM public.metric_subcategories WHERE category = 'marketing' AND name = 'Parceiros' LIMIT 1;
  IF v_parceiros_id IS NULL THEN
    INSERT INTO public.metric_subcategories (category, name, sort_order) VALUES ('marketing', 'Parceiros', 4) RETURNING id INTO v_parceiros_id;
  END IF;

  SELECT id INTO v_eventos_id FROM public.metric_subcategories WHERE category = 'marketing' AND name = 'Eventos' LIMIT 1;
  IF v_eventos_id IS NULL THEN
    INSERT INTO public.metric_subcategories (category, name, sort_order) VALUES ('marketing', 'Eventos', 5) RETURNING id INTO v_eventos_id;
  END IF;

  -- Ensure Eventos metrics exist and are assigned
  -- 1) Participação em Eventos
  SELECT id INTO v_metric_id FROM public.metrics WHERE name = 'Participação em Eventos' AND category = 'marketing' LIMIT 1;
  IF v_metric_id IS NULL THEN
    INSERT INTO public.metrics (name, category, division, target_value, current_value, unit, description, polarity)
    VALUES ('Participação em Eventos', 'marketing', 'marketing', 0, 0, 'un', 'Quantidade de eventos com participação', 'higher_is_better')
    RETURNING id INTO v_metric_id;
  END IF;
  INSERT INTO public.metric_subcategory_assignments (metric_id, subcategory_id, sort_order)
  VALUES (v_metric_id, v_eventos_id, 1)
  ON CONFLICT (metric_id) DO UPDATE SET subcategory_id = EXCLUDED.subcategory_id, sort_order = EXCLUDED.sort_order;

  -- 2) Palestras ministradas
  SELECT id INTO v_metric_id FROM public.metrics WHERE name = 'Palestras ministradas' AND category = 'marketing' LIMIT 1;
  IF v_metric_id IS NULL THEN
    INSERT INTO public.metrics (name, category, division, target_value, current_value, unit, description, polarity)
    VALUES ('Palestras ministradas', 'marketing', 'marketing', 0, 0, 'un', 'Quantidade de palestras ministradas', 'higher_is_better')
    RETURNING id INTO v_metric_id;
  END IF;
  INSERT INTO public.metric_subcategory_assignments (metric_id, subcategory_id, sort_order)
  VALUES (v_metric_id, v_eventos_id, 2)
  ON CONFLICT (metric_id) DO UPDATE SET subcategory_id = EXCLUDED.subcategory_id, sort_order = EXCLUDED.sort_order;

  -- 3) Viagens realizadas
  SELECT id INTO v_metric_id FROM public.metrics WHERE name = 'Viagens realizadas' AND category = 'marketing' LIMIT 1;
  IF v_metric_id IS NULL THEN
    INSERT INTO public.metrics (name, category, division, target_value, current_value, unit, description, polarity)
    VALUES ('Viagens realizadas', 'marketing', 'marketing', 0, 0, 'un', 'Quantidade de viagens realizadas', 'higher_is_better')
    RETURNING id INTO v_metric_id;
  END IF;
  INSERT INTO public.metric_subcategory_assignments (metric_id, subcategory_id, sort_order)
  VALUES (v_metric_id, v_eventos_id, 3)
  ON CONFLICT (metric_id) DO UPDATE SET subcategory_id = EXCLUDED.subcategory_id, sort_order = EXCLUDED.sort_order;

END $$;
