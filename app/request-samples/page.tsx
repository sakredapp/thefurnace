import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Request Lead Samples | Furnace Leads",
  description: "Tell us about your business and we'll send you sample leads for your industry.",
};

const T = {
  accent: "#F4511E",
  ink: "#0f0f0f",
  muted: "#3B1A08",
  muted2: "#6B3820",
  paper2: "#FFF8F3",
  cardTint: "#FFF0E5",
  charcoal1: "#2A1A0E",
  charcoal2: "#111008",
};

const INDUSTRIES = [
  "Health Insurance",
  "Life Insurance",
  "Auto Insurance",
  "Home & Property Insurance",
  "Medicare / ACA",
  "Final Expense",
  "Annuities",
  "Financial Services",
  "Solar / Home Services",
  "Mortgage / Lending",
  "Real Estate",
  "Other",
];

const LEAD_VOLUMES = [
  "25–50 leads / month",
  "50–100 leads / month",
  "100–250 leads / month",
  "250–500 leads / month",
  "500+ leads / month",
  "Just testing — send me samples",
];

export default function RequestSamples() {
  return (
    <main>
      <div className="wrap">
        <div style={{ maxWidth: 640, margin: "0 auto" }}>

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <div style={{
              fontSize: "0.72rem",
              fontWeight: 800,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: T.accent,
              marginBottom: "0.75rem",
            }}>
              Free Lead Samples
            </div>
            <h1 style={{
              fontSize: "clamp(1.8rem, 4vw, 2.4rem)",
              fontWeight: 900,
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
              color: T.ink,
              margin: "0 0 0.75rem",
            }}>
              See the Leads Before You Buy
            </h1>
            <p style={{
              fontSize: "1rem",
              lineHeight: 1.65,
              color: T.muted,
              margin: "0 auto",
              maxWidth: 480,
            }}>
              Tell us about your business and we&apos;ll send you real lead samples from your target market within one business day.
            </p>
          </div>

          {/* Form card */}
          <div style={{
            background: T.cardTint,
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: 16,
            padding: "2.5rem 2rem",
          }}>
            <form
              style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
              onSubmit={undefined}
            >

              {/* Name */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={labelStyle}>Full Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Jane Smith"
                  required
                  style={inputStyle}
                />
              </div>

              {/* Email */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={labelStyle}>Work Email</label>
                <input
                  type="email"
                  name="email"
                  placeholder="jane@agency.com"
                  required
                  style={inputStyle}
                />
              </div>

              {/* Phone */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={labelStyle}>Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="(555) 000-0000"
                  required
                  style={inputStyle}
                />
              </div>

              {/* Industry */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={labelStyle}>Industry</label>
                <select name="industry" required style={inputStyle}>
                  <option value="">Select your industry...</option>
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>

              {/* Leads needed */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={labelStyle}>Leads Needed Per Month</label>
                <select name="leads_needed" required style={inputStyle}>
                  <option value="">Select a volume...</option>
                  {LEAD_VOLUMES.map((vol) => (
                    <option key={vol} value={vol}>{vol}</option>
                  ))}
                </select>
              </div>

              {/* Submit */}
              <div style={{ paddingTop: "0.5rem" }}>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ width: "100%", textAlign: "center", fontSize: "1rem", padding: "0.8rem 1.5rem" }}
                >
                  Send Me Lead Samples
                </button>
                <p style={{
                  fontSize: "0.78rem",
                  color: T.muted2,
                  textAlign: "center",
                  marginTop: "0.75rem",
                }}>
                  No credit card required. We&apos;ll follow up within one business day.
                </p>
              </div>

            </form>
          </div>

          {/* Trust signals */}
          <div style={{
            display: "flex",
            gap: "1.5rem",
            justifyContent: "center",
            flexWrap: "wrap",
            marginTop: "2rem",
            padding: "1.5rem",
            background: `linear-gradient(135deg, ${T.charcoal1} 0%, ${T.charcoal2} 100%)`,
            borderRadius: 14,
          }}>
            {[
              ["Exclusive", "Never shared with competitors"],
              ["Verified", "Intent-confirmed before delivery"],
              ["Real-Time", "Delivered to your CRM instantly"],
            ].map(([title, desc]) => (
              <div key={title} style={{ textAlign: "center", flex: "1 1 140px", minWidth: 0 }}>
                <div style={{ fontSize: "0.78rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: T.accent, marginBottom: "0.2rem" }}>{title}</div>
                <div style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.4 }}>{desc}</div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer style={{
        borderTop: "1px solid rgba(0,0,0,0.09)",
        padding: "2rem 1.5rem",
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "1rem",
        background: T.paper2,
        marginTop: "4rem",
      }}>
        <div style={{ fontSize: "0.88rem", color: T.muted2 }}>
          © {new Date().getFullYear()} Furnace Leads. All rights reserved.
        </div>
        <nav style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
          <a href="/" className="footer-link" style={{ fontSize: "0.88rem" }}>Home</a>
          <a href="/privacy" className="footer-link" style={{ fontSize: "0.88rem" }}>Privacy Policy</a>
          <a href="/terms" className="footer-link" style={{ fontSize: "0.88rem" }}>Terms of Service</a>
          <a href="mailto:hello@furnaceleads.com" className="footer-link" style={{ fontSize: "0.88rem" }}>hello@furnaceleads.com</a>
        </nav>
      </footer>
    </main>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: "0.82rem",
  fontWeight: 700,
  color: "#0f0f0f",
  letterSpacing: "0.01em",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.65rem 0.85rem",
  fontSize: "0.95rem",
  color: "#0f0f0f",
  background: "#ffffff",
  border: "1.5px solid rgba(0,0,0,0.12)",
  borderRadius: 8,
  outline: "none",
  fontFamily: 'var(--font-ibm-plex), "Inter", sans-serif',
  boxSizing: "border-box",
};
