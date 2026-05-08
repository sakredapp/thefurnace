import { GoogleAdsApi } from "google-ads-api";

export interface GooglePublishMetadata {
  customer_id: string;
  refresh_token: string;
  ad_group_resource_name: string; // e.g. "customers/123/adGroups/456"
  final_url: string;
}

export interface GooglePublishResult {
  ad_resource_name: string;
}

function normalizeCustomerId(id: string): string {
  return id.replace(/-/g, "");
}

// Truncate headline to Google's 30-char limit, body to 90-char limit
function truncate(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max - 1) + "…";
}

// Split a long headline into multiple assets (Google RSA supports up to 15 headlines)
function buildHeadlines(headline: string): string[] {
  // Primary headline — truncated to 30 chars
  const primary = truncate(headline, 30);

  // Split on em-dash, colon, pipe to extract sub-headlines naturally
  const parts = headline
    .split(/[—|:]+/)
    .map((s) => truncate(s.trim(), 30))
    .filter((s) => s.length > 2);

  const all = [primary, ...parts];
  // Deduplicate preserving order
  return [...new Set(all)].slice(0, 5);
}

function buildDescriptions(body: string): string[] {
  const primary = truncate(body, 90);
  const sentences = body
    .split(/[.!?]+/)
    .map((s) => truncate(s.trim(), 90))
    .filter((s) => s.length > 5);

  const all = [primary, ...sentences];
  return [...new Set(all)].slice(0, 4);
}

// ─── Publish Responsive Search Ad ─────────────────────────────────────────────

export async function publishToGoogle(
  meta: GooglePublishMetadata,
  creative: { headline: string; body: string }
): Promise<GooglePublishResult> {
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  if (!developerToken) throw new Error("GOOGLE_ADS_DEVELOPER_TOKEN not set");

  const adsClient = new GoogleAdsApi({
    client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
    client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
    developer_token: developerToken,
  });

  const customerId = normalizeCustomerId(meta.customer_id);
  const customer = adsClient.Customer({
    customer_id: customerId,
    refresh_token: meta.refresh_token,
  });

  const headlines = buildHeadlines(creative.headline);
  const descriptions = buildDescriptions(creative.body);

  const operations = [{
    entity: "ad_group_ad" as const,
    operation: "create" as const,
    resource: {
      ad_group: meta.ad_group_resource_name,
      status: 2, // PAUSED — always start paused
      ad: {
        final_urls: [meta.final_url],
        responsive_search_ad: {
          headlines: headlines.map((text) => ({ text })),
          descriptions: descriptions.map((text) => ({ text })),
        },
      },
    },
  }];

  const result = await customer.mutateResources(operations);
  const resourceName = result?.mutate_operation_responses?.[0]?.ad_group_ad_result?.resource_name;

  if (!resourceName) throw new Error("Google Ads mutate returned no resource name");
  return { ad_resource_name: resourceName };
}

// ─── Fetch per-ad performance ─────────────────────────────────────────────────

export async function fetchGoogleAdPerformance(
  meta: GooglePublishMetadata,
  adResourceNames: string[],
  dateRange: { start: string; end: string }
): Promise<Array<{ ad_resource_name: string; impressions: number; clicks: number; spend: number; conversions: number }>> {
  if (!adResourceNames.length) return [];

  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  if (!developerToken) return [];

  const adsClient = new GoogleAdsApi({
    client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
    client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
    developer_token: developerToken,
  });

  const customer = adsClient.Customer({
    customer_id: normalizeCustomerId(meta.customer_id),
    refresh_token: meta.refresh_token,
  });

  const nameList = adResourceNames.map((n) => `'${n}'`).join(",");

  const rows = await customer.query<{
    ad_group_ad: { resource_name: string };
    metrics: { impressions: number; clicks: number; cost_micros: number; conversions: number };
  }[]>(`
    SELECT
      ad_group_ad.resource_name,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions
    FROM ad_group_ad
    WHERE ad_group_ad.resource_name IN (${nameList})
      AND segments.date BETWEEN '${dateRange.start}' AND '${dateRange.end}'
  `);

  return rows.map((row) => ({
    ad_resource_name: row.ad_group_ad.resource_name,
    impressions: row.metrics.impressions ?? 0,
    clicks: row.metrics.clicks ?? 0,
    spend: (row.metrics.cost_micros ?? 0) / 1_000_000,
    conversions: row.metrics.conversions ?? 0,
  }));
}
