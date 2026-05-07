import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const T = { accent: "#F4511E", muted: "rgba(255,255,255,0.45)" };

const STEP_DESCRIPTIONS: Record<string, string> = {
  google_ads: "Your account manager will connect your Google Ads account to our system.",
  meta_ads: "We'll link your Meta (Facebook/Instagram) Ads account for campaign management.",
  crm: "Connect your CRM so leads flow in automatically and get qualified.",
  offer: "We'll document your offer, target customer, and what makes you different.",
  geo_budget: "Set your monthly ad budget and the geographic areas you want to target.",
  tracking: "Install our conversion pixel so we can track leads back to revenue.",
  launch: "Final review of your campaign plan before we go live.",
};

export default async function ClientOnboarding() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: client } = await supabase
    .from("clients")
    .select("id, business_name, status")
    .eq("user_id", user.id)
    .single();

  if (!client) redirect("/login");

  const { data: steps } = await supabase
    .from("onboarding_steps")
    .select("*")
    .eq("client_id", client.id)
    .order("step_order", { ascending: true });

  const completedCount = steps?.filter((s) => s.completed).length ?? 0;
  const totalCount = steps?.length ?? 0;
  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const allDone = completedCount === totalCount && totalCount > 0;

  return (
    <div style={{ padding: "2rem 2.5rem", maxWidth: 680 }}>
      <h1 style={{ fontSize: "1.4rem", fontWeight: 900, color: "#fff", margin: "0 0 0.4rem" }}>
        Onboarding
      </h1>
      <p style={{ margin: "0 0 2rem", fontSize: "0.88rem", color: T.muted }}>
        Your account manager is working through these steps with you. Each one unlocks the next.
      </p>

      {/* Progress */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
          <span style={{ fontSize: "0.78rem", color: T.muted }}>{completedCount} of {totalCount} complete</span>
          <span style={{ fontSize: "0.78rem", color: allDone ? "#16a34a" : T.accent, fontWeight: 700 }}>
            {allDone ? "Complete!" : `${Math.round(progressPct)}%`}
          </span>
        </div>
        <div style={{ height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 4, overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${progressPct}%`,
            background: allDone ? "#16a34a" : T.accent,
            borderRadius: 4,
            transition: "width 0.4s ease",
          }} />
        </div>
      </div>

      {allDone && (
        <div style={{
          background: "rgba(22,163,74,0.08)",
          border: "1px solid rgba(22,163,74,0.25)",
          borderRadius: 12,
          padding: "1.25rem 1.5rem",
          marginBottom: "2rem",
          fontSize: "0.92rem",
          color: "#86efac",
          fontWeight: 600,
        }}>
          All steps complete — your campaigns are live!
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {steps?.map((step, i) => {
          const isNext = !step.completed && (i === 0 || steps[i - 1]?.completed);
          return (
            <div
              key={step.id}
              style={{
                display: "flex",
                gap: "1rem",
                padding: "1.1rem 1.25rem",
                background: step.completed
                  ? "rgba(22,163,74,0.05)"
                  : isNext
                  ? "rgba(244,81,30,0.06)"
                  : "rgba(255,255,255,0.02)",
                border: `1px solid ${
                  step.completed
                    ? "rgba(22,163,74,0.18)"
                    : isNext
                    ? "rgba(244,81,30,0.25)"
                    : "rgba(255,255,255,0.06)"
                }`,
                borderRadius: 12,
                opacity: !step.completed && !isNext ? 0.5 : 1,
              }}
            >
              {/* Circle */}
              <div style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.78rem",
                fontWeight: 800,
                background: step.completed
                  ? "#16a34a"
                  : isNext
                  ? T.accent
                  : "rgba(255,255,255,0.06)",
                color: step.completed || isNext ? "#fff" : T.muted,
                border: step.completed || isNext ? "none" : "1px solid rgba(255,255,255,0.1)",
              }}>
                {step.completed ? "✓" : i + 1}
              </div>

              {/* Content */}
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: "0.92rem",
                  fontWeight: 700,
                  color: step.completed ? "rgba(255,255,255,0.4)" : "#fff",
                  textDecoration: step.completed ? "line-through" : "none",
                  marginBottom: "0.2rem",
                }}>
                  {step.step_label}
                </div>
                <div style={{ fontSize: "0.8rem", color: T.muted, lineHeight: 1.5 }}>
                  {STEP_DESCRIPTIONS[step.step_key] ?? "Your account manager will complete this step."}
                </div>
                {step.completed && step.completed_at && (
                  <div style={{ fontSize: "0.72rem", color: "rgba(22,163,74,0.7)", marginTop: "0.3rem" }}>
                    Done {new Date(step.completed_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </div>
                )}
                {isNext && (
                  <div style={{ fontSize: "0.72rem", color: T.accent, fontWeight: 700, marginTop: "0.3rem", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    In Progress
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
