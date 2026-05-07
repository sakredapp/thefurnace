import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parseFurnaceLeadId, mapGHLStageToStatus } from "@/lib/gohighlevel";
import { uploadGoogleEnhancedConversion, type GoogleAdsMetadata } from "@/lib/google-ads";

const db = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CONVERSION_STATUSES = new Set(["qualified", "booked", "closed_won"]);

export async function POST(req: NextRequest) {
  // GHL signs requests with a shared secret if configured — check if set
  const ghlSecret = process.env.GHL_WEBHOOK_SECRET;
  if (ghlSecret) {
    const sig = req.headers.get("x-ghl-signature") ?? req.headers.get("x-hub-signature-256");
    if (sig !== ghlSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Only handle OpportunityStageUpdate events
  if (body.type !== "OpportunityStageUpdate") {
    return NextResponse.json({ ok: true, skipped: true });
  }

  // GHL payload shape:
  // { type, locationId, id, pipelineStage: { name }, contact: { tags: [] } }
  const contact = body.contact as { tags?: string[] } | undefined;
  const stage = body.pipelineStage as { name?: string } | undefined;

  const furnaceLeadId = parseFurnaceLeadId(contact?.tags);
  if (!furnaceLeadId) {
    // Not a Furnace-originated lead — ignore
    return NextResponse.json({ ok: true, skipped: true });
  }

  const stageName = stage?.name ?? "";
  const newStatus = mapGHLStageToStatus(stageName);
  const now = new Date().toISOString();

  const statusTimestamps: Record<string, string> = {};
  if (newStatus === "qualified") statusTimestamps.qualified_at = now;
  if (newStatus === "booked") statusTimestamps.booked_at = now;
  if (newStatus === "closed_won") statusTimestamps.closed_at = now;

  const { data: lead, error } = await db()
    .from("leads")
    .update({ status: newStatus, ghl_stage: stageName, ...statusTimestamps })
    .eq("id", furnaceLeadId)
    .select("*, clients(id, business_name)")
    .single();

  if (error || !lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  // Fire attribution events after response for conversion statuses
  if (CONVERSION_STATUSES.has(newStatus)) {
    const clientId = lead.client_id as string;
    after(async () => {
      await Promise.allSettled([
        fireGoogleEnhancedConversion(lead, clientId),
        fireMetaConversionEvent(lead, newStatus),
      ]);
    });
  }

  return NextResponse.json({ ok: true, furnace_status: newStatus, ghl_stage: stageName });
}

async function fireGoogleEnhancedConversion(lead: Record<string, unknown>, clientId: string) {
  if (!process.env.GOOGLE_ADS_DEVELOPER_TOKEN) return;

  const { data: integration } = await db()
    .from("integrations")
    .select("metadata")
    .eq("client_id", clientId)
    .eq("type", "google_ads")
    .eq("status", "connected")
    .single();

  if (!integration?.metadata) return;
  const meta = integration.metadata as GoogleAdsMetadata;
  if (!meta.customer_id || !meta.refresh_token || !meta.conversion_action_id) return;

  await uploadGoogleEnhancedConversion(meta, {
    email: lead.email as string | undefined,
    phone: lead.phone as string | undefined,
    conversionDateTime: new Date().toISOString(),
  }).catch(console.error);
}

async function fireMetaConversionEvent(lead: Record<string, unknown>, status: string) {
  const metaPixelId = process.env.META_PIXEL_ID;
  const metaToken = process.env.META_CONVERSIONS_API_TOKEN;
  if (!metaPixelId || !metaToken) return;

  const eventName =
    status === "booked" ? "Schedule"
    : status === "qualified" ? "Lead"
    : "Purchase";

  const { createHash } = await import("crypto");
  const hash = (v: string) => createHash("sha256").update(v.trim().toLowerCase()).digest("hex");

  await fetch(`https://graph.facebook.com/v19.0/${metaPixelId}/events?access_token=${metaToken}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      data: [{
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        action_source: "system_generated",
        user_data: {
          em: lead.email ? [hash(lead.email as string)] : undefined,
          ph: lead.phone ? [hash((lead.phone as string).replace(/\D/g, ""))] : undefined,
        },
        custom_data: { furnace_lead_id: lead.id, lead_status: status },
      }],
    }),
  }).catch(console.error);
}
