const GHL_BASE = "https://rest.gohighlevel.com/v1";

export interface GHLMetadata {
  location_id: string;
  api_key: string;
  webhook_id?: string; // stored after auto-registration
}

function headers(apiKey: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
}

// ─── Create contact with furnace tracking tag ─────────────────────────────────

export async function createGHLContact(
  meta: GHLMetadata,
  lead: {
    furnace_lead_id: string;
    full_name?: string | null;
    email?: string | null;
    phone?: string | null;
    source?: string | null;
  }
): Promise<{ contact_id: string } | null> {
  const [firstName, ...rest] = (lead.full_name ?? "").trim().split(" ");
  const lastName = rest.join(" ") || undefined;

  const res = await fetch(`${GHL_BASE}/contacts/`, {
    method: "POST",
    headers: headers(meta.api_key),
    body: JSON.stringify({
      locationId: meta.location_id,
      firstName: firstName || "Unknown",
      lastName,
      email: lead.email ?? undefined,
      phone: lead.phone ?? undefined,
      source: "furnace",
      // Tag encodes furnace_lead_id — parsed on webhook return
      tags: ["furnace", `furnace:${lead.furnace_lead_id}`],
    }),
  });

  if (!res.ok) {
    console.error("[ghl] createContact failed:", await res.text());
    return null;
  }

  const data = await res.json();
  return { contact_id: data.contact?.id ?? data.id };
}

// ─── Auto-register webhook for this location ──────────────────────────────────

export async function registerGHLWebhook(
  meta: GHLMetadata,
  webhookUrl: string
): Promise<{ webhook_id: string } | null> {
  const res = await fetch(`${GHL_BASE}/hooks/`, {
    method: "POST",
    headers: headers(meta.api_key),
    body: JSON.stringify({
      locationId: meta.location_id,
      url: webhookUrl,
      events: ["OpportunityStageUpdate"],
    }),
  });

  if (!res.ok) {
    console.error("[ghl] registerWebhook failed:", await res.text());
    return null;
  }

  const data = await res.json();
  return { webhook_id: data.id ?? data.hook?.id };
}

// ─── Delete webhook when integration is removed ───────────────────────────────

export async function deleteGHLWebhook(meta: GHLMetadata): Promise<void> {
  if (!meta.webhook_id) return;
  await fetch(`${GHL_BASE}/hooks/${meta.webhook_id}/`, {
    method: "DELETE",
    headers: headers(meta.api_key),
  }).catch(() => {});
}

// ─── Parse furnace_lead_id from GHL webhook payload ──────────────────────────

export function parseFurnaceLeadId(
  tags: string[] | undefined | null
): string | null {
  const tag = tags?.find((t) => t.startsWith("furnace:"));
  return tag ? tag.replace("furnace:", "") : null;
}

// ─── Map GHL stage name → Furnace status ─────────────────────────────────────

const STAGE_MAP: Array<{ match: RegExp; status: string }> = [
  { match: /new|fresh|inbound/i,                        status: "new" },
  { match: /contact|reach|call|attempt|voicemail/i,     status: "contacted" },
  { match: /qualif|interest|prospect/i,                 status: "qualified" },
  { match: /appoint|book|schedul|set|meeting/i,         status: "booked" },
  { match: /won|closed.won|sale|paid|approv|aca/i,      status: "closed_won" },
  { match: /lost|closed.lost|dead|disqualif|no.sale/i,  status: "closed_lost" },
  { match: /wrong|disconnect|bad.number|unqualif/i,     status: "unqualified" },
];

export function mapGHLStageToStatus(stageName: string): string {
  for (const { match, status } of STAGE_MAP) {
    if (match.test(stageName)) return status;
  }
  return "contacted"; // safe default
}
