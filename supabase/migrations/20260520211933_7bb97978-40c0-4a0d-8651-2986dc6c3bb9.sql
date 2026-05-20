
CREATE TABLE IF NOT EXISTS public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  friend_name text NOT NULL,
  key_prefix text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  used_today bigint NOT NULL DEFAULT 0,
  used_this_month bigint NOT NULL DEFAULT 0,
  daily_limit_tokens bigint NOT NULL DEFAULT 0,
  monthly_limit_tokens bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_time timestamptz NOT NULL DEFAULT now(),
  friend_name text,
  model text,
  input_tokens bigint NOT NULL DEFAULT 0,
  output_tokens bigint NOT NULL DEFAULT 0,
  total_tokens bigint NOT NULL DEFAULT 0,
  status text
);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view api_keys" ON public.api_keys FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can update api_keys" ON public.api_keys FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can view usage_logs" ON public.usage_logs FOR SELECT TO authenticated USING (true);
