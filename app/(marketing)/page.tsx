import React from "react";

// ── Design tokens (furnace / fire / heat palette) ─────────
const T = {
  accent: "#F4511E",
  accentDark: "#C73A0A",
  ink: "#0f0f0f",
  muted: "#3B1A08",
  muted2: "#6B3820",
  paper: "#ffffff",
  paper2: "#FFF8F3",
  cardTint: "#FFF0E5",
  green: "#16a34a",
  charcoal1: "#2A1A0E",
  charcoal2: "#111008",
};

// ── Sub-components ─────────────────────────────────────────

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      display: "inline-block",
      fontSize: "0.68rem",
      fontWeight: 800,
      letterSpacing: "0.16em",
      textTransform: "uppercase",
      background: T.accent,
      color: "#fff",
      borderRadius: 999,
      padding: "4px 10px",
      marginBottom: "0.6rem",
    }}>
      {children}
    </span>
  );
}

function SectionLabel({
  kicker,
  heading,
  dark,
}: {
  kicker: string;
  heading: string;
  dark?: boolean;
}) {
  return (
    <div style={{ textAlign: "center", maxWidth: 780, margin: "0 auto 2.5rem" }}>
      <div style={{
        fontSize: "0.72rem",
        fontWeight: 800,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        color: T.accent,
        marginBottom: "0.55rem",
      }}>
        {kicker}
      </div>
      <h2 style={{
        fontSize: "clamp(1.6rem, 3.8vw, 2.2rem)",
        fontWeight: 900,
        letterSpacing: "-0.015em",
        lineHeight: 1.2,
        color: dark ? "#fff" : T.ink,
        margin: 0,
      }}>
        {heading}
      </h2>
    </div>
  );
}

function FeatureCard({
  badge,
  title,
  body,
  bullets,
  dark,
}: {
  badge: string;
  title: string;
  body: string;
  bullets: string[];
  dark?: boolean;
}) {
  return (
    <div
      className="card-hover"
      style={{
        background: dark ? "rgba(255,255,255,0.05)" : T.cardTint,
        border: `1px solid ${dark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.08)"}`,
        borderRadius: 14,
        padding: "1.4rem 1.2rem",
      }}
    >
      <details>
        <summary style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem" }}>
          <div style={{ flex: 1 }}>
            <Badge>{badge}</Badge>
            <h3 style={{
              fontSize: "1.05rem",
              fontWeight: 800,
              lineHeight: 1.3,
              color: dark ? "#fff" : T.ink,
              margin: "0 0 0.5rem",
            }}>
              {title}
            </h3>
            <p style={{
              fontSize: "0.92rem",
              lineHeight: 1.65,
              color: dark ? "rgba(255,255,255,0.68)" : T.muted,
              margin: 0,
            }}>
              {body}
            </p>
          </div>
          <span className="chevron" style={{ color: dark ? "rgba(255,255,255,0.5)" : T.muted2, flexShrink: 0, fontSize: "1rem", marginTop: "0.2rem" }}>▾</span>
        </summary>
        <ul style={{ margin: "1rem 0 0", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "0.45rem" }}>
          {bullets.map((b, i) => (
            <li key={i} style={{ fontSize: "0.92rem", color: dark ? "rgba(255,255,255,0.75)" : T.muted, display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
              <span style={{ color: T.green, fontWeight: 700, flexShrink: 0 }}>✓</span>
              {b}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

function IntegrationCard({
  icon,
  name,
  description,
  dark,
}: {
  icon: string;
  name: string;
  description: string;
  dark?: boolean;
}) {
  return (
    <div
      className="card-hover"
      style={{
        background: dark ? "rgba(255,255,255,0.05)" : T.cardTint,
        border: `1px solid ${dark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.08)"}`,
        borderRadius: 14,
        padding: "1.4rem 1.2rem",
        display: "flex",
        alignItems: "flex-start",
        gap: "1rem",
      }}
    >
      <span style={{
        flexShrink: 0,
        width: "2.6rem",
        height: "2.6rem",
        borderRadius: 8,
        background: "rgba(244,81,30,0.18)",
        border: "1px solid rgba(244,81,30,0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "0.62rem",
        fontWeight: 800,
        letterSpacing: "0.04em",
        color: T.accent,
      }}>{icon}</span>
      <div>
        <h3 style={{
          fontSize: "1.05rem",
          fontWeight: 800,
          lineHeight: 1.3,
          color: dark ? "#fff" : T.ink,
          margin: "0 0 0.3rem",
        }}>
          {name}
        </h3>
        <p style={{
          fontSize: "0.92rem",
          lineHeight: 1.65,
          color: dark ? "rgba(255,255,255,0.68)" : T.muted,
          margin: 0,
        }}>
          {description}
        </p>
      </div>
    </div>
  );
}

function BenefitCard({ num, title, body }: { num: string; title: string; body: string }) {
  return (
    <div
      className="card-hover"
      style={{
        background: T.cardTint,
        border: "1px solid rgba(0,0,0,0.08)",
        borderRadius: 14,
        padding: "1.4rem 1.2rem",
      }}
    >
      <div style={{
        fontSize: "0.78rem",
        fontWeight: 700,
        letterSpacing: "0.18em",
        color: T.accent,
        marginBottom: "0.5rem",
      }}>
        {num}
      </div>
      <h3 style={{
        fontSize: "1.05rem",
        fontWeight: 800,
        lineHeight: 1.3,
        color: T.ink,
        margin: "0 0 0.5rem",
      }}>
        {title}
      </h3>
      <p style={{
        fontSize: "0.92rem",
        lineHeight: 1.65,
        color: T.muted,
        margin: 0,
      }}>
        {body}
      </p>
    </div>
  );
}

function PricingLayerCard({
  step,
  label,
  title,
  body,
  tag,
}: {
  step: string;
  label: string;
  title: string;
  body: string;
  tag: string;
}) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.09)",
      borderRadius: 14,
      padding: "1.4rem 1.2rem",
      display: "flex",
      gap: "1rem",
      alignItems: "flex-start",
    }}>
      <div style={{
        flexShrink: 0,
        width: "2.2rem",
        height: "2.2rem",
        borderRadius: 8,
        background: "rgba(244,81,30,0.18)",
        border: "1px solid rgba(244,81,30,0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "0.78rem",
        fontWeight: 800,
        color: T.accent,
      }}>{step}</div>
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: "0.68rem",
          fontWeight: 800,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.45)",
          marginBottom: "0.2rem",
        }}>{label}</div>
        <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#fff", margin: "0 0 0.35rem" }}>{title}</h3>
        <p style={{ fontSize: "0.9rem", lineHeight: 1.6, color: "rgba(255,255,255,0.65)", margin: 0 }}>{body}</p>
      </div>
      <div style={{
        flexShrink: 0,
        fontSize: "0.7rem",
        fontWeight: 700,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: T.accent,
        background: "rgba(244,81,30,0.12)",
        border: "1px solid rgba(244,81,30,0.25)",
        borderRadius: 6,
        padding: "3px 8px",
        whiteSpace: "nowrap",
      }}>{tag}</div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────
export default function Home() {
  const year = new Date().getFullYear();

  return (
    <main>
      <div className="wrap">

        {/* ── 1. HERO ── */}
        <section style={{ textAlign: "center", paddingBottom: "2rem" }}>
          <div style={{
            fontSize: "0.72rem",
            fontWeight: 800,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: T.accent,
            marginBottom: "1rem",
          }}>
            AI Lead Generation Operating System
          </div>
          <h1 style={{
            fontSize: "clamp(2rem, 5vw, 2.8rem)",
            fontWeight: 900,
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
            color: T.ink,
            margin: "0 auto 1.2rem",
            maxWidth: 720,
          }}>
            The More It Runs,<br />The Cheaper Your Leads Get.
          </h1>
          <p style={{
            fontSize: "1.05rem",
            lineHeight: 1.65,
            color: T.muted,
            margin: "0 auto 0.85rem",
            maxWidth: 580,
          }}>
            Furnace is an AI-powered lead acquisition engine for insurance agencies and service businesses. We launch your campaigns, generate your creative, qualify your leads, and feed real revenue data back into the platforms.
          </p>
          <p style={{
            fontSize: "1rem",
            fontWeight: 700,
            color: T.accent,
            margin: "0 auto 0.6rem",
            maxWidth: 500,
          }}>
            — the system gets smarter every week.
          </p>
          <p style={{
            fontSize: "0.92rem",
            lineHeight: 1.6,
            color: T.muted2,
            margin: "0 auto 2rem",
            maxWidth: 500,
            fontStyle: "italic",
          }}>
            Not just another lead vendor, or ad agency.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <a href="mailto:hello@furnaceleads.com" className="btn-primary">Book a Strategy Call</a>
            <a href="#how-it-works" className="btn-secondary">See How It Works</a>
          </div>
        </section>

        {/* ── 2. DARK BAND — Five layers ── */}
        <section id="how-it-works" className="landing-band-dark">
          <SectionLabel kicker="How It Works" heading="Five Layers. One Operating System." dark />
          <div className="feature-grid" style={{ marginTop: "2rem" }}>
            <FeatureCard
              dark
              badge="Layer 1 — Acquisition"
              title="AI Campaign Orchestration"
              body="We connect directly to Google Ads and Meta through their APIs and act as a control tower — not a replacement for their automation. Your campaigns are built, launched, and continuously reallocated toward the audiences and placements actually producing revenue."
              bullets={[
                "Google Performance Max and Search campaigns",
                "Meta Lead Ads with real-time CRM delivery",
                "Programmatic campaign assembly from structured inputs",
                "Spend pacing and budget reallocation without manual oversight",
              ]}
            />
            <FeatureCard
              dark
              badge="Layer 2 — Creative"
              title="AI Creative Generation & Scoring"
              body="Copy, images, and video variants are generated and scored before launch. The system identifies likely winners before they spend a dollar, then expands or kills variants based on downstream performance — not just clicks."
              bullets={[
                "AI-generated headlines, body copy, and CTAs",
                "Predictive creative scoring across variant sets",
                "Continuous refresh to prevent ad fatigue",
                "Brand rules and prohibited terms enforced automatically",
              ]}
            />
            <FeatureCard
              dark
              badge="Layer 3 — Conversion"
              title="Landing Page & Lead Form Routing"
              body="Every click hits a conversion pathway optimized for your specific offer and audience. Traffic is routed across variants automatically — each visitor goes to the page they're most likely to convert on."
              bullets={[
                "Landing page A/B testing with AI traffic routing",
                "Native lead forms for frictionless mobile conversion",
                "Offer-specific page variants by audience segment",
                "Conversion tracking wired from day one",
              ]}
            />
            <FeatureCard
              dark
              badge="Layer 4 — Qualification"
              title="Lead Routing, Nurture & Booking"
              body="A captured lead is not a closed deal. The system qualifies, responds, and routes leads in real time — switching channels when prospects go quiet, and guiding qualified buyers toward a booked appointment with your team."
              bullets={[
                "Instant CRM record creation and lead tagging",
                "SMS, chat, and voice qualification sequences",
                "Channel-switching when leads stop responding",
                "Automated booking to your calendar for qualified prospects",
              ]}
            />
            <FeatureCard
              dark
              badge="Layer 5 — Attribution"
              title="Offline Conversion Feedback Loop"
              body="This is the part most lead vendors skip — and it's the most important. CRM status changes, qualified leads, booked calls, and closed-won revenue get fed back into Google and Meta so the platforms optimize for real business outcomes, not cost-per-click."
              bullets={[
                "Google Enhanced Conversions for Leads",
                "Meta Conversions API with CRM-offline event sync",
                "Platforms optimize toward qualified appointments and revenue",
                "Eliminates cheap-lead flooding — every signal points toward closed deals",
              ]}
            />
          </div>
        </section>

        {/* ── 3. CREAM BAND — The optimization problem ── */}
        <section className="landing-band-cream">
          <SectionLabel kicker="The Real Problem" heading="Most Lead Gen Optimizes for the Wrong Thing" />
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.85rem",
            justifyContent: "center",
            marginTop: "2rem",
          }}>
            {/* Before */}
            <div style={{
              flex: "1 1 320px",
              minWidth: 0,
              background: T.paper,
              border: "1px solid rgba(0,0,0,0.08)",
              borderRadius: 14,
              padding: "2rem",
            }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: T.muted2, marginBottom: "1rem" }}>
                Optimizing for CPL
              </div>
              <div style={{ fontSize: "2.4rem", fontWeight: 900, letterSpacing: "-0.02em", color: T.ink, lineHeight: 1 }}>Cheap leads</div>
              <div style={{ fontSize: "0.92rem", color: T.muted, margin: "0.4rem 0 1.25rem" }}>What the platform optimizes toward without a feedback loop</div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {[
                  "Platform learns to find cheap clicks, not buyers",
                  "High lead volume, low close rates",
                  "Your reps burn time chasing the wrong people",
                  "No signal about what actually closed",
                  "System gets worse over time, not better",
                ].map((item, i) => (
                  <li key={i} style={{ fontSize: "0.92rem", color: T.muted, display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                    <span style={{ color: "#dc2626", flexShrink: 0 }}>✕</span>{item}
                  </li>
                ))}
              </ul>
            </div>

            {/* After */}
            <div style={{
              flex: "1 1 320px",
              minWidth: 0,
              background: T.cardTint,
              border: `1.5px solid ${T.accent}`,
              borderRadius: 14,
              padding: "2rem",
            }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: T.accent, marginBottom: "1rem" }}>
                Optimizing for Revenue
              </div>
              <div style={{ fontSize: "2.4rem", fontWeight: 900, letterSpacing: "-0.02em", color: T.ink, lineHeight: 1 }}>Qualified pipeline</div>
              <div style={{ fontSize: "0.92rem", color: T.muted, margin: "0.4rem 0 1.25rem" }}>What Furnace optimizes toward with a closed-loop attribution system</div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {[
                  "Platform learns what a real buyer looks like",
                  "Lower volume, dramatically higher close rates",
                  "Reps spend time with people ready to buy",
                  "Every closed deal trains the system to find more like it",
                  "System compounds in your favor week over week",
                ].map((item, i) => (
                  <li key={i} style={{ fontSize: "0.92rem", color: T.muted, display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                    <span style={{ color: T.green, fontWeight: 700, flexShrink: 0 }}>✓</span>{item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── 4. DARK BAND — Integrations ── */}
        <section className="landing-band-dark">
          <SectionLabel kicker="Integrations" heading="Connects to Your Entire Stack" dark />
          <div className="feature-grid" style={{ marginTop: "2rem" }}>
            <IntegrationCard dark icon="G" name="Google Ads" description="Performance Max and Search campaigns managed via the Ads API — automated account management, custom reporting, and Smart Bidding strategy inputs." />
            <IntegrationCard dark icon="M" name="Meta Ads" description="Lead Ads and programmatic campaign creation through the Marketing API — native lead forms with real-time CRM delivery via webhook." />
            <IntegrationCard dark icon="GHL" name="GoHighLevel" description="Built for agencies already running GHL. Leads drop into your pipeline with custom tags, workflow triggers, and booking automation." />
            <IntegrationCard dark icon="HS" name="HubSpot CRM" description="Direct webhook and native integration — leads flow in and get assigned automatically. Offline events sync back through the API for attribution." />
            <IntegrationCard dark icon="SF" name="Salesforce" description="Enterprise-grade CRM sync with field mapping, lead scoring, and opportunity auto-creation. Closed-won revenue feeds back to platform bidding." />
            <IntegrationCard dark icon="ZAP" name="Zapier / Make" description="Connect any tool in your stack via Zapier or Make when a native integration doesn't exist — no engineering required." />
          </div>
        </section>

        {/* ── 5. CREAM BAND — Key benefits ── */}
        <section className="landing-band-cream">
          <SectionLabel kicker="Why Furnace" heading="Built for Revenue, Not Dashboards" />
          <div className="benefits-grid" style={{ marginTop: "2rem" }}>
            <BenefitCard num="01" title="Vertical Playbooks" body="We don't run generic campaigns. Our systems are built around how insurance buyers and high-value service clients actually make decisions — from first search to signed contract." />
            <BenefitCard num="02" title="The Feedback Loop" body="Every qualified lead, booked call, and closed deal trains the system to find more buyers like the ones who converted. Without this, you're just buying traffic. With it, you're building a machine." />
            <BenefitCard num="03" title="Human Guardrails" body="Every campaign goes through human approval before launch. Brand rules, prohibited claims, spend caps, and escalation thresholds are set at the account level — the AI works within them, not around them." />
            <BenefitCard num="04" title="Speed to Contact" body="Leads are routed to your CRM and qualification sequence within seconds of capture. The single biggest predictor of close rate is how fast you respond — so we automate that response." />
            <BenefitCard num="05" title="Transparent Reporting" body="Two dashboards: platform metrics (CTR, CPL, spend) and business metrics (cost per qualified lead, booked calls, revenue per lead). Clients see what actually matters." />
            <BenefitCard num="06" title="Recurring, Not Transactional" body="This is a platform relationship, not a lead purchase. Your account compounds over time as the system learns your buyers, your market, and what a good lead actually looks like." />
          </div>
        </section>

        {/* ── 6. DARK BAND — Pricing ── */}
        <section className="landing-band-dark">
          <SectionLabel kicker="Pricing Model" heading="Four Layers. Designed to Scale With You." dark />
          <p style={{
            textAlign: "center",
            fontSize: "0.95rem",
            lineHeight: 1.65,
            color: "rgba(255,255,255,0.6)",
            maxWidth: 580,
            margin: "0 auto 2rem",
          }}>
            Every engagement is built from the same four layers. You get a clear view of what you're paying for and what each piece is doing.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: 720, margin: "0 auto" }}>
            <PricingLayerCard
              step="01"
              label="One-Time"
              title="Setup & Onboarding"
              body="Account connections (Google Ads, Meta, CRM, calendar, analytics), brand ingestion, conversion tracking installation, and campaign workflow configuration."
              tag="Fixed fee"
            />
            <PricingLayerCard
              step="02"
              label="Monthly Recurring"
              title="Platform Fee"
              body="The software layer: AI creative generation, campaign management, variant testing, lead routing logic, qualification sequences, and performance reporting."
              tag="Recurring"
            />
            <PricingLayerCard
              step="03"
              label="Monthly Recurring"
              title="Spend Management"
              body="Ongoing campaign oversight scaled to your ad spend — budget pacing, audience management, negative keyword maintenance, and experiment decisions."
              tag="% of spend"
            />
            <PricingLayerCard
              step="04"
              label="Optional"
              title="Performance Kicker"
              body="An incentive layer tied to qualified appointments set or closed-won revenue — available for accounts with offline conversion tracking fully in place."
              tag="Performance"
            />
          </div>
          <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
            <a href="mailto:hello@furnaceleads.com" className="btn-primary">Get Pricing for Your Account</a>
          </div>
        </section>

        {/* ── 7. CREAM BAND — Who it's for ── */}
        <section className="landing-band-cream">
          <SectionLabel kicker="Who We Work With" heading="Built for One Thing: Lead-Driven Businesses That Need Pipeline" />
          <div style={{
            background: `linear-gradient(135deg, ${T.charcoal1} 0%, ${T.charcoal2} 100%)`,
            borderRadius: 18,
            padding: "2.5rem",
            color: "#fff",
            maxWidth: 780,
            margin: "2rem auto 0",
          }}>
            <p style={{ fontSize: "1rem", lineHeight: 1.8, color: "rgba(255,255,255,0.82)", margin: "0 0 1.25rem" }}>
              Furnace is purpose-built for markets where the value per customer is high, speed of response matters, and qualification can be expressed as a clear set of rules. Insurance agencies, elective health practices, legal intake, and local service businesses with structured sales processes.
            </p>
            <p style={{ fontSize: "1rem", lineHeight: 1.8, color: "rgba(255,255,255,0.82)", margin: "0 0 1.25rem" }}>
              We don't work with everyone. The system produces its best results when there's enough monthly lead volume to generate learning signals, a defined sales motion, and a CRM capable of pushing status changes back to the platforms. If those conditions exist, the feedback loop compounds quickly.
            </p>
            <p style={{ fontSize: "1rem", lineHeight: 1.8, color: "rgba(255,255,255,0.82)", margin: 0 }}>
              If you're ready to stop optimizing for cheap leads and start building a system that gets smarter every week, we'd like to show you what that looks like for your specific market.
            </p>
            <div style={{ marginTop: "1.5rem", fontSize: "0.9rem", fontWeight: 700, color: T.accent }}>
              — The Furnace Team
            </div>
          </div>
        </section>

      </div>{/* /wrap */}

      {/* ── 8. FOOTER ── */}
      <footer style={{
        borderTop: "1px solid rgba(0,0,0,0.09)",
        padding: "2rem 1.5rem",
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "1rem",
        background: T.paper2,
      }}>
        <div style={{ fontSize: "0.88rem", color: T.muted2 }}>
          © {year} Furnace. All rights reserved.
        </div>
        <nav style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
          <a href="/privacy" className="footer-link" style={{ fontSize: "0.88rem" }}>Privacy Policy</a>
          <a href="/terms" className="footer-link" style={{ fontSize: "0.88rem" }}>Terms of Service</a>
          <a href="mailto:hello@furnaceleads.com" className="footer-link" style={{ fontSize: "0.88rem" }}>hello@furnaceleads.com</a>
        </nav>
      </footer>
    </main>
  );
}
