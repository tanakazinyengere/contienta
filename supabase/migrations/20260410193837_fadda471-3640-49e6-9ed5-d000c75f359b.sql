CREATE TABLE public.saved_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  post_type text NOT NULL DEFAULT '',
  hook text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  cta text NOT NULL DEFAULT '',
  hashtags text[] NOT NULL DEFAULT '{}',
  image_search_terms text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own saved posts"
  ON public.saved_posts FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved posts"
  ON public.saved_posts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved posts"
  ON public.saved_posts FOR DELETE TO authenticated
  USING (auth.uid() = user_id);