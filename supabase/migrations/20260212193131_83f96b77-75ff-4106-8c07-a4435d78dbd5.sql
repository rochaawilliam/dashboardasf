
-- Create "Total de Contratos" metric
INSERT INTO public.metrics (id, name, category, unit, target_value, current_value, description)
VALUES ('d3e4f5a6-b7c8-9012-cdef-234567890abc', 'Total de Contratos', 'experiencia_cliente', 'número', 72, 0, 'Soma de todos os contratos ativos e novos');

-- Monthly targets: Jan=39, Feb=41, Mar=43, Apr=49, May=51, Jun=54, Jul=57, Aug=60, Sep=64, Oct=66, Nov=69, Dec=72
INSERT INTO public.monthly_targets (metric_id, year, month, target_value) VALUES
('d3e4f5a6-b7c8-9012-cdef-234567890abc', 2025, 1, 39),
('d3e4f5a6-b7c8-9012-cdef-234567890abc', 2025, 2, 41),
('d3e4f5a6-b7c8-9012-cdef-234567890abc', 2025, 3, 43),
('d3e4f5a6-b7c8-9012-cdef-234567890abc', 2025, 4, 49),
('d3e4f5a6-b7c8-9012-cdef-234567890abc', 2025, 5, 51),
('d3e4f5a6-b7c8-9012-cdef-234567890abc', 2025, 6, 54),
('d3e4f5a6-b7c8-9012-cdef-234567890abc', 2025, 7, 57),
('d3e4f5a6-b7c8-9012-cdef-234567890abc', 2025, 8, 60),
('d3e4f5a6-b7c8-9012-cdef-234567890abc', 2025, 9, 64),
('d3e4f5a6-b7c8-9012-cdef-234567890abc', 2025, 10, 66),
('d3e4f5a6-b7c8-9012-cdef-234567890abc', 2025, 11, 69),
('d3e4f5a6-b7c8-9012-cdef-234567890abc', 2025, 12, 72);
