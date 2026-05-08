export interface MetaPublishMetadata {
  ad_account_id: string;  // act_XXXXXXXXXX
  access_token: string;
  page_id: string;        // Facebook Page ID for the ad
  ad_set_id: string;      // existing Ad Set to publish into
  final_url: string;      // landing page URL
}

export interface PublishResult {
  ad_id: string;
  creative_id: string;
}

const GRAPH = "https://graph.facebook.com/v19.0";

// ─── Upload image from URL to Meta ad account ─────────────────────────────────

async function uploadImageFromUrl(
  adAccountId: string,
  accessToken: string,
  imageUrl: string
): Promise<string> {
  // Download image bytes
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) throw new Error(`Failed to download image: ${imgRes.status}`);
  const blob = await imgRes.blob();
  const buffer = Buffer.from(await blob.arrayBuffer());

  // Upload to Meta
  const form = new FormData();
  form.append("filename", new Blob([buffer], { type: blob.type }), "creative.jpg");
  form.append("access_token", accessToken);

  const res = await fetch(`${GRAPH}/${adAccountId}/adimages`, {
    method: "POST",
    body: form,
  });

  const data = await res.json() as { images?: Record<string, { hash: string }>; error?: { message: string } };
  if (data.error) throw new Error(`Meta image upload failed: ${data.error.message}`);

  const hash = Object.values(data.images ?? {})[0]?.hash;
  if (!hash) throw new Error("Meta image upload returned no hash");
  return hash;
}

// ─── Create ad creative ────────────────────────────────────────────────────────

async function createAdCreative(
  meta: MetaPublishMetadata,
  creative: { headline: string; body: string; cta: string; imageHash: string }
): Promise<string> {
  const ctaTypeMap: Record<string, string> = {
    "Learn More": "LEARN_MORE",
    "Get Quote": "GET_QUOTE",
    "Contact Us": "CONTACT_US",
    "Sign Up": "SIGN_UP",
    "Book Now": "BOOK_NOW",
    "Apply Now": "APPLY_NOW",
    "Get Started": "GET_STARTED",
  };
  const ctaType = ctaTypeMap[creative.cta] ?? "LEARN_MORE";

  const res = await fetch(`${GRAPH}/${meta.ad_account_id}/adcreatives`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      access_token: meta.access_token,
      name: `Furnace — ${creative.headline.slice(0, 40)}`,
      object_story_spec: {
        page_id: meta.page_id,
        link_data: {
          image_hash: creative.imageHash,
          message: creative.body,
          link: meta.final_url,
          name: creative.headline,
          call_to_action: { type: ctaType, value: { link: meta.final_url } },
        },
      },
    }),
  });

  const data = await res.json() as { id?: string; error?: { message: string } };
  if (data.error) throw new Error(`Meta creative creation failed: ${data.error.message}`);
  if (!data.id) throw new Error("Meta creative creation returned no ID");
  return data.id;
}

// ─── Create ad (starts paused — activate manually or via automation) ──────────

async function createAd(
  meta: MetaPublishMetadata,
  creativeName: string,
  adCreativeId: string
): Promise<string> {
  const res = await fetch(`${GRAPH}/${meta.ad_account_id}/ads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      access_token: meta.access_token,
      name: `Furnace — ${creativeName.slice(0, 40)}`,
      adset_id: meta.ad_set_id,
      creative: { creative_id: adCreativeId },
      status: "PAUSED", // always start paused; activate after review
    }),
  });

  const data = await res.json() as { id?: string; error?: { message: string } };
  if (data.error) throw new Error(`Meta ad creation failed: ${data.error.message}`);
  if (!data.id) throw new Error("Meta ad creation returned no ID");
  return data.id;
}

// ─── Main publish function ─────────────────────────────────────────────────────

export async function publishToMeta(
  meta: MetaPublishMetadata,
  creative: {
    headline: string;
    body: string;
    cta: string;
    imageUrl: string | null;
  }
): Promise<PublishResult> {
  if (!creative.imageUrl) throw new Error("Image URL required for Meta ads");

  const imageHash = await uploadImageFromUrl(meta.ad_account_id, meta.access_token, creative.imageUrl);
  const adCreativeId = await createAdCreative(meta, { ...creative, imageHash });
  const adId = await createAd(meta, creative.headline, adCreativeId);

  return { ad_id: adId, creative_id: adCreativeId };
}

// ─── Fetch per-ad performance (for attribution once published) ────────────────

export async function fetchMetaAdInsights(
  accessToken: string,
  adIds: string[],
  dateRange: { start: string; end: string }
): Promise<Array<{ ad_id: string; impressions: number; clicks: number; spend: number; leads: number }>> {
  if (!adIds.length) return [];

  const params = new URLSearchParams({
    fields: "impressions,clicks,spend,actions",
    time_range: JSON.stringify({ since: dateRange.start, until: dateRange.end }),
    access_token: accessToken,
  });

  const results: Array<{ ad_id: string; impressions: number; clicks: number; spend: number; leads: number }> = [];

  // Fetch in batches of 50
  for (let i = 0; i < adIds.length; i += 50) {
    const batch = adIds.slice(i, i + 50);
    const res = await fetch(`${GRAPH}/?ids=${batch.join(",")}&${params}`);
    const data = await res.json() as Record<string, {
      insights?: { data: Array<{ impressions?: string; clicks?: string; spend?: string; actions?: Array<{ action_type: string; value: string }> }> };
      error?: { message: string };
    }>;

    for (const [adId, adData] of Object.entries(data)) {
      if (adData.error) continue;
      const insight = adData.insights?.data?.[0];
      if (!insight) continue;
      const leadsAction = insight.actions?.find(a => a.action_type === "lead" || a.action_type === "onsite_conversion.lead_grouped");
      results.push({
        ad_id: adId,
        impressions: parseInt(insight.impressions ?? "0", 10),
        clicks: parseInt(insight.clicks ?? "0", 10),
        spend: parseFloat(insight.spend ?? "0"),
        leads: leadsAction ? parseInt(leadsAction.value, 10) : 0,
      });
    }
  }

  return results;
}
