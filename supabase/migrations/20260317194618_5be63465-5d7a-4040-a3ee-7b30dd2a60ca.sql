
-- Create audit_log table
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  old_value jsonb,
  new_value jsonb,
  user_id uuid,
  metric_name text,
  metric_unit text,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read
CREATE POLICY "Authenticated users can read audit_log"
  ON public.audit_log FOR SELECT TO authenticated
  USING (true);

-- System (triggers) insert via security definer functions
CREATE POLICY "System can insert audit_log"
  ON public.audit_log FOR INSERT TO authenticated
  WITH CHECK (true);

-- Trigger function for metric_history changes
CREATE OR REPLACE FUNCTION public.log_metric_history_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _metric_name text;
  _metric_unit text;
  _description text;
  _action text;
  _record_id uuid;
  _old_value jsonb;
  _new_value jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT name, unit INTO _metric_name, _metric_unit FROM public.metrics WHERE id = NEW.metric_id;
    _action := 'create';
    _record_id := NEW.id;
    _old_value := NULL;
    _new_value := jsonb_build_object('value', NEW.value, 'recorded_at', NEW.recorded_at, 'period_type', NEW.period_type, 'comment', NEW.comment, 'source', NEW.source);
    _description := 'Lançamento criado: ' || COALESCE(_metric_name, 'Métrica') || ' = ' || NEW.value;
  ELSIF TG_OP = 'UPDATE' THEN
    SELECT name, unit INTO _metric_name, _metric_unit FROM public.metrics WHERE id = NEW.metric_id;
    _action := 'update';
    _record_id := NEW.id;
    _old_value := jsonb_build_object('value', OLD.value, 'recorded_at', OLD.recorded_at, 'period_type', OLD.period_type, 'comment', OLD.comment, 'source', OLD.source);
    _new_value := jsonb_build_object('value', NEW.value, 'recorded_at', NEW.recorded_at, 'period_type', NEW.period_type, 'comment', NEW.comment, 'source', NEW.source);
    _description := 'Lançamento editado: ' || COALESCE(_metric_name, 'Métrica') || ' de ' || OLD.value || ' para ' || NEW.value;
  ELSIF TG_OP = 'DELETE' THEN
    SELECT name, unit INTO _metric_name, _metric_unit FROM public.metrics WHERE id = OLD.metric_id;
    _action := 'delete';
    _record_id := OLD.id;
    _old_value := jsonb_build_object('value', OLD.value, 'recorded_at', OLD.recorded_at, 'period_type', OLD.period_type, 'comment', OLD.comment, 'source', OLD.source);
    _new_value := NULL;
    _description := 'Lançamento excluído: ' || COALESCE(_metric_name, 'Métrica') || ' = ' || OLD.value;
  END IF;

  INSERT INTO public.audit_log (table_name, record_id, action, old_value, new_value, user_id, metric_name, metric_unit, description)
  VALUES ('metric_history', _record_id, _action, _old_value, _new_value, auth.uid(), _metric_name, _metric_unit, _description);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger function for monthly_targets changes
CREATE OR REPLACE FUNCTION public.log_monthly_target_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _metric_name text;
  _metric_unit text;
  _description text;
  _action text;
  _record_id uuid;
  _old_value jsonb;
  _new_value jsonb;
  _month_names text[] := ARRAY['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
BEGIN
  SELECT name, unit INTO _metric_name, _metric_unit FROM public.metrics WHERE id = NEW.metric_id;

  IF TG_OP = 'INSERT' THEN
    _action := 'create';
    _record_id := NEW.id;
    _old_value := NULL;
    _new_value := jsonb_build_object('target_value', NEW.target_value, 'month', NEW.month, 'year', NEW.year);
    _description := 'Meta criada: ' || COALESCE(_metric_name, 'Métrica') || ' ' || _month_names[NEW.month] || '/' || NEW.year || ' = ' || NEW.target_value;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.target_value = NEW.target_value THEN
      RETURN NEW;
    END IF;
    _action := 'update';
    _record_id := NEW.id;
    _old_value := jsonb_build_object('target_value', OLD.target_value, 'month', OLD.month, 'year', OLD.year);
    _new_value := jsonb_build_object('target_value', NEW.target_value, 'month', NEW.month, 'year', NEW.year);
    _description := 'Meta alterada: ' || COALESCE(_metric_name, 'Métrica') || ' ' || _month_names[NEW.month] || '/' || NEW.year || ' de ' || OLD.target_value || ' para ' || NEW.target_value;
  ELSIF TG_OP = 'DELETE' THEN
    SELECT name, unit INTO _metric_name, _metric_unit FROM public.metrics WHERE id = OLD.metric_id;
    _action := 'delete';
    _record_id := OLD.id;
    _old_value := jsonb_build_object('target_value', OLD.target_value, 'month', OLD.month, 'year', OLD.year);
    _new_value := NULL;
    _description := 'Meta excluída: ' || COALESCE(_metric_name, 'Métrica') || ' ' || _month_names[OLD.month] || '/' || OLD.year;
    INSERT INTO public.audit_log (table_name, record_id, action, old_value, new_value, user_id, metric_name, metric_unit, description)
    VALUES ('monthly_targets', _record_id, _action, _old_value, _new_value, auth.uid(), _metric_name, _metric_unit, _description);
    RETURN OLD;
  END IF;

  INSERT INTO public.audit_log (table_name, record_id, action, old_value, new_value, user_id, metric_name, metric_unit, description)
  VALUES ('monthly_targets', _record_id, _action, _old_value, _new_value, auth.uid(), _metric_name, _metric_unit, _description);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- Create triggers on metric_history
CREATE TRIGGER audit_metric_history_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.metric_history
  FOR EACH ROW EXECUTE FUNCTION public.log_metric_history_changes();

-- Create triggers on monthly_targets
CREATE TRIGGER audit_monthly_target_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.monthly_targets
  FOR EACH ROW EXECUTE FUNCTION public.log_monthly_target_changes();
