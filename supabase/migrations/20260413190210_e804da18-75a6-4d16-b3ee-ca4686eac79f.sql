
-- Delete "Média de Ações/Dia" and "Comentários por Lead" and their related data
DELETE FROM metric_subcategory_assignments WHERE metric_id IN ('d1e2f3a4-1111-4ddd-eeee-111111111111', 'd1e2f3a4-4444-4ddd-eeee-444444444444');
DELETE FROM metric_history WHERE metric_id IN ('d1e2f3a4-1111-4ddd-eeee-111111111111', 'd1e2f3a4-4444-4ddd-eeee-444444444444');
DELETE FROM monthly_targets WHERE metric_id IN ('d1e2f3a4-1111-4ddd-eeee-111111111111', 'd1e2f3a4-4444-4ddd-eeee-444444444444');
DELETE FROM metrics WHERE id IN ('d1e2f3a4-1111-4ddd-eeee-111111111111', 'd1e2f3a4-4444-4ddd-eeee-444444444444');
