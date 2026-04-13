UPDATE public.metrics
SET description = 'Média de dias entre a data de entrada e a data atual dos clientes com 100% de conclusão no Onboarding Compass. Fonte: integração automática com o projeto Onboarding Compass.'
WHERE id = '0fa037ef-7740-4670-a7e8-f2efe4753472';

UPDATE public.metrics
SET description = 'Percentual de etapas concluídas dentro do prazo (data de conclusão ≤ data planejada). Fonte: integração automática com o projeto Onboarding Compass.'
WHERE id = '7fd92316-a980-4f41-b3f7-a8c126808e6c';