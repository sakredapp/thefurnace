import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const T = { accent: "#F4511E", muted: "rgba(255,255,255,0.45)" };

const SOURCE_LABEL: Record<string, string> = {
  google_ads: "Google",
  meta_ads: "Meta",
  organic: "Organic",
  referral: "Referral",
  other: "Other",
};

const STATUS_COLOR: Record<string, string> = {
  new: "#6b7280",
  contacted: "#3b82f6",
  qualified: "#f59e0b",
  booked: "#8b5cf6",
  closed_won: "#16a34a",
  closed_lost: "#dc2626",
  unqualified: "#6b7280",
};

const DISPOSITION_LABEL: Record<string, string> = {
  new: "New",
  no_answer: "No Answer",
  left_voicemail: "Voicemail",
  callback: "Callback",
  interested: "Interested",
  sent_info: "Sent Info",
  appointment_set: "Appt Set",
  second_call_booked: "2nd Call",
  third_call_booked: "3rd Call",
  application_sent: "App Sent",
  application_approved: "Approved",
  aca: "ACA",
  not_interested: "Not Interested",
  do_not_contact: "DNC",
  wrong_number: "Wrong #",
  disconnected: "Disconnected",
  disqualified: "Disqualified",
  reschedule: "Reschedule",
  unresponsive: "Unresponsive",
};

function fmt(n: number, decimals = 0) {
  return n.toLocaleString("en-US", { maximumFractionDigits: decimals });
}
function fmtDollar(n: number) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function pct(num: number, den: number) {
  if (!den) return "—";
  return (num / den * 100).toFixed(1) + "%";
}

type DailyRow = {
  spend: number;
  impressions: number;
  clicks: number;
  leads_count: number;
  contacted_count: number;
  qualified_count: number;
  booked_count: number;
  closed_count: number;
  disqualified_count: number;
  no_answer_count: number;
  voicemail_count: number;
};

type Lead = {
  id: string;
  full_name: string | null;
  source: string | null;
  status: string;
  vc_disposition: string | null;
  created_at: string;
};

export default async function ClientDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: client } = await supabase
    .from("clients")
    .select("id, business_name, status, monthly_budget, vertical")
    .eq("user_id", user.id)
    .single();

  if (!client) redirect("/login");

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString().split("T")[0];

  const [metricsRes, creativesRes, recentLeadsRes, totalLeadsRes, reportsRes] = await Promise.all([
    supabase
      .from("daily_metrics")
      .select("spend,impressions,clicks,leads_count,contacted_count,qualified_count,booked_count,closed_count,disqualified_count,no_answer_count,voicemail_count")
      .eq("client_id", client.id)
      .gte("date", thirtyDaysAgo),
    supabase
      .from("creatives")
      .select("id, status, platform, headline, ai_generated", { count: "exact" })
      .eq("client_id", client.id)
      .eq("status", "active")
      .limit(3),
    supabase
      .from("leads")
      .select("id, full_name, source, status, vc_disposition, created_at")
      .eq("client_id", client.id)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("leads")
      .select("status", { count: "exact" })
      .eq("client_id", client.id),
    supabase
      .from("ai_runs")
      .select("id, input_summary, output, created_at")
      .eq("client_id", client.id)
      .eq("run_type", "report")
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(4),
  ]);

  const rows: DailyRow[] = (metricsRes.data ?? []) as DailyRow[];

  const totals = rows.reduce(
    (acc, r) => ({
      spend: acc.spend + Number(r.spend ?? 0),
      impressions: acc.impressions + (r.impressions ?? 0),
      clicks: acc.clicks + (r.clicks ?? 0),
      leads: acc.leads + (r.leads_count ?? 0),
      contacted: acc.contacted + (r.contacted_count ?? 0),
      qualified: acc.qualified + (r.qualified_count ?? 0),
      booked: acc.booked + (r.booked_count ?? 0),
      closed: acc.closed + (r.closed_count ?? 0),
      disqualified: acc.disqualified + (r.disqualified_count ?? 0),
      no_answer: acc.no_answer + (r.no_answer_count ?? 0),
      voicemail: acc.voicemail + (r.voicemail_count ?? 0),
    }),
    { spend: 0, impressions: 0, clicks: 0, leads: 0, contacted: 0, qualified: 0, booked: 0, closed: 0, disqualified: 0, no_answer: 0, voicemail: 0 }
  );

  const cpl = totals.leads > 0 ? totals.spend / totals.leads : 0;
  const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
  const contactRate = totals.leads > 0 ? totals.contacted / totals.leads : 0;
  const bookingRate = totals.leads > 0 ? totals.booked / totals.leads : 0;

  const activeCreatives = creativesRes.data ?? [];
  const activeCreativesCount = creativesRes.count ?? 0;
  const recentLeads: Lead[] = (recentLeadsRes.data ?? []) as Lead[];
  const totalLeadsCount = totalLeadsRes.count ?? 0;
  const reports = (reportsRes.data ?? []) as Array<{
    id: string;
    input_summary: string;
    output: { report?: { headline?: string; clientSummary?: string; highlights?: string[]; concerns?: string[]; nextWeekPlan?: string[] } } | null;
    created_at: string;
  }>;

  const isOnboarding = client.status === "onboarding";

  return (
    <div style={{ padding: "2rem 2.5rem", maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 900, color: "#fff", margin: 0 }}>
            {client.business_name}
          </h1>
          <div style={{ fontSize: "0.82rem", color: T.muted, marginTop: "0.2rem" }}>
            Last 30 days · {client.vertical ?? "All verticals"}
          </div>
        </div>
        {client.monthly_budget && (
          <div style={{ fontSize: "0.82rem", color: T.muted }}>
            Monthly budget: <span style={{ color: "#fff", fontWeight: 700 }}>${Number(client.monthly_budget).toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Onboarding banner */}
      {isOnboarding && (
        <div style={{
          background: "rgba(244,81,30,0.08)", border: "1px solid rgba(244,81,30,0.25)",
          borderRadius: 12, padding: "1rem 1.5rem", marginBottom: "2rem",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap",
        }}>
          <div style={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.7)" }}>
            Your campaigns aren't live yet. Complete your onboarding to start generating leads.
          </div>
          <a href="/onboarding" style={{
            background: T.accent, color: "#fff", borderRadius: 8,
            padding: "0.5rem 1.2rem", fontWeight: 700, fontSize: "0.85rem",
            textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0,
          }}>
            Continue Setup →
          </a>
        </div>
      )}

      {/* Top KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
        {[
          { label: "Ad Spend", value: totals.spend > 0 ? fmtDollar(totals.spend) : "—", sub: "30 days" },
          { label: "Leads Generated", value: fmt(totals.leads), sub: `${fmt(totalLeadsCount)} total` },
          { label: "Cost Per Lead", value: cpl > 0 ? fmtDollar(cpl) : "—", sub: "avg this period" },
          { label: "Booking Rate", value: pct(totals.booked, totals.leads), sub: `${totals.booked} booked` },
        ].map((s) => (
          <div key={s.label} style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12, padding: "1.25rem 1.5rem",
          }}>
            <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "#fff", lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: T.muted, marginTop: "0.35rem" }}>{s.label}</div>
            <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", marginTop: "0.2rem" }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Ad stats + VC funnel side by side */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>

        {/* Ad performance */}
        <div style={{
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 12, padding: "1.5rem",
        }}>
          <div style={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: T.muted, marginBottom: "1.25rem" }}>
            Ad Performance · 30d
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            {[
              { label: "Impressions", value: totals.impressions > 0 ? fmt(totals.impressions) : "—" },
              { label: "Clicks", value: totals.clicks > 0 ? fmt(totals.clicks) : "—" },
              { label: "CTR", value: ctr > 0 ? ctr.toFixed(2) + "%" : "—" },
              { label: "CPL", value: cpl > 0 ? fmtDollar(cpl) : "—" },
            ].map((s) => (
              <div key={s.label}>
                <div style={{ fontSize: "1.4rem", fontWeight: 900, color: "#fff", lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: "0.72rem", color: T.muted, marginTop: "0.2rem" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* VC nurture funnel */}
        <div style={{
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 12, padding: "1.5rem",
        }}>
          <div style={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: T.muted, marginBottom: "1.25rem" }}>
            Nurture Funnel · 30d
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[
              { label: "Contacted", count: totals.contacted, rate: contactRate, color: "#3b82f6" },
              { label: "Qualified", count: totals.qualified, rate: totals.leads > 0 ? totals.qualified / totals.leads : 0, color: "#f59e0b" },
              { label: "Booked", count: totals.booked, rate: bookingRate, color: "#8b5cf6" },
              { label: "Closed", count: totals.closed, rate: totals.leads > 0 ? totals.closed / totals.leads : 0, color: "#16a34a" },
            ].map((row) => (
              <div key={row.label}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                  <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.7)" }}>{row.label}</span>
                  <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#fff" }}>
                    {fmt(row.count)} <span style={{ color: row.color, fontWeight: 600 }}>({pct(row.count, totals.leads)})</span>
                  </span>
                </div>
                <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", width: `${Math.min(row.rate * 100, 100)}%`,
                    background: row.color, borderRadius: 2,
                    transition: "width 0.4s ease",
                  }} />
                </div>
              </div>
            ))}
          </div>

          {/* No-answer / DQ breakdown */}
          {(totals.no_answer > 0 || totals.disqualified > 0 || totals.voicemail > 0) && (
            <div style={{ display: "flex", gap: "1.25rem", marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              {totals.no_answer > 0 && (
                <div style={{ fontSize: "0.75rem", color: T.muted }}>
                  No answer: <span style={{ color: "#fff" }}>{fmt(totals.no_answer)}</span>
                </div>
              )}
              {totals.voicemail > 0 && (
                <div style={{ fontSize: "0.75rem", color: T.muted }}>
                  Voicemail: <span style={{ color: "#fff" }}>{fmt(totals.voicemail)}</span>
                </div>
              )}
              {totals.disqualified > 0 && (
                <div style={{ fontSize: "0.75rem", color: T.muted }}>
                  Disqualified: <span style={{ color: "#fff" }}>{fmt(totals.disqualified)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Weekly reports */}
      {reports.length > 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: T.muted, marginBottom: "1rem" }}>
            Weekly Reports
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {reports.map((run) => {
              const r = run.output?.report;
              if (!r) return null;
              const period = run.input_summary?.replace("weekly_report ", "") ?? "";
              return (
                <div key={run.id} style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 12, padding: "1.5rem",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontSize: "1rem", fontWeight: 800, color: "#fff", lineHeight: 1.3 }}>{r.headline}</div>
                      <div style={{ fontSize: "0.72rem", color: T.muted, marginTop: "0.25rem" }}>{period}</div>
                    </div>
                    <div style={{ fontSize: "0.7rem", color: T.muted, flexShrink: 0 }}>
                      {new Date(run.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                  </div>
                  {r.clientSummary && (
                    <p style={{ margin: "0 0 1rem", fontSize: "0.88rem", color: "rgba(255,255,255,0.75)", lineHeight: 1.6, borderLeft: `3px solid ${T.accent}`, paddingLeft: "0.9rem" }}>
                      {r.clientSummary}
                    </p>
                  )}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    {r.highlights && r.highlights.length > 0 && (
                      <div>
                        <div style={{ fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#16a34a", marginBottom: "0.4rem" }}>Highlights</div>
                        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                          {r.highlights.slice(0, 3).map((h, i) => (
                            <li key={i} style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.65)" }}>✓ {h}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {r.nextWeekPlan && r.nextWeekPlan.length > 0 && (
                      <div>
                        <div style={{ fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: T.accent, marginBottom: "0.4rem" }}>Next Week</div>
                        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                          {r.nextWeekPlan.slice(0, 3).map((p, i) => (
                            <li key={i} style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.65)" }}>{i + 1}. {p}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent leads + Active creatives */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem" }}>

        {/* Recent leads */}
        <div style={{
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 12, padding: "1.5rem",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <div style={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: T.muted }}>
              Recent Leads
            </div>
            <span style={{ fontSize: "0.72rem", color: T.muted }}>{fmt(totalLeadsCount)} total</span>
          </div>

          {recentLeads.length === 0 ? (
            <div style={{ fontSize: "0.85rem", color: T.muted, textAlign: "center", padding: "2rem 0" }}>
              No leads yet. Campaigns will start delivering leads once you go live.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {recentLeads.map((lead) => {
                const statusColor = STATUS_COLOR[lead.status] ?? "#6b7280";
                return (
                  <div key={lead.id} style={{
                    display: "flex", alignItems: "center", gap: "0.75rem",
                    padding: "0.6rem 0.75rem",
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.05)",
                    borderRadius: 8,
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {lead.full_name ?? "Unknown"}
                      </div>
                      <div style={{ fontSize: "0.72rem", color: T.muted, marginTop: "0.1rem" }}>
                        {SOURCE_LABEL[lead.source ?? ""] ?? "Unknown"} · {new Date(lead.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexShrink: 0 }}>
                      {lead.vc_disposition && (
                        <span style={{
                          fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.06em",
                          color: "#c084fc", background: "rgba(192,132,252,0.1)",
                          border: "1px solid rgba(192,132,252,0.2)",
                          borderRadius: 4, padding: "2px 6px", whiteSpace: "nowrap",
                        }}>
                          {DISPOSITION_LABEL[lead.vc_disposition] ?? lead.vc_disposition}
                        </span>
                      )}
                      <span style={{
                        fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                        color: statusColor, background: `${statusColor}15`,
                        border: `1px solid ${statusColor}30`,
                        borderRadius: 4, padding: "2px 6px", whiteSpace: "nowrap",
                      }}>
                        {lead.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Active creatives */}
        <div style={{
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 12, padding: "1.5rem",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <div style={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: T.muted }}>
              Live Creatives
            </div>
            <span style={{ fontSize: "0.72rem", color: T.muted }}>{activeCreativesCount} active</span>
          </div>

          {activeCreatives.length === 0 ? (
            <div style={{ fontSize: "0.82rem", color: T.muted, textAlign: "center", padding: "2rem 0", lineHeight: 1.6 }}>
              No live creatives yet.
              <br />
              <span style={{ fontSize: "0.75rem" }}>Your team is building your ad assets.</span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {activeCreatives.map((c) => (
                <div key={c.id} style={{
                  padding: "0.75rem",
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  borderRadius: 8,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.4rem" }}>
                    <span style={{ fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: T.muted }}>
                      {c.platform === "google_ads" ? "Google" : c.platform === "meta_ads" ? "Meta" : "Both"}
                    </span>
                    {c.ai_generated && (
                      <span style={{ fontSize: "0.6rem", fontWeight: 700, color: T.accent, background: `${T.accent}15`, border: `1px solid ${T.accent}30`, borderRadius: 4, padding: "1px 5px" }}>
                        AI
                      </span>
                    )}
                    <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "#16a34a", background: "rgba(22,163,74,0.1)", border: "1px solid rgba(22,163,74,0.25)", borderRadius: 4, padding: "1px 5px" }}>
                      Live
                    </span>
                  </div>
                  {c.headline && (
                    <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#fff", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>
                      {c.headline}
                    </div>
                  )}
                </div>
              ))}
              {activeCreativesCount > 3 && (
                <div style={{ fontSize: "0.75rem", color: T.muted, textAlign: "center" }}>
                  +{activeCreativesCount - 3} more
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
