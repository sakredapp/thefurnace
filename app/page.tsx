import React from "react";

// ── Design tokens (furnace / fire / heat palette) ─────────
const T = {
  accent: "#F4511E",        // fire orange
  accentDark: "#C73A0A",   // ember darken
  ink: "#0f0f0f",
  muted: "#3B1A08",        // deep warm brown
  muted2: "#6B3820",       // mid warm brown
  paper: "#ffffff",
  paper2: "#FFF8F3",       // heat-haze cream
  cardTint: "#FFF0E5",     // warm ember tint
  green: "#16a34a",
  charcoal1: "#2A1A0E",    // forge dark top
  charcoal2: "#111008",    // coals dark bottom
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

function PlanCard({
  tier,
  title,
  bullets,
  cta,
  href,
}: {
  tier: string;
  title: string;
  bullets: string[];
  cta: string;
  href: string;
}) {
  return (
    <div
      className="card-hover"
      style={{
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: 14,
        padding: "1.8rem 1.4rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      <div style={{
        fontSize: "0.72rem",
        fontWeight: 800,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        color: T.accent,
      }}>
        {tier}
      </div>
      <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#fff", margin: 0 }}>{title}</h3>
      <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "0.45rem", flex: 1 }}>
        {bullets.map((b, i) => (
          <li key={i} style={{ fontSize: "0.92rem", color: "rgba(255,255,255,0.78)", display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
            <span style={{ color: T.green, fontWeight: 700, flexShrink: 0 }}>✓</span>
            {b}
          </li>
        ))}
      </ul>
      <a href={href} className="btn-primary" style={{ alignSelf: "flex-start", marginTop: "0.5rem" }}>{cta}</a>
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
            B2B Lead Generation
          </div>
          <h1 style={{
            fontSize: "clamp(2rem, 5vw, 2.8rem)",
            fontWeight: 900,
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
            color: T.ink,
            margin: "0 auto 1.2rem",
            maxWidth: 720,
          }}>
            High-Quality Inbound Leads for Insurance&nbsp;&amp;&nbsp;Sales&nbsp;Teams
          </h1>
          <p style={{
            fontSize: "1.05rem",
            lineHeight: 1.65,
            color: T.muted,
            margin: "0 auto 2rem",
            maxWidth: 540,
          }}>
            Furnace Leads delivers verified, intent-driven prospects to agencies and sales organizations that are ready to close. No cold lists. No guesswork. Just qualified opportunities.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <a href="mailto:hello@furnaceleads.com" className="btn-primary">Book a Consultation</a>
            <a href="/request-samples" className="btn-secondary">Request Lead Samples</a>
          </div>
        </section>

        {/* ── 2. DARK BAND — Core features ── */}
        <section className="landing-band-dark">
          <SectionLabel kicker="What We Offer" heading="Lead Generation Built for Closers" dark />
          <div className="feature-grid" style={{ marginTop: "2rem" }}>
            <FeatureCard
              dark
              badge="Lead Gen"
              title="Inbound Lead Campaigns"
              body="We build and manage end-to-end campaigns that bring motivated buyers directly to your sales team. Every lead is sourced, filtered, and pre-qualified before delivery."
              bullets={[
                "Targeted by industry, geography, and intent signal",
                "Real-time delivery to your CRM or inbox",
                "Ongoing campaign optimization included",
              ]}
            />
            <FeatureCard
              dark
              badge="Marketing"
              title="Funnel & Campaign Optimization"
              body="Your funnel is only as strong as its weakest step. We audit, rebuild, and optimize every touchpoint from first click to booked call."
              bullets={[
                "Landing page and offer audits",
                "A/B testing and conversion tracking",
                "Ad copy and targeting refinement",
              ]}
            />
            <FeatureCard
              dark
              badge="CRM"
              title="CRM Integration & Automation"
              body="Connect your lead flow directly to HubSpot, Salesforce, GoHighLevel, or any CRM. Reduce manual entry and respond to leads faster."
              bullets={[
                "Plug-and-play CRM connectors",
                "Automated lead routing and tagging",
                "Follow-up sequence setup and management",
              ]}
            />
            <FeatureCard
              dark
              badge="Strategy"
              title="Business Growth Consulting"
              body="Beyond leads, we help you build a repeatable acquisition engine. Our team reviews your sales process and identifies the highest-leverage opportunities."
              bullets={[
                "Intake pipeline and close-rate analysis",
                "Sales process documentation and training",
                "Monthly strategy reviews with your team",
              ]}
            />
          </div>
        </section>

        {/* ── 3. CREAM BAND — Cost comparison ── */}
        <section className="landing-band-cream">
          <SectionLabel kicker="The Numbers" heading="What Traditional Lead Buying Costs You" />
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
                Without Furnace Leads
              </div>
              <div style={{ fontSize: "2.4rem", fontWeight: 900, letterSpacing: "-0.02em", color: T.ink, lineHeight: 1 }}>$18+</div>
              <div style={{ fontSize: "0.92rem", color: T.muted, margin: "0.4rem 0 1.25rem" }}>average cost per unverified, shared lead elsewhere</div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {[
                  "Shared leads sold to 3–5 competitors",
                  "No intent filtering or qualification",
                  "Cold outbound burn for your reps",
                  "Wasted ad spend on broad audiences",
                  "No visibility into conversion data",
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
                With Furnace Leads
              </div>
              <div style={{ fontSize: "2.4rem", fontWeight: 900, letterSpacing: "-0.02em", color: T.ink, lineHeight: 1 }}>Under $10</div>
              <div style={{ fontSize: "0.92rem", color: T.muted, margin: "0.4rem 0 1.25rem" }}>exclusive, verified leads delivered only to your team</div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {[
                  "Exclusive, intent-verified leads",
                  "Pre-qualified before delivery",
                  "Your reps spend time closing, not chasing",
                  "Full campaign transparency and reporting",
                  "Dedicated account manager included",
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
          <SectionLabel kicker="Integrations" heading="Works With the Tools Your Team Already Uses" dark />
          <div className="feature-grid" style={{ marginTop: "2rem" }}>
            <IntegrationCard dark icon="HS" name="HubSpot CRM" description="Direct webhook and native integration — leads flow in and get assigned automatically with no manual import." />
            <IntegrationCard dark icon="GHL" name="GoHighLevel" description="Built for agencies already running GHL. Leads drop into your pipeline with custom tags and workflow triggers." />
            <IntegrationCard dark icon="SF" name="Salesforce" description="Enterprise-grade CRM sync with field mapping, lead scoring, and opportunity auto-creation out of the box." />
            <IntegrationCard dark icon="ZAP" name="Zapier / Make" description="Connect to any tool in your stack via Zapier or Make — no engineering required, no ongoing maintenance." />
          </div>
        </section>

        {/* ── 5. CREAM BAND — Key benefits ── */}
        <section className="landing-band-cream">
          <SectionLabel kicker="Why Furnace Leads" heading="Built for Agencies That Need Results, Not Promises" />
          <div className="benefits-grid" style={{ marginTop: "2rem" }}>
            <BenefitCard num="01" title="Verified Intent Data" body="Every lead is sourced from high-intent traffic and validated before delivery. You get contacts who are actively shopping, not just browsing." />
            <BenefitCard num="02" title="Exclusive Delivery" body="Your leads are never shared with competitors. Each opportunity is routed exclusively to your team for maximum close potential." />
            <BenefitCard num="03" title="Real-Time Routing" body="Leads land in your CRM or inbox within seconds of qualification. Speed to contact is the single biggest predictor of close rate." />
            <BenefitCard num="04" title="Industry Targeting" body="We specialize in insurance agencies, sales organizations, and service businesses — targeting is built around your specific buyer profiles." />
            <BenefitCard num="05" title="Transparent Reporting" body="Know exactly where every lead came from, how it performed, and what your cost-per-acquisition looks like each month." />
            <BenefitCard num="06" title="Dedicated Support" body="You get a named account manager, not a ticket queue. Your growth targets become our growth targets from day one." />
          </div>
        </section>

        {/* ── 6. DARK BAND — Plans ── */}
        <section className="landing-band-dark">
          <SectionLabel kicker="Get Started" heading="Two Ways to Work With Us" dark />
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "1rem",
            marginTop: "2rem",
          }}>
            <PlanCard
              tier="Performance"
              title="Pay-Per-Lead"
              bullets={[
                "Purchase leads as you need them",
                "No long-term commitment required",
                "Minimum order of 25 leads",
                "Real-time CRM delivery",
                "Industry and geography filters",
              ]}
              cta="Get Lead Pricing"
              href="mailto:hello@furnaceleads.com"
            />
            <PlanCard
              tier="Growth Partnership"
              title="Managed Lead Program"
              bullets={[
                "Ongoing monthly lead volume",
                "Dedicated campaign management",
                "Full funnel optimization included",
                "CRM integration and automation setup",
                "Monthly strategy and reporting calls",
              ]}
              cta="Talk to Sales"
              href="mailto:hello@furnaceleads.com"
            />
          </div>
        </section>

        {/* ── 7. CREAM BAND — Story / credibility ── */}
        <section className="landing-band-cream">
          <SectionLabel kicker="Our Story" heading="Why We Built Furnace Leads" />
          <div style={{
            background: `linear-gradient(135deg, ${T.charcoal1} 0%, ${T.charcoal2} 100%)`,
            borderRadius: 18,
            padding: "2.5rem",
            color: "#fff",
            maxWidth: 780,
            margin: "2rem auto 0",
          }}>
            <p style={{ fontSize: "1rem", lineHeight: 1.8, color: "rgba(255,255,255,0.82)", margin: "0 0 1.25rem" }}>
              Most lead vendors treat agencies like transaction numbers. They sell the same contact to five competing firms, call it a "lead," and move on. We built Furnace Leads because we saw what high-quality, exclusive lead flow actually does to a sales team's output — and we wanted to make that accessible to agencies of every size.
            </p>
            <p style={{ fontSize: "1rem", lineHeight: 1.8, color: "rgba(255,255,255,0.82)", margin: "0 0 1.25rem" }}>
              Our team comes from insurance distribution, performance marketing, and sales operations. We understand what it takes to get a prospect from first touch to signed policy or closed deal. Every campaign we run is built around one metric: your cost per acquisition.
            </p>
            <p style={{ fontSize: "1rem", lineHeight: 1.8, color: "rgba(255,255,255,0.82)", margin: 0 }}>
              If you're ready to stop chasing cold lists and start building a real inbound pipeline, we'd like to show you what that looks like for your specific market.
            </p>
            <div style={{ marginTop: "1.5rem", fontSize: "0.9rem", fontWeight: 700, color: T.accent }}>
              — The Furnace Leads Team
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
          © {year} Furnace Leads. All rights reserved.
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
