
-- Rename existing metrics
UPDATE metrics SET name = 'Leads no Funil Online' WHERE id = 'dc434066-4bd6-4c89-a22e-04ba5ea1dd9c';
UPDATE metrics SET name = 'Leads no Funil Offline' WHERE id = 'b2c3d4e5-3333-4bbb-cccc-333333333333';
UPDATE metrics SET name = 'Conversas Iniciadas pela IA' WHERE id = 'ca49be98-52c9-4da8-a580-6a681b54aeba';

-- Create Novos Leads Online
INSERT INTO metrics (id, name, category, unit, target_value, polarity, description)
VALUES (
  'e1f2a3b4-1111-4eee-ffff-111111111111',
  'Novos Leads Online',
  'execucao_comercial',
  'leads',
  0,
  'higher_is_better',
  'Leads cadastrados no mês atual no Pipeline (origem online). Diferente de Leads no Funil, que inclui leads transferidos de meses anteriores.'
);

-- Create Novos Leads Offline
INSERT INTO metrics (id, name, category, unit, target_value, polarity, description)
VALUES (
  'e1f2a3b4-2222-4eee-ffff-222222222222',
  'Novos Leads Offline',
  'execucao_comercial',
  'leads',
  0,
  'higher_is_better',
  'Leads cadastrados no mês atual no Pipeline (origem offline). Diferente de Leads no Funil, que inclui leads transferidos de meses anteriores.'
);
