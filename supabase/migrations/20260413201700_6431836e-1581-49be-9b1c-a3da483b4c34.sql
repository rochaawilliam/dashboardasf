-- Novas métricas para Time ASF (gestao_pessoas)

-- Engajamento
INSERT INTO public.metrics (id, name, category, unit, target_value, current_value, polarity, description)
VALUES 
  ('a1b2c3d4-1001-4000-a001-000000000001', 'Headcount Ativo', 'gestao_pessoas', 'un', 10, 2, 'higher_is_better',
   'Total de colaboradores com status Ativo no quadro da empresa. Fonte: planilha de colaboradores.');

-- Desenvolvimento
INSERT INTO public.metrics (id, name, category, unit, target_value, current_value, polarity, description)
VALUES 
  ('a1b2c3d4-1001-4000-a001-000000000002', 'Horas de Treinamento', 'gestao_pessoas', 'hrs', 120, 0, 'higher_is_better',
   'Total acumulado de horas de treinamento concluídas por todos os colaboradores. Calculado pela soma da coluna "Carga Horária" dos módulos com status "Concluído". Meta anual por colaborador. Fonte: planilha de treinamentos.'),
  ('a1b2c3d4-1001-4000-a001-000000000003', 'Módulos Concluídos', 'gestao_pessoas', 'un', 24, 0, 'higher_is_better',
   'Quantidade total de módulos de treinamento finalizados com status "Concluído". Fonte: planilha de treinamentos.'),
  ('a1b2c3d4-1001-4000-a001-000000000004', 'Taxa de Certificação', 'gestao_pessoas', '%', 80, 0, 'higher_is_better',
   'Percentual de módulos concluídos que geraram certificado. Fórmula: (Módulos com Certificado = "Sim" / Total de Módulos Concluídos) × 100. Fonte: planilha de treinamentos.');

-- Retenção
INSERT INTO public.metrics (id, name, category, unit, target_value, current_value, polarity, description)
VALUES 
  ('a1b2c3d4-1001-4000-a001-000000000005', 'Tempo Médio de Casa', 'gestao_pessoas', 'meses', 24, 0, 'higher_is_better',
   'Média de meses entre a data de admissão e a data atual dos colaboradores ativos. Fonte: planilha de colaboradores.');

-- Vincular métricas às subcategorias existentes
INSERT INTO public.metric_subcategory_assignments (metric_id, subcategory_id, sort_order) VALUES
  -- Headcount -> Engajamento
  ('a1b2c3d4-1001-4000-a001-000000000001', 'bd84f5f2-b332-4dfd-8dc2-a29d3de0ec34', 0),
  -- Horas, Módulos, Certificação -> Desenvolvimento
  ('a1b2c3d4-1001-4000-a001-000000000002', '8478eb6a-50de-4149-a135-9afafe0c0367', 0),
  ('a1b2c3d4-1001-4000-a001-000000000003', '8478eb6a-50de-4149-a135-9afafe0c0367', 1),
  ('a1b2c3d4-1001-4000-a001-000000000004', '8478eb6a-50de-4149-a135-9afafe0c0367', 2),
  -- Tempo Médio de Casa -> Retenção de Talentos
  ('a1b2c3d4-1001-4000-a001-000000000005', '2b3ad8de-cfd1-439f-9115-76b6a6b8db2b', 0);

-- Gerar monthly_targets para as novas métricas
DO $$
DECLARE
  _metric RECORD;
  _is_rate BOOLEAN;
  _monthly_val NUMERIC;
  _yr INT;
  _mo INT;
BEGIN
  FOR _metric IN 
    SELECT id, name, unit, target_value 
    FROM public.metrics 
    WHERE id IN (
      'a1b2c3d4-1001-4000-a001-000000000001',
      'a1b2c3d4-1001-4000-a001-000000000002',
      'a1b2c3d4-1001-4000-a001-000000000003',
      'a1b2c3d4-1001-4000-a001-000000000004',
      'a1b2c3d4-1001-4000-a001-000000000005'
    )
  LOOP
    _is_rate := (_metric.unit IN ('%', 'meses', 'un') AND _metric.name IN ('Headcount Ativo', 'Taxa de Certificação', 'Tempo Médio de Casa'));
    
    IF _is_rate THEN
      _monthly_val := _metric.target_value;
    ELSE
      _monthly_val := ROUND(_metric.target_value / 12, 2);
    END IF;

    FOR _yr IN 2025..2027 LOOP
      FOR _mo IN 1..12 LOOP
        INSERT INTO public.monthly_targets (metric_id, year, month, target_value)
        VALUES (_metric.id, _yr, _mo, _monthly_val)
        ON CONFLICT (metric_id, year, month) DO NOTHING;
      END LOOP;
    END LOOP;
  END LOOP;
END $$;
