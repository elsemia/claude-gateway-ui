
ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS api_key_hash text;
ALTER TABLE public.usage_logs ADD COLUMN IF NOT EXISTS api_key_id uuid;
ALTER TABLE public.usage_logs ADD COLUMN IF NOT EXISTS error_message text;

CREATE POLICY "Authenticated can insert api_keys"
  ON public.api_keys FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can delete api_keys"
  ON public.api_keys FOR DELETE TO authenticated USING (true);
