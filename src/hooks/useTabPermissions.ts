import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useUserRole } from "./useUserRole";
import { toast } from "@/hooks/use-toast";

export type TabKey = 
  | "lucratividade" 
  | "execucao_comercial" 
  | "experiencia_cliente" 
  | "produtividade" 
  | "gestao_pessoas" 
  | "aprendizado_crescimento";

export const ALL_TABS: TabKey[] = [
  "lucratividade",
  "execucao_comercial",
  "experiencia_cliente",
  "produtividade",
  "gestao_pessoas",
  "aprendizado_crescimento",
];

export const TAB_LABELS: Record<TabKey, string> = {
  lucratividade: "Lucratividade",
  execucao_comercial: "Execução Comercial",
  experiencia_cliente: "Gestão de Crescimento",
  produtividade: "Produtividade",
  gestao_pessoas: "Gestão de Pessoas",
  aprendizado_crescimento: "Aprendizado e Crescimento",
};

interface TabPermission {
  id: string;
  user_id: string;
  tab_key: string;
  created_at: string;
  granted_by: string | null;
}

export function useUserTabPermissions() {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();

  const { data: permissions, isLoading } = useQuery({
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

  // Admins have access to all tabs
  const allowedTabs: TabKey[] = isAdmin 
    ? ALL_TABS 
    : (permissions?.map(p => p.tab_key as TabKey) || []);

  const hasTabAccess = (tabKey: TabKey): boolean => {
    if (isAdmin) return true;
    return allowedTabs.includes(tabKey);
  };

  return { 
    allowedTabs, 
    hasTabAccess, 
    isLoading,
    isAdmin,
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
    queryKey: ["userTabPermissions", userId],
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

// Mutation to update user tab permissions
export function useUpdateTabPermissions() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ userId, tabs }: { userId: string; tabs: TabKey[] }) => {
      // First, delete all existing permissions for this user
      const { error: deleteError } = await supabase
        .from("user_tab_permissions")
        .delete()
        .eq("user_id", userId);
      
      if (deleteError) throw deleteError;

      // Then, insert new permissions
      if (tabs.length > 0) {
        const newPermissions = tabs.map(tab => ({
          user_id: userId,
          tab_key: tab,
          granted_by: user?.id || null,
        }));

        const { error: insertError } = await supabase
          .from("user_tab_permissions")
          .insert(newPermissions);
        
        if (insertError) throw insertError;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["userTabPermissions", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["allTabPermissions"] });
      toast({
        title: "Permissões atualizadas",
        description: "As permissões de abas foram salvas com sucesso.",
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
