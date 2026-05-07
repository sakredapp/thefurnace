import { createClient_ } from "@/app/actions/clients";

const T = { accent: "#F4511E", muted: "rgba(255,255,255,0.45)" };

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
  padding: "0.65rem 0.9rem",
  color: "#fff",
  fontSize: "0.92rem",
  fontFamily: "inherit",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.75rem",
  fontWeight: 800,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: T.muted,
  marginBottom: "0.4rem",
};

export default function NewClientPage() {
  return (
    <div style={{ padding: "2rem 2.5rem", maxWidth: 720 }}>
      <a href="/admin" style={{ fontSize: "0.82rem", color: T.muted, textDecoration: "none" }}>← Back</a>
      <h1 style={{ fontSize: "1.4rem", fontWeight: 900, color: "#fff", margin: "1rem 0 2rem" }}>New Client</h1>

      <form action={createClient_} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

        <section>
          <div style={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: T.accent, marginBottom: "1rem" }}>
            Business Info
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={labelStyle}>Business Name *</label>
              <input name="business_name" required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Vertical</label>
              <select name="vertical" style={{ ...inputStyle, cursor: "pointer" }}>
                <option value="">Select…</option>
                <option value="insurance">Insurance</option>
                <option value="elective_health">Elective Health</option>
                <option value="legal">Legal</option>
                <option value="real_estate">Real Estate</option>
                <option value="home_services">Home Services</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop: "1rem" }}>
            <label style={labelStyle}>Offer Description</label>
            <textarea name="offer_description" rows={3} style={{ ...inputStyle, resize: "vertical" }} placeholder="What does this client sell, and who do they sell it to?" />
          </div>
        </section>

        <section>
          <div style={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: T.accent, marginBottom: "1rem" }}>
            Contact
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={labelStyle}>Contact Name</label>
              <input name="contact_name" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Contact Email *</label>
              <input name="contact_email" type="email" required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Contact Phone</label>
              <input name="contact_phone" type="tel" style={inputStyle} />
            </div>
          </div>
        </section>

        <section>
          <div style={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: T.accent, marginBottom: "1rem" }}>
            Campaign Setup
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={labelStyle}>Monthly Ad Budget ($)</label>
              <input name="monthly_budget" type="number" min="0" style={inputStyle} placeholder="e.g. 3000" />
            </div>
            <div>
              <label style={labelStyle}>CRM</label>
              <select name="crm_type" style={{ ...inputStyle, cursor: "pointer" }}>
                <option value="">Select…</option>
                <option value="gohighlevel">GoHighLevel</option>
                <option value="hubspot">HubSpot</option>
                <option value="salesforce">Salesforce</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Target Geography</label>
              <input name="target_geography" style={inputStyle} placeholder="e.g. Dallas-Fort Worth, TX or National" />
            </div>
          </div>
        </section>

        <div style={{ paddingTop: "0.5rem" }}>
          <button type="submit" style={{
            background: T.accent,
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "0.75rem 2rem",
            fontWeight: 700,
            fontSize: "0.95rem",
            cursor: "pointer",
            fontFamily: "inherit",
          }}>
            Create Client & Generate Onboarding Steps
          </button>
        </div>
      </form>
    </div>
  );
}
