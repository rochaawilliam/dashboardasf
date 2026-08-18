
-- 1. Rename and update the 'Folha sobre Receita' metric to 'Receita por Colaborador'
UPDATE public.metrics 
SET name = 'Receita por Colaborador', 
    unit = 'R$', 
    target_value = 0 
WHERE id = '966513fb-82c1-4565-8677-58dd7f4a90be';

-- 2. Clear 2026 targets for the main ID entry to avoid conflicts before migration
DELETE FROM public.monthly_targets 
WHERE metric_id = '966513fb-82c1-4565-8677-58dd7f4a90be' 
AND year = 2026;

-- 3. Migrate targets from the 'other' Receita por Colaborador entry to our main ID
UPDATE public.monthly_targets 
SET metric_id = '966513fb-82c1-4565-8677-58dd7f4a90be' 
WHERE metric_id = '8602a4c6-6e6a-456d-b1bd-10d99671bdaa' 
AND year = 2026;

-- 4. Delete the duplicate metric entry
DELETE FROM public.metrics 
WHERE id = '8602a4c6-6e6a-456d-b1bd-10d99671bdaa';

-- 5. Ensure target for Fluxo de Caixa Operacional for August 2026 is 0
UPDATE public.monthly_targets 
SET target_value = 0 
WHERE metric_id = 'd2f3a4b5-c6d7-4e8f-9a0b-1c2d3e4f5a6b' 
AND month = 8 
AND year = 2026;
