"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_STEPS = [
  { step_key: "google_ads", step_label: "Connect Google Ads", step_order: 1 },
  { step_key: "meta_ads", step_label: "Connect Meta Ads", step_order: 2 },
  { step_key: "crm", step_label: "Connect CRM", step_order: 3 },
  { step_key: "offer", step_label: "Define Your Offer", step_order: 4 },
  { step_key: "geo_budget", step_label: "Set Geography & Budget", step_order: 5 },
  { step_key: "tracking", step_label: "Install Conversion Tracking", step_order: 6 },
  { step_key: "launch", step_label: "Review & Launch", step_order: 7 },
];

export async function createClient_(formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: client, error } = await supabase
    .from("clients")
    .insert({
      business_name: formData.get("business_name") as string,
      contact_name: formData.get("contact_name") as string,
      contact_email: formData.get("contact_email") as string,
      contact_phone: formData.get("contact_phone") as string,
      vertical: formData.get("vertical") as string,
      monthly_budget: Number(formData.get("monthly_budget")) || null,
      target_geography: formData.get("target_geography") as string,
      offer_description: formData.get("offer_description") as string,
      crm_type: formData.get("crm_type") as string,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) redirect("/admin/clients/new?error=1");

  // Seed default onboarding steps
  await supabase.from("onboarding_steps").insert(
    DEFAULT_STEPS.map((s) => ({ ...s, client_id: client.id }))
  );

  redirect(`/admin/clients/${client.id}`);
}

export async function markStepComplete(stepId: string, clientId: string) {
  const supabase = await createClient();

  await supabase
    .from("onboarding_steps")
    .update({ completed: true, completed_at: new Date().toISOString() })
    .eq("id", stepId);

  // Flip client to active if all steps are now done
  const { data: steps } = await supabase
    .from("onboarding_steps")
    .select("completed")
    .eq("client_id", clientId);

  if (steps && steps.every((s) => s.completed)) {
    await supabase
      .from("clients")
      .update({ status: "active" })
      .eq("id", clientId);
  }

  redirect(`/admin/clients/${clientId}`);
}
