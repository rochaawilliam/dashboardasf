import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SB_ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const SB_SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const SOURCES = ["pipeline", "traffic_funnel", "financial_cashflow"] as const;
type Source = (typeof SOURCES)[number];

function jsonResp(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function snapshotPipelineMonth(year: number, month: number) {
  const url = `${SB_URL}/functions/v1/sync-pipeline-data?year=${year}&month=${month}&skip_snapshots=1`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${SB_ANON}`,
      apikey: SB_ANON,
      "x-skip-snapshots": "1",
    },
  });
  if (!res.ok) throw new Error(`sync-pipeline-data failed: ${res.status}`);
  const p: any = await res.json();
  const ms = `${year}-${String(month).padStart(2, "0")}`;

  const slice: any = {
    months: p.months?.[ms],
    dashboard: p.dashboard?.[ms],
    dashboardByOrigin: p.dashboardByOrigin?.[ms],
    dashboardByOriginArea: p.dashboardByOriginArea?.[ms],
    novosByOriginArea: p.novosByOriginArea?.[ms],
    avgCloseDays: p.avgCloseDaysByMonth?.[ms],
    operational: p.operational?.[ms],
    cardNames: p.cardNames?.[ms],
    byArea: {},
    byAreaTag: {},
    cardNamesByArea: {},
    cardNamesByAreaTag: {},
    training: { byMonth: p.training?.byMonth?.[ms], byCollaboratorMonth: {} },
  };
  for (const a of Object.keys(p.byArea || {})) {
    if (p.byArea[a]?.[ms]) slice.byArea[a] = p.byArea[a][ms];
  }
  for (const a of Object.keys(p.byAreaTag || {})) {
    for (const t of Object.keys(p.byAreaTag[a] || {})) {
      if (p.byAreaTag[a][t]?.[ms]) {
        slice.byAreaTag[a] = slice.byAreaTag[a] || {};
        slice.byAreaTag[a][t] = p.byAreaTag[a][t][ms];
      }
    }
  }
  for (const a of Object.keys(p.cardNamesByArea || {})) {
    if (p.cardNamesByArea[a]?.[ms]) slice.cardNamesByArea[a] = p.cardNamesByArea[a][ms];
  }
  for (const a of Object.keys(p.cardNamesByAreaTag || {})) {
    for (const t of Object.keys(p.cardNamesByAreaTag[a] || {})) {
      if (p.cardNamesByAreaTag[a][t]?.[ms]) {
        slice.cardNamesByAreaTag[a] = slice.cardNamesByAreaTag[a] || {};
        slice.cardNamesByAreaTag[a][t] = p.cardNamesByAreaTag[a][t][ms];
      }
    }
  }
  for (const c of Object.keys(p.training?.byCollaboratorMonth || {})) {
    const v = p.training.byCollaboratorMonth[c]?.[ms];
    if (v !== undefined) slice.training.byCollaboratorMonth[c] = v;
  }
  return slice;
}

async function snapshotTrafficMonth(year: number, month: number) {
  const url = `${SB_URL}/functions/v1/sync-traffic-funnel?year=${year}&skip_snapshots=1`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${SB_ANON}`, apikey: SB_ANON, "x-skip-snapshots": "1" },
  });
  if (!res.ok) throw new Error(`sync-traffic-funnel failed: ${res.status}`);
  const p: any = await res.json();
  const ms = `${year}-${String(month).padStart(2, "0")}`;
  return { months: p.months?.[ms] ?? null };
}

async function snapshotCashflowMonth(year: number, month: number) {
  const url = `${SB_URL}/functions/v1/sync-financial-cashflow?year=${year}&skip_snapshots=1`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${SB_ANON}`, apikey: SB_ANON, "x-skip-snapshots": "1" },
  });
  if (!res.ok) throw new Error(`sync-financial-cashflow failed: ${res.status}`);
  const p: any = await res.json();
  const ms = `${year}-${String(month).padStart(2, "0")}`;
  return { months: p.months?.[ms] ?? null };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const action: "close" | "reopen" = body.action === "reopen" ? "reopen" : "close";
    const auto = !!body.auto;
    const year = Number(body.year);
    const month = Number(body.month);
    const sources: Source[] = Array.isArray(body.sources) && body.sources.length
      ? body.sources.filter((s: string) => (SOURCES as readonly string[]).includes(s))
      : [...SOURCES];

    if (!year || !month || month < 1 || month > 12) {
      return jsonResp({ error: "Invalid year/month" }, 400);
    }

    // Auth: must be admin unless auto (cron) with service role bearer
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization") || "";
    if (auto) {
      const token = authHeader.replace(/^Bearer\s+/i, "");
      if (token !== SB_SERVICE) return jsonResp({ error: "Unauthorized" }, 401);
    } else {
      if (!authHeader) return jsonResp({ error: "Unauthorized" }, 401);
      const userClient = createClient(SB_URL, SB_ANON, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: userData, error: uerr } = await userClient.auth.getUser();
      if (uerr || !userData?.user) return jsonResp({ error: "Unauthorized" }, 401);
      userId = userData.user.id;
      const { data: isAdmin } = await userClient.rpc("has_role", {
        _user_id: userId,
        _role: "admin",
      });
      if (!isAdmin) return jsonResp({ error: "Forbidden" }, 403);
    }

    const admin = createClient(SB_URL, SB_SERVICE);

    if (action === "reopen") {
      for (const source of sources) {
        await admin.from("month_snapshots").delete().match({ source, year, month });
      }
      return jsonResp({ ok: true, reopened: { year, month, sources } });
    }

    // Close: snapshot live data per source
    const results: Record<string, { ok: boolean; skipped?: boolean; error?: string }> = {};
    for (const source of sources) {
      try {
        if (auto) {
          const { data: existing } = await admin
            .from("month_snapshots")
            .select("id")
            .match({ source, year, month })
            .maybeSingle();
          if (existing) {
            results[source] = { ok: true, skipped: true };
            continue;
          }
        }
        const payload =
          source === "pipeline"
            ? await snapshotPipelineMonth(year, month)
            : source === "traffic_funnel"
              ? await snapshotTrafficMonth(year, month)
              : await snapshotCashflowMonth(year, month);
        const { error } = await admin
          .from("month_snapshots")
          .upsert(
            {
              source,
              year,
              month,
              payload,
              closed_by: userId,
              auto_closed: auto,
              closed_at: new Date().toISOString(),
            },
            { onConflict: "source,year,month" }
          );
        if (error) throw error;
        results[source] = { ok: true };
      } catch (e) {
        console.error(`close ${source} failed`, e);
        results[source] = { ok: false, error: (e as Error).message };
      }
    }

    return jsonResp({ ok: true, year, month, results });
  } catch (err) {
    console.error("close-month error", err);
    return jsonResp({ error: (err as Error).message }, 500);
  }
});
