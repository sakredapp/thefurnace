import { NextResponse } from "next/server";

// GHL webhooks are now routed per-client at /api/crm/ghl/[clientId]
export async function POST() {
  return NextResponse.json(
    { error: "Use the per-client endpoint: /api/crm/ghl/{clientId}?secret={webhook_secret}" },
    { status: 410 }
  );
}
