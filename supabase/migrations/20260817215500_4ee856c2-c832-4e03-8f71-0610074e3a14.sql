-- Add Health Score metric and update Churn description
INSERT INTO public.metrics (
    id,
    name,
    category,
    target_value,
    current_value,
    unit,
    description,
    polarity
) VALUES (
    'e6e6e6e6-1111-4eee-aaaa-111111111111',
    'Health Score',
    'experiencia_cliente',
    80,
    0,
    'pts',
    'Health Score do cliente. Fonte: integração automática com o projeto NPS Pulse.',
    'higher_is_better'
) ON CONFLICT (id) DO UPDATE SET
    description = EXCLUDED.description,
    name = EXCLUDED.name;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.metrics TO authenticated;
GRANT ALL ON public.metrics TO service_role;

UPDATE public.metrics
SET description = 'Taxa de cancelamento de clientes. Fonte: integração automática com o projeto NPS Pulse.'
WHERE id = '94d12621-1574-4041-ace3-9a3b6c064b07';

-- Ensure subcategory assignment for Satisfação do Cliente (experiencia_cliente)
DO $$
DECLARE
    subcat_id uuid;
BEGIN
    SELECT id INTO subcat_id FROM public.metric_subcategories WHERE name = 'Satisfação do cliente' LIMIT 1;
    
    IF subcat_id IS NOT NULL THEN
        -- Assign Health Score
        INSERT INTO public.metric_subcategory_assignments (subcategory_id, metric_id, sort_order)
        VALUES (subcat_id, 'e6e6e6e6-1111-4eee-aaaa-111111111111', 10)
        ON CONFLICT (subcategory_id, metric_id) DO NOTHING;
        
        -- Ensure Churn is assigned too
        INSERT INTO public.metric_subcategory_assignments (subcategory_id, metric_id, sort_order)
        VALUES (subcat_id, '94d12621-1574-4041-ace3-9a3b6c064b07', 20)
        ON CONFLICT (subcategory_id, metric_id) DO NOTHING;
    END IF;
END $$;
