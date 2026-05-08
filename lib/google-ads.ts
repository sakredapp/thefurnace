import { GoogleAdsApi } from "google-ads-api";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";

export interface GoogleAdsMetadata {
  customer_id: string;          // e.g. "123-456-7890"
  refresh_token: string;
  conversion_action_id: string; // e.g. "customers/123/conversionActions/456"
}

// ─── OAuth helpers ────────────────────────────────────────────────────────────

async function getAccessToken(refreshToken: string, attempt = 0): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    // Only retry on server-side transient errors, not auth failures (400/401)
    if (res.status >= 500 && attempt < 2) {
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
      return getAccessToken(refreshToken, attempt + 1);
    }
    throw new Error(`Google OAuth token exchange failed (${res.status}): ${err}`);
  }

  const data = await res.json();
  return data.access_token as string;
}

function normalizeCustomerId(customerId: string): string {
  return customerId.replace(/-/g, "");
}

// ─── Metrics sync ─────────────────────────────────────────────────────────────

export async function syncGoogleAdsCampaignMetrics(
  clientId: string,
  metadata: GoogleAdsMetadata,
  dateRange: { start: string; end: string }
): Promise<void> {
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  if (!developerToken) {
    console.warn("[google-ads] GOOGLE_ADS_DEVELOPER_TOKEN not set — skipping sync");
    return;
  }

  const adsClient = new GoogleAdsApi({
    client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
    client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
    developer_token: developerToken,
  });

  const customer = adsClient.Customer({
    customer_id: normalizeCustomerId(metadata.customer_id),
    refresh_token: metadata.refresh_token,
  });

  const rows = await customer.query<{
    campaign: { id: string; name: string };
    segments: { date: string };
    metrics: {
      impressions: number;
      clicks: number;
      cost_micros: number;
      conversions: number;
    };
  }[]>(`
    SELECT
      campaign.id,
      campaign.name,
      segments.date,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions
    FROM campaign
    WHERE campaign.status = 'ENABLED'
      AND segments.date BETWEEN '${dateRange.start}' AND '${dateRange.end}'
  `);

  // Aggregate all campaigns → one row per date
  const byDate = new Map<string, { impressions: number; clicks: number; spend: number; conversions: number }>();

  for (const row of rows) {
    const date = row.segments.date;
    const existing = byDate.get(date) ?? { impressions: 0, clicks: 0, spend: 0, conversions: 0 };
    byDate.set(date, {
      impressions: existing.impressions + (row.metrics.impressions ?? 0),
      clicks: existing.clicks + (row.metrics.clicks ?? 0),
      spend: existing.spend + (row.metrics.cost_micros ?? 0) / 1_000_000,
      conversions: existing.conversions + (row.metrics.conversions ?? 0),
    });
  }

  if (byDate.size === 0) return;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Account-level daily totals (existing table — dashboard uses this)
  const dailyRows = Array.from(byDate.entries()).map(([date, metrics]) => ({
    client_id: clientId,
    date,
    platform: "google_ads" as const,
    impressions: metrics.impressions,
    clicks: metrics.clicks,
    spend: Math.round(metrics.spend * 100) / 100,
    leads_count: metrics.conversions,
  }));

  await supabase
    .from("daily_metrics")
    .upsert(dailyRows, { onConflict: "client_id,date,platform" });

  // Per-campaign breakdown (intelligence layer uses this)
  const campaignRows: Array<{
    client_id: string; date: string; platform: string;
    campaign_id: string; campaign_name: string;
    impressions: number; clicks: number; spend: number; leads_count: number;
  }> = [];

  for (const row of rows) {
    campaignRows.push({
      client_id: clientId,
      date: row.segments.date,
      platform: "google_ads",
      campaign_id: String(row.campaign.id),
      campaign_name: row.campaign.name,
      impressions: row.metrics.impressions ?? 0,
      clicks: row.metrics.clicks ?? 0,
      spend: Math.round(((row.metrics.cost_micros ?? 0) / 1_000_000) * 100) / 100,
      leads_count: row.metrics.conversions ?? 0,
    });
  }

  if (campaignRows.length > 0) {
    await supabase
      .from("campaign_performance")
      .upsert(campaignRows, { onConflict: "client_id,date,platform,campaign_id" });
  }
}

// ─── Enhanced Conversions upload ──────────────────────────────────────────────

export async function uploadGoogleEnhancedConversion(
  metadata: GoogleAdsMetadata,
  data: {
    email?: string;
    phone?: string;
    conversionDateTime: string; // ISO string
  }
): Promise<void> {
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  if (!developerToken) return;
  if (!metadata.customer_id || !metadata.refresh_token || !metadata.conversion_action_id) return;

  const accessToken = await getAccessToken(metadata.refresh_token);
  const customerId = normalizeCustomerId(metadata.customer_id);

  const hash = (v: string) =>
    createHash("sha256").update(v.trim().toLowerCase()).digest("hex");

  const userIdentifiers: Array<Record<string, string>> = [];
  if (data.email) userIdentifiers.push({ hashed_email_address: hash(data.email) });
  if (data.phone) userIdentifiers.push({ hashed_phone_number: hash(data.phone.replace(/\D/g, "")) });
  if (userIdentifiers.length === 0) return;

  // Format: "2024-01-01 00:00:00+00:00"
  const conversionDateTime = new Date(data.conversionDateTime)
    .toISOString()
    .replace("T", " ")
    .replace("Z", "+00:00");

  const body = {
    conversions: [
      {
        conversion_action: metadata.conversion_action_id,
        conversion_date_time: conversionDateTime,
        conversion_value: 0.0,
        currency_code: "USD",
        user_identifiers: userIdentifiers,
      },
    ],
    partial_failure: true,
    validate_only: false,
  };

  const res = await fetch(
    `https://googleads.googleapis.com/v17/customers/${customerId}/conversionUploads:uploadClickConversions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "developer-token": developerToken,
        "login-customer-id": customerId,
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Enhanced Conversion upload failed: ${err}`);
  }
}
