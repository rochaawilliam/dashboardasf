UPDATE public.monthly_targets mt
SET target_value = s.total, updated_at = now()
FROM (
  SELECT mt2.month, SUM(mt2.target_value) AS total
  FROM public.monthly_targets mt2
  JOIN public.metrics m ON m.id = mt2.metric_id
  WHERE mt2.year = 2026 AND m.name IN (
    'Novos Contratos Empresarial Assessoria','Novos Contratos Empresarial Consultoria',
    'Novos Contratos Trabalhista Assessoria','Novos Contratos Trabalhista Consultoria',
    'Novos Contratos Tributário Assessoria','Novos Contratos Tributário Consultoria')
  GROUP BY mt2.month
) s
WHERE mt.metric_id = 'd3e4f5a6-b7c8-9012-cdef-234567890abc'
  AND mt.year = 2026 AND mt.month = s.month AND mt.target_value <> s.total;