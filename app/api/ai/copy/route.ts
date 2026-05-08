import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateCopyVariants } from "@/lib/ai";
import { generateAdImage } from "@/lib/image-gen";
import { buildAdCreative } from "@/lib/placid";

const db = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { client_id, platform, count, performance_notes } = body as {
    client_id: string;
    platform: "google_ads" | "meta_ads";
    count?: number;
    performance_notes?: string;
  };

  if (!client_id || !platform) {
    return NextResponse.json({ error: "client_id and platform required" }, { status: 400 });
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);
  const startStr = thirtyDaysAgo.toISOString().split("T")[0];

  // Fetch client + context in parallel
  const [clientRes, existingRes, metricsRes, signalsRes, campaignRes] = await Promise.all([
    db().from("clients")
      .select("business_name, vertical, offer_description, target_geography")
      .eq("id", client_id)
      .single(),
    db().from("creatives")
      .select("headline, body")
      .eq("client_id", client_id)
      .eq("platform", platform)
      .in("status", ["approved", "active"])
      .limit(5),
    db().from("daily_metrics")
      .select("spend, impressions, clicks, leads_count, booked_count")
      .eq("client_id", client_id)
      .eq("platform", platform)
      .gte("date", startStr),
    db().from("client_signals")
      .select("signal_type, signal, confidence")
      .eq("client_id", client_id)
      .eq("active", true),
    db().from("campaign_performance")
      .select("campaign_name, spend, leads_count")
      .eq("client_id", client_id)
      .eq("platform", platform)
      .gte("date", startStr),
  ]);

  const client = clientRes.data;
  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const existingCopy = existingRes.data?.map((c) =>
    [c.headline, c.body].filter(Boolean).join(" — ")
  );

  // Aggregate 30d metrics
  const metricRows = metricsRes.data ?? [];
  const totals = metricRows.reduce(
    (acc, r) => ({
      spend: acc.spend + Number(r.spend ?? 0),
      impressions: acc.impressions + (r.impressions ?? 0),
      clicks: acc.clicks + (r.clicks ?? 0),
      leads: acc.leads + (r.leads_count ?? 0),
      booked: acc.booked + (r.booked_count ?? 0),
    }),
    { spend: 0, impressions: 0, clicks: 0, leads: 0, booked: 0 }
  );

  // Find top/weakest campaigns by CPL
  const campaignMap = new Map<string, { spend: number; leads: number }>();
  for (const row of campaignRes.data ?? []) {
    const key = row.campaign_name ?? "Unknown";
    const e = campaignMap.get(key) ?? { spend: 0, leads: 0 };
    campaignMap.set(key, {
      spend: e.spend + Number(row.spend ?? 0),
      leads: e.leads + (row.leads_count ?? 0),
    });
  }
  const rankedCampaigns = Array.from(campaignMap.entries())
    .filter(([, m]) => m.leads > 0)
    .sort(([, a], [, b]) => a.spend / a.leads - b.spend / b.leads);

  const recentMetrics = totals.spend > 0 || totals.leads > 0 ? {
    spend: totals.spend,
    leads: totals.leads,
    cpl: totals.leads > 0 ? totals.spend / totals.leads : 0,
    ctr: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
    bookingRate: totals.leads > 0 ? totals.booked / totals.leads : 0,
    topCampaign: rankedCampaigns[0]?.[0],
    weakestCampaign: rankedCampaigns[rankedCampaigns.length - 1]?.[0],
  } : undefined;

  const activeSignals = signalsRes.data ?? [];

  // Log the run start
  const { data: run } = await db()
    .from("ai_runs")
    .insert({
      client_id,
      run_type: "copy_gen",
      status: "running",
      input_summary: `${platform} copy gen for ${client.business_name}`,
    })
    .select()
    .single();

  try {
    const result = await generateCopyVariants({
      businessName: client.business_name,
      vertical: client.vertical ?? "other",
      offerDescription: client.offer_description ?? "",
      targetGeography: client.target_geography ?? "National",
      platform,
      count: count ?? 3,
      existingCopy: existingCopy ?? [],
      performanceNotes: performance_notes,
      recentMetrics,
      activeSignals,
    });

    // Generate one image per variant in parallel (non-blocking — images attach after response)
    const imagePromises = result.variants.map((v) =>
      generateAdImage({
        vertical: client.vertical ?? "other",
        platform,
        offerDescription: client.offer_description ?? "",
        angle: v.angle,
      })
    );

    // Insert copy rows immediately — image_url filled in after generation
    const creativeRows = result.variants.map((v) => ({
      client_id,
      type: "copy",
      platform,
      headline: v.headline,
      body: v.body,
      cta: v.cta,
      status: "draft",
      ai_generated: true,
      ai_notes: `Angle: ${v.angle}. Reasoning: ${result.reasoning}`,
    }));

    const { data: creatives } = await db()
      .from("creatives")
      .insert(creativeRows)
      .select();

    // After response: generate images → composite with Placid → attach URLs
    after(async () => {
      const backgroundUrls = await Promise.all(imagePromises);

      if (creatives) {
        await Promise.allSettled(
          creatives.map(async (c, i) => {
            const bgUrl = backgroundUrls[i] ?? null;

            // Try Placid compositing first (copy + background → polished ad)
            const placidUrl = await buildAdCreative({
              platform,
              headline: c.headline ?? "",
              body: c.body ?? "",
              cta: c.cta ?? "",
              backgroundImageUrl: bgUrl,
            });

            // Use Placid output if available, otherwise fall back to raw fal.ai background
            const finalUrl = placidUrl ?? bgUrl;
            if (finalUrl) {
              await db().from("creatives").update({ image_url: finalUrl }).eq("id", c.id);
            }
          })
        );
      }

      await db()
        .from("ai_runs")
        .update({ status: "completed", output: result, completed_at: new Date().toISOString() })
        .eq("id", run?.id);
    });

    return NextResponse.json({ variants: result.variants, creatives });
  } catch (err) {
    await db()
      .from("ai_runs")
      .update({ status: "failed", error: String(err) })
      .eq("id", run?.id);

    return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
  }
}
