import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useUserRole } from "./useUserRole";
import { toast } from "@/hooks/use-toast";

export type TabKey = 
  | "lucratividade" 
  | "execucao_comercial" 
  | "experiencia_cliente" 
  | "marketing"
  | "administrativo"
  | "produtividade" 
  | "gestao_pessoas" 
  | "aprendizado_crescimento";

export type PermissionType = "view" | "edit" | "delete";

export const ALL_TABS: TabKey[] = [
  "lucratividade",
  "execucao_comercial",
  "experiencia_cliente",
  "marketing",
  "administrativo",
  "produtividade",
  "gestao_pessoas",
  "aprendizado_crescimento",
];

export const TAB_LABELS: Record<TabKey, string> = {
  lucratividade: "Financeiro",
  execucao_comercial: "Crescimento",
  experiencia_cliente: "Crescimento",
  marketing: "Marketing",
  administrativo: "Administrativo",
  produtividade: "Jurídico",
  gestao_pessoas: "Pessoas",
  aprendizado_crescimento: "Pessoas",
};

export const PERMISSION_LABELS: Record<PermissionType, string> = {
  view: "Visualizar",
  edit: "Editar",
  delete: "Apagar",
};

export interface TabPermission {
  id: string;
  user_id: string;
  tab_key: string;
  permission_type: PermissionType;
  created_at: string;
  granted_by: string | null;
}

export interface TabPermissionSet {
  view: boolean;
  edit: boolean;
  delete: boolean;
}

export function useUserTabPermissions() {
  const { user } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useUserRole();

  const { data: permissions, isLoading: permissionsLoading } = useQuery({
    queryKey: ["userTabPermissions", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("user_tab_permissions")
        .select("*")
        .eq("user_id", user.id);
      
      if (error) throw error;
      return data as TabPermission[];
    },
    enabled: !!user?.id,
  });

  // If not logged in, no access to any tab
  const isAuthenticated = !!user;

  // Get tabs that user can view
  const allowedTabs: TabKey[] = !isAuthenticated 
    ? [] 
    : isAdmin 
      ? ALL_TABS 
      : [...new Set(permissions?.filter(p => p.permission_type === "view").map(p => p.tab_key as TabKey) || [])];

  const hasTabAccess = (tabKey: TabKey, permissionType: PermissionType = "view"): boolean => {
    if (!isAuthenticated) return false;
    if (isAdmin) return true;
    return permissions?.some(p => p.tab_key === tabKey && p.permission_type === permissionType) || false;
  };

  const getTabPermissions = (tabKey: TabKey): TabPermissionSet => {
    if (!isAuthenticated) return { view: false, edit: false, delete: false };
    if (isAdmin) return { view: true, edit: true, delete: true };
    return {
      view: permissions?.some(p => p.tab_key === tabKey && p.permission_type === "view") || false,
      edit: permissions?.some(p => p.tab_key === tabKey && p.permission_type === "edit") || false,
      delete: permissions?.some(p => p.tab_key === tabKey && p.permission_type === "delete") || false,
    };
  };

  return { 
    allowedTabs, 
    hasTabAccess, 
    getTabPermissions,
    isLoading: permissionsLoading || roleLoading,
    isAdmin,
    isAuthenticated,
  };
}

// Hook for admin to manage all user permissions
export function useAllTabPermissions() {
  return useQuery({
    queryKey: ["allTabPermissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_tab_permissions")
        .select("*");
      
      if (error) throw error;
      return data as TabPermission[];
    },
  });
}

// Hook for admin to get permissions for a specific user
export function useUserTabPermissionsForAdmin(userId: string | null) {
  return useQuery({
    queryKey: ["adminUserTabPermissions", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from("user_tab_permissions")
        .select("*")
        .eq("user_id", userId);
      
      if (error) throw error;
      return data as TabPermission[];
    },
    enabled: !!userId,
  });
}

// Mutation to update user tab permissions with granular actions
export function useUpdateTabPermissions() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ userId, permissions }: { userId: string; permissions: Record<TabKey, TabPermissionSet> }) => {
      // First, delete all existing permissions for this user
      const { error: deleteError } = await supabase
        .from("user_tab_permissions")
        .delete()
        .eq("user_id", userId);
      
      if (deleteError) throw deleteError;

      // Build new permissions array
      const newPermissions: { user_id: string; tab_key: string; permission_type: PermissionType; granted_by: string | null }[] = [];
      
      for (const [tabKey, permSet] of Object.entries(permissions)) {
        if (permSet.view) {
          newPermissions.push({
            user_id: userId,
            tab_key: tabKey,
            permission_type: "view",
            granted_by: user?.id || null,
          });
        }
        if (permSet.edit) {
          newPermissions.push({
            user_id: userId,
            tab_key: tabKey,
            permission_type: "edit",
            granted_by: user?.id || null,
          });
        }
        if (permSet.delete) {
          newPermissions.push({
            user_id: userId,
            tab_key: tabKey,
            permission_type: "delete",
            granted_by: user?.id || null,
          });
        }
      }

      // Insert new permissions
      if (newPermissions.length > 0) {
        const { error: insertError } = await supabase
          .from("user_tab_permissions")
          .insert(newPermissions);
        
        if (insertError) throw insertError;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["adminUserTabPermissions", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["userTabPermissions", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["allTabPermissions"] });
      toast({
        title: "Permissões atualizadas",
        description: "As permissões foram salvas com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar permissões",
        description: error.message || "Não foi possível atualizar as permissões.",
        variant: "destructive",
      });
    },
  });
}
