import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { analyzeCampaignPerformance, generateWeeklyReport } from "@/lib/ai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function authCheck(req: NextRequest): boolean {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(req: NextRequest) {
  if (!authCheck(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setUTCDate(now.getUTCDate() - 1);
  const periodStart = new Date(periodEnd);
  periodStart.setUTCDate(periodEnd.getUTCDate() - 6);

  const startStr = periodStart.toISOString().split("T")[0];
  const endStr = periodEnd.toISOString().split("T")[0];
  const period = `${startStr} to ${endStr}`;

  const { data: clients } = await supabase
    .from("clients")
    .select("id, business_name, vertical, offer_description")
    .eq("status", "active");

  if (!clients?.length) {
    return NextResponse.json({ processed: 0, message: "No active clients" });
  }

  const results = await Promise.allSettled(
    clients.map((client) => processClientReport(client, startStr, endStr, period))
  );

  const processed = results.filter((r) => r.status === "fulfilled").length;
  const errors = results.filter((r) => r.status === "rejected").length;

  return NextResponse.json({ processed, errors, period });
}

async function processClientReport(
  client: { id: string; business_name: string; vertical: string | null; offer_description: string | null },
  startStr: string,
  endStr: string,
  period: string
) {
  // Aggregate daily_metrics for the period
  const { data: metrics } = await supabase
    .from("daily_metrics")
    .select("platform, spend, impressions, clicks, leads_count, qualified_count, booked_count, closed_count")
    .eq("client_id", client.id)
    .gte("date", startStr)
    .lte("date", endStr);

  // Lead status breakdown
  const { data: leads } = await supabase
    .from("leads")
    .select("status")
    .eq("client_id", client.id)
    .gte("created_at", `${startStr}T00:00:00Z`)
    .lte("created_at", `${endStr}T23:59:59Z`);

  const leadStatusBreakdown: Record<string, number> = {};
  for (const lead of leads ?? []) {
    leadStatusBreakdown[lead.status] = (leadStatusBreakdown[lead.status] ?? 0) + 1;
  }

  // Group metrics by platform
  const byPlatform = new Map<string, {
    impressions: number; clicks: number; leads: number;
    qualifiedLeads: number; spend: number;
  }>();

  for (const row of metrics ?? []) {
    const p = row.platform ?? "total";
    const existing = byPlatform.get(p) ?? { impressions: 0, clicks: 0, leads: 0, qualifiedLeads: 0, spend: 0 };
    byPlatform.set(p, {
      impressions: existing.impressions + (row.impressions ?? 0),
      clicks: existing.clicks + (row.clicks ?? 0),
      leads: existing.leads + (row.leads_count ?? 0),
      qualifiedLeads: existing.qualifiedLeads + (row.qualified_count ?? 0),
      spend: existing.spend + Number(row.spend ?? 0),
    });
  }

  const campaigns = Array.from(byPlatform.entries()).map(([platform, m]) => ({ platform, ...m }));

  // Totals for the weekly report
  const totals = campaigns.reduce(
    (acc, c) => ({
      spend: acc.spend + c.spend,
      impressions: acc.impressions + c.impressions,
      clicks: acc.clicks + c.clicks,
      leads: acc.leads + c.leads,
      qualified: acc.qualified + c.qualifiedLeads,
    }),
    { spend: 0, impressions: 0, clicks: 0, leads: 0, qualified: 0 }
  );

  const metricsForReport: Record<string, number | string> = {
    total_spend: `$${totals.spend.toFixed(2)}`,
    impressions: totals.impressions,
    clicks: totals.clicks,
    leads: totals.leads,
    qualified_leads: totals.qualified,
    cpl: totals.leads > 0 ? `$${(totals.spend / totals.leads).toFixed(2)}` : "N/A",
    booking_rate: totals.leads > 0
      ? `${(((leadStatusBreakdown.booked ?? 0) / totals.leads) * 100).toFixed(1)}%`
      : "N/A",
  };

  // Log run start
  const { data: runRecord } = await supabase
    .from("ai_runs")
    .insert({
      client_id: client.id,
      run_type: "report",
      status: "running",
      input_summary: `weekly_report ${period}`,
    })
    .select("id")
    .single();

  try {
    const [analysis, report] = await Promise.all([
      campaigns.length > 0
        ? analyzeCampaignPerformance({
            businessName: client.business_name,
            vertical: client.vertical ?? "general",
            offerDescription: client.offer_description ?? "",
            campaigns,
          })
        : null,
      generateWeeklyReport({
        businessName: client.business_name,
        period,
        metrics: metricsForReport,
        leadStatusBreakdown,
      }),
    ]);

    await supabase
      .from("ai_runs")
      .update({
        status: "completed",
        output: { analysis, report, metricsForReport, leadStatusBreakdown },
        completed_at: new Date().toISOString(),
      })
      .eq("id", runRecord!.id);
  } catch (err) {
    await supabase
      .from("ai_runs")
      .update({
        status: "failed",
        error: String(err),
        completed_at: new Date().toISOString(),
      })
      .eq("id", runRecord!.id);
    throw err;
  }
}
