import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";

const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTsfH654wi4--vHND8IU2KvlQSEYcM3cTbO0s3Sdsu-n5If2TZ3ynEFP-p4G_TA-w/pub?gid=41664948&single=true&output=csv";

// Slug -> metric UUID (aba Marketing)
const METRIC_IDS: Record<string, string> = {
  "ativacoes com parceiros": "5c66b8e3-2c1a-4d84-bfe4-a1608e1f9f22",
  "parcerias formalizadas": "2b32e074-e78c-4bf3-a228-29ce95cb97e3",
  "postagens": "f5331c88-23c2-47b8-b35f-74f9d032fe54",
  "stories": "0410b12f-d5c8-4af6-ac3c-5a0b60b1000d",
  "seguidores (ganho liquido)": "b495c3d7-80f2-4cf5-94b4-97d8788901b2",
  "linkedin": "5027c638-ed07-4c0d-81fe-c1b51a5e8ed4",
  "e-mail marketing": "3c702de3-5981-49c5-a44a-3f82b311809e",
  "avaliacoes google meu negocio": "95317c7c-bf03-47d8-878a-a2c43cc7d5ac",
  "gravacoes (videomaker + social media)": "18046da8-481d-4108-8027-c1537521db2e",
  "blog": "872794b9-37d4-4fff-b4b4-2192492ed954",
  "visitas ao site": "e4b899d1-8b6b-4017-8b17-dda419c9a5f1",
  "engajamento do site": "33d37ba5-2494-4cea-908c-e0a9a1ed0d84",
};

const PERCENT_METRICS = new Set(["33d37ba5-2494-4cea-908c-e0a9a1ed0d84"]);

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") field += c;
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function parseNumber(raw: string): number | null {
  if (!raw) return null;
  let s = raw.replace(/[R$\s%]/g, "").trim();
  if (!s) return null;
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

Deno.serve(async (req) => {
  const pre = handleCorsOptions(req);
  if (pre) return pre;
  const cors = { ...getCorsHeaders(req), "Content-Type": "application/json" };

  try {
    const res = await fetch(SHEET_URL, { redirect: "follow" });
    if (!res.ok) {
      const body = await res.text();
      console.error(`Sheet fetch failed [${res.status}]: ${body.slice(0, 300)}`);
      return new Response(
        JSON.stringify({ error: "Sheet fetch failed", status: res.status }),
        { status: res.status, headers: cors },
      );
    }
    const rows = parseCsv(await res.text());

    // Locate header row (contains "Indicador")
    const headerIdx = rows.findIndex((r) => normalize(r[0] ?? "") === "indicador");
    if (headerIdx === -1) {
      return new Response(JSON.stringify({ error: "Header row not found" }), {
        status: 422,
        headers: cors,
      });
    }

    // months are columns 3..14 (Jan..Dez)
    const months: Record<string, Record<string, number>> = {};
    const definitions: Record<string, { unit: string; target: string }> = {};

    for (let i = headerIdx + 1; i < rows.length; i++) {
      const row = rows[i];
      const name = normalize(row[0] ?? "");
      if (!name) continue;
      const metricId = METRIC_IDS[name];
      if (!metricId) continue;

      definitions[metricId] = { unit: (row[1] ?? "").trim(), target: (row[2] ?? "").trim() };

      for (let m = 1; m <= 12; m++) {
        const value = parseNumber(row[2 + m] ?? "");
        if (value === null) continue;
        const key = String(m);
        months[key] ??= {};
        months[key][metricId] = value;
      }
    }

    // Accumulated: sum for counters, average of filled months for percentages
    const accumulated: Record<string, number> = {};
    const counts: Record<string, number> = {};
    Object.values(months).forEach((byMetric) => {
      Object.entries(byMetric).forEach(([id, v]) => {
        accumulated[id] = (accumulated[id] ?? 0) + v;
        counts[id] = (counts[id] ?? 0) + 1;
      });
    });
    Object.keys(accumulated).forEach((id) => {
      if (PERCENT_METRICS.has(id) && counts[id] > 0) {
        accumulated[id] = Math.round((accumulated[id] / counts[id]) * 100) / 100;
      }
    });

    return new Response(
      JSON.stringify({ months, accumulated, definitions, synced_at: new Date().toISOString() }),
      { headers: cors },
    );
  } catch (e) {
    console.error("sync-marketing-sheet error:", e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: cors });
  }
});
