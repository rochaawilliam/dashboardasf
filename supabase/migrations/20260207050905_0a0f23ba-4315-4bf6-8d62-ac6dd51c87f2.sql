-- Create user_preferences table for multi-device sync
CREATE TABLE public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  theme TEXT NOT NULL DEFAULT 'dark',
  notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  notify_on_goal_reached BOOLEAN NOT NULL DEFAULT true,
  notify_on_goal_missed BOOLEAN NOT NULL DEFAULT true,
  notify_on_trend_change BOOLEAN NOT NULL DEFAULT false,
  show_monthly_goals BOOLEAN NOT NULL DEFAULT true,
  show_annual_goals BOOLEAN NOT NULL DEFAULT true,
  show_progress_percentage BOOLEAN NOT NULL DEFAULT true,
  show_sparklines BOOLEAN NOT NULL DEFAULT true,
  show_trend_indicators BOOLEAN NOT NULL DEFAULT true,
  trend_period_months INTEGER NOT NULL DEFAULT 6,
  language TEXT NOT NULL DEFAULT 'pt-BR',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own preferences
CREATE POLICY "Users can view own preferences"
  ON public.user_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own preferences
CREATE POLICY "Users can insert own preferences"
  ON public.user_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update own preferences"
  ON public.user_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own preferences
CREATE POLICY "Users can delete own preferences"
  ON public.user_preferences
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();