-- Base schema for The Furnace AI Marketing OS
-- Run this first on a fresh Supabase project before any other migrations.

-- ─── Profiles ────────────────────────────────────────────────────────────────
-- Extends Supabase auth.users. role = "admin" | "client"
CREATE TABLE IF NOT EXISTS public.profiles (
  id        uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role      text NOT NULL DEFAULT 'client' CHECK (role IN ('admin', 'client')),
  full_name text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- Users can read their own profile; service role gets full access
CREATE POLICY "Own profile read" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Service role full access" ON public.profiles USING (true) WITH CHECK (true);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
    NEW.raw_user_meta_data->>'full_name'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ─── Clients ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.clients (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid REFERENCES auth.users(id),   -- set when client is invited
  created_by        uuid REFERENCES auth.users(id),   -- admin who created the record
  business_name     text NOT NULL,
  contact_name      text,
  contact_email     text NOT NULL,
  contact_phone     text,
  vertical          text CHECK (vertical IN ('insurance','elective_health','legal','real_estate','home_services','other')),
  monthly_budget    numeric,
  target_geography  text,
  offer_description text,
  crm_type          text,
  status            text NOT NULL DEFAULT 'onboarding'
                    CHECK (status IN ('onboarding','active','paused','churned')),
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
-- Admins see all; clients see only their own row
CREATE POLICY "Admin full access" ON public.clients
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Client own row" ON public.clients FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "Service role full access" ON public.clients USING (true) WITH CHECK (true);

-- ─── Onboarding steps ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.onboarding_steps (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  step_key     text NOT NULL,
  step_label   text NOT NULL,
  step_order   integer NOT NULL,
  completed    boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at   timestamptz DEFAULT now()
);
ALTER TABLE public.onboarding_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access" ON public.onboarding_steps
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Client own steps" ON public.onboarding_steps FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.clients WHERE id = client_id AND user_id = auth.uid()));
CREATE POLICY "Service role full access" ON public.onboarding_steps USING (true) WITH CHECK (true);

-- ─── Integrations ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.integrations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  type          text NOT NULL,   -- google_ads | meta_ads | gohighlevel | virtual_closer | google_analytics
  account_id    text,
  account_label text,
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','connected','error','disconnected')),
  connected_at  timestamptz,
  error_message text,
  metadata      jsonb,           -- platform-specific tokens/IDs (encrypted at rest via Supabase Vault recommended)
  created_at    timestamptz DEFAULT now(),
  UNIQUE (client_id, type)
);
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access" ON public.integrations
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Service role full access" ON public.integrations USING (true) WITH CHECK (true);

-- ─── Leads ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.leads (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     uuid NOT NULL REFERENCES public.clients(id),
  source        text NOT NULL DEFAULT 'other'
                CHECK (source IN ('google_ads','meta_ads','organic','referral','other')),
  campaign_id   text,
  ad_set_id     text,
  ad_id         text,
  full_name     text,
  email         text,
  phone         text,
  status        text NOT NULL DEFAULT 'new'
                CHECK (status IN ('new','contacted','qualified','booked','closed_won','closed_lost','unqualified')),
  raw_payload   jsonb,
  -- VC attribution
  vc_lead_id    text,
  vc_disposition text,
  vc_synced_at  timestamptz,
  -- GHL
  ghl_stage     text,
  -- Timestamps per funnel stage
  qualified_at  timestamptz,
  booked_at     timestamptz,
  closed_at     timestamptz,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS leads_client_status ON public.leads (client_id, status);
CREATE INDEX IF NOT EXISTS leads_created_at ON public.leads (created_at DESC);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access" ON public.leads
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Client own leads" ON public.leads FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.clients WHERE id = client_id AND user_id = auth.uid()));
CREATE POLICY "Service role full access" ON public.leads USING (true) WITH CHECK (true);

-- ─── Daily metrics ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.daily_metrics (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id           uuid NOT NULL REFERENCES public.clients(id),
  date                date NOT NULL,
  platform            text NOT NULL,  -- google_ads | meta_ads | total
  impressions         integer DEFAULT 0,
  clicks              integer DEFAULT 0,
  spend               numeric DEFAULT 0,
  leads_count         integer DEFAULT 0,
  contacted_count     integer DEFAULT 0,
  qualified_count     integer DEFAULT 0,
  booked_count        integer DEFAULT 0,
  closed_count        integer DEFAULT 0,
  disqualified_count  integer DEFAULT 0,
  no_answer_count     integer DEFAULT 0,
  voicemail_count     integer DEFAULT 0,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now(),
  UNIQUE (client_id, date, platform)
);
CREATE INDEX IF NOT EXISTS daily_metrics_client_date ON public.daily_metrics (client_id, date DESC);
ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access" ON public.daily_metrics
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Client own metrics" ON public.daily_metrics FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.clients WHERE id = client_id AND user_id = auth.uid()));
CREATE POLICY "Service role full access" ON public.daily_metrics USING (true) WITH CHECK (true);

-- ─── Creatives ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.creatives (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id             uuid NOT NULL REFERENCES public.clients(id),
  type                  text NOT NULL DEFAULT 'copy',
  platform              text CHECK (platform IN ('google_ads','meta_ads')),
  headline              text,
  body                  text,
  cta                   text,
  image_url             text,
  status                text NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft','pending_approval','approved','active','paused','rejected')),
  ai_generated          boolean DEFAULT false,
  ai_notes              text,
  -- Publishing
  publish_status        text DEFAULT 'unpublished'
                        CHECK (publish_status IN ('unpublished','publishing','published','failed')),
  publish_error         text,
  platform_ad_id        text,
  platform_creative_id  text,
  published_at          timestamptz,
  final_url             text,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);
ALTER TABLE public.creatives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access" ON public.creatives
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Client own creatives" ON public.creatives FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.clients WHERE id = client_id AND user_id = auth.uid()));
CREATE POLICY "Service role full access" ON public.creatives USING (true) WITH CHECK (true);

-- ─── AI runs ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_runs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     uuid REFERENCES public.clients(id),   -- null for system-wide runs
  run_type      text NOT NULL CHECK (run_type IN ('copy_gen','analysis','report')),
  status        text NOT NULL DEFAULT 'running'
                CHECK (status IN ('running','completed','failed')),
  input_summary text,
  output        jsonb,
  error         text,
  completed_at  timestamptz,
  created_at    timestamptz DEFAULT now()
);
ALTER TABLE public.ai_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access" ON public.ai_runs
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Client own runs" ON public.ai_runs FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.clients WHERE id = client_id AND user_id = auth.uid()));
CREATE POLICY "Service role full access" ON public.ai_runs USING (true) WITH CHECK (true);
