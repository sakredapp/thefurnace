import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createGHLContact, type GHLMetadata } from "@/lib/gohighlevel";

const db = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  // Verify shared webhook secret
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

  const clientId = body.client_id as string | undefined;
  if (!clientId) {
    return NextResponse.json({ error: "client_id required" }, { status: 400 });
  }

  // Upsert lead into Supabase
  const { data: lead, error } = await db()
    .from("leads")
    .insert({
      client_id: clientId,
      source: (body.source as string) ?? "other",
      campaign_id: body.campaign_id as string | null,
      ad_set_id: body.ad_set_id as string | null,
      ad_id: body.ad_id as string | null,
      full_name: body.full_name as string | null,
      email: body.email as string | null,
      phone: body.phone as string | null,
      status: "new",
      raw_payload: body,
    })
    .select()
    .single();

  if (error) {
    console.error("Lead insert error:", error);
    return NextResponse.json({ error: "Failed to store lead" }, { status: 500 });
  }

  // Forward to Virtual Closer and/or GHL if configured for this client
  const { data: client } = await db()
    .from("clients")
    .select("id, business_name, crm_type")
    .eq("id", clientId)
    .single();

  const { data: integrations } = await db()
    .from("integrations")
    .select("type, account_id, status")
    .eq("client_id", clientId)
    .eq("status", "connected");

  const forwardPromises: Promise<unknown>[] = [];

  // Forward to Virtual Closer — use per-client repId stored in integration account_id
  const vcIntegration = integrations?.find((i) => i.type === "virtual_closer");
  const vcRepId = vcIntegration?.account_id;
  const vcSecret = process.env.FURNACE_INBOUND_SECRET;
  if (vcRepId && vcSecret) {
    forwardPromises.push(
      fetch(`https://virtualcloser.com/api/webhooks/furnace/${vcRepId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-furnace-secret": vcSecret,
        },
        body: JSON.stringify({
          furnace_lead_id: lead.id,
          client_id: clientId,
          client_name: client?.business_name,
          full_name: lead.full_name,
          email: lead.email,
          phone: lead.phone,
          source: lead.source,
          campaign_id: lead.campaign_id,
        }),
      }).catch((e) => console.error("VC forward failed:", e))
    );
  }

  // Forward to GHL via API — creates contact with furnace tracking tag
  const ghlIntegration = integrations?.find((i) => i.type === "gohighlevel");
  if (ghlIntegration) {
    const { data: ghlIntFull } = await db()
      .from("integrations")
      .select("metadata")
      .eq("client_id", clientId)
      .eq("type", "gohighlevel")
      .single();

    const ghlMeta = ghlIntFull?.metadata as GHLMetadata | undefined;
    if (ghlMeta?.api_key && ghlMeta?.location_id) {
      forwardPromises.push(
        createGHLContact(ghlMeta, {
          furnace_lead_id: lead.id,
          full_name: lead.full_name,
          email: lead.email,
          phone: lead.phone,
          source: lead.source,
        }).catch((e) => console.error("GHL contact create failed:", e))
      );
    }
  }

  // Forward after response is sent — don't block the webhook caller
  after(async () => {
    await Promise.allSettled(forwardPromises);
  });

  return NextResponse.json({ success: true, lead_id: lead.id }, { status: 201 });
}
