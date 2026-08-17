import { supabase } from "@/integrations/supabase/client";

const METRIC_ID = "8602a4c6-6e6a-456d-b1bd-10d99671bdaa";

const TARGETS = [
  { month: 1, target: 7418.18 },
  { month: 2, target: 7800.00 },
  { month: 3, target: 8133.33 },
  { month: 4, target: 9528.27 },
  { month: 5, target: 9780.00 },
  { month: 6, target: 13740.00 },
  { month: 7, target: 11662.50 },
  { month: 8, target: 11923.53 },
  { month: 9, target: 11621.05 },
  { month: 10, target: 13694.74 },
  { month: 11, target: 14168.48 },
  { month: 12, target: 17226.32 },
];

export async function updateCollaboratorRevenueTargets() {
  console.log("Updating targets for Receita por Colaborador...");
  
  for (const item of TARGETS) {
    const { error } = await supabase
      .from("monthly_targets")
      .update({ target_value: item.target })
      .eq("metric_id", METRIC_ID)
      .eq("month", item.month)
      .eq("year", 2026);
      
    if (error) {
      console.error(`Error updating month ${item.month}:`, error);
    } else {
      console.log(`Updated month ${item.month} to ${item.target}`);
    }
  }
}
