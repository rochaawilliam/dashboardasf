
-- Add Total de Contratos to the skip list in sync trigger
CREATE OR REPLACE FUNCTION public.sync_monthly_targets_on_metric_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  is_rate_metric BOOLEAN;
  monthly_val NUMERIC;
  yr INT;
  mo INT;
BEGIN
  IF OLD.target_value = NEW.target_value THEN
    RETURN NEW;
  END IF;

  -- Skip metrics with custom monthly targets
  IF NEW.name ILIKE '%Receita Total%' OR NEW.name ILIKE '%Total de Contratos%' OR NEW.name ILIKE '%Ticket Médio%' THEN
    RETURN NEW;
  END IF;

  is_rate_metric := (
    NEW.unit IN ('%', 'x', 'pts', ' pts', 'pontos', 'dias', 'meses', ' anos') OR
    NEW.name ILIKE '%Ticket Médio%' OR
    NEW.name ILIKE '%LTV%' OR
    NEW.name ILIKE '%Receita por Colaborador%' OR
    NEW.name ILIKE '%Taxa%' OR
    NEW.name ILIKE '%NPS%' OR
    NEW.name ILIKE '%ENPS%' OR
    NEW.name ILIKE '%Capacidade%' OR
    NEW.name ILIKE '%IC Médio%' OR
    NEW.name ILIKE '%Total Contratos Ativos%' OR
    NEW.name ILIKE '%Lifetime%' OR
    NEW.name ILIKE '%Lead Time%' OR
    NEW.name ILIKE '%Churn%' OR
    NEW.name ILIKE '%Inadimplência%' OR
    NEW.name ILIKE '%Lucratividade%' OR
    NEW.name ILIKE '%Margem%' OR
    NEW.name ILIKE '%MRR%' OR
    NEW.name ILIKE '%ARR%' OR
    NEW.name ILIKE '%Folha sobre%' OR
    NEW.name ILIKE '%Custo Fixo%' OR
    NEW.name ILIKE '%Cumprimento%' OR
    NEW.name ILIKE '%SLA%' OR
    NEW.name ILIKE '%Turnover%'
  );

  IF is_rate_metric THEN
    monthly_val := NEW.target_value;
  ELSE
    monthly_val := ROUND(NEW.target_value / 12, 2);
  END IF;

  FOR yr IN EXTRACT(YEAR FROM NOW())::INT .. (EXTRACT(YEAR FROM NOW())::INT + 1) LOOP
    FOR mo IN 1..12 LOOP
      INSERT INTO public.monthly_targets (metric_id, year, month, target_value)
      VALUES (NEW.id, yr, mo, monthly_val)
      ON CONFLICT (metric_id, year, month) 
      DO UPDATE SET target_value = monthly_val, updated_at = NOW();
    END LOOP;
  END LOOP;

  RETURN NEW;
END;
$function$;

-- Restore correct monthly targets for Total de Contratos 2026
UPDATE public.monthly_targets SET target_value = CASE month
  WHEN 1 THEN 7 WHEN 2 THEN 7 WHEN 3 THEN 7 WHEN 4 THEN 11
  WHEN 5 THEN 11 WHEN 6 THEN 12 WHEN 7 THEN 13 WHEN 8 THEN 14
  WHEN 9 THEN 16 WHEN 10 THEN 16 WHEN 11 THEN 17 WHEN 12 THEN 18
END
WHERE metric_id='d3e4f5a6-b7c8-9012-cdef-234567890abc' AND year=2026;
