"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as serviceClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { publishToMeta, type MetaPublishMetadata } from "@/lib/meta-publish";
import { publishToGoogle, type GooglePublishMetadata } from "@/lib/google-publish";

const db = () => serviceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function publishCreative(creativeId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch the creative + client info
  const { data: creative } = await db()
    .from("creatives")
    .select("*, clients(id, business_name)")
    .eq("id", creativeId)
    .single();

  if (!creative) throw new Error("Creative not found");
  if (creative.status !== "approved") throw new Error("Creative must be approved before publishing");

  const clientId = creative.client_id as string;

  // Mark as publishing
  await db().from("creatives")
    .update({ publish_status: "publishing", publish_error: null })
    .eq("id", creativeId);

  try {
    if (creative.platform === "meta_ads") {
      await publishToMetaAds(creativeId, clientId, creative);
    } else if (creative.platform === "google_ads") {
      await publishToGoogleAds(creativeId, clientId, creative);
    } else {
      throw new Error(`Unsupported platform: ${creative.platform}`);
    }
  } catch (err) {
    await db().from("creatives").update({
      publish_status: "failed",
      publish_error: String(err),
    }).eq("id", creativeId);
    throw err;
  }
}

async function publishToMetaAds(
  creativeId: string,
  clientId: string,
  creative: Record<string, unknown>
) {
  const { data: integration } = await db()
    .from("integrations")
    .select("metadata")
    .eq("client_id", clientId)
    .eq("type", "meta_ads")
    .eq("status", "connected")
    .single();

  const meta = integration?.metadata as Record<string, string> | null;
  if (!meta?.ad_account_id || !meta?.access_token) {
    throw new Error("Meta Ads not connected or missing credentials");
  }
  if (!meta.page_id) throw new Error("Meta Page ID not configured — add it in integrations");
  if (!meta.ad_set_id) throw new Error("Meta Ad Set ID not configured — add it in integrations");
  if (!meta.final_url && !creative.final_url) throw new Error("Landing page URL required — add it in integrations or on the creative");

  const publishMeta: MetaPublishMetadata = {
    ad_account_id: meta.ad_account_id,
    access_token: meta.access_token,
    page_id: meta.page_id,
    ad_set_id: meta.ad_set_id,
    final_url: (creative.final_url as string) ?? meta.final_url,
  };

  const result = await publishToMeta(publishMeta, {
    headline: creative.headline as string,
    body: creative.body as string,
    cta: creative.cta as string ?? "Learn More",
    imageUrl: creative.image_url as string | null,
  });

  await db().from("creatives").update({
    platform_ad_id: result.ad_id,
    platform_creative_id: result.creative_id,
    publish_status: "published",
    published_at: new Date().toISOString(),
    status: "active",
  }).eq("id", creativeId);
}

async function publishToGoogleAds(
  creativeId: string,
  clientId: string,
  creative: Record<string, unknown>
) {
  const { data: integration } = await db()
    .from("integrations")
    .select("metadata")
    .eq("client_id", clientId)
    .eq("type", "google_ads")
    .eq("status", "connected")
    .single();

  const meta = integration?.metadata as Record<string, string> | null;
  if (!meta?.customer_id || !meta?.refresh_token) {
    throw new Error("Google Ads not connected or missing credentials");
  }
  if (!meta.ad_group_resource_name) throw new Error("Ad Group Resource Name not configured — add it in integrations");
  if (!meta.final_url && !creative.final_url) throw new Error("Landing page URL required");

  const publishMeta: GooglePublishMetadata = {
    customer_id: meta.customer_id,
    refresh_token: meta.refresh_token,
    ad_group_resource_name: meta.ad_group_resource_name,
    final_url: (creative.final_url as string) ?? meta.final_url,
  };

  const result = await publishToGoogle(publishMeta, {
    headline: creative.headline as string,
    body: creative.body as string,
  });

  await db().from("creatives").update({
    platform_ad_id: result.ad_resource_name,
    publish_status: "published",
    published_at: new Date().toISOString(),
    status: "active",
  }).eq("id", creativeId);
}

export async function rejectCreative(creativeId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await db().from("creatives")
    .update({ status: "rejected" })
    .eq("id", creativeId);
}
