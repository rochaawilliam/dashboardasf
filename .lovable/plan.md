# Plan: Synchronize Churn and Health Score with NPS Pulse

Synchronize "Churn de Clientes" with the external "NPS Pulse" project and create a new "Health Score" card in the Satisfação do cliente line, also sourced from the same project.

## User Review Required

> [!IMPORTANT]
> - The sync relies on the external project `@project:ea380fd6-a007-4c8e-937e-5ca6fbe8828f` ("NPS Pulse").
> - I will verify if the "Health Score" metric exists in the backend; if not, I'll create it.

## Proposed Changes

### Backend (Supabase)

#### Database Schema
- Ensure the `Health Score` metric exists in the `public.metrics` table under the `experiencia_cliente` (Satisfação do cliente) category.
- Update descriptions for `Churn de Clientes` and `Health Score` to reflect their source.

#### Edge Function: `sync-pipeline-data`
- Update the function to fetch `Health Score` and `Churn` data from the external NPS Pulse project.
- Map these new external values to the local metric IDs.

### Frontend (React)

#### Dashboard View (`src/pages/Index.tsx`)
- Update data mapping to ensure the new values from the sync payload are correctly displayed in the dashboard cards.
- Ensure the "Health Score" card is positioned correctly in the "Satisfação do cliente" subcategory.

## Technical Details
- External Source: `ea380fd6-a007-4c8e-937e-5ca6fbe8828f.supabase.co`.
- Metric mapping in `sync-pipeline-data` will be updated to include the new keys.
- RLS and Grants will be maintained for consistent access.
