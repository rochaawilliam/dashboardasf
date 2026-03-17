
-- Add user_display_name column to audit_log
ALTER TABLE public.audit_log ADD COLUMN IF NOT EXISTS user_display_name text;

-- Update log_metric_history_changes to capture user display name
CREATE OR REPLACE FUNCTION public.log_metric_history_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _metric_name text;
  _metric_unit text;
  _description text;
  _action text;
  _record_id uuid;
  _old_value jsonb;
  _new_value jsonb;
  _user_display_name text;
BEGIN
  -- Get user display name
  SELECT display_name INTO _user_display_name FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;

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

  INSERT INTO public.audit_log (table_name, record_id, action, old_value, new_value, user_id, metric_name, metric_unit, description, user_display_name)
  VALUES ('metric_history', _record_id, _action, _old_value, _new_value, auth.uid(), _metric_name, _metric_unit, _description, _user_display_name);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$function$;

-- Update log_monthly_target_changes to capture user display name
CREATE OR REPLACE FUNCTION public.log_monthly_target_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _metric_name text;
  _metric_unit text;
  _description text;
  _action text;
  _record_id uuid;
  _old_value jsonb;
  _new_value jsonb;
  _month_names text[] := ARRAY['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  _user_display_name text;
BEGIN
  -- Get user display name
  SELECT display_name INTO _user_display_name FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;

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
    INSERT INTO public.audit_log (table_name, record_id, action, old_value, new_value, user_id, metric_name, metric_unit, description, user_display_name)
    VALUES ('monthly_targets', _record_id, _action, _old_value, _new_value, auth.uid(), _metric_name, _metric_unit, _description, _user_display_name);
    RETURN OLD;
  END IF;

  INSERT INTO public.audit_log (table_name, record_id, action, old_value, new_value, user_id, metric_name, metric_unit, description, user_display_name)
  VALUES ('monthly_targets', _record_id, _action, _old_value, _new_value, auth.uid(), _metric_name, _metric_unit, _description, _user_display_name);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$function$;
