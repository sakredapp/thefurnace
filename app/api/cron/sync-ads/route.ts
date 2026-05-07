import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { syncGoogleAdsCampaignMetrics, type GoogleAdsMetadata } from "@/lib/google-ads";
import { syncMetaAdsCampaignMetrics, type MetaAdsMetadata } from "@/lib/meta-ads";

const db = () => createClient(
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

  // Yesterday — full day is always complete
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const dateStr = yesterday.toISOString().split("T")[0];
  const dateRange = { start: dateStr, end: dateStr };

  // All active clients
  const { data: clients, error: clientsError } = await db()
    .from("clients")
    .select("id, business_name")
    .eq("status", "active");

  if (clientsError || !clients?.length) {
    return NextResponse.json({ synced: 0, errors: 0, message: "No active clients" });
  }

  // Fetch all connected ad integrations in one query
  const clientIds = clients.map((c) => c.id);
  const { data: integrations } = await db()
    .from("integrations")
    .select("client_id, type, metadata")
    .in("client_id", clientIds)
    .in("type", ["google_ads", "meta_ads"])
    .eq("status", "connected");

  const intByClient = new Map<string, typeof integrations>();
  for (const int of integrations ?? []) {
    if (!intByClient.has(int.client_id)) intByClient.set(int.client_id, []);
    intByClient.get(int.client_id)!.push(int);
  }

  const results = await Promise.allSettled(
    clients.flatMap((client) => {
      const ints = intByClient.get(client.id) ?? [];
      return ints.map(async (int) => {
        if (int.type === "google_ads") {
          await syncGoogleAdsCampaignMetrics(client.id, int.metadata as GoogleAdsMetadata, dateRange);
          return `${client.business_name} google_ads`;
        } else {
          await syncMetaAdsCampaignMetrics(client.id, int.metadata as MetaAdsMetadata, dateRange);
          return `${client.business_name} meta_ads`;
        }
      });
    })
  );

  const synced = results.filter((r) => r.status === "fulfilled").length;
  const errors = results.filter((r) => r.status === "rejected").length;
  const errorDetails = results
    .filter((r): r is PromiseRejectedResult => r.status === "rejected")
    .map((r) => String(r.reason));

  // Log run
  await db().from("ai_runs").insert({
    client_id: null,
    run_type: "analysis",
    status: errors === 0 ? "completed" : "failed",
    input_summary: `daily_ads_sync ${dateStr}`,
    output: { synced, errors, errorDetails },
    completed_at: new Date().toISOString(),
  });

  return NextResponse.json({ synced, errors, date: dateStr, errorDetails });
}
