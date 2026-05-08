const T = { accent: "#F4511E", muted: "rgba(255,255,255,0.45)" };

interface Service {
  name: string;
  category: string;
  description: string;
  layer: string;
  envVars: string[];
  dashboardUrl: string;
  docsUrl?: string;
  notes?: string;
}

const SERVICES: Service[] = [
  {
    name: "Anthropic Claude",
    category: "AI",
    description: "Powers all AI: copy generation (Sonnet 4.6), signal detection, weekly reports. Haiku 4.5 for fast summaries.",
    layer: "Layer 2 — AI Engine",
    envVars: ["ANTHROPIC_API_KEY"],
    dashboardUrl: "https://console.anthropic.com",
    docsUrl: "https://docs.anthropic.com",
    notes: "Check usage + billing under 'Usage' — pay-per-token. High-volume signal detection and copy gen both hit Sonnet.",
  },
  {
    name: "fal.ai",
    category: "AI",
    description: "Generates background images for ad creatives using Flux Pro. Called per copy variant after generation.",
    layer: "Layer 2 — Creative Generation",
    envVars: ["FAL_KEY"],
    dashboardUrl: "https://fal.ai/dashboard",
    docsUrl: "https://docs.fal.ai",
    notes: "Credit-based — check balance in dashboard. Each image gen costs ~$0.05. Runs async via next/server after().",
  },
  {
    name: "Placid",
    category: "Creative",
    description: "Composites ad copy onto background images via templates. Produces polished ad creatives ready for upload.",
    layer: "Layer 2 — Creative Compositing",
    envVars: ["PLACID_API_KEY", "PLACID_TEMPLATE_GOOGLE", "PLACID_TEMPLATE_META"],
    dashboardUrl: "https://placid.app/dashboard",
    docsUrl: "https://placid.app/docs",
    notes: "Templates must be created in Placid UI and their IDs stored in env vars. Monthly render quota — check plan limits.",
  },
  {
    name: "Resend",
    category: "Email",
    description: "Sends weekly performance report emails to clients. Domain: reports@furnaceleads.com.",
    layer: "Layer 5 — Client Reporting",
    envVars: ["RESEND_API_KEY"],
    dashboardUrl: "https://resend.com/overview",
    docsUrl: "https://resend.com/docs",
    notes: "Verify reports@furnaceleads.com domain in Resend dashboard before weekly emails go out. Free tier: 3k/mo.",
  },
  {
    name: "Supabase",
    category: "Database",
    description: "Primary database + auth. Stores clients, leads, creatives, metrics, signals, AI runs. RLS enforced.",
    layer: "Infrastructure",
    envVars: ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY"],
    dashboardUrl: "https://supabase.com/dashboard",
    docsUrl: "https://supabase.com/docs",
    notes: "Service role key bypasses RLS — only used server-side. Check project quota and row counts if on free tier.",
  },
  {
    name: "Vercel",
    category: "Infrastructure",
    description: "Hosting, deployments, and cron jobs. Runs 3 scheduled jobs: daily ad sync (2am), weekly report (Mon 8am), signal detection (Mon/Wed/Fri 3am).",
    layer: "Infrastructure",
    envVars: ["CRON_SECRET"],
    dashboardUrl: "https://vercel.com/dashboard",
    docsUrl: "https://vercel.com/docs",
    notes: "Crons require CRON_SECRET env var set on Vercel. Pro plan required for >1 cron job.",
  },
  {
    name: "Google Ads API",
    category: "Ad Platform",
    description: "Syncs campaign/daily metrics, publishes Responsive Search Ads, uploads Enhanced Conversions for attribution.",
    layer: "Layer 1 — Paid Traffic",
    envVars: ["GOOGLE_ADS_DEVELOPER_TOKEN", "GOOGLE_ADS_CLIENT_ID", "GOOGLE_ADS_CLIENT_SECRET"],
    dashboardUrl: "https://ads.google.com",
    docsUrl: "https://developers.google.com/google-ads/api/docs/start",
    notes: "Developer token must be approved by Google (standard access for production). Each client needs OAuth refresh token stored in integrations.",
  },
  {
    name: "Meta Graph API",
    category: "Ad Platform",
    description: "Syncs campaign metrics, uploads ad images, creates ad creatives and ads. Sends CAPI conversion events for attribution.",
    layer: "Layer 1 — Paid Traffic",
    envVars: ["FURNACE_META_BUSINESS_ID"],
    dashboardUrl: "https://business.facebook.com",
    docsUrl: "https://developers.facebook.com/docs/marketing-apis",
    notes: "Each client supplies their own long-lived access token and page/ad set IDs via Integrations. Ads start PAUSED.",
  },
  {
    name: "GoHighLevel",
    category: "CRM",
    description: "Per-client CRM webhook. Receives opportunity stage updates, maps to lead disposition, triggers attribution events.",
    layer: "Layer 3 — Lead Management",
    envVars: ["LEADS_WEBHOOK_SECRET"],
    dashboardUrl: "https://app.gohighlevel.com",
    docsUrl: "https://highlevel.stoplight.io",
    notes: "Each client gets a unique webhook URL with embedded secret (/api/crm/ghl/{clientId}?secret=...). See client Integrations tab.",
  },
  {
    name: "Virtual Closer",
    category: "AI Sales",
    description: "AI voice/sales OS. Handles Layer 4: qualification, booking, nurture. Pushes booked events back to Furnace for attribution.",
    layer: "Layer 4 — AI SDR",
    envVars: ["FURNACE_INBOUND_SECRET"],
    dashboardUrl: "https://virtualcloser.app",
    notes: "Owner also operates VC. Per-client Rep IDs stored in integrations. Connects full stack: Furnace generates traffic → VC closes.",
  },
];

const CATEGORY_ORDER = ["AI", "Creative", "Email", "Ad Platform", "CRM", "AI Sales", "Database", "Infrastructure"];

export default function StackPage() {
  // Check which env vars are present (server-side only)
  const envStatus = new Map<string, boolean>();
  const allVars = SERVICES.flatMap((s) => s.envVars);
  for (const v of allVars) {
    envStatus.set(v, Boolean(process.env[v]));
  }

  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    services: SERVICES.filter((s) => s.category === cat),
  })).filter((g) => g.services.length > 0);

  const totalServices = SERVICES.length;
  const fullyConnected = SERVICES.filter((s) => s.envVars.every((v) => envStatus.get(v))).length;
  const missingKeys = SERVICES.filter((s) => s.envVars.some((v) => !envStatus.get(v))).length;

  return (
    <div style={{ padding: "2rem 2.5rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 900, color: "#fff", margin: "0 0 0.4rem" }}>Tech Stack</h1>
        <p style={{ fontSize: "0.88rem", color: T.muted, margin: 0 }}>
          Every service powering the Furnace AI Marketing OS. Green = env key present, red = needs configuration.
        </p>
      </div>

      {/* Summary strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "2.5rem" }}>
        {[
          { label: "Total Services", value: totalServices, color: "#fff" },
          { label: "Keys Configured", value: fullyConnected, color: "#86efac" },
          { label: "Needs Attention", value: missingKeys, color: missingKeys > 0 ? "#fca5a5" : "#86efac" },
        ].map((s) => (
          <div key={s.label} style={{
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12, padding: "1.25rem 1.5rem",
          }}>
            <div style={{ fontSize: "2rem", fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: "0.78rem", color: T.muted, marginTop: "0.3rem" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Services by category */}
      <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
        {grouped.map(({ category, services }) => (
          <div key={category}>
            <div style={{
              fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.15em",
              textTransform: "uppercase", color: T.muted, marginBottom: "0.75rem",
            }}>
              {category}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {services.map((svc) => {
                const allConnected = svc.envVars.every((v) => envStatus.get(v));
                const missingVars = svc.envVars.filter((v) => !envStatus.get(v));

                return (
                  <div key={svc.name} style={{
                    background: "rgba(255,255,255,0.03)",
                    border: `1px solid ${allConnected ? "rgba(22,163,74,0.2)" : "rgba(220,38,38,0.2)"}`,
                    borderRadius: 12,
                    padding: "1.25rem 1.5rem",
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: "1rem",
                    alignItems: "start",
                  }}>
                    <div>
                      {/* Name + status */}
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.4rem" }}>
                        <span style={{ fontSize: "1rem", fontWeight: 800, color: "#fff" }}>{svc.name}</span>
                        <span style={{
                          fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                          padding: "2px 7px", borderRadius: 4,
                          background: allConnected ? "rgba(22,163,74,0.12)" : "rgba(220,38,38,0.12)",
                          color: allConnected ? "#86efac" : "#fca5a5",
                          border: `1px solid ${allConnected ? "rgba(22,163,74,0.3)" : "rgba(220,38,38,0.3)"}`,
                        }}>
                          {allConnected ? "Connected" : "Missing Keys"}
                        </span>
                        <span style={{
                          fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
                          padding: "2px 7px", borderRadius: 4,
                          background: "rgba(244,81,30,0.08)", color: T.accent,
                          border: "1px solid rgba(244,81,30,0.2)",
                        }}>
                          {svc.layer}
                        </span>
                      </div>

                      {/* Description */}
                      <div style={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.6, marginBottom: "0.75rem" }}>
                        {svc.description}
                      </div>

                      {/* Env vars */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: svc.notes ? "0.75rem" : 0 }}>
                        {svc.envVars.map((v) => {
                          const present = envStatus.get(v);
                          return (
                            <code key={v} style={{
                              fontSize: "0.7rem", padding: "2px 8px", borderRadius: 4, fontFamily: "monospace",
                              background: present ? "rgba(22,163,74,0.08)" : "rgba(220,38,38,0.08)",
                              color: present ? "#86efac" : "#fca5a5",
                              border: `1px solid ${present ? "rgba(22,163,74,0.2)" : "rgba(220,38,38,0.2)"}`,
                            }}>
                              {present ? "✓ " : "✗ "}{v}
                            </code>
                          );
                        })}
                      </div>

                      {/* Notes */}
                      {svc.notes && (
                        <div style={{
                          fontSize: "0.78rem", color: T.muted, lineHeight: 1.5,
                          borderLeft: `2px solid rgba(244,81,30,0.3)`, paddingLeft: "0.75rem",
                        }}>
                          {svc.notes}
                        </div>
                      )}

                      {/* Missing var callout */}
                      {!allConnected && (
                        <div style={{
                          marginTop: "0.75rem", fontSize: "0.78rem",
                          color: "#fcd34d", background: "rgba(245,158,11,0.06)",
                          border: "1px solid rgba(245,158,11,0.2)", borderRadius: 6,
                          padding: "0.5rem 0.75rem",
                        }}>
                          Add to Vercel: {missingVars.join(", ")}
                        </div>
                      )}
                    </div>

                    {/* Links */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", minWidth: 100 }}>
                      <a
                        href={svc.dashboardUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: "0.75rem", fontWeight: 700, textDecoration: "none",
                          color: T.accent, background: "rgba(244,81,30,0.08)",
                          border: "1px solid rgba(244,81,30,0.2)", borderRadius: 6,
                          padding: "0.35rem 0.75rem", textAlign: "center", whiteSpace: "nowrap",
                        }}
                      >
                        Dashboard →
                      </a>
                      {svc.docsUrl && (
                        <a
                          href={svc.docsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: "0.75rem", fontWeight: 600, textDecoration: "none",
                            color: T.muted, background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6,
                            padding: "0.35rem 0.75rem", textAlign: "center", whiteSpace: "nowrap",
                          }}
                        >
                          Docs →
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <div style={{
        marginTop: "3rem", padding: "1.25rem 1.5rem",
        background: "rgba(244,81,30,0.04)", border: "1px solid rgba(244,81,30,0.15)",
        borderRadius: 12, fontSize: "0.82rem", color: T.muted, lineHeight: 1.7,
      }}>
        <strong style={{ color: "rgba(255,255,255,0.6)" }}>Deployment checklist:</strong> All env vars must be added in the Vercel project settings (not just .env.local) before they take effect in production. Set CRON_SECRET in Vercel → Settings → Environment Variables, then redeploy for cron auth to work.
      </div>
    </div>
  );
}
