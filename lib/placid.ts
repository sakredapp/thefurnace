const PLACID_BASE = "https://api.placid.app/api/rest";

interface PlacidLayer {
  text?: string;
  image?: string;
  hide?: boolean;
}

interface PlacidResponse {
  status: "finished" | "queued" | "error";
  image_url?: string;
  polling_url?: string;
  error?: string;
}

export interface PlacidCreativeInput {
  templateUuid: string;
  layers: Record<string, PlacidLayer>;
  webhookUrl?: string;
}

async function placidFetch(path: string, body: Record<string, unknown>): Promise<PlacidResponse> {
  const key = process.env.PLACID_API_KEY;
  if (!key) throw new Error("PLACID_API_KEY not set");

  const res = await fetch(`${PLACID_BASE}${path}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Placid API error ${res.status}: ${text}`);
  }

  return res.json();
}

async function pollUntilDone(pollingUrl: string, maxWaitMs = 60_000): Promise<string | null> {
  const key = process.env.PLACID_API_KEY;
  const deadline = Date.now() + maxWaitMs;

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 2000));
    const res = await fetch(pollingUrl, {
      headers: { "Authorization": `Bearer ${key}` },
    });
    if (!res.ok) return null;
    const data: PlacidResponse = await res.json();
    if (data.status === "finished" && data.image_url) return data.image_url;
    if (data.status === "error") return null;
  }

  return null;
}

export async function generatePlacidCreative(input: PlacidCreativeInput): Promise<string | null> {
  if (!process.env.PLACID_API_KEY) return null;

  try {
    const data = await placidFetch("/images", {
      template_uuid: input.templateUuid,
      layers: input.layers,
      ...(input.webhookUrl ? { webhook_url: input.webhookUrl } : {}),
    });

    if (data.status === "finished" && data.image_url) return data.image_url;
    if (data.status === "queued" && data.polling_url) {
      return pollUntilDone(data.polling_url);
    }

    return null;
  } catch (err) {
    console.error("[placid] creative generation failed:", err);
    return null;
  }
}

// Build a Placid creative from Furnace copy + a background image URL.
// Template must have layers named: headline, body, cta, background (image).
// Falls back gracefully if no template UUID is configured for the platform.
export async function buildAdCreative(input: {
  platform: "meta_ads" | "google_ads";
  headline: string;
  body: string;
  cta: string;
  backgroundImageUrl: string | null;
}): Promise<string | null> {
  const templateUuid =
    input.platform === "meta_ads"
      ? process.env.PLACID_TEMPLATE_META
      : process.env.PLACID_TEMPLATE_GOOGLE;

  if (!templateUuid) return null;

  const layers: Record<string, PlacidLayer> = {
    headline: { text: input.headline },
    body: { text: input.body },
    cta: { text: input.cta },
  };

  if (input.backgroundImageUrl) {
    layers.background = { image: input.backgroundImageUrl };
  }

  return generatePlacidCreative({ templateUuid, layers });
}
