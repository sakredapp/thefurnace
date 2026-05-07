"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { registerGHLWebhook, type GHLMetadata } from "@/lib/gohighlevel";

export async function saveIntegration(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const clientId = formData.get("client_id") as string;
  const type = formData.get("type") as string;
  const accountId = formData.get("account_id") as string | null;
  const accountLabel = formData.get("account_label") as string | null;

  // Collect any metadata_* fields from the form (e.g. metadata_refresh_token, metadata_ad_account_id)
  const metadata: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("metadata_") && typeof value === "string" && value.trim()) {
      metadata[key.replace("metadata_", "")] = value.trim();
    }
  }

  // Fetch existing metadata to merge (don't overwrite fields not in this submission)
  const { data: existing } = await supabase
    .from("integrations")
    .select("metadata")
    .eq("client_id", clientId)
    .eq("type", type)
    .single();

  let mergedMetadata = { ...(existing?.metadata ?? {}), ...metadata };

  // Auto-register GHL webhook when GHL integration is first connected
  if (type === "gohighlevel" && mergedMetadata.api_key && mergedMetadata.location_id && !mergedMetadata.webhook_id) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.furnaceleads.com";
    const result = await registerGHLWebhook(
      mergedMetadata as unknown as GHLMetadata,
      `${siteUrl}/api/crm/ghl`
    );
    if (result?.webhook_id) {
      mergedMetadata = { ...mergedMetadata, webhook_id: result.webhook_id };
    }
  }

  await supabase
    .from("integrations")
    .upsert(
      {
        client_id: clientId,
        type,
        account_id: accountId || null,
        account_label: accountLabel || null,
        status: "connected",
        connected_at: new Date().toISOString(),
        error_message: null,
        metadata: Object.keys(mergedMetadata).length > 0 ? mergedMetadata : undefined,
      },
      { onConflict: "client_id,type" }
    );

  // Mark the corresponding onboarding step complete
  const stepKeyMap: Record<string, string> = {
    google_ads: "google_ads",
    meta_ads: "meta_ads",
    gohighlevel: "crm",
    hubspot: "crm",
    salesforce: "crm",
    google_analytics: "tracking",
    virtual_closer: "virtual_closer",
  };

  const stepKey = stepKeyMap[type];
  if (stepKey) {
    const { data: step } = await supabase
      .from("onboarding_steps")
      .select("id, completed")
      .eq("client_id", clientId)
      .eq("step_key", stepKey)
      .single();

    if (step && !step.completed) {
      await supabase
        .from("onboarding_steps")
        .update({ completed: true, completed_at: new Date().toISOString() })
        .eq("id", step.id);

      // Check if all steps done → flip to active
      const { data: allSteps } = await supabase
        .from("onboarding_steps")
        .select("completed")
        .eq("client_id", clientId);

      if (allSteps?.every((s) => s.completed)) {
        await supabase.from("clients").update({ status: "active" }).eq("id", clientId);
      }
    }
  }

  redirect(`/admin/clients/${clientId}`);
}

export async function inviteClient(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const clientId = formData.get("client_id") as string;
  const email = formData.get("email") as string;

  // Use service role to send invite — server action with admin client
  const { createClient: createServiceClient } = await import("@supabase/supabase-js");
  const adminClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { data: invited, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${siteUrl}/dashboard`,
    data: { role: "client", client_id: clientId },
  });

  if (error) redirect(`/admin/clients/${clientId}?invite_error=1`);

  // Create profile row and link user_id to client
  if (invited.user) {
    await adminClient.from("profiles").upsert({
      id: invited.user.id,
      role: "client",
      full_name: null,
    });

    await adminClient
      .from("clients")
      .update({ user_id: invited.user.id })
      .eq("id", clientId);
  }

  redirect(`/admin/clients/${clientId}?invited=1`);
}
