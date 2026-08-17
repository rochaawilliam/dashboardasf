INSERT INTO public.month_snapshots (year, month, source, payload, auto_closed, closed_at)
VALUES (2026, 8, 'financial_cashflow', '{
  "months": {
    "recebimentos_dinheiro_pix": 108459.97,
    "total_recebimentos": 108459.97,
    "total_pagamentos": 0,
    "folha_total": 0,
    "custo_fixo_total": 0,
    "lucratividade_pct": 0,
    "folha_sobre_receita_pct": 0,
    "custo_fixo_sobre_receita_pct": 0,
    "boleto_total": 0
  }
}'::jsonb, true, NOW());

-- Also ensure monthly_targets is 0 for this month/metric
INSERT INTO public.monthly_targets (metric_id, month, year, target_value)
VALUES ('d2f3a4b5-c6d7-4e8f-9a0b-1c2d3e4f5a6b', 8, 2026, 0)
ON CONFLICT (metric_id, month, year) DO UPDATE SET target_value = 0;