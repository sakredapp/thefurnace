import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { markStepComplete } from "@/app/actions/clients";

// Per-step SOP context injected into the UI — no DB needed
const STEP_META: Record<string, { desc: string; action?: (id: string) => { label: string; href: string } }> = {
  profile: {
    desc: "Fill in business name, vertical, offer description, target geography, and monthly budget.",
  },
  client_invite: {
    desc: "Send the client their portal login so they can view their own dashboard.",
    action: (id) => ({ label: "Send Invite →", href: `/admin/clients/${id}/invite` }),
  },
  google_ads: {
    desc: "Get Google Ads Customer ID (XXX-XXX-XXXX), OAuth refresh token, and conversion action resource name. Client must grant admin access to your MCC email first.",
    action: (id) => ({ label: "Connect Google Ads →", href: `/admin/clients/${id}/integrations?step=google_ads` }),
  },
  meta_ads: {
    desc: "Get Meta Ad Account ID (act_XXXXXXXXXX) and a long-lived access token from Meta Business Suite. Client adds your Business ID as a partner first.",
    action: (id) => ({ label: "Connect Meta Ads →", href: `/admin/clients/${id}/integrations?step=meta_ads` }),
  },
  virtual_closer: {
    desc: "Enter the VC Rep ID assigned to this client. Once saved, all inbound leads auto-route to that rep via the VC webhook.",
    action: (id) => ({ label: "Connect Virtual Closer →", href: `/admin/clients/${id}/integrations?step=virtual_closer` }),
  },
  crm: {
    desc: "Optional. If client uses GoHighLevel: get their Location ID + API key and save. Furnace will auto-register the webhook — no manual GHL workflow setup needed.",
    action: (id) => ({ label: "Connect GHL →", href: `/admin/clients/${id}/integrations?step=gohighlevel` }),
  },
  tracking: {
    desc: "Get GA4 Measurement ID (G-XXXXXXXXXX) from analytics.google.com → Admin → Data Streams.",
    action: (id) => ({ label: "Connect GA4 →", href: `/admin/clients/${id}/integrations?step=google_analytics` }),
  },
  webhook_test: {
    desc: "Send a test POST to the leads webhook to confirm the lead appears in the pipeline and routes to VC. Use the URL and secret shown below.",
  },
  copy_gen: {
    desc: "Generate the first round of AI ad copy for Google and Meta. Review and approve before handing off to the media buyer.",
    action: (_id) => ({ label: "Go to Creatives →", href: `/admin/creatives` }),
  },
  launch: {
    desc: "Confirm campaigns are live in Google Ads and Meta. Mark this step done to flip client status to Active.",
  },
};

const T = {
  accent: "#F4511E",
  muted: "rgba(255,255,255,0.45)",
  faint: "rgba(255,255,255,0.08)",
};

const STATUS_COLORS: Record<string, string> = {
  onboarding: "#F4511E",
  active: "#16a34a",
  paused: "#ca8a04",
  churned: "#6b7280",
};

const VERTICAL_LABELS: Record<string, string> = {
  insurance: "Insurance",
  elective_health: "Elective Health",
  legal: "Legal",
  real_estate: "Real Estate",
  home_services: "Home Services",
  other: "Other",
};

const CRM_LABELS: Record<string, string> = {
  gohighlevel: "GoHighLevel",
  hubspot: "HubSpot",
  salesforce: "Salesforce",
  other: "Other",
};

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const [{ data: client }, { data: steps }, { data: metricsRows }, { data: leadRows }, { data: recentReports }] = await Promise.all([
    supabase.from("clients").select("*").eq("id", id).single(),
    supabase
      .from("onboarding_steps")
      .select("*")
      .eq("client_id", id)
      .order("step_order", { ascending: true }),
    supabase
      .from("daily_metrics")
      .select("platform, spend, impressions, clicks, leads_count, qualified_count, booked_count, closed_count")
      .eq("client_id", id)
      .gte("date", thirtyDaysAgo),
    supabase
      .from("leads")
      .select("status")
      .eq("client_id", id),
    supabase
      .from("ai_runs")
      .select("id, input_summary, output, created_at")
      .eq("client_id", id)
      .eq("run_type", "report")
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  if (!client) notFound();

  // Aggregate 30-day metrics by platform
  const platformMap = new Map<string, { spend: number; impressions: number; clicks: number; leads: number; qualified: number; booked: number; closed: number }>();
  for (const row of metricsRows ?? []) {
    const p = row.platform ?? "total";
    const e = platformMap.get(p) ?? { spend: 0, impressions: 0, clicks: 0, leads: 0, qualified: 0, booked: 0, closed: 0 };
    platformMap.set(p, {
      spend: e.spend + Number(row.spend ?? 0),
      impressions: e.impressions + (row.impressions ?? 0),
      clicks: e.clicks + (row.clicks ?? 0),
      leads: e.leads + (row.leads_count ?? 0),
      qualified: e.qualified + (row.qualified_count ?? 0),
      booked: e.booked + (row.booked_count ?? 0),
      closed: e.closed + (row.closed_count ?? 0),
    });
  }
  const platforms = Array.from(platformMap.entries()).filter(([p]) => p !== "total");
  const totals30d = Array.from(platformMap.values()).reduce(
    (acc, r) => ({ spend: acc.spend + r.spend, impressions: acc.impressions + r.impressions, clicks: acc.clicks + r.clicks, leads: acc.leads + r.leads, qualified: acc.qualified + r.qualified, booked: acc.booked + r.booked, closed: acc.closed + r.closed }),
    { spend: 0, impressions: 0, clicks: 0, leads: 0, qualified: 0, booked: 0, closed: 0 }
  );

  const statusCount: Record<string, number> = {};
  for (const l of leadRows ?? []) {
    statusCount[l.status] = (statusCount[l.status] ?? 0) + 1;
  }
  const totalLeads = (leadRows ?? []).length;

  const hasCampaignData = (metricsRows ?? []).length > 0;

  const completedCount = steps?.filter((s) => s.completed).length ?? 0;
  const totalCount = steps?.length ?? 0;
  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div style={{ padding: "2rem 2.5rem", maxWidth: 860 }}>
      {/* Back */}
      <a
        href="/admin"
        style={{ fontSize: "0.82rem", color: T.muted, textDecoration: "none" }}
      >
        ← Clients
      </a>

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          margin: "1rem 0 2rem",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 900,
              color: "#fff",
              margin: "0 0 0.35rem",
            }}
          >
            {client.business_name}
          </h1>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
            {client.vertical && (
              <span style={{ fontSize: "0.78rem", color: T.muted }}>
                {VERTICAL_LABELS[client.vertical] ?? client.vertical}
              </span>
            )}
            <span
              style={{
                fontSize: "0.7rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: STATUS_COLORS[client.status] ?? T.muted,
                background: `${STATUS_COLORS[client.status] ?? "#6b7280"}18`,
                border: `1px solid ${STATUS_COLORS[client.status] ?? "#6b7280"}40`,
                borderRadius: 6,
                padding: "3px 8px",
              }}
            >
              {client.status}
            </span>
          </div>
        </div>

        <div style={{ fontSize: "0.78rem", color: T.muted, textAlign: "right" }}>
          <div>
            Added{" "}
            {new Date(client.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        {[
          { label: "Contact", value: client.contact_name || "—" },
          { label: "Email", value: client.contact_email },
          { label: "Phone", value: client.contact_phone || "—" },
          {
            label: "Monthly Budget",
            value: client.monthly_budget
              ? `$${Number(client.monthly_budget).toLocaleString()}`
              : "—",
          },
          {
            label: "CRM",
            value: client.crm_type
              ? (CRM_LABELS[client.crm_type] ?? client.crm_type)
              : "—",
          },
          { label: "Geography", value: client.target_geography || "—" },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 10,
              padding: "1rem 1.25rem",
            }}
          >
            <div
              style={{
                fontSize: "0.68rem",
                fontWeight: 800,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: T.muted,
                marginBottom: "0.35rem",
              }}
            >
              {item.label}
            </div>
            <div
              style={{
                fontSize: "0.92rem",
                color: "#fff",
                fontWeight: 600,
                wordBreak: "break-word",
              }}
            >
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {/* Offer description */}
      {client.offer_description && (
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 10,
            padding: "1rem 1.25rem",
            marginBottom: "2rem",
          }}
        >
          <div
            style={{
              fontSize: "0.68rem",
              fontWeight: 800,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: T.muted,
              marginBottom: "0.5rem",
            }}
          >
            Offer
          </div>
          <p
            style={{
              margin: 0,
              fontSize: "0.92rem",
              color: "rgba(255,255,255,0.8)",
              lineHeight: 1.6,
            }}
          >
            {client.offer_description}
          </p>
        </div>
      )}

      {/* Campaign Performance */}
      <div style={{ marginBottom: "2.5rem" }}>
        <div style={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: T.accent, marginBottom: "1rem" }}>
          Campaign Performance · Last 30 Days
        </div>

        {!hasCampaignData ? (
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "1.5rem", fontSize: "0.85rem", color: T.muted, textAlign: "center" }}>
            No ad data synced yet. Metrics appear here once Google Ads and Meta Ads are connected and the daily sync runs.
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem", marginBottom: "1rem" }}>
              {[
                { label: "Ad Spend", value: totals30d.spend > 0 ? `$${totals30d.spend.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—" },
                { label: "Leads", value: totals30d.leads > 0 ? totals30d.leads.toLocaleString() : "—" },
                { label: "CPL", value: totals30d.leads > 0 ? `$${(totals30d.spend / totals30d.leads).toFixed(2)}` : "—" },
                { label: "Booked", value: totals30d.booked > 0 ? `${totals30d.booked} (${totals30d.leads > 0 ? ((totals30d.booked / totals30d.leads) * 100).toFixed(1) : 0}%)` : "—" },
              ].map((kpi) => (
                <div key={kpi.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "1rem 1.25rem" }}>
                  <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#fff", lineHeight: 1 }}>{kpi.value}</div>
                  <div style={{ fontSize: "0.67rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: T.muted, marginTop: "0.3rem" }}>{kpi.label}</div>
                </div>
              ))}
            </div>

            {/* Platform breakdown */}
            {platforms.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(platforms.length, 2)}, 1fr)`, gap: "0.75rem", marginBottom: "1rem" }}>
                {platforms.map(([platform, m]) => (
                  <div key={platform} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "1rem 1.25rem" }}>
                    <div style={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: T.muted, marginBottom: "0.75rem" }}>
                      {platform === "google_ads" ? "Google Ads" : platform === "meta_ads" ? "Meta Ads" : platform}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem" }}>
                      {[
                        { label: "Spend", value: `$${m.spend.toFixed(0)}` },
                        { label: "Leads", value: m.leads },
                        { label: "CPL", value: m.leads > 0 ? `$${(m.spend / m.leads).toFixed(0)}` : "—" },
                        { label: "Impressions", value: m.impressions > 1000 ? `${(m.impressions / 1000).toFixed(1)}k` : m.impressions },
                        { label: "Clicks", value: m.clicks },
                        { label: "CTR", value: m.impressions > 0 ? `${((m.clicks / m.impressions) * 100).toFixed(2)}%` : "—" },
                      ].map((s) => (
                        <div key={s.label}>
                          <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#fff" }}>{s.value}</div>
                          <div style={{ fontSize: "0.65rem", color: T.muted }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Lead pipeline */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "1rem 1.25rem" }}>
              <div style={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: T.muted, marginBottom: "0.75rem" }}>
                Full Lead Pipeline · All Time ({totalLeads} total)
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {[
                  { key: "new", label: "New", color: "#6b7280" },
                  { key: "contacted", label: "Contacted", color: "#3b82f6" },
                  { key: "qualified", label: "Qualified", color: "#f59e0b" },
                  { key: "booked", label: "Booked", color: "#8b5cf6" },
                  { key: "closed_won", label: "Won", color: "#16a34a" },
                  { key: "closed_lost", label: "Lost", color: "#dc2626" },
                  { key: "unqualified", label: "DQ", color: "#374151" },
                ].map(({ key, label, color }) => {
                  const n = statusCount[key] ?? 0;
                  if (n === 0) return null;
                  return (
                    <div key={key} style={{
                      background: `${color}18`, border: `1px solid ${color}35`,
                      borderRadius: 8, padding: "0.5rem 0.9rem", textAlign: "center",
                    }}>
                      <div style={{ fontSize: "1.1rem", fontWeight: 900, color }}>{n}</div>
                      <div style={{ fontSize: "0.65rem", fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Weekly AI reports */}
        {(recentReports ?? []).length > 0 && (
          <div style={{ marginTop: "1rem" }}>
            <div style={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: T.muted, marginBottom: "0.75rem" }}>
              AI Weekly Reports
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {(recentReports ?? []).map((run) => {
                const r = (run.output as { report?: { headline?: string; clientSummary?: string; concerns?: string[] } } | null)?.report;
                const analysis = (run.output as { analysis?: { summary?: string; recommendations?: Array<{ priority: string; action: string }> } } | null)?.analysis;
                if (!r) return null;
                return (
                  <div key={run.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "1rem 1.25rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", marginBottom: "0.5rem" }}>
                      <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#fff" }}>{r.headline}</div>
                      <div style={{ fontSize: "0.68rem", color: T.muted, flexShrink: 0 }}>
                        {new Date(run.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </div>
                    </div>
                    {r.clientSummary && (
                      <p style={{ margin: "0 0 0.5rem", fontSize: "0.82rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>{r.clientSummary}</p>
                    )}
                    {analysis?.recommendations?.filter(rec => rec.priority === "high").slice(0, 2).map((rec, i) => (
                      <div key={i} style={{ fontSize: "0.78rem", color: T.accent, marginTop: "0.25rem" }}>→ {rec.action}</div>
                    ))}
                    {r.concerns && r.concerns.length > 0 && (
                      <div style={{ fontSize: "0.75rem", color: "#f59e0b", marginTop: "0.35rem" }}>⚠ {r.concerns[0]}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Onboarding SOP */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
          <div style={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: T.accent }}>
            Onboarding Checklist
          </div>
          <div style={{ fontSize: "0.8rem", color: T.muted }}>{completedCount} / {totalCount} complete</div>
        </div>

        <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 4, marginBottom: "1.5rem", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${progressPct}%`, background: progressPct === 100 ? "#16a34a" : T.accent, borderRadius: 4 }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {steps?.map((step, i) => {
            const meta = STEP_META[step.step_key];
            const actionLink = !step.completed && meta?.action ? meta.action(id) : null;
            const isWebhookStep = step.step_key === "webhook_test";
            const webhookUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.furnaceleads.com"}/api/leads`;

            return (
              <div
                key={step.id}
                style={{
                  background: step.completed ? "rgba(22,163,74,0.05)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${step.completed ? "rgba(22,163,74,0.18)" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: 10,
                  padding: "1rem 1.25rem",
                  opacity: step.completed ? 0.65 : 1,
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
                  {/* Number / check */}
                  <div style={{
                    width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.72rem", fontWeight: 800, marginTop: 1,
                    background: step.completed ? "#16a34a" : "rgba(255,255,255,0.06)",
                    border: step.completed ? "none" : "1px solid rgba(255,255,255,0.12)",
                    color: step.completed ? "#fff" : T.muted,
                  }}>
                    {step.completed ? "✓" : i + 1}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Step label */}
                    <div style={{
                      fontSize: "0.92rem", fontWeight: 700,
                      color: step.completed ? "rgba(255,255,255,0.45)" : "#fff",
                      textDecoration: step.completed ? "line-through" : "none",
                      marginBottom: meta?.desc && !step.completed ? "0.3rem" : 0,
                    }}>
                      {step.step_label}
                    </div>

                    {/* Description */}
                    {meta?.desc && !step.completed && (
                      <div style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.5, marginBottom: "0.6rem" }}>
                        {meta.desc}
                      </div>
                    )}

                    {/* Webhook URL block */}
                    {isWebhookStep && !step.completed && (
                      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "0.75rem 1rem", marginBottom: "0.6rem" }}>
                        <div style={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: T.muted, marginBottom: "0.5rem" }}>Webhook Config</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                          <div>
                            <span style={{ fontSize: "0.72rem", color: T.muted }}>POST URL </span>
                            <code style={{ fontSize: "0.78rem", color: "#fff", background: "rgba(255,255,255,0.06)", padding: "2px 6px", borderRadius: 4 }}>{webhookUrl}</code>
                          </div>
                          <div>
                            <span style={{ fontSize: "0.72rem", color: T.muted }}>Header </span>
                            <code style={{ fontSize: "0.78rem", color: "#fff", background: "rgba(255,255,255,0.06)", padding: "2px 6px", borderRadius: 4 }}>x-webhook-secret: {"<LEADS_WEBHOOK_SECRET from Vercel>"}</code>
                          </div>
                          <div style={{ fontSize: "0.72rem", color: T.muted, marginTop: "0.25rem" }}>
                            Required fields: client_id, source, full_name, email, phone
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Completed date */}
                    {step.completed && step.completed_at && (
                      <div style={{ fontSize: "0.72rem", color: T.muted }}>
                        Done {new Date(step.completed_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                    )}

                    {/* Action row */}
                    {!step.completed && (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                        {actionLink && (
                          <a href={actionLink.href} style={{
                            fontSize: "0.78rem", fontWeight: 700, color: "#fff",
                            background: T.accent, borderRadius: 6, padding: "0.35rem 0.9rem",
                            textDecoration: "none", whiteSpace: "nowrap",
                          }}>
                            {actionLink.label}
                          </a>
                        )}
                        <form action={markStepComplete.bind(null, step.id, client.id)}>
                          <button type="submit" style={{
                            background: "none", border: `1px solid rgba(255,255,255,0.15)`,
                            color: "rgba(255,255,255,0.45)", borderRadius: 6,
                            padding: "0.35rem 0.85rem", fontSize: "0.75rem", fontWeight: 700,
                            cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
                          }}>
                            Mark Done
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
