import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { uploadGoogleEnhancedConversion, type GoogleAdsMetadata } from "@/lib/google-ads";

const db = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CONVERSION_STATUSES = new Set(["qualified", "booked", "closed_won"]);

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-webhook-secret");
  if (secret !== process.env.LEADS_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const furnaceLeadId = body.furnace_lead_id as string | undefined;
  const newStatus = body.status as string | undefined;

  if (!furnaceLeadId || !newStatus) {
    return NextResponse.json({ error: "furnace_lead_id and status required" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const statusTimestamps: Record<string, string> = {};
  if (newStatus === "qualified") statusTimestamps.qualified_at = now;
  if (newStatus === "booked") statusTimestamps.booked_at = now;
  if (newStatus === "closed_won") statusTimestamps.closed_at = now;

  const { data: lead, error } = await db()
    .from("leads")
    .update({ status: newStatus, ...statusTimestamps })
    .eq("id", furnaceLeadId)
    .select("*, clients(id, business_name, vertical)")
    .single();

  if (error || !lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  // Fire offline conversion events to Google + Meta after response
  if (CONVERSION_STATUSES.has(newStatus)) {
    const clientId = (lead.clients as { id: string } | null)?.id ?? lead.client_id as string;
    after(async () => {
      await Promise.allSettled([
        fireGoogleEnhancedConversion(lead, newStatus, clientId),
        fireMetaConversionEvent(lead, newStatus),
      ]);
    });
  }

  return NextResponse.json({ success: true });
}

async function fireGoogleEnhancedConversion(
  lead: Record<string, unknown>,
  status: string,
  clientId: string
) {
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
  });
}

async function fireMetaConversionEvent(
  lead: Record<string, unknown>,
  status: string
) {
  const metaPixelId = process.env.META_PIXEL_ID;
  const metaAccessToken = process.env.META_CONVERSIONS_API_TOKEN;
  if (!metaPixelId || !metaAccessToken) return;

  const eventName =
    status === "booked" ? "Schedule"
    : status === "qualified" ? "Lead"
    : "Purchase";

  // Meta Conversions API
  await fetch(
    `https://graph.facebook.com/v19.0/${metaPixelId}/events?access_token=${metaAccessToken}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: [
          {
            event_name: eventName,
            event_time: Math.floor(Date.now() / 1000),
            event_source_url: process.env.NEXT_PUBLIC_SITE_URL,
            action_source: "system_generated",
            user_data: {
              em: lead.email ? [hashSHA256(lead.email as string)] : undefined,
              ph: lead.phone ? [hashSHA256(normalizePhone(lead.phone as string))] : undefined,
            },
            custom_data: {
              furnace_lead_id: lead.id,
              lead_status: status,
            },
          },
        ],
      }),
    }
  );
}

// Meta requires SHA-256 hashed, lowercase, trimmed PII
function hashSHA256(value: string): string {
  const { createHash } = require("crypto");
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}
