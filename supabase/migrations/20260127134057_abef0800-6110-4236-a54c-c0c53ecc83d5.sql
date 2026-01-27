-- Create enum for metric categories
CREATE TYPE public.metric_category AS ENUM (
  'lucratividade',
  'experiencia_cliente',
  'produtividade',
  'gestao_pessoas',
  'aprendizado_crescimento'
);

-- Create enum for divisions
CREATE TYPE public.division AS ENUM (
  'juridico',
  'crescimento',
  'marketing',
  'administrativo'
);

-- Create metrics table to store all KPIs
CREATE TABLE public.metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category metric_category NOT NULL,
  division division,
  target_value DECIMAL(10,2) NOT NULL,
  current_value DECIMAL(10,2) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT '%',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create historical data table for charts
CREATE TABLE public.metric_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_id UUID NOT NULL REFERENCES public.metrics(id) ON DELETE CASCADE,
  value DECIMAL(10,2) NOT NULL,
  recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,
  period_type TEXT NOT NULL DEFAULT 'monthly', -- monthly, quarterly, yearly
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create training hours table
CREATE TABLE public.training_hours (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role TEXT NOT NULL,
  target_hours DECIMAL(5,2) NOT NULL,
  current_hours DECIMAL(5,2) NOT NULL DEFAULT 0,
  division division,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metric_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_hours ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (dashboard is public)
CREATE POLICY "Allow public read access to metrics"
  ON public.metrics FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to metric_history"
  ON public.metric_history FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to training_hours"
  ON public.training_hours FOR SELECT
  USING (true);

-- Create policies for public insert/update (for now, later can add auth)
CREATE POLICY "Allow public insert to metrics"
  ON public.metrics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to metrics"
  ON public.metrics FOR UPDATE
  USING (true);

CREATE POLICY "Allow public insert to metric_history"
  ON public.metric_history FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public insert to training_hours"
  ON public.training_hours FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to training_hours"
  ON public.training_hours FOR UPDATE
  USING (true);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_metrics_updated_at
  BEFORE UPDATE ON public.metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_training_hours_updated_at
  BEFORE UPDATE ON public.training_hours
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial metrics data
INSERT INTO public.metrics (name, category, division, target_value, current_value, unit, description) VALUES
  ('Cumprimento de Orçamento', 'lucratividade', NULL, 95, 95, '%', 'Meta de cumprimento do orçamento anual'),
  ('SLA Externo', 'lucratividade', NULL, 90, 90, '%', 'Proteger o caixa e blindar contra perdas'),
  ('Lead Time de Onboarding', 'lucratividade', NULL, 45, 45, '%', 'Tempo de integração de novos clientes'),
  ('Churn de Clientes', 'experiencia_cliente', 'juridico', 3.75, 3.75, '%', 'Taxa de cancelamento de clientes'),
  ('Lifetime Médio do Cliente', 'experiencia_cliente', 'juridico', 2.5, 2.5, ' anos', 'Tempo médio de retenção de clientes'),
  ('NPS', 'experiencia_cliente', 'crescimento', 76, 76, ' pts', 'Net Promoter Score'),
  ('Capacidade Ocupada (IC)', 'produtividade', 'juridico', 80, 80, '%', 'Percentual de capacidade utilizada'),
  ('IC Médio por Advogado', 'produtividade', 'juridico', 80, 80, '%', 'Índice de capacidade individual'),
  ('Turnover', 'gestao_pessoas', NULL, 3.5, 3.5, '%', 'Taxa de rotatividade de colaboradores'),
  ('eNPS', 'gestao_pessoas', NULL, 76, 76, ' pts', 'Satisfação dos colaboradores');

-- Insert training hours data
INSERT INTO public.training_hours (role, target_hours, current_hours, division) VALUES
  ('Estagiário', 4, 4, 'juridico'),
  ('Jurídico Interno', 5, 5, 'juridico'),
  ('Administrativo', 6, 6, 'administrativo'),
  ('Liderança', 6, 6, NULL);

-- Insert historical data for charts (last 6 months)
INSERT INTO public.metric_history (metric_id, value, recorded_at, period_type)
SELECT 
  m.id,
  CASE 
    WHEN m.name = 'Cumprimento de Orçamento' THEN 88 + (random() * 7)
    WHEN m.name = 'SLA Externo' THEN 85 + (random() * 5)
    WHEN m.name = 'Lead Time de Onboarding' THEN 40 + (random() * 5)
    WHEN m.name = 'Churn de Clientes' THEN 3 + (random() * 1)
    WHEN m.name = 'Lifetime Médio do Cliente' THEN 2 + (random() * 0.5)
    WHEN m.name = 'NPS' THEN 70 + (random() * 6)
    WHEN m.name = 'Capacidade Ocupada (IC)' THEN 75 + (random() * 5)
    WHEN m.name = 'IC Médio por Advogado' THEN 75 + (random() * 5)
    WHEN m.name = 'Turnover' THEN 3 + (random() * 0.5)
    WHEN m.name = 'eNPS' THEN 70 + (random() * 6)
  END,
  (CURRENT_DATE - (n * INTERVAL '1 month'))::DATE,
  'monthly'
FROM public.metrics m
CROSS JOIN generate_series(1, 6) AS n;