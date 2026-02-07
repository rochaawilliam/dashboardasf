-- =====================================================
-- Upgrade Tab Permissions to Include Actions
-- =====================================================

-- Add permission_type column to distinguish view/edit/delete
ALTER TABLE public.user_tab_permissions 
ADD COLUMN IF NOT EXISTS permission_type text NOT NULL DEFAULT 'view';

-- Add constraint for valid permission types
ALTER TABLE public.user_tab_permissions 
DROP CONSTRAINT IF EXISTS user_tab_permissions_permission_type_check;

ALTER TABLE public.user_tab_permissions 
ADD CONSTRAINT user_tab_permissions_permission_type_check 
CHECK (permission_type IN ('view', 'edit', 'delete'));

-- Update unique constraint to include permission_type
ALTER TABLE public.user_tab_permissions 
DROP CONSTRAINT IF EXISTS user_tab_permissions_user_id_tab_key_key;

ALTER TABLE public.user_tab_permissions 
ADD CONSTRAINT user_tab_permissions_user_id_tab_key_permission_key 
UNIQUE (user_id, tab_key, permission_type);