-- Update metrics to reflect NPS Pulse source
UPDATE public.metrics
SET description = 'Net Promoter Score (Pulse)'
WHERE id = 'f7b32bc5-7f37-4470-a52d-4cc8c096a2a5';

UPDATE public.metrics
SET description = 'Employee Net Promoter Score (Pulse)'
WHERE id = 'bfc3fbed-ec18-4009-a6ba-20c7f3ec184b';
