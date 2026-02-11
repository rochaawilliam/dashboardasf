
-- Create monthly_targets table for metrics with variable monthly goals
CREATE TABLE public.monthly_targets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_id UUID NOT NULL REFERENCES public.metrics(id) ON DELETE CASCADE,
  year INTEGER NOT NULL DEFAULT 2025,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  target_value NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(metric_id, year, month)
);

-- Enable RLS
ALTER TABLE public.monthly_targets ENABLE ROW LEVEL SECURITY;

-- RLS policies (same pattern as metrics)
CREATE POLICY "Authenticated users can read monthly_targets"
ON public.monthly_targets FOR SELECT USING (true);

CREATE POLICY "Admins can insert monthly_targets"
ON public.monthly_targets FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update monthly_targets"
ON public.monthly_targets FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete monthly_targets"
ON public.monthly_targets FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_monthly_targets_updated_at
BEFORE UPDATE ON public.monthly_targets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
