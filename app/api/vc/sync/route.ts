import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { uploadGoogleEnhancedConversion, type GoogleAdsMetadata } from "@/lib/google-ads";

const db = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// VC disposition → Furnace status mapping
const DISPOSITION_TO_STATUS: Record<string, string> = {
  new: "new",
  no_answer: "new",
  left_voicemail: "new",
  unresponsive: "new",
  callback: "contacted",
  interested: "contacted",
  sent_info: "contacted",
  reschedule: "contacted",
  appointment_set: "booked",
  second_call_booked: "booked",
  third_call_booked: "booked",
  application_sent: "booked",
  application_approved: "closed_won",
  aca: "closed_won",
  not_interested: "closed_lost",
  do_not_contact: "closed_lost",
  wrong_number: "unqualified",
  disconnected: "unqualified",
  disqualified: "unqualified",
};

// Dispositions that should fire attribution events
const CONVERSION_DISPOSITIONS = new Set([
  "appointment_set", "second_call_booked", "third_call_booked",
  "application_sent", "application_approved", "aca",
]);

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-webhook-secret");
  if (secret !== process.env.VC_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // VC sends: furnace_lead_id, vc_lead_id, disposition, rep_id
  const { furnace_lead_id, vc_lead_id, disposition, rep_id } = body as {
    furnace_lead_id?: string;
    vc_lead_id?: string;
    disposition?: string;
    rep_id?: string;
  };

  if (!furnace_lead_id || !disposition) {
    return NextResponse.json({ error: "furnace_lead_id and disposition required" }, { status: 400 });
  }

  const furnaceStatus = DISPOSITION_TO_STATUS[disposition] ?? "contacted";
  const now = new Date().toISOString();

  const statusTimestamps: Record<string, string> = {};
  if (furnaceStatus === "booked" || disposition === "appointment_set") statusTimestamps.booked_at = now;
  if (furnaceStatus === "closed_won") statusTimestamps.closed_at = now;
  if (furnaceStatus === "contacted" && !statusTimestamps.qualified_at) statusTimestamps.qualified_at = now;

  const { data: lead, error } = await db()
    .from("leads")
    .update({
      vc_disposition: disposition,
      vc_lead_id: vc_lead_id ?? null,
      vc_synced_at: now,
      status: furnaceStatus,
      ...statusTimestamps,
    })
    .eq("id", furnace_lead_id)
    .select("*, clients(id, business_name, vertical)")
    .single();

  if (error || !lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  // Fire attribution + update daily metrics after response
  after(async () => {
    await Promise.allSettled([
      // Attribution to Google/Meta if conversion event
      CONVERSION_DISPOSITIONS.has(disposition)
        ? fireAttributionEvents(lead, disposition)
        : Promise.resolve(),
      // Update daily metrics snapshot
      updateDailyMetrics(lead.client_id, disposition),
    ]);
  });

  return NextResponse.json({ success: true, furnace_status: furnaceStatus });
}

async function fireAttributionEvents(lead: Record<string, unknown>, disposition: string) {
  await Promise.allSettled([
    fireMetaConversionEvent(lead, disposition),
    fireGoogleEnhancedConversion(lead, disposition),
  ]);
}

async function fireMetaConversionEvent(lead: Record<string, unknown>, disposition: string) {
  const metaPixelId = process.env.META_PIXEL_ID;
  const metaToken = process.env.META_CONVERSIONS_API_TOKEN;
  if (!metaPixelId || !metaToken) return;

  const eventName =
    ["application_approved", "aca"].includes(disposition) ? "Purchase"
    : ["appointment_set", "second_call_booked", "third_call_booked"].includes(disposition) ? "Schedule"
    : "Lead";

  const { createHash } = await import("crypto");
  const hash = (v: string) => createHash("sha256").update(v.trim().toLowerCase()).digest("hex");

  await fetch(
    `https://graph.facebook.com/v19.0/${metaPixelId}/events?access_token=${metaToken}`,
    {
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
          custom_data: { furnace_lead_id: lead.id, vc_disposition: disposition },
        }],
      }),
    }
  ).catch(console.error);
}

async function fireGoogleEnhancedConversion(lead: Record<string, unknown>, disposition: string) {
  if (!process.env.GOOGLE_ADS_DEVELOPER_TOKEN) return;

  const clientId = lead.client_id as string;
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

async function updateDailyMetrics(clientId: string, disposition: string) {
  const today = new Date().toISOString().split("T")[0];

  // Bucket dispositions into metric columns
  const increment: Record<string, number> = {};

  if (["callback", "interested", "sent_info", "reschedule"].includes(disposition))
    increment.contacted_count = 1;
  if (["interested", "sent_info", "appointment_set", "second_call_booked", "third_call_booked", "application_sent", "application_approved", "aca"].includes(disposition))
    increment.qualified_count = 1;
  if (["appointment_set", "second_call_booked", "third_call_booked", "application_sent"].includes(disposition))
    increment.booked_count = 1;
  if (["application_approved", "aca"].includes(disposition))
    increment.closed_count = 1;
  if (["not_interested", "do_not_contact", "disqualified", "wrong_number", "disconnected"].includes(disposition))
    increment.disqualified_count = 1;
  if (["no_answer", "unresponsive"].includes(disposition))
    increment.no_answer_count = 1;
  if (disposition === "left_voicemail")
    increment.voicemail_count = 1;

  if (!Object.keys(increment).length) return;

  // Atomic increment per column via SQL function
  await Promise.allSettled(
    Object.entries(increment).map(([col, val]) =>
      db().rpc("increment_daily_metric", {
        p_client_id: clientId,
        p_date: today,
        p_platform: "total",
        p_column: col,
        p_amount: val,
      })
    )
  );
}
