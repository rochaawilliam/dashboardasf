
-- Create a function to sync monthly_targets when metrics.target_value changes
CREATE OR REPLACE FUNCTION public.sync_monthly_targets_on_metric_update()
RETURNS TRIGGER AS $$
DECLARE
  is_rate_metric BOOLEAN;
  monthly_val NUMERIC;
  yr INT;
  mo INT;
BEGIN
  -- Only run if target_value actually changed
  IF OLD.target_value = NEW.target_value THEN
    RETURN NEW;
  END IF;

  -- Determine if this is a rate metric (monthly = annual) or cumulative (monthly = annual/12)
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

  -- Update existing monthly_targets for current year and next year
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create the trigger
CREATE TRIGGER sync_monthly_targets_trigger
AFTER UPDATE OF target_value ON public.metrics
FOR EACH ROW
EXECUTE FUNCTION public.sync_monthly_targets_on_metric_update();
