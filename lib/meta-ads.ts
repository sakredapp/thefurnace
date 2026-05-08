import { createClient } from "@supabase/supabase-js";

export interface MetaAdsMetadata {
  ad_account_id: string; // e.g. "act_123456789"
  access_token: string;  // long-lived system user token
  page_id?: string;
  ad_set_id?: string;
  final_url?: string;
}

interface MetaInsightRow {
  impressions: string;
  clicks: string;
  spend: string;
  date_start: string;
  campaign_id?: string;
  campaign_name?: string;
  actions?: Array<{ action_type: string; value: string }>;
}

interface MetaInsightsResponse {
  data: MetaInsightRow[];
  paging?: { cursors?: { after?: string }; next?: string };
  error?: { message: string; code: number };
}

export async function syncMetaAdsCampaignMetrics(
  clientId: string,
  metadata: MetaAdsMetadata,
  dateRange: { start: string; end: string }
): Promise<void> {
  if (!metadata.ad_account_id || !metadata.access_token) return;

  // Fetch at campaign level to get per-campaign breakdown for the intelligence layer
  const params = new URLSearchParams({
    fields: "impressions,clicks,spend,actions,campaign_id,campaign_name",
    time_increment: "1",
    time_range: JSON.stringify({ since: dateRange.start, until: dateRange.end }),
    level: "campaign",
    access_token: metadata.access_token,
    limit: "500",
  });

  // Paginate through all results — high-volume accounts can exceed 500 rows
  const allRows: MetaInsightRow[] = [];
  let nextUrl: string | null = `https://graph.facebook.com/v19.0/${metadata.ad_account_id}/insights?${params}`;

  while (nextUrl) {
    const res = await fetch(nextUrl);

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Meta Insights API error: ${err}`);
    }

    const json: MetaInsightsResponse = await res.json();

    if (json.error) {
      throw new Error(`Meta Insights API error ${json.error.code}: ${json.error.message}`);
    }

    allRows.push(...(json.data ?? []));
    nextUrl = json.paging?.next ?? null;
  }

  if (!allRows.length) return;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Aggregate to account-level daily rows for dashboard
  const dailyMap = new Map<string, { impressions: number; clicks: number; spend: number; leads: number }>();
  const campaignRows: Array<{
    client_id: string; date: string; platform: string;
    campaign_id: string; campaign_name: string;
    impressions: number; clicks: number; spend: number; leads_count: number;
  }> = [];

  for (const row of allRows) {
    const leadsAction = row.actions?.find(
      (a) =>
        a.action_type === "lead" ||
        a.action_type === "onsite_conversion.lead_grouped"
    );
    const leads = leadsAction ? parseInt(leadsAction.value, 10) : 0;

    const existing = dailyMap.get(row.date_start) ?? { impressions: 0, clicks: 0, spend: 0, leads: 0 };
    dailyMap.set(row.date_start, {
      impressions: existing.impressions + parseInt(row.impressions ?? "0", 10),
      clicks: existing.clicks + parseInt(row.clicks ?? "0", 10),
      spend: existing.spend + parseFloat(row.spend ?? "0"),
      leads: existing.leads + leads,
    });

    if (row.campaign_id && row.campaign_name) {
      campaignRows.push({
        client_id: clientId,
        date: row.date_start,
        platform: "meta_ads",
        campaign_id: row.campaign_id,
        campaign_name: row.campaign_name,
        impressions: parseInt(row.impressions ?? "0", 10),
        clicks: parseInt(row.clicks ?? "0", 10),
        spend: Math.round(parseFloat(row.spend ?? "0") * 100) / 100,
        leads_count: leads,
      });
    }
  }

  const upsertRows = Array.from(dailyMap.entries()).map(([date, m]) => ({
    client_id: clientId,
    date,
    platform: "meta_ads" as const,
    impressions: m.impressions,
    clicks: m.clicks,
    spend: Math.round(m.spend * 100) / 100,
    leads_count: m.leads,
  }));

  await supabase
    .from("daily_metrics")
    .upsert(upsertRows, { onConflict: "client_id,date,platform" });

  if (campaignRows.length > 0) {
    await supabase
      .from("campaign_performance")
      .upsert(campaignRows, { onConflict: "client_id,date,platform,campaign_id" });
  }
}
