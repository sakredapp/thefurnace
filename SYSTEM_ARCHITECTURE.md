# The Furnace — Complete System Architecture & Rebuild Guide

> **Purpose:** A full, implementation-level specification of how The Furnace works, written so you (or another AI) can rebuild it from scratch on any stack. Every schema, prompt, endpoint, secret, and data-flow below is extracted verbatim from the live codebase.
>
> **What it is:** An autonomous AI lead-generation & marketing operating system. It launches paid ad campaigns, generates copy + imagery with AI, captures leads, routes them to a sales system, and — critically — feeds real conversion outcomes back to Google/Meta so the ad algorithms optimize toward revenue, not clicks. "The more it runs, the cheaper your leads get."

---

## 1. Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | **Next.js 16.2.5** (App Router) | Server Components + Server Actions + Route Handlers |
| Runtime | **React 19.2.4**, TypeScript 5 | |
| Hosting | **Vercel** | Fluid Compute; uses `after()` for post-response work; Cron via `vercel.json` |
| Database + Auth | **Supabase** (Postgres) | `@supabase/ssr` + `@supabase/supabase-js`; Row-Level Security throughout |
| LLM | **Claude via Vercel AI SDK v6** (`ai`) + `@ai-sdk/anthropic` | Sonnet + Haiku |
| Image gen | **fal.ai** (`@fal-ai/client`) | FLUX Pro v1.1 |
| Image compositing | **Placid** REST API | Text overlay onto AI backgrounds |
| Ad platforms | **Google Ads** (`google-ads-api`), **Meta Graph API v19.0** | Sync metrics + publish ads + offline conversions |
| Sales/CRM routing | **Virtual Closer** (external), **GoHighLevel** (optional) | Lead forwarding + disposition sync |
| Email | **Resend** | Weekly HTML reports |

**No Tailwind, no shadcn, no CSS framework** — all UI is inline React `style={{}}` objects. See `BRAND_DESIGN_SYSTEM.md` for the visual system.

**Styling note for rebuild:** `@anthropic-ai/sdk` is in `package.json` but **unused** — all Claude calls go through the Vercel AI SDK wrapper. Safe to omit.

---

## 2. The Core Concept — The Feedback Loop

This is the whole product. Everything else serves this loop:

```
   ┌─────────────────────────────────────────────────────────────────┐
   │                                                                   │
   │   1. AI GENERATES        2. HUMAN APPROVES      3. PUBLISH        │
   │   copy (Claude) +        (admin reviews          to Meta/Google   │
   │   image (FLUX) +         draft creatives)        (starts PAUSED)  │
   │   composite (Placid)                                              │
   │        │                                              │           │
   │        │                                              ▼           │
   │        │                                     4. ADS RUN →         │
   │        │                                     leads come in via    │
   │        │                                     /api/leads webhook   │
   │        │                                              │           │
   │        │                                              ▼           │
   │        │                            5. LEAD ROUTED to Virtual     │
   │        │                               Closer (voice AI) + GHL    │
   │        │                                              │           │
   │        │                                              ▼           │
   │        │                            6. VC WORKS THE LEAD →        │
   │        │                               disposition synced back    │
   │        │                               via /api/vc/sync           │
   │        │                                              │           │
   │        │                                              ▼           │
   │        │                            7. ATTRIBUTION: qualified/    │
   │        │                               booked/closed events fired │
   │        │                               to Google Enhanced         │
   │        │                               Conversions + Meta CAPI    │
   │        │                                              │           │
   │        │                                              ▼           │
   │        │                            8. PLATFORMS OPTIMIZE toward   │
   │        │                               revenue-producing leads     │
   │        │                                              │           │
   │        ▼                                              ▼           │
   │   9. detect-signals cron reads all metrics + outcomes, Claude     │
   │      learns per-client "signals" (what works) → feeds them back   │
   │      into step 1's copy generation.                               │
   │                                                                   │
   └───────────────────────────────────── LOOP ───────────────────────┘
```

The magic is **steps 6–8**: most ad systems optimize on the *click* or the *form-fill*. The Furnace waits for the *sales outcome* (a booked call, a closed deal) and reports THAT back to the ad platforms as the conversion. The platforms then find more people like the ones who actually bought.

---

## 3. Database Schema (Supabase / Postgres)

Three migrations in `supabase/migrations/`. Run in order. All tables have **Row-Level Security** enabled with three policy patterns: admins (via `profiles.role='admin'`) get full access, clients get read-only access to their own rows, and the `service_role` key bypasses everything for server-side writes.

### 3.1 `profiles` — extends Supabase `auth.users`
```sql
CREATE TABLE public.profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role       text NOT NULL DEFAULT 'client' CHECK (role IN ('admin','client')),
  full_name  text,
  created_at timestamptz DEFAULT now()
);
```
- **Auto-created on signup** via a `handle_new_user()` trigger on `auth.users` that reads `raw_user_meta_data->>'role'` (defaults to `'client'`).
- RLS: `auth.uid() = id` for self-read; service role full access.

### 3.2 `clients` — the businesses Furnace runs ads for
```sql
CREATE TABLE public.clients (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid REFERENCES auth.users(id),   -- the client's login (when invited)
  created_by        uuid REFERENCES auth.users(id),   -- admin who created it
  business_name     text NOT NULL,
  contact_name      text,
  contact_email     text NOT NULL,
  contact_phone     text,
  vertical          text CHECK (vertical IN ('insurance','elective_health','legal','real_estate','home_services','other')),
  monthly_budget    numeric,
  target_geography  text,
  offer_description text,
  crm_type          text,
  status            text NOT NULL DEFAULT 'onboarding' CHECK (status IN ('onboarding','active','paused','churned')),
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);
```
- RLS: admin full; client sees only `user_id = auth.uid()`; service role full.

### 3.3 `onboarding_steps` — per-client checklist
```sql
CREATE TABLE public.onboarding_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  step_key text NOT NULL, step_label text NOT NULL, step_order integer NOT NULL,
  completed boolean NOT NULL DEFAULT false, completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);
```

### 3.4 `integrations` — per-client platform connections (the secrets vault)
```sql
CREATE TABLE public.integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  type text NOT NULL,   -- google_ads | meta_ads | gohighlevel | virtual_closer | google_analytics
  account_id text, account_label text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','connected','error','disconnected')),
  connected_at timestamptz, error_message text,
  metadata jsonb,       -- platform tokens/IDs live here (see §7 for per-type shape)
  created_at timestamptz DEFAULT now(),
  UNIQUE (client_id, type)
);
```
- **`metadata` jsonb is the critical column** — it holds each platform's tokens/IDs. Shapes:
  - `google_ads`: `{ customer_id, refresh_token, conversion_action_id }`
  - `meta_ads`: `{ ad_account_id, access_token, page_id, ad_set_id, pixel_id, final_url }`
  - `gohighlevel`: `{ api_key, location_id }`
  - `virtual_closer`: `account_id` holds the VC `repId`
- **Security note:** these are live OAuth tokens in plaintext jsonb. Migration comment recommends Supabase Vault / encryption at rest. RLS restricts to admin + service role only (clients cannot read integration rows).

### 3.5 `leads` — every captured lead + funnel timestamps
```sql
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id),
  source text NOT NULL DEFAULT 'other' CHECK (source IN ('google_ads','meta_ads','organic','referral','other')),
  campaign_id text, ad_set_id text, ad_id text,
  full_name text, email text, phone text,
  status text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new','contacted','qualified','booked','closed_won','closed_lost','unqualified')),
  raw_payload jsonb,
  vc_lead_id text, vc_disposition text, vc_synced_at timestamptz,  -- Virtual Closer attribution
  ghl_stage text,
  qualified_at timestamptz, booked_at timestamptz, closed_at timestamptz,  -- per-stage timestamps
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
CREATE INDEX leads_client_status ON public.leads (client_id, status);
CREATE INDEX leads_created_at ON public.leads (created_at DESC);
```

### 3.6 `daily_metrics` — account-level daily rollup (one row per client/date/platform)
```sql
CREATE TABLE public.daily_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id),
  date date NOT NULL,
  platform text NOT NULL,   -- google_ads | meta_ads | total
  impressions integer DEFAULT 0, clicks integer DEFAULT 0, spend numeric DEFAULT 0,
  leads_count integer DEFAULT 0, contacted_count integer DEFAULT 0, qualified_count integer DEFAULT 0,
  booked_count integer DEFAULT 0, closed_count integer DEFAULT 0, disqualified_count integer DEFAULT 0,
  no_answer_count integer DEFAULT 0, voicemail_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now(),
  UNIQUE (client_id, date, platform)
);
CREATE INDEX daily_metrics_client_date ON public.daily_metrics (client_id, date DESC);
```

### 3.7 `campaign_performance` — finer per-campaign daily breakdown
```sql
CREATE TABLE public.campaign_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id),
  date date NOT NULL,
  platform text NOT NULL CHECK (platform IN ('google_ads','meta_ads')),
  campaign_id text NOT NULL, campaign_name text,
  impressions integer DEFAULT 0, clicks integer DEFAULT 0, spend numeric DEFAULT 0, leads_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now(),
  UNIQUE (client_id, date, platform, campaign_id)
);
```

### 3.8 `creatives` — AI-generated ad copy + images + publish state
```sql
CREATE TABLE public.creatives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id),
  type text NOT NULL DEFAULT 'copy',
  platform text CHECK (platform IN ('google_ads','meta_ads')),
  headline text, body text, cta text, image_url text,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','pending_approval','approved','active','paused','rejected')),
  ai_generated boolean DEFAULT false, ai_notes text,
  -- Publishing
  publish_status text DEFAULT 'unpublished'
    CHECK (publish_status IN ('unpublished','publishing','published','failed')),
  publish_error text, platform_ad_id text, platform_creative_id text,
  published_at timestamptz, final_url text,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
```
- **Two independent state machines:** `status` (creative review lifecycle) and `publish_status` (platform publish lifecycle). A creative is generated as `status='draft'`, an admin moves it to `approved`, then publishing flips `publish_status` through `publishing → published`.

### 3.9 `ai_runs` — audit log of every AI job
```sql
CREATE TABLE public.ai_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id),   -- null for system-wide
  run_type text NOT NULL CHECK (run_type IN ('copy_gen','analysis','report')),
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running','completed','failed')),
  input_summary text, output jsonb, error text,
  completed_at timestamptz, created_at timestamptz DEFAULT now()
);
```

### 3.10 `client_signals` — **Claude's learned memory per client** (the "marketer brain")
```sql
CREATE TABLE public.client_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id),
  signal_type text NOT NULL CHECK (signal_type IN (
    'copy_angle', 'audience_timing', 'offer_framing',
    'creative_format', 'funnel_gap', 'momentum')),
  signal text NOT NULL,
  confidence text NOT NULL CHECK (confidence IN ('high','medium','low')),
  evidence text,
  active boolean DEFAULT true,
  superseded_by uuid REFERENCES public.client_signals(id),
  created_at timestamptz DEFAULT now(),
  detected_from_period text
);
```
- This table is what makes the system "learn." The signal-detection cron writes rows here; the copy-generation endpoint reads active rows and injects them into Claude's prompt.

### 3.11 `increment_daily_metric()` — atomic funnel counter (SECURITY DEFINER)
An RPC that safely upserts a `daily_metrics` row and atomically increments one whitelisted counter column. Called from webhooks so concurrent disposition updates don't race.
```sql
CREATE FUNCTION public.increment_daily_metric(
  p_client_id uuid, p_date date, p_platform text, p_column text, p_amount integer DEFAULT 1
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE allowed_columns text[] := ARRAY['leads_count','contacted_count','qualified_count',
  'booked_count','closed_count','disqualified_count','no_answer_count','voicemail_count'];
BEGIN
  IF NOT (p_column = ANY(allowed_columns)) THEN
    RAISE EXCEPTION 'Column % is not an allowed metric column', p_column;
  END IF;
  INSERT INTO public.daily_metrics (client_id, date, platform)
  VALUES (p_client_id, p_date, p_platform) ON CONFLICT (client_id, date, platform) DO NOTHING;
  EXECUTE format('UPDATE public.daily_metrics SET %I = COALESCE(%I,0) + $1
    WHERE client_id=$2 AND date=$3 AND platform=$4', p_column, p_column)
    USING p_amount, p_client_id, p_date, p_platform;
END; $$;
REVOKE ALL ON FUNCTION public.increment_daily_metric FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_daily_metric TO service_role;
```
- **Security detail worth copying:** the dynamic column name is validated against a whitelist array before `format('… %I …')` to prevent SQL injection, and execution is granted only to `service_role`.

---

## 4. Authentication & Authorization

Supabase Auth (email/password), two roles: **`admin`** (the Furnace operator) and **`client`** (the business owner viewing their dashboard).

### 4.1 Three Supabase clients
```ts
// lib/supabase/client.ts — BROWSER (anon key, RLS enforced)
createBrowserClient(URL, ANON_KEY)

// lib/supabase/server.ts — SERVER COMPONENTS/ACTIONS (anon key + cookie session, RLS enforced)
createServerClient(URL, ANON_KEY, { cookies: { getAll, setAll } })  // reads next/headers cookies

// In route handlers — SERVICE ROLE (bypasses RLS, server-only)
createClient(URL, SUPABASE_SERVICE_ROLE_KEY)
```
- **Rule:** user-facing reads go through the anon/session client (RLS protects data). System writes (webhooks, crons, AI jobs) use the service-role client.

### 4.2 Login flow — `app/actions/auth.ts`
```ts
export async function login(formData: FormData) {
  const supabase = await createClient();
  const { error, data } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect("/login?error=1");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
  if (profile?.role === "client") redirect("/dashboard");
  redirect("/admin");   // default → admin
}
```

### 4.3 Route protection — `app/actions/guard.ts`
```ts
export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");
  return { user, supabase };
}
```
- Called at the top of every admin-only server action and the admin API route. **There is no `middleware.ts`** — protection is enforced per-action/per-route, plus RLS at the DB layer (defense in depth).

---

## 5. The AI Layer — `lib/ai.ts` (verbatim prompts)

```ts
const anthropic  = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const FAST_MODEL  = anthropic("claude-haiku-4-5-20251001");   // Haiku — cheap/fast
const SMART_MODEL = anthropic("claude-sonnet-4-6");           // Sonnet — reasoning
```
> ⚠️ **`claude-sonnet-4-6` is not a currently-valid model ID** (latest Sonnet is `claude-sonnet-5`). When rebuilding, use a real ID. All four functions use `generateText({ model, output: Output.object({ schema }), prompt })` — structured output via Zod, not `generateObject`.

### 5.1 `generateCopyVariants()` — Sonnet
**Output schema:**
```ts
{ variants: [{ headline, body, cta, angle, hypothesis }], reasoning }
```
**Prompt (with dynamic context injected):**
```
You are an expert direct-response ad copywriter for {Google Search Ads (headline max 30 chars,
description max 90 chars) | Meta Feed Ads (headline max 40 chars, body max 125 chars)}.

Business: {businessName}
Vertical: {vertical}
Offer: {offerDescription}
Geography: {targetGeography}
{Last 30 days performance: Spend / Leads / CPL / CTR / Booking rate / Best & Weakest campaign}
{Learned patterns for this client: - [HIGH confidence / copy_angle] {signal} ...}
{Additional context from account manager: ...}
{Existing copy already running (do NOT repeat these angles): ...}

Generate {count} distinct ad copy variants. Rules:
1. Each variant must test a different hypothesis — angle, framing, emotional trigger, or offer presentation
2. If performance data is provided, use it: if CPL is high, test price anchoring; if CTR is low, test
   stronger curiosity hooks; if booking rate is low, address the objection in copy
3. Apply learned signals with high confidence directly; test medium-confidence signals as hypotheses
4. No fluff. Every word earns its place.
5. Each variant's hypothesis field must explain exactly what you're testing and why, referencing the data
```
- Injects `recentMetrics` (30-day aggregates) and `activeSignals` (from `client_signals`) — this is how the loop closes: past performance shapes new copy.

### 5.2 `analyzeCampaignPerformance()` — Sonnet
**Output:** `{ summary, wins[], problems[], recommendations[{priority, action, rationale}], copyAnglesToTest[], estimatedImpact }`
Pre-computes CTR/CVR/CPL/CPQL/qualRate per campaign, then:
```
You are a brutally honest paid media analyst and AI marketing strategist.
Business / Vertical / Offer / Lead quality notes
Campaign performance: {enriched JSON}
Identify what is actually wrong — copy, audience, offer, landing page, follow-up speed.
Prioritize recommendations by revenue impact. Suggest specific copy angles to test next. Be direct.
```

### 5.3 `detectClientSignals()` — Sonnet (the learning brain)
**Output:** `{ signals: [{signal_type, signal, confidence, evidence}], supersede_signals[], summary }`
```
You are the pattern-recognition layer of an autonomous AI marketing system for {business} ({vertical}).

Your job is to detect real, actionable signals from performance data — things a sharp performance
marketer would notice after studying the numbers for 20 minutes. Not generic "CTR is low, test new
copy." Specific: "The insurance vertical in Florida shows 3x higher qualification rates on Tuesday/
Wednesday vs weekend. Shift budget."

Current period / Performance by platform / by campaign / Lead funnel breakdown
Total leads → Booked → Closed
{Trends vs previous period: CPL / CTR / Booking rate / Leads change %}
Currently running copy angles / Previously detected signals (do not repeat unless reinforced)

Output:
- New signals with enough data support (avoid signals with <3 data points of evidence)
- Supersede old signals if new data contradicts them
- Be specific: name campaigns, angles, platforms, lead stages by name
- Momentum signals: flag anything moving >15% in either direction
```

### 5.4 `generateWeeklyReport()` — **Haiku** (cheap, formatting task)
**Output:** `{ headline, highlights[], concerns[], nextWeekPlan[], clientSummary }`
```
Generate a weekly performance report for {business} ({period}).
Metrics: {...}  Lead pipeline: {...}
Write a clear report. The clientSummary should be plain English — no jargon, just results and what's next.
```

---

## 6. Creative Generation Pipeline — `app/api/ai/copy/route.ts`

**`POST /api/ai/copy`** (admin session required). The orchestrator. Body: `{ client_id, platform, count?, performance_notes? }`.

1. **Auth:** verify session user + `profiles.role === 'admin'` (else 401/403).
2. **Gather context in parallel** (service-role client): client record, last-5 existing approved/active copy, 30-day `daily_metrics`, active `client_signals`, `campaign_performance`. Aggregate into `recentMetrics` (spend/leads/CPL/CTR/bookingRate + top/weakest campaign by CPL).
3. **Log** an `ai_runs` row (`run_type='copy_gen', status='running'`).
4. **`generateCopyVariants(...)`** → N copy variants (Claude Sonnet).
5. **Insert** the variants immediately as `creatives` rows (`status='draft', ai_generated=true`, `ai_notes` = angle + reasoning), and return them to the caller right away.
6. **`after()` (post-response, non-blocking):** for each variant, in parallel:
   - **`generateAdImage()`** → FLUX Pro background (see §6.1)
   - **`buildAdCreative()`** → Placid composites copy onto the background (see §6.2)
   - Final URL = Placid output **or** raw fal.ai URL fallback → written to `creatives.image_url`.
   - Mark the `ai_runs` row `completed` with the full output.

### 6.1 Image generation — `lib/image-gen.ts` (fal.ai FLUX Pro v1.1)
```ts
fal.config({ credentials: process.env.FAL_KEY });
await fal.subscribe("fal-ai/flux-pro/v1.1", {
  input: { prompt, image_size, num_images: 1, safety_tolerance: "2" }
});
// image_size: "square_hd" (meta_ads) | "landscape_16_9" (google_ads)
// returns result.data.images[0].url  (null if FAL_KEY missing or on error)
```
Prompt built from per-vertical scene + per-platform style:
- **`VERTICAL_SCENE`** — insurance / elective_health / legal / real_estate / home_services / other (each a photo-scene description).
- **`PLATFORM_STYLE`** — meta_ads = "square 1:1 … social feed"; google_ads = "wide 16:9 … centered".
- Template ends: *"Commercial advertising photography: {scene}. Mood: {angle}. {style}. Shot on Sony A7 IV, 35mm lens, professional lighting. No text, no logos, no watermarks. Photorealistic, high resolution. Clean composition with space for text overlay."*
- **Deliberately generates text-free backgrounds** because Placid adds the text next.

### 6.2 Compositing — `lib/placid.ts` (Placid REST)
```
POST https://api.placid.app/api/rest/images   (Bearer PLACID_API_KEY)
  body: { template_uuid, layers: { headline, body, cta, background } }
→ poll polling_url up to 60s until status === "finished" → returns image_url
```
- `buildAdCreative({platform,...})` picks the template from `PLACID_TEMPLATE_META` or `PLACID_TEMPLATE_GOOGLE`. **Graceful fallback:** if no template UUID / no key, returns `null` and the pipeline uses the raw fal.ai image.

### 6.3 Publishing to Meta — `lib/meta-publish.ts` (Graph API v19.0)
`publishToMeta(meta, creative)` runs three sequential Graph calls:
1. **Upload image:** download bytes from the creative's image URL → `POST /{ad_account_id}/adimages` (multipart) → returns an **image hash**.
2. **Create ad creative:** `POST /{ad_account_id}/adcreatives` with `object_story_spec.link_data` (image_hash, message=body, name=headline, link=final_url, `call_to_action` mapped from CTA text → Meta enum like `GET_QUOTE`, `BOOK_NOW`).
3. **Create ad:** `POST /{ad_account_id}/ads` into an existing `ad_set_id`, **`status: "PAUSED"`** — always starts paused; a human activates after review.

Returns `{ ad_id, creative_id }` → stored on the creative's `platform_ad_id` / `platform_creative_id`.
Also `fetchMetaAdInsights()` pulls per-ad impressions/clicks/spend/leads (batched 50) for attribution.

- Google publishing lives in `lib/google-publish.ts` (analogous). Meta metric sync in `lib/meta-ads.ts`.

---

## 7. Lead Capture & The Attribution Loop (the crown jewels)

### 7.1 `POST /api/leads` — lead intake webhook
- **Auth:** header `x-webhook-secret` must equal `LEADS_WEBHOOK_SECRET`.
- Body: `{ client_id, source, campaign_id, ad_set_id, ad_id, full_name, email, phone, ... }`.
- **Insert** into `leads` (`status='new'`, whole body saved to `raw_payload`).
- **Forward the lead** (in `after()`, non-blocking) to whatever the client has connected:
  - **Virtual Closer:** if a `virtual_closer` integration exists, `POST https://virtualcloser.com/api/webhooks/furnace/{repId}` with header `x-furnace-secret: FURNACE_INBOUND_SECRET`, body includes `furnace_lead_id` (so VC can call back with dispositions).
  - **GoHighLevel:** if `gohighlevel` integration has `{api_key, location_id}` in metadata, `createGHLContact(...)` with a furnace tracking tag.
- Returns `{ success, lead_id }` (201).

### 7.2 `POST /api/vc/sync` — Virtual Closer disposition sync (the loop closer)
- **Auth:** `x-webhook-secret` == `FURNACE_INBOUND_SECRET`.
- VC sends `{ furnace_lead_id, vc_lead_id, disposition, rep_id }`.
- **Maps 19 VC dispositions → 7 Furnace statuses** via `DISPOSITION_TO_STATUS` (e.g. `appointment_set→booked`, `application_approved/aca→closed_won`, `not_interested/do_not_contact→closed_lost`, `wrong_number/disconnected/disqualified→unqualified`).
- Updates the lead (`vc_disposition`, `vc_lead_id`, `vc_synced_at`, `status`, stage timestamps).
- **`after()`:** if the disposition is a conversion (`appointment_set`, `*_booked`, `application_sent/approved`, `aca`):
  - **Fire attribution** to Meta CAPI + Google Enhanced Conversions (§7.4).
  - **Bucket the disposition into funnel counters** and atomically bump `daily_metrics` via the `increment_daily_metric` RPC (platform `'total'`).

### 7.3 `POST /api/leads/status` — direct status-update webhook
- Same secret as `/api/leads`. Body `{ furnace_lead_id, status }`.
- Sets stage timestamps; if new status ∈ `{qualified, booked, closed_won}`, fires Google + Meta conversion events.

### 7.4 Offline conversion attribution (what makes leads get cheaper)
**Meta Conversions API** (`graph.facebook.com/v19.0/{pixel_id}/events`):
- Reads per-client `meta_ads` integration metadata (falls back to env `META_PIXEL_ID` / `META_CONVERSIONS_API_TOKEN`).
- Maps outcome → event name: `Purchase` (closed/approved), `Schedule` (booked), `Lead` (qualified).
- **PII is SHA-256 hashed** (email lowercased/trimmed; phone digits-only) before sending — `user_data.em` / `user_data.ph`. `action_source: "system_generated"`. `custom_data` carries `furnace_lead_id` + disposition.

**Google Enhanced Conversions** — `lib/google-ads.ts` `uploadGoogleEnhancedConversion()`:
- Reads `google_ads` integration metadata `{ customer_id, refresh_token, conversion_action_id }`.
- Exchanges refresh token → access token (`oauth2.googleapis.com/token`, with retry).
- `POST googleads.googleapis.com/v17/customers/{cid}/conversionUploads:uploadClickConversions` (headers include `login-customer-id`, `developer-token`), with the hashed user identifiers and `conversion_action`.

> **This is the differentiator:** the ad platforms receive the *real sales outcome* as the conversion, so their optimization targets revenue, not form-fills.

---

## 8. Cron Jobs (`vercel.json`)

All cron routes are `GET`, authed by header **`Authorization: Bearer {CRON_SECRET}`**.

```json
"crons": [
  { "path": "/api/cron/sync-ads",       "schedule": "0 2 * * *" },     // daily 02:00
  { "path": "/api/cron/weekly-report",  "schedule": "0 8 * * 1" },     // Mondays 08:00
  { "path": "/api/cron/detect-signals", "schedule": "0 3 * * 1,3,5" }  // Mon/Wed/Fri 03:00
]
```

- **`sync-ads`** — for every active client with connected `google_ads`/`meta_ads` integrations, pull yesterday's campaign metrics (`syncGoogleAdsCampaignMetrics` via GAQL query, `syncMetaAdsCampaignMetrics`) and upsert into `daily_metrics` + `campaign_performance`. Logs to `ai_runs`.
- **`detect-signals`** — for each active client: gather 14-day metrics + prior-14-day window (for trends), campaigns, lead funnel, active creatives, existing signals → `detectClientSignals()` → deactivate superseded signals (`active=false`) → insert new signal rows. Logs to `ai_runs`.
- **`weekly-report`** — per client: build 7-day metrics + lead-status breakdown → `analyzeCampaignPerformance()` (Sonnet) + `generateWeeklyReport()` (Haiku) → `sendWeeklyReport()` (Resend HTML email to the client). Logs to `ai_runs`.

---

## 9. Application Structure (App Router route groups)

```
app/
├─ layout.tsx                  # root: Inter font, #0d0d0d bg, metadata
├─ (marketing)/                # PUBLIC — cream light theme
│   ├─ page.tsx                #   landing (hero, features, integrations, pricing)
│   ├─ request-samples/        #   lead form
│   ├─ terms/ , ...            #   legal
│   └─ layout.tsx              #   marketing shell + CSS band styles
├─ (auth)/login/              # PUBLIC — login form → server action
├─ (client)/                   # CLIENT role — dark theme
│   ├─ dashboard/page.tsx      #   client's KPIs, leads, creatives (read-only oversight)
│   └─ layout.tsx
└─ (portal)/                   # ADMIN role — dark theme, operator cockpit
    ├─ admin/page.tsx          #   all clients overview
    ├─ admin/clients/[id]/     #   per-client management
    ├─ admin/leads/            #   lead inbox
    ├─ admin/creatives/        #   creative review + "Generate Copy" button
    ├─ admin/stack/            #   tech-stack + env-var reference page
    └─ layout.tsx              #   sidebar nav

app/actions/   → auth.ts, guard.ts, clients.ts, creatives.ts, integrations.ts   (Server Actions)
app/api/       → ai/copy, cron/{sync-ads,weekly-report,detect-signals},
                 leads, leads/status, vc/sync, crm/ghl/[clientId], crm/ghl
lib/           → ai, image-gen, placid, meta-publish, meta-ads, google-ads,
                 google-publish, gohighlevel, email, supabase/{client,server}
```

---

## 10. Environment Variables (complete)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (public) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key — browser/session clients (RLS-enforced) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key — server-only, bypasses RLS |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL (used in conversion event source) |
| `ANTHROPIC_API_KEY` | Claude (copy/analysis/signals via AI SDK) |
| `FAL_KEY` | fal.ai FLUX Pro image generation |
| `PLACID_API_KEY` | Placid compositing |
| `PLACID_TEMPLATE_META` / `PLACID_TEMPLATE_GOOGLE` | Placid template UUIDs per platform |
| `RESEND_API_KEY` | Resend weekly report emails (from `reports@furnaceleads.com`) |
| `CRON_SECRET` | Bearer token guarding all cron routes |
| `LEADS_WEBHOOK_SECRET` | `x-webhook-secret` for `/api/leads` + `/api/leads/status` |
| `FURNACE_INBOUND_SECRET` | Shared secret for VC ↔ Furnace (`/api/vc/sync` inbound, VC forward outbound) |
| `GOOGLE_ADS_DEVELOPER_TOKEN` | Google Ads API developer token |
| `GOOGLE_ADS_CLIENT_ID` / `GOOGLE_ADS_CLIENT_SECRET` | Google OAuth app creds (per-client `refresh_token` lives in integration metadata) |
| `FURNACE_GOOGLE_ADS_EMAIL` | Manager/login email for Google Ads |
| `META_PIXEL_ID` / `META_CONVERSIONS_API_TOKEN` | Fallback Meta CAPI creds (per-client override in integration metadata) |
| `FURNACE_META_BUSINESS_ID` | Meta Business ID |

Per-client platform tokens are **not** env vars — they live in `integrations.metadata` (jsonb), keyed by integration `type`. See §3.4.

---

## 11. Rebuild Checklist / Order of Operations

1. **Provision:** a Postgres+Auth provider (Supabase or equivalent), a host that supports post-response background work + cron (Vercel), and accounts for Anthropic, fal.ai, Placid, Resend, Google Ads API, Meta Marketing API.
2. **Schema:** run the three migrations in `supabase/migrations/` in order. Confirm RLS + the `handle_new_user` trigger + `increment_daily_metric` RPC.
3. **Auth:** wire the three DB clients (browser/anon, server/session, service-role), `login`/`logout` actions, and `requireAdmin` guard. Seed one admin (`profiles.role='admin'`).
4. **AI layer:** port `lib/ai.ts` with the four functions + verbatim prompts. **Fix the model IDs** to current ones (`claude-sonnet-5` / a valid Haiku).
5. **Creative pipeline:** `image-gen` (FLUX) → `placid` (composite) → `meta-publish`/`google-publish`. Wire the `/api/ai/copy` orchestrator with `after()`.
6. **Lead + attribution:** build `/api/leads`, `/api/vc/sync`, `/api/leads/status`. This is the core value — get the disposition mapping and hashed offline-conversion events right.
7. **Crons:** `sync-ads`, `detect-signals`, `weekly-report` with `Authorization: Bearer` checks. Register schedules.
8. **UI:** three route groups (public marketing, client dashboard, admin portal). Apply `BRAND_DESIGN_SYSTEM.md`.
9. **Secrets:** set all env vars (§10); store per-client platform tokens in `integrations.metadata`.

### Known issues to fix on rebuild
- **Model ID `claude-sonnet-4-6` is invalid** — replace with a real Sonnet ID.
- **Integration tokens are plaintext jsonb** — encrypt at rest (Supabase Vault) as the migration comment recommends.
- **Google Ads API is pinned to `v17`, Meta to `v19.0`** — bump to current versions; these APIs deprecate old versions on a schedule.
- **`@anthropic-ai/sdk` dependency is unused** — drop it.

---

*Companion doc: `BRAND_DESIGN_SYSTEM.md` (colors, fonts, components). Together these two files fully specify a rebuild.*
