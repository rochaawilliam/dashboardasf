INSERT INTO public.metric_subcategory_assignments (metric_id, subcategory_id, sort_order)
VALUES ('a1b2c3d4-1001-4000-a001-000000000006', 'bd84f5f2-b332-4dfd-8dc2-a29d3de0ec34', 1)
ON CONFLICT (metric_id) DO UPDATE SET subcategory_id = EXCLUDED.subcategory_id, sort_order = EXCLUDED.sort_order;

-- Move ENPS to sort_order 2
UPDATE public.metric_subcategory_assignments
SET sort_order = 2
WHERE metric_id = 'bfc3fbed-ec18-4009-a6ba-20c7f3ec184b';