
-- Allow service_role to insert into audit_log (edge functions use service_role which bypasses RLS, so this is already fine)
-- But we need a trigger for user_tab_permissions changes

CREATE OR REPLACE FUNCTION public.log_tab_permission_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _user_email text;
  _user_display_name text;
  _description text;
  _action text;
  _record_id uuid;
  _old_value jsonb;
  _new_value jsonb;
  _admin_display_name text;
BEGIN
  -- Get admin display name
  SELECT display_name INTO _admin_display_name FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;

  IF TG_OP = 'INSERT' THEN
    -- Get target user info
    SELECT display_name INTO _user_display_name FROM public.profiles WHERE user_id = NEW.user_id LIMIT 1;
    _action := 'create';
    _record_id := NEW.id;
    _old_value := NULL;
    _new_value := jsonb_build_object('tab_key', NEW.tab_key, 'permission_type', NEW.permission_type, 'user_display_name', COALESCE(_user_display_name, 'Usuário'));
    _description := 'Permissão concedida: ' || NEW.permission_type || ' em ' || NEW.tab_key || ' para ' || COALESCE(_user_display_name, 'Usuário');

    INSERT INTO public.audit_log (table_name, record_id, action, old_value, new_value, user_id, description, user_display_name)
    VALUES ('user_tab_permissions', _record_id, _action, _old_value, _new_value, auth.uid(), _description, _admin_display_name);
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    SELECT display_name INTO _user_display_name FROM public.profiles WHERE user_id = OLD.user_id LIMIT 1;
    _action := 'delete';
    _record_id := OLD.id;
    _old_value := jsonb_build_object('tab_key', OLD.tab_key, 'permission_type', OLD.permission_type, 'user_display_name', COALESCE(_user_display_name, 'Usuário'));
    _new_value := NULL;
    _description := 'Permissão removida: ' || OLD.permission_type || ' em ' || OLD.tab_key || ' de ' || COALESCE(_user_display_name, 'Usuário');

    INSERT INTO public.audit_log (table_name, record_id, action, old_value, new_value, user_id, description, user_display_name)
    VALUES ('user_tab_permissions', _record_id, _action, _old_value, _new_value, auth.uid(), _description, _admin_display_name);
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE TRIGGER log_tab_permission_changes_trigger
  AFTER INSERT OR DELETE ON public.user_tab_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.log_tab_permission_changes();
