-- Rename "Receita Total Mensal" to "Receita Bruta Operacional"
UPDATE public.metrics
SET 
  name = 'Receita Bruta Operacional',
  description = 'Valor do faturamento total mensal bruto da operação. Fonte: Pipeline Vision Board.'
WHERE id = 'b94952b3-b811-4200-872e-810b215240f6';

-- Create "Fluxo de Caixa Operacional"
INSERT INTO public.metrics (
  id,
  name,
  category,
  description,
  unit,
  polarity,
  target_value,
  current_value
) VALUES (
  'd2f3a4b5-c6d7-4e8f-9a0b-1c2d3e4f5a6b',
  'Fluxo de Caixa Operacional',
  'lucratividade',
  'Valor total recebido pelo caixa no mês. Vinculado ao resultado mensal da planilha DRE.',
  'currency',
  'higher_is_better',
  0,
  0
);

-- Assign to subcategory "Receita Total" (ID: 9569a194-9ef0-43f1-beea-94608dfe378c)
INSERT INTO public.metric_subcategory_assignments (
  metric_id,
  subcategory_id,
  sort_order
) VALUES (
  'd2f3a4b5-c6d7-4e8f-9a0b-1c2d3e4f5a6b',
  '9569a194-9ef0-43f1-beea-94608dfe378c',
  2
);

-- Ensure sort order for "Receita Bruta Operacional" is first
UPDATE public.metric_subcategory_assignments
SET sort_order = 1
WHERE metric_id = 'b94952b3-b811-4200-872e-810b215240f6'
  AND subcategory_id = '9569a194-9ef0-43f1-beea-94608dfe378c';