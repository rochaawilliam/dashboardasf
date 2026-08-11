import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version, x-supabase-api-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PIPELINE_INGEST_URL = "https://lhkdxtefbbpktdqenify.supabase.co/functions/v1/ingest-task";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);

  const token = Deno.env.get("TASK_INGEST_TOKEN")?.trim();
  if (!token) {
    return json(
      { error: "Integração não configurada: token de tarefas ausente." },
      500,
    );
  }

  // Autenticação: apenas usuários logados podem enviar tarefas
  const authHeader = req.headers.get("Authorization") ?? "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "");
  if (!jwt) return json({ error: "Não autenticado" }, 401);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
  );
  const { data: userData, error: userError } = await supabase.auth.getUser(jwt);
  if (userError || !userData?.user) return json({ error: "Não autenticado" }, 401);

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "JSON inválido" }, 400);
  }

  const rawItems: unknown[] = Array.isArray(payload?.tasks) ? payload.tasks : [];
  const context = typeof payload?.context === "string" ? payload.context.trim() : "";
  const dueAt = typeof payload?.due_at === "string" ? payload.due_at : null;

  const items = rawItems
    .map((t: any) => (typeof t === "string" ? { title: t } : t))
    .map((t: any) => ({
      title: String(t?.title ?? "").replace(/\*\*/g, "").trim().slice(0, 255),
      description: typeof t?.description === "string" ? t.description : null,
    }))
    .filter((t) => t.title.length > 0);

  if (items.length === 0) return json({ error: "Nenhuma tarefa para enviar" }, 400);
  if (items.length > 100) return json({ error: "Máximo de 100 tarefas por envio" }, 400);

  const stamp = new Date().toISOString().slice(0, 10);
  const tasks = items.map((t) => ({
    title: t.title,
    description:
      t.description ??
      (context ? `Ação corretiva gerada na Análise de Desempenho — ${context}` : null),
    priority: "media",
    due_at: dueAt,
    company_slug: "asf",
    // assigned_to omitido de propósito: a tarefa entra sem responsável,
    // para que qualquer usuário do Pipeline possa assumi-la.
    source_key: `dashboard-asf:${slugify(context || "analise")}:${stamp}:${slugify(t.title)}`,
  }));

  const res = await fetch(PIPELINE_INGEST_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-task-token": token },
    body: JSON.stringify({ tasks, company_slug: "asf" }),
  });

  const text = await res.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = { raw: text };
  }

  if (!res.ok) {
    console.error("ingest-task falhou:", res.status, text);
    return json({ error: "Falha ao enviar tarefas ao Pipeline", details: parsed }, res.status);
  }

  return json({ ok: true, ...(parsed as Record<string, unknown>) });
});
