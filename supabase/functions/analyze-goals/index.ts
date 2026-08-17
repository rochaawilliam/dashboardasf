import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";

interface MetricInput {
  name: string;
  unit: string;
  value: number;
  target: number;
  progress: number;
  polarity?: string;
  description?: string; // Nova propriedade para conceito/cálculo
}

interface Payload {
  tabTitle: string;
  periodLabel: string;
  dayOfMonth?: number;
  daysInMonth?: number;
  overall: number;
  metrics: MetricInput[];
}

Deno.serve(async (req) => {
  const pre = handleCorsOptions(req);
  if (pre) return pre;
  const cors = { ...getCorsHeaders(req), "Content-Type": "application/json" };

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "missing_api_key" }), { status: 500, headers: cors });
    }

    const body = (await req.json()) as Payload;
    // Envia métricas mais relevantes e agora inclui a descrição se disponível
    const all = (body.metrics ?? []).slice();
    all.sort((a, b) => a.progress - b.progress);
    const metrics = all.length > 20 ? [...all.slice(0, 14), ...all.slice(-6)] : all;

    const lines = metrics
      .map(
        (m) =>
          `- ${m.name}: ${m.value}${m.unit ?? ""} / meta ${m.target} = ${Math.round(m.progress)}%${m.polarity === "lower_is_better" ? " (menor é melhor)" : ""}${m.description ? `\n  Conceito/Cálculo: ${m.description}` : ""}`,
      )
      .join("\n");

    const prompt = `Você é um analista de performance de um escritório de advocacia (ASF).
Analise as metas indutoras da área "${body.tabTitle}" no período ${body.periodLabel}.
${body.dayOfMonth && body.daysInMonth ? `Estamos no dia ${body.dayOfMonth} de ${body.daysInMonth} do mês (${Math.round((body.dayOfMonth / body.daysInMonth) * 100)}% do mês decorrido).` : ""}
Desempenho geral consolidado: ${Math.round(body.overall)}%.

Métricas e seus conceitos/cálculos:
${lines || "Sem métricas com meta definida."}

Escreva em português do Brasil, tom executivo e direto. Responda em markdown com exatamente três seções, nesta ordem e com estes títulos exatos:
**Panorama** — 2 a 3 frases sobre a situação geral, considerando o ritmo esperado para o dia do mês. Mencione brevemente o que os indicadores representam se for relevante para a análise.
**Pontos de melhoria** — 3 a 4 bullets objetivos, citando as métricas mais críticas.
**Checklist de ações corretivas** — 4 a 6 bullets curtos no formato "- [ ] Ação ..." (imperativo e específico).

Máximo de 180 palavras no total. Não invente números que não estejam acima.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-lite",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 800,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      const status = res.status === 429 || res.status === 402 ? res.status : 500;
      return new Response(JSON.stringify({ error: errText || "gateway_error" }), { status, headers: cors });
    }

    const json = await res.json();
    const text: string = json?.choices?.[0]?.message?.content ?? "";

    return new Response(JSON.stringify({ analysis: text.trim() }), { headers: cors });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: getCorsHeaders(req) });
  }
});
