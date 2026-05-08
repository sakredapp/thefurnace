import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { detectClientSignals } from "@/lib/ai";

const db = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function authCheck(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  return req.headers.get("authorization") === `Bearer ${cronSecret}`;
}

export async function GET(req: NextRequest) {
  if (!authCheck(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setUTCDate(now.getUTCDate() - 1);
  const periodStart = new Date(periodEnd);
  periodStart.setUTCDate(periodEnd.getUTCDate() - 13); // 14-day rolling window
  const startStr = periodStart.toISOString().split("T")[0];
  const endStr = periodEnd.toISOString().split("T")[0];
  const period = `${startStr} to ${endStr}`;

  // Previous 14-day window for trend comparison
  const prevEnd = new Date(periodStart);
  prevEnd.setUTCDate(periodStart.getUTCDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setUTCDate(prevEnd.getUTCDate() - 13);
  const prevStartStr = prevStart.toISOString().split("T")[0];
  const prevEndStr = prevEnd.toISOString().split("T")[0];

  const { data: clients } = await db()
    .from("clients")
    .select("id, business_name, vertical")
    .eq("status", "active");

  if (!clients?.length) {
    return NextResponse.json({ processed: 0, message: "No active clients" });
  }

  const results = await Promise.allSettled(
    clients.map((client) => processClientSignals(client, startStr, endStr, period, prevStartStr, prevEndStr))
  );

  return NextResponse.json({
    processed: results.filter((r) => r.status === "fulfilled").length,
    errors: results.filter((r) => r.status === "rejected").length,
    period,
  });
}

async function processClientSignals(
  client: { id: string; business_name: string; vertical: string | null },
  startStr: string,
  endStr: string,
  period: string,
  prevStartStr: string,
  prevEndStr: string,
) {
  // Current period metrics
  const [metricsRes, campaignRes, leadsRes, activesRes, signalsRes, prevMetricsRes] = await Promise.all([
    db().from("daily_metrics")
      .select("platform, spend, impressions, clicks, leads_count, booked_count")
      .eq("client_id", client.id)
      .gte("date", startStr).lte("date", endStr),
    db().from("campaign_performance")
      .select("campaign_name, platform, spend, impressions, clicks, leads_count")
      .eq("client_id", client.id)
      .gte("date", startStr).lte("date", endStr),
    db().from("leads")
      .select("status, vc_disposition")
      .eq("client_id", client.id)
      .gte("created_at", `${startStr}T00:00:00Z`)
      .lte("created_at", `${endStr}T23:59:59Z`),
    db().from("creatives")
      .select("headline, body, ai_notes, platform")
      .eq("client_id", client.id)
      .in("status", ["active", "approved"]),
    db().from("client_signals")
      .select("id, signal_type, signal, confidence, detected_from_period")
      .eq("client_id", client.id)
      .eq("active", true),
    // Previous period for trend calc
    db().from("daily_metrics")
      .select("spend, impressions, clicks, leads_count, booked_count")
      .eq("client_id", client.id)
      .gte("date", prevStartStr).lte("date", prevEndStr),
  ]);

  const metrics = metricsRes.data ?? [];
  const campaigns = campaignRes.data ?? [];
  const leads = leadsRes.data ?? [];
  const prevMetrics = prevMetricsRes.data ?? [];

  if (metrics.length === 0 && leads.length === 0) return; // no data yet

  // Aggregate by platform
  const byPlatform = new Map<string, { spend: number; impressions: number; clicks: number; leads: number; booked: number }>();
  for (const row of metrics) {
    const p = row.platform ?? "total";
    const e = byPlatform.get(p) ?? { spend: 0, impressions: 0, clicks: 0, leads: 0, booked: 0 };
    byPlatform.set(p, {
      spend: e.spend + Number(row.spend ?? 0),
      impressions: e.impressions + (row.impressions ?? 0),
      clicks: e.clicks + (row.clicks ?? 0),
      leads: e.leads + (row.leads_count ?? 0),
      booked: e.booked + (row.booked_count ?? 0),
    });
  }

  const platformMetrics = Array.from(byPlatform.entries()).map(([platform, m]) => ({
    platform,
    spend: m.spend,
    leads: m.leads,
    cpl: m.leads > 0 ? m.spend / m.leads : 0,
    ctr: m.impressions > 0 ? (m.clicks / m.impressions) * 100 : 0,
    bookingRate: m.leads > 0 ? m.booked / m.leads : 0,
  }));

  // Aggregate by campaign
  const campaignMap = new Map<string, { name: string; platform: string; spend: number; impressions: number; clicks: number; leads: number }>();
  for (const row of campaigns) {
    const key = `${row.platform}::${row.campaign_name}`;
    const e = campaignMap.get(key) ?? { name: row.campaign_name ?? "Unknown", platform: row.platform ?? "unknown", spend: 0, impressions: 0, clicks: 0, leads: 0 };
    campaignMap.set(key, {
      ...e,
      spend: e.spend + Number(row.spend ?? 0),
      impressions: e.impressions + (row.impressions ?? 0),
      clicks: e.clicks + (row.clicks ?? 0),
      leads: e.leads + (row.leads_count ?? 0),
    });
  }

  const byCampaign = Array.from(campaignMap.values()).map((c) => ({
    ...c,
    cpl: c.leads > 0 ? c.spend / c.leads : 0,
    ctr: c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0,
  }));

  // Lead funnel
  const funnel: Record<string, number> = {};
  for (const l of leads) {
    funnel[l.status] = (funnel[l.status] ?? 0) + 1;
    if (l.vc_disposition) {
      const key = `vc:${l.vc_disposition}`;
      funnel[key] = (funnel[key] ?? 0) + 1;
    }
  }

  // Trend vs previous period
  const prevTotals = prevMetrics.reduce(
    (acc, r) => ({ spend: acc.spend + Number(r.spend ?? 0), leads: acc.leads + (r.leads_count ?? 0), clicks: acc.clicks + (r.clicks ?? 0), impressions: acc.impressions + (r.impressions ?? 0), booked: acc.booked + (r.booked_count ?? 0) }),
    { spend: 0, leads: 0, clicks: 0, impressions: 0, booked: 0 }
  );
  const currTotals = metrics.reduce(
    (acc, r) => ({ spend: acc.spend + Number(r.spend ?? 0), leads: acc.leads + (r.leads_count ?? 0), clicks: acc.clicks + (r.clicks ?? 0), impressions: acc.impressions + (r.impressions ?? 0), booked: acc.booked + (r.booked_count ?? 0) }),
    { spend: 0, leads: 0, clicks: 0, impressions: 0, booked: 0 }
  );

  const pctChange = (curr: number, prev: number) =>
    prev > 0 ? ((curr - prev) / prev) * 100 : 0;

  const prevCpl = prevTotals.leads > 0 ? prevTotals.spend / prevTotals.leads : 0;
  const currCpl = currTotals.leads > 0 ? currTotals.spend / currTotals.leads : 0;
  const prevCtr = prevTotals.impressions > 0 ? (prevTotals.clicks / prevTotals.impressions) * 100 : 0;
  const currCtr = currTotals.impressions > 0 ? (currTotals.clicks / currTotals.impressions) * 100 : 0;
  const prevBooking = prevTotals.leads > 0 ? prevTotals.booked / prevTotals.leads : 0;
  const currBooking = currTotals.leads > 0 ? currTotals.booked / currTotals.leads : 0;

  const trendVsPrevious = prevTotals.leads > 0 ? {
    cplChange: pctChange(currCpl, prevCpl),
    ctrChange: pctChange(currCtr, prevCtr),
    bookingRateChange: pctChange(currBooking, prevBooking),
    leadsChange: pctChange(currTotals.leads, prevTotals.leads),
  } : undefined;

  // Active creatives with angle info
  const activeCreatives = (activesRes.data ?? []).map((c) => {
    const angle = c.ai_notes?.match(/Angle: ([^.]+)/)?.[1] ?? "Unknown";
    return { headline: c.headline ?? "", body: c.body ?? "", angle, platform: c.platform ?? "" };
  });

  // Run signal detection
  const detected = await detectClientSignals({
    businessName: client.business_name,
    vertical: client.vertical ?? "general",
    currentPeriod: period,
    metrics: {
      byPlatform: platformMetrics,
      byCampaign,
      leadFunnel: funnel,
      totalLeads: leads.length,
      totalBooked: funnel["booked"] ?? 0,
      totalClosed: funnel["closed_won"] ?? 0,
    },
    trendVsPrevious,
    activeCreatives,
    existingSignals: signalsRes.data ?? [],
  });

  // Supersede old signals
  if (detected.supersede_signals.length > 0) {
    await db()
      .from("client_signals")
      .update({ active: false })
      .in("id", detected.supersede_signals)
      .eq("client_id", client.id);
  }

  // Store new signals
  if (detected.signals.length > 0) {
    await db().from("client_signals").insert(
      detected.signals.map((s) => ({
        client_id: client.id,
        signal_type: s.signal_type,
        signal: s.signal,
        confidence: s.confidence,
        evidence: s.evidence,
        detected_from_period: period,
      }))
    );
  }

  // Log the run
  await db().from("ai_runs").insert({
    client_id: client.id,
    run_type: "analysis",
    status: "completed",
    input_summary: `signal_detection ${period}`,
    output: { signals: detected.signals, superseded: detected.supersede_signals, summary: detected.summary },
    completed_at: new Date().toISOString(),
  });
}
