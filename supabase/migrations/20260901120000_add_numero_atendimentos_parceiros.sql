-- Adiciona o card "Número de atendimentos por parceiros" em Marketing > Parceiros
DO $$
DECLARE
  v_parceiros_id uuid;
  v_metric_id uuid;
  v_sort_order integer;
BEGIN
  -- Garante que a subcategoria Parceiros exista na categoria marketing
  SELECT id INTO v_parceiros_id
  FROM public.metric_subcategories
  WHERE category = 'marketing' AND name = 'Parceiros'
  LIMIT 1;

  IF v_parceiros_id IS NULL THEN
    INSERT INTO public.metric_subcategories (category, name, sort_order)
    VALUES ('marketing', 'Parceiros', 4)
    RETURNING id INTO v_parceiros_id;
  END IF;

  -- Cria a métrica caso ainda não exista
  SELECT id INTO v_metric_id
  FROM public.metrics
  WHERE name = 'Número de atendimentos por parceiros' AND category = 'marketing'
  LIMIT 1;

  IF v_metric_id IS NULL THEN
    INSERT INTO public.metrics (name, category, division, target_value, current_value, unit, description, polarity)
    VALUES (
      'Número de atendimentos por parceiros',
      'marketing',
      'marketing',
      0,
      0,
      'un',
      'Quantidade de atendimentos realizados por parceiros no período',
      'higher_is_better'
    )
    RETURNING id INTO v_metric_id;
  END IF;

  -- Posiciona o novo card no final da subcategoria Parceiros
  SELECT COALESCE(MAX(sort_order), 0) + 1 INTO v_sort_order
  FROM public.metric_subcategory_assignments
  WHERE subcategory_id = v_parceiros_id;

  INSERT INTO public.metric_subcategory_assignments (metric_id, subcategory_id, sort_order)
  VALUES (v_metric_id, v_parceiros_id, v_sort_order)
  ON CONFLICT (metric_id) DO UPDATE
    SET subcategory_id = EXCLUDED.subcategory_id,
        sort_order = EXCLUDED.sort_order;
END $$;
