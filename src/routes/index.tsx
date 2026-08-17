import { useState, useCallback, useMemo, useEffect } from "react";
import { ChevronDown, ChevronUp, Users as UsersDropdown } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { parseLocalDate, getRefMonthYear } from "@/utils/dateUtils";
import { formatNumber } from "@/utils/formatters";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { sanitizeError } from "@/lib/error-handler";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { AuditPanel } from "@/components/dashboard/AuditPanel";
import { MetricCardMonthly } from "@/components/dashboard/MetricCardMonthly";
import { CircularProgressCard } from "@/components/dashboard/CircularProgressCard";
import { MetricDrilldownDialog } from "@/components/dashboard/MetricDrilldownDialog";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { GoalsPerformanceAnalysis } from "@/components/dashboard/GoalsPerformanceAnalysis";
import { SubcategoryHeader } from "@/components/dashboard/SubcategoryHeader";
import { TrainingCardEditable } from "@/components/dashboard/TrainingCardEditable";
import { TrainingDashboard as TrainingDashboardComponent } from "@/components/dashboard/TrainingDashboard";
import { MetricChart } from "@/components/dashboard/MetricChart";
import { PrintStyles } from "@/components/dashboard/PrintStyles";
import { MonthSelector } from "@/components/dashboard/MonthSelector";
import { MobileDrawer } from "@/components/dashboard/MobileDrawer";
import { SwipeableTabs } from "@/components/dashboard/SwipeableTabs";

import { CommissionTab, TridentIcon } from "@/components/dashboard/CommissionTab";
import { SDRCommissionTab } from "@/components/dashboard/SDRCommissionTab";
import { useOfflineCache, usePendingMutations, useOnlineStatus } from "@/hooks/useOfflineMode";
import { SyncStatusFooter } from "@/components/dashboard/SyncStatusFooter";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { organizeMetricsBySubcategory } from "@/utils/metricOrganizer";
import { useSubcategories, useSubcategoryAssignments, useUpdateAssignment } from "@/hooks/useSubcategories";
import { SubcategoryManagerDialog } from "@/components/dashboard/SubcategoryManagerDialog";
import { DraggableCardWrapper } from "@/components/dashboard/DraggableCardWrapper";
import { DndContext, DragEndEvent, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import { useAllRitualCompletions, CUMPRIMENTO_RITUAIS_ID, RITUAIS_ASF_ID, RITUAIS_CRESCIMENTO_ID, RITUAIS_JURIDICO_ID, ALL_RITUAL_IDS, getTotalExpected, getActiveRituals } from "@/hooks/useRitualCompletions";
import {
  DollarSign,
  Users,
  Zap,
  Rocket,
  Lock,
  LogIn,
  Target,
  TrendingUp,
  Settings2,
  Move,
  Eye,
  EyeOff,
  Globe,
  Building2,
  Layers } from
"lucide-react";
import { SalesFunnel } from "@/components/dashboard/SalesFunnel";
import { usePipelineData } from "@/hooks/usePipelineData";
import { useTrafficFunnelData } from "@/hooks/useTrafficFunnelData";
import { useFinancialCashflowData } from "@/hooks/useFinancialCashflowData";
import {
  useMetrics,
  useMetricHistory,
  useTrainingHours,
  useMonthlyTargets,
  type Filters,
  type MetricCategory } from
"@/hooks/useMetrics";
import { useMetricNotifications } from "@/hooks/useMetricNotifications";
import { useUserTabPermissions } from "@/hooks/useTabPermissions";
import { useAuth } from "@/hooks/useAuth";

const categoryConfig: Record<string, {title: string;shortTitle: string;subtitle: string;icon: any;variant: "primary" | "accent" | "success" | "warning";}> = {
  lucratividade: {
    title: "Financeiro",
    shortTitle: "Financeiro",
    subtitle: "Aumentar lucratividade e margem do negócio",
    icon: DollarSign,
    variant: "primary"
  },
  experiencia_cliente: {
    title: "Crescimento",
    shortTitle: "Crescimento",
    subtitle: "Acompanhar crescimento comercial e gestão de carteira",
    icon: Rocket,
    variant: "accent"
  },
  produtividade: {
    title: "Jurídico",
    shortTitle: "Jurídico",
    subtitle: "Garantir eficiência do time jurídico",
    icon: Zap,
    variant: "warning"
  },
  gestao_pessoas: {
    title: "Time ASF",
    shortTitle: "Time ASF",
    subtitle: "Construir um time estável, produtivo e engajado",
    icon: Users,
    variant: "success"
  },
};

const categoryOrder: MetricCategory[] = [
"experiencia_cliente",
"produtividade",
"gestao_pessoas",
"lucratividade"];

/**
 * com as informações das planilhas financeiras compartilhadas e as demais fontes de dados, quais cards da aba Financeiro eu consigo calcular e apresentar nos cards?
 */

const Index = () => {
  return null;
}
export default Index;
