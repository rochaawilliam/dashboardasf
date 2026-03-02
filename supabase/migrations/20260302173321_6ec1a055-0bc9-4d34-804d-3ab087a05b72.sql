
-- Table to store subcategory definitions
CREATE TABLE public.metric_subcategories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(category, name)
);

-- Table to assign metrics to subcategories with ordering
CREATE TABLE public.metric_subcategory_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_id UUID NOT NULL REFERENCES public.metrics(id) ON DELETE CASCADE,
  subcategory_id UUID NOT NULL REFERENCES public.metric_subcategories(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(metric_id)
);

-- Enable RLS
ALTER TABLE public.metric_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metric_subcategory_assignments ENABLE ROW LEVEL SECURITY;

-- Everyone can read
CREATE POLICY "Everyone can read subcategories"
  ON public.metric_subcategories FOR SELECT USING (true);

CREATE POLICY "Everyone can read assignments"
  ON public.metric_subcategory_assignments FOR SELECT USING (true);

-- Only admins can modify
CREATE POLICY "Admins can insert subcategories"
  ON public.metric_subcategories FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update subcategories"
  ON public.metric_subcategories FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete subcategories"
  ON public.metric_subcategories FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert assignments"
  ON public.metric_subcategory_assignments FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update assignments"
  ON public.metric_subcategory_assignments FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete assignments"
  ON public.metric_subcategory_assignments FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- Triggers for updated_at
CREATE TRIGGER update_metric_subcategories_updated_at
  BEFORE UPDATE ON public.metric_subcategories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_metric_subcategory_assignments_updated_at
  BEFORE UPDATE ON public.metric_subcategory_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
