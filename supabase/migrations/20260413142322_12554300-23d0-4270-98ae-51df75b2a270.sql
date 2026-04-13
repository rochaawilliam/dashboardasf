
-- Rename Lucratividade to Lucratividade Mensal
UPDATE metrics SET name = 'Lucratividade Mensal' WHERE id = '5d9ddf5d-2b10-48f6-baf0-3a2da4025bbc';

-- Create Lucratividade Anual metric
INSERT INTO metrics (name, category, unit, target_value, current_value, polarity, description)
VALUES ('Lucratividade Anual', 'lucratividade', '%', 30.00, 0, 'higher_is_better', 'Média anual da lucratividade mensal');

-- Assign to same subcategory (Indicadores de Rentabilidade), sort after Lucratividade Mensal
INSERT INTO metric_subcategory_assignments (metric_id, subcategory_id, sort_order)
SELECT m.id, '388ad3f2-172c-42d0-b25e-9ecb22b34e5d', 2
FROM metrics m WHERE m.name = 'Lucratividade Anual';
