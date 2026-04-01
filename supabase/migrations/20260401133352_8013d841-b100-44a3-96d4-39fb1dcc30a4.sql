-- 1. Rename subcategories
UPDATE metric_subcategories SET name = 'Contratos Assessoria', sort_order = 1 WHERE id = '150fe28b-8a95-4736-a35d-dab3f5668e16';
UPDATE metric_subcategories SET name = 'Contratos Consultoria', sort_order = 2 WHERE id = '04ebc074-99d1-4a31-8052-5c30275de07e';

-- 2. Delete old "Contratos - Tributário" and "Contratos Totais" subcategories
DELETE FROM metric_subcategory_assignments WHERE subcategory_id IN ('dc94dc37-1e16-498d-a27f-8283f963cc27', '9931926d-3559-4e9a-82d2-5c2e87ed8f9f');
DELETE FROM metric_subcategories WHERE id IN ('dc94dc37-1e16-498d-a27f-8283f963cc27', '9931926d-3559-4e9a-82d2-5c2e87ed8f9f');

-- 3. Clear old assignments from renamed subcategories
DELETE FROM metric_subcategory_assignments WHERE subcategory_id IN ('150fe28b-8a95-4736-a35d-dab3f5668e16', '04ebc074-99d1-4a31-8052-5c30275de07e');

-- 4. Assign Assessoria metrics to "Contratos Assessoria"
INSERT INTO metric_subcategory_assignments (metric_id, subcategory_id, sort_order) VALUES
('f80d5c78-cf50-4aca-befb-5808b6557d8e', '150fe28b-8a95-4736-a35d-dab3f5668e16', 1),
('ae64d582-a08d-442c-998e-b6bc214e486e', '150fe28b-8a95-4736-a35d-dab3f5668e16', 2),
('a1102d97-a2a6-44d6-8ac7-716cc1474d16', '150fe28b-8a95-4736-a35d-dab3f5668e16', 3);

-- 5. Assign Consultoria metrics to "Contratos Consultoria"
INSERT INTO metric_subcategory_assignments (metric_id, subcategory_id, sort_order) VALUES
('90726f8c-8cf7-47d8-81b6-c6f22c4eeef5', '04ebc074-99d1-4a31-8052-5c30275de07e', 1),
('0ffeaffb-ab3c-4371-be5b-172f57160ec4', '04ebc074-99d1-4a31-8052-5c30275de07e', 2),
('95280373-3e3b-4596-b2c4-ce8e01ee1b2c', '04ebc074-99d1-4a31-8052-5c30275de07e', 3);

-- 6. Move Total de Contratos to Crescimento Comercial
INSERT INTO metric_subcategory_assignments (metric_id, subcategory_id, sort_order) VALUES
('d3e4f5a6-b7c8-9012-cdef-234567890abc', 'f740e740-90af-4b5a-9a1b-37d7f7a55b78', 0);