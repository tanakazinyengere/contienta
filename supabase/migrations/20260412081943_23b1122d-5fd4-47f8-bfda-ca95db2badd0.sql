-- SSI Cache table for deterministic scores
CREATE TABLE public.ssi_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_url text NOT NULL,
  profile_handle text NOT NULL DEFAULT '',
  result_data jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days')
);

CREATE INDEX idx_ssi_cache_url ON public.ssi_cache (profile_url);

ALTER TABLE public.ssi_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cached SSI results"
ON public.ssi_cache FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert cache"
ON public.ssi_cache FOR INSERT TO authenticated
WITH CHECK (true);

-- Pro Waitlist table
CREATE TABLE public.pro_waitlist (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  email text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_pro_waitlist_user ON public.pro_waitlist (user_id);

ALTER TABLE public.pro_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own waitlist entry"
ON public.pro_waitlist FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can join the waitlist"
ON public.pro_waitlist FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);