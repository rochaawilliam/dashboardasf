import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";

interface MetricInput {
  name: string;
  unit: string;
  value: number;
  target: number;
  progress: number;
  polarity?: string;
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
    const metrics = (body.metrics ?? []).slice(0, 60);

    const lines = metrics
      .map(
        (m) =>
          `- ${m.name}: realizado ${m.value} ${m.unit ?? ""} | meta ${m.target} | atingimento ${Math.round(m.progress)}%${m.polarity === "lower_is_better" ? " (quanto menor, melhor)" : ""}`,
      )
      .join("\n");

    const prompt = `Você é um analista de performance de um escritório de advocacia (ASF).
Analise as metas indutoras da área "${body.tabTitle}" no período ${body.periodLabel}.
${body.dayOfMonth && body.daysInMonth ? `Estamos no dia ${body.dayOfMonth} de ${body.daysInMonth} do mês (${Math.round((body.dayOfMonth / body.daysInMonth) * 100)}% do mês decorrido).` : ""}
Desempenho geral consolidado: ${Math.round(body.overall)}%.

Métricas:
${lines || "Sem métricas com meta definida."}

Escreva em português do Brasil, tom executivo e direto. Responda em markdown com exatamente três seções, nesta ordem e com estes títulos exatos:
**Panorama** — 2 a 3 frases sobre a situação geral, considerando o ritmo esperado para o dia do mês.
**Pontos de melhoria** — 3 a 4 bullets objetivos, citando as métricas mais críticas.
**Checklist de ações corretivas** — 4 a 6 bullets curtos no formato "- [ ] Ação ..." (imperativo e específico).
Máximo de 220 palavras no total. Não invente números que não estejam acima.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "openai/gpt-5.6-sol",
        input: prompt,
        stream: true,
        reasoning: { effort: "low", summary: "auto" },
      }),
    });

    if (!res.ok || !res.body) {
      const errText = await res.text().catch(() => "");
      const status = res.status === 429 || res.status === 402 ? res.status : 500;
      return new Response(JSON.stringify({ error: errText || "gateway_error" }), { status, headers: cors });
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let text = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n");
      buffer = parts.pop() ?? "";
      for (const line of parts) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const data = trimmed.slice(5).trim();
        if (!data || data === "[DONE]") continue;
        try {
          const evt = JSON.parse(data);
          if (evt.type === "response.output_text.delta" && typeof evt.delta === "string") {
            text += evt.delta;
          } else if (evt.type === "response.completed" && !text) {
            text = evt.response?.output_text ?? "";
          }
        } catch {
          // ignore partial frames
        }
      }
    }

    return new Response(JSON.stringify({ analysis: text.trim() }), { headers: cors });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: getCorsHeaders(req) });
  }
});
