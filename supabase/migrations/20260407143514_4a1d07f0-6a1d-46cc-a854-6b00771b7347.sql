
-- Rename existing subcategory
UPDATE metric_subcategories SET name = 'Ticket Médio Assessoria' WHERE id = '3b3eac88-08f9-437a-93cb-e49425f13f0c';

-- Shift subcategories after sort_order 9 to make room
UPDATE metric_subcategories SET sort_order = sort_order + 1 WHERE category = 'lucratividade' AND sort_order >= 10;

-- Create new subcategory for Consultoria
INSERT INTO metric_subcategories (id, category, name, sort_order)
VALUES ('a1b2c3d4-1111-2222-3333-444455556666', 'lucratividade', 'Ticket Médio Consultoria', 10);

-- Move consultoria tickets to new subcategory
UPDATE metric_subcategory_assignments SET subcategory_id = 'a1b2c3d4-1111-2222-3333-444455556666', sort_order = 0 WHERE metric_id = '29568b33-b3e7-4f5d-b3a1-85da7fd19c91';
UPDATE metric_subcategory_assignments SET subcategory_id = 'a1b2c3d4-1111-2222-3333-444455556666', sort_order = 1 WHERE metric_id = '6fa5a98b-7531-4c2e-893b-f878df35ff1b';
UPDATE metric_subcategory_assignments SET subcategory_id = 'a1b2c3d4-1111-2222-3333-444455556666', sort_order = 2 WHERE metric_id = '2185212f-d509-4405-a861-91efe05dc23d';
