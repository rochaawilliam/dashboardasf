
-- Replace the overly permissive INSERT policy with one that only allows the trigger functions
DROP POLICY "System can insert audit_log" ON public.audit_log;

-- No direct INSERT by users - only SECURITY DEFINER functions can insert
-- Since triggers run as SECURITY DEFINER, they bypass RLS anyway
-- So we can safely deny all direct inserts
CREATE POLICY "No direct inserts to audit_log"
  ON public.audit_log FOR INSERT TO authenticated
  WITH CHECK (false);
