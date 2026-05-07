import { createClient } from "@supabase/supabase-js";

export interface MetaAdsMetadata {
  ad_account_id: string; // e.g. "act_123456789"
  access_token: string;  // long-lived system user token
}

interface MetaInsightRow {
  impressions: string;
  clicks: string;
  spend: string;
  date_start: string;
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

  const params = new URLSearchParams({
    fields: "impressions,clicks,spend,actions",
    time_increment: "1",
    time_range: JSON.stringify({ since: dateRange.start, until: dateRange.end }),
    level: "account",
    access_token: metadata.access_token,
    limit: "500",
  });

  const url = `https://graph.facebook.com/v19.0/${metadata.ad_account_id}/insights?${params}`;
  const res = await fetch(url);

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Meta Insights API error: ${err}`);
  }

  const json: MetaInsightsResponse = await res.json();

  if (json.error) {
    throw new Error(`Meta Insights API error ${json.error.code}: ${json.error.message}`);
  }

  if (!json.data?.length) return;

  const upsertRows = json.data.map((row) => {
    const leadsAction = row.actions?.find(
      (a) =>
        a.action_type === "lead" ||
        a.action_type === "onsite_conversion.lead_grouped"
    );

    return {
      client_id: clientId,
      date: row.date_start,
      platform: "meta_ads" as const,
      impressions: parseInt(row.impressions ?? "0", 10),
      clicks: parseInt(row.clicks ?? "0", 10),
      spend: Math.round(parseFloat(row.spend ?? "0") * 100) / 100,
      leads_count: leadsAction ? parseInt(leadsAction.value, 10) : 0,
    };
  });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await supabase
    .from("daily_metrics")
    .upsert(upsertRows, { onConflict: "client_id,date,platform" });
}
