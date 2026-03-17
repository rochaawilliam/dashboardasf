import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function insertAuditLog(
  supabaseAdmin: ReturnType<typeof createClient>,
  params: {
    table_name: string;
    record_id: string;
    action: string;
    old_value?: Record<string, unknown> | null;
    new_value?: Record<string, unknown> | null;
    user_id: string;
    metric_name?: string | null;
    description: string;
  }
) {
  // Get user display name
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("display_name")
    .eq("user_id", params.user_id)
    .single();

  const { error } = await supabaseAdmin.from("audit_log").insert({
    table_name: params.table_name,
    record_id: params.record_id,
    action: params.action,
    old_value: params.old_value || null,
    new_value: params.new_value || null,
    user_id: params.user_id,
    metric_name: params.metric_name || null,
    description: params.description,
    user_display_name: profile?.display_name || null,
  });

  if (error) {
    console.error("Error inserting audit log:", error);
  }
}
