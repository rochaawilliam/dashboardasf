import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { sanitizeError } from "@/lib/error-handler";
import type { MetricCategory } from "@/hooks/useMetrics";

export interface Subcategory {
  id: string;
  category: string;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface SubcategoryAssignment {
  id: string;
  metric_id: string;
  subcategory_id: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export function useSubcategories() {
  return useQuery({
    queryKey: ["metric_subcategories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("metric_subcategories")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as Subcategory[];
    },
  });
}

export function useSubcategoryAssignments() {
  return useQuery({
    queryKey: ["metric_subcategory_assignments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("metric_subcategory_assignments")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as SubcategoryAssignment[];
    },
  });
}

export function useCreateSubcategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ category, name, sort_order }: { category: string; name: string; sort_order: number }) => {
      const { data, error } = await supabase
        .from("metric_subcategories")
        .insert({ category, name, sort_order })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metric_subcategories"] });
      toast({ title: "Subcategoria criada" });
    },
    onError: (error) => {
      toast({ title: "Erro", description: sanitizeError(error), variant: "destructive" });
    },
  });
}

export function useUpdateSubcategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name, sort_order }: { id: string; name?: string; sort_order?: number }) => {
      const updateData: { name?: string; sort_order?: number } = {};
      if (name !== undefined) updateData.name = name;
      if (sort_order !== undefined) updateData.sort_order = sort_order;
      const { data, error } = await supabase
        .from("metric_subcategories")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metric_subcategories"] });
      toast({ title: "Subcategoria atualizada" });
    },
    onError: (error) => {
      toast({ title: "Erro", description: sanitizeError(error), variant: "destructive" });
    },
  });
}

export function useDeleteSubcategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("metric_subcategories")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metric_subcategories"] });
      queryClient.invalidateQueries({ queryKey: ["metric_subcategory_assignments"] });
      toast({ title: "Subcategoria excluída" });
    },
    onError: (error) => {
      toast({ title: "Erro", description: sanitizeError(error), variant: "destructive" });
    },
  });
}

export function useUpdateAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ metric_id, subcategory_id, sort_order }: { metric_id: string; subcategory_id: string; sort_order: number }) => {
      // Upsert: delete existing, then insert
      await supabase.from("metric_subcategory_assignments").delete().eq("metric_id", metric_id);
      const { data, error } = await supabase
        .from("metric_subcategory_assignments")
        .insert({ metric_id, subcategory_id, sort_order })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metric_subcategory_assignments"] });
    },
    onError: (error) => {
      toast({ title: "Erro ao mover", description: sanitizeError(error), variant: "destructive" });
    },
  });
}

export function useBulkUpdateAssignments() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (assignments: { metric_id: string; subcategory_id: string; sort_order: number }[]) => {
      // Delete all existing assignments for affected metrics
      const metricIds = assignments.map((a) => a.metric_id);
      if (metricIds.length > 0) {
        const { error: delError } = await supabase
          .from("metric_subcategory_assignments")
          .delete()
          .in("metric_id", metricIds);
        if (delError) throw delError;
      }
      // Insert new
      if (assignments.length > 0) {
        const { error } = await supabase
          .from("metric_subcategory_assignments")
          .insert(assignments);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metric_subcategory_assignments"] });
      toast({ title: "Organização salva" });
    },
    onError: (error) => {
      toast({ title: "Erro ao salvar", description: sanitizeError(error), variant: "destructive" });
    },
  });
}

export function useBulkReorderSubcategories() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: { id: string; sort_order: number }[]) => {
      for (const u of updates) {
        const { error } = await supabase
          .from("metric_subcategories")
          .update({ sort_order: u.sort_order })
          .eq("id", u.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metric_subcategories"] });
      toast({ title: "Ordem atualizada" });
    },
    onError: (error) => {
      toast({ title: "Erro", description: sanitizeError(error), variant: "destructive" });
    },
  });
}
