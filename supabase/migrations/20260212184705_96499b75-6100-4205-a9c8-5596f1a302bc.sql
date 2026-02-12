
-- Create "Contratos Empresariais Mês Anterior" metric
INSERT INTO public.metrics (name, category, target_value, current_value, unit, description)
VALUES 
  ('Contratos Empresariais Mês Anterior', 'experiencia_cliente', 0, 0, 'contratos', 'Soma dos contratos empresariais (Assessoria + Consultoria) do mês anterior. Valor calculado automaticamente.'),
  ('Contratos Trabalhista Mês Anterior', 'experiencia_cliente', 0, 0, 'contratos', 'Soma dos contratos trabalhistas (Assessoria + Consultoria) do mês anterior. Valor calculado automaticamente.');
