-- =====================================================
-- User Tab Permissions Table
-- Allows admins to control which tabs each user can view
-- =====================================================

-- Create table for user tab permissions
CREATE TABLE public.user_tab_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tab_key text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  granted_by uuid,
  UNIQUE (user_id, tab_key)
);

-- Enable RLS
ALTER TABLE public.user_tab_permissions ENABLE ROW LEVEL SECURITY;

-- Policies: Users can read their own permissions, admins can manage all
CREATE POLICY "Users can view their own tab permissions"
ON public.user_tab_permissions FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all tab permissions"
ON public.user_tab_permissions FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert tab permissions"
ON public.user_tab_permissions FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update tab permissions"
ON public.user_tab_permissions FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete tab permissions"
ON public.user_tab_permissions FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));