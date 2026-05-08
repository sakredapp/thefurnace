-- Publishing fields on creatives
ALTER TABLE public.creatives
  ADD COLUMN IF NOT EXISTS platform_ad_id text,
  ADD COLUMN IF NOT EXISTS platform_creative_id text,
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS publish_status text DEFAULT 'unpublished'
    CHECK (publish_status IN ('unpublished','publishing','published','failed')),
  ADD COLUMN IF NOT EXISTS publish_error text,
  ADD COLUMN IF NOT EXISTS final_url text;

-- Per-campaign breakdown (finer than daily_metrics which is account-level totals)
CREATE TABLE IF NOT EXISTS public.campaign_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id),
  date date NOT NULL,
  platform text NOT NULL CHECK (platform IN ('google_ads','meta_ads')),
  campaign_id text NOT NULL,
  campaign_name text,
  impressions integer DEFAULT 0,
  clicks integer DEFAULT 0,
  spend numeric DEFAULT 0,
  leads_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (client_id, date, platform, campaign_id)
);
ALTER TABLE public.campaign_performance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON public.campaign_performance
  USING (true) WITH CHECK (true);

-- Claude's learned signals per client — the marketer brain
CREATE TABLE IF NOT EXISTS public.client_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id),
  signal_type text NOT NULL CHECK (signal_type IN (
    'copy_angle',      -- which emotional angles get results
    'audience_timing', -- when ads perform best
    'offer_framing',   -- how to position the offer
    'creative_format', -- image style / composition insights
    'funnel_gap',      -- where leads are dying in the pipeline
    'momentum'         -- something accelerating or decelerating
  )),
  signal text NOT NULL,
  confidence text NOT NULL CHECK (confidence IN ('high','medium','low')),
  evidence text,
  active boolean DEFAULT true,
  superseded_by uuid REFERENCES public.client_signals(id),
  created_at timestamptz DEFAULT now(),
  detected_from_period text
);
ALTER TABLE public.client_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON public.client_signals
  USING (true) WITH CHECK (true);
