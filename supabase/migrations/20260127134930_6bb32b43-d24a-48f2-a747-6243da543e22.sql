-- Add UPDATE policy for metric_history
CREATE POLICY "Allow public update to metric_history" 
ON public.metric_history 
FOR UPDATE 
USING (true);

-- Add DELETE policy for metric_history
CREATE POLICY "Allow public delete from metric_history" 
ON public.metric_history 
FOR DELETE 
USING (true);