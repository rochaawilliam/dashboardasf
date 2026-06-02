# Integração Financeiro × Google Sheets (Fluxo de Caixa)

## Como vai funcionar (visão do usuário)

1. Em **Perfil → Administração** aparece um novo painel **"Planilhas Financeiras"**:
   - Linha por mês (Jan–Dez/2026)
   - Campo para colar o **link CSV publicado** daquela aba (`...output=csv&gid=XXX`)
   - Botão "Sincronizar agora" e indicador "Última sincronização"
2. Os cards do **Financeiro** passam a exibir os valores da planilha automaticamente, com badge "Sincronizado da planilha" e ícone de origem (igual Pipeline/Tráfego). Lançamento manual fica desabilitado para esses cards.
3. Auto-sync a cada **10 min** + ao abrir a aba. Cache local (mesmo padrão do Tráfego).
4. Quando o mês for **fechado** no Fechamento Mensal, os valores ficam congelados — o que vier depois da planilha não altera mais.

## Métricas mapeadas (mês a mês)

| Card no Financeiro | Cálculo na planilha |
|---|---|
| Receita Total | Soma das linhas `Dinheiro` + `Pix` (Total do mês) |
| Custo Total (novo card) | `TOTAL DE PAGAMENTOS` (Total do mês) |
| Lucratividade Média | (Receita − Custo) / Receita × 100 |
| Folha sobre Receita | Soma de `Folha de Pagamento *` + `Bolsa Auxílio*` + encargos / Receita × 100 |

Se uma aba mensal não tiver link cadastrado, os cards daquele mês caem para o lançamento manual existente (fallback).

---

## Detalhes técnicos

### 1. Banco
- Nova tabela `financial_sheet_sources` (admin-only):
  - `year int`, `month int`, `csv_url text`, `last_synced_at timestamptz`, unique(year, month)
  - RLS: admin write, authenticated read; grants normais.
- Reaproveita `month_snapshots` (source = `financial_cashflow`) para congelamento.

### 2. Edge function `sync-financial-cashflow`
- Lê todos os `financial_sheet_sources` do ano.
- Para cada mês, faz `fetch` do CSV, parseia (parser BR para `R$ 1.234,56`), extrai:
  - `recebimentos_dinheiro_pix` (linha "Dinheiro" + "Pix", coluna `Total`)
  - `total_recebimentos`, `total_pagamentos`
  - `folha_total` (soma das linhas "Folha de Pagamento *", "Bolsa Auxílio*", "FGTS*", "INSS*", "Vale*", "Auxílio*")
- Devolve `{ months: { "2026-03": {...} }, year }`.
- Overlay de snapshots (mesmo padrão `sync-traffic-funnel`).
- Suporta `?skip_snapshots=1` para o fluxo de Fechamento Mensal.

### 3. Fechamento Mensal
- `close-month/index.ts`: adicionar `financial_cashflow` à lista de fontes congeladas (chama o sync com `skip_snapshots=1` e grava em `month_snapshots`).
- `MonthClosurePanel.tsx`: mostrar status também do `financial_cashflow`.

### 4. Frontend
- `src/hooks/useFinancialCashflowData.ts` — 10m TTL, padrão do `useTrafficFunnelData`.
- `src/components/dashboard/FinancialSheetsPanel.tsx` — admin UI (12 linhas, paste URL, salvar, sincronizar).
- Adicionar à aba **Profile → Administração**.
- Nos cards do Financeiro afetados (Receita Total, Custo Total, Lucratividade Média, Folha sobre Receita): se houver valor sincronizado para o mês selecionado, usar esse valor; mostrar ícone "🔗 Sincronizado". Lançamento manual fica bloqueado nesses cards (mensagem "Valor vem da planilha de Fluxo de Caixa").
- Criar a métrica "Custo Total" no Financeiro se ainda não existir.

### 5. Config
- Registrar nova função em `supabase/config.toml`.
- `cron` reaproveita o `auto-close-previous-month` (que agora também fecha financial_cashflow).

## Fora deste plano
- Separação Assessoria vs Consultoria (planilha não distingue) — Receita continua sendo agregada.
- Edição da planilha de dentro do app (continua sendo só leitura).

Pode confirmar para eu seguir?