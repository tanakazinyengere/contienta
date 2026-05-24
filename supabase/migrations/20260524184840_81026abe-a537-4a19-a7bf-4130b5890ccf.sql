
-- Profile Health Tracker
CREATE TABLE public.profile_health (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_url TEXT NOT NULL,
  measured_score INTEGER NOT NULL DEFAULT 0,
  projected_score INTEGER NOT NULL DEFAULT 0,
  completed_suggestions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, profile_url)
);
ALTER TABLE public.profile_health ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile_health select" ON public.profile_health FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own profile_health insert" ON public.profile_health FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own profile_health update" ON public.profile_health FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own profile_health delete" ON public.profile_health FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER profile_health_updated BEFORE UPDATE ON public.profile_health FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Reef nodes
CREATE TABLE public.reef_nodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  reef_id UUID NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  image_url TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  caption TEXT NOT NULL DEFAULT '',
  attached_post_id UUID,
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reef_nodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own reef select" ON public.reef_nodes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own reef insert" ON public.reef_nodes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own reef update" ON public.reef_nodes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own reef delete" ON public.reef_nodes FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER reef_nodes_updated BEFORE UPDATE ON public.reef_nodes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Clippie chat
CREATE TABLE public.chat_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'New chat',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own conv select" ON public.chat_conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own conv insert" ON public.chat_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own conv update" ON public.chat_conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own conv delete" ON public.chat_conversations FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER chat_conv_updated BEFORE UPDATE ON public.chat_conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own msg select" ON public.chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own msg insert" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own msg delete" ON public.chat_messages FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_chat_messages_conv ON public.chat_messages(conversation_id, created_at);

-- Scheduled LinkedIn posts
CREATE TABLE public.scheduled_linkedin_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  text TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','published','failed','cancelled')),
  linkedin_post_id TEXT,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.scheduled_linkedin_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sched select" ON public.scheduled_linkedin_posts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own sched insert" ON public.scheduled_linkedin_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own sched update" ON public.scheduled_linkedin_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own sched delete" ON public.scheduled_linkedin_posts FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER sched_updated BEFORE UPDATE ON public.scheduled_linkedin_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
