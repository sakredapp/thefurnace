import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { saveIntegration } from "@/app/actions/integrations";

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
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.72rem",
  fontWeight: 800,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: T.muted,
  marginBottom: "0.4rem",
};

export default async function IntegrationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ step?: string }>;
}) {
  const { id } = await params;
  const { step } = await searchParams;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: client }, { data: integrations }] = await Promise.all([
    supabase.from("clients").select("*").eq("id", id).single(),
    supabase.from("integrations").select("*").eq("client_id", id),
  ]);

  if (!client) notFound();

  const activeStep = step ?? "google_ads";
  const connected = Object.fromEntries(
    (integrations ?? []).map((i) => [i.type, i])
  );

  const webhookBase = process.env.NEXT_PUBLIC_SITE_URL ?? "https://yourdomain.com";
  const leadsWebhookUrl = `${webhookBase}/api/leads`;

  return (
    <div style={{ padding: "2rem 2.5rem", maxWidth: 720 }}>
      <a href={`/admin/clients/${id}`} style={{ fontSize: "0.82rem", color: T.muted, textDecoration: "none" }}>
        ← Back to {client.business_name}
      </a>
      <h1 style={{ fontSize: "1.4rem", fontWeight: 900, color: "#fff", margin: "1rem 0 2rem" }}>
        Connect Integrations
      </h1>

      {/* Step tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem", flexWrap: "wrap" }}>
        {STEPS.map((s) => {
          const isConnected = connected[s.type]?.status === "connected";
          return (
            <a
              key={s.type}
              href={`/admin/clients/${id}/integrations?step=${s.type}`}
              style={{
                padding: "0.4rem 0.9rem",
                borderRadius: 20,
                fontSize: "0.78rem",
                fontWeight: 700,
                textDecoration: "none",
                background: activeStep === s.type ? T.accent : isConnected ? "rgba(22,163,74,0.12)" : "rgba(255,255,255,0.05)",
                color: activeStep === s.type ? "#fff" : isConnected ? "#86efac" : T.muted,
                border: `1px solid ${activeStep === s.type ? T.accent : isConnected ? "rgba(22,163,74,0.3)" : "rgba(255,255,255,0.08)"}`,
              }}
            >
              {isConnected ? "✓ " : ""}{s.label}
            </a>
          );
        })}
      </div>

      {/* Step content */}
      {activeStep === "google_ads" && (
        <IntegrationCard
          title="Connect Google Ads"
          status={connected["google_ads"]?.status}
        >
          <Instructions steps={[
            "Sign in to your Google Ads account at ads.google.com",
            'Click the gear icon (Settings) → "Account access and security"',
            'Click "+" to add a new user',
            `Enter this email address: ${process.env.FURNACE_GOOGLE_ADS_EMAIL ?? "ops@yourdomain.com"}`,
            'Select "Admin" access level and click "Send invitation"',
            "Once accepted, paste your Google Ads Customer ID below (format: XXX-XXX-XXXX)",
          ]} />
          <ConnectForm
            clientId={id}
            type="google_ads"
            label="Google Ads Customer ID"
            placeholder="123-456-7890"
            existing={connected["google_ads"]}
            extraFields={[
              { name: "refresh_token", label: "OAuth Refresh Token", placeholder: "1//0g...", sensitive: true },
              { name: "conversion_action_id", label: "Conversion Action Resource Name", placeholder: "customers/123/conversionActions/456" },
            ]}
          />
        </IntegrationCard>
      )}

      {activeStep === "meta_ads" && (
        <IntegrationCard title="Connect Meta Ads" status={connected["meta_ads"]?.status}>
          <Instructions steps={[
            "Go to business.facebook.com → Business Settings",
            'Click "Users" → "Partners" → "Add Partner"',
            `Enter our Business ID: ${process.env.FURNACE_META_BUSINESS_ID ?? "your-business-id"}`,
            'Grant "Manage campaigns" access to your Ad Account',
            'Also grant "View performance" on your Pixel',
            "Paste your Meta Ad Account ID below (format: act_XXXXXXXXXX)",
          ]} />
          <ConnectForm
            clientId={id}
            type="meta_ads"
            label="Meta Ad Account ID"
            placeholder="act_123456789"
            existing={connected["meta_ads"]}
            extraFields={[
              { name: "access_token", label: "Meta Long-Lived Access Token", placeholder: "EAAxxxxxx...", sensitive: true },
            ]}
          />
        </IntegrationCard>
      )}

      {activeStep === "gohighlevel" && (
        <IntegrationCard title="Connect GoHighLevel" status={connected["gohighlevel"]?.status}>
          <Instructions steps={[
            "In GHL, go to Settings → Integrations → API Keys",
            'Click "Create API Key" — give it the name "Furnace"',
            "Copy the API key and paste it below",
            "Also copy your GHL Location ID (Settings → Business Info → Location ID)",
            `Finally, go to Settings → Webhooks → Add Webhook URL: ${leadsWebhookUrl}`,
            "Select: Contact Created, Contact Updated, Opportunity Stage Change",
          ]} />
          <ConnectForm clientId={id} type="gohighlevel" label="GHL Location ID" placeholder="abc123xyz" existing={connected["gohighlevel"]} />
        </IntegrationCard>
      )}

      {activeStep === "virtual_closer" && (
        <IntegrationCard title="Connect Virtual Closer" status={connected["virtual_closer"]?.status}>
          <div style={{ background: "rgba(244,81,30,0.06)", border: "1px solid rgba(244,81,30,0.2)", borderRadius: 10, padding: "1rem 1.25rem", marginBottom: "1.5rem" }}>
            <div style={{ fontSize: "0.82rem", color: T.accent, fontWeight: 700, marginBottom: "0.3rem" }}>AI Nurture Layer</div>
            <div style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.6 }}>
              Virtual Closer is our AI voice + sales OS. Once connected, every lead that comes through Furnace gets automatically called, qualified, and booked by an AI SDR — 24/7, no manual follow-up required.
            </div>
          </div>
          <Instructions steps={[
            "Your Virtual Closer account will be provisioned by our team",
            "You'll receive an email with your VC dashboard login",
            "We'll configure your AI SDR with your offer, objection handling, and calendar",
            "Paste the Rep ID assigned to this client below — leads will route to that rep automatically",
            "VC will push booked appointments and disposition updates back to Furnace for attribution",
          ]} />
          <ConnectForm
            clientId={id}
            type="virtual_closer"
            label="VC Rep ID"
            placeholder="rep_abc123"
            existing={connected["virtual_closer"]}
          />
        </IntegrationCard>
      )}

      {activeStep === "google_analytics" && (
        <IntegrationCard title="Connect Google Analytics 4" status={connected["google_analytics"]?.status}>
          <Instructions steps={[
            "Go to analytics.google.com → Admin → Property Settings",
            'Under "Property" click "Data Streams" → your web stream',
            "Copy your Measurement ID (format: G-XXXXXXXXXX)",
            'Also go to Admin → "Data collection and modification" → "Data Streams"',
            'Enable "Enhanced measurement" to track form submissions automatically',
            "Paste your GA4 Measurement ID below",
          ]} />
          <ConnectForm clientId={id} type="google_analytics" label="GA4 Measurement ID" placeholder="G-XXXXXXXXXX" existing={connected["google_analytics"]} />
        </IntegrationCard>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function IntegrationCard({
  title,
  status,
  children,
}: {
  title: string;
  status?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 900, color: "#fff", margin: 0 }}>{title}</h2>
        {status === "connected" && (
          <span style={{
            fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
            color: "#16a34a", background: "rgba(22,163,74,0.12)", border: "1px solid rgba(22,163,74,0.3)",
            borderRadius: 6, padding: "3px 8px",
          }}>Connected</span>
        )}
      </div>
      {children}
    </div>
  );
}

function Instructions({ steps }: { steps: string[] }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 10,
      padding: "1.25rem 1.5rem",
      marginBottom: "1.5rem",
    }}>
      <div style={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: T.muted, marginBottom: "0.75rem" }}>
        Steps
      </div>
      <ol style={{ margin: 0, padding: "0 0 0 1.25rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        {steps.map((s, i) => (
          <li key={i} style={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.75)", lineHeight: 1.5 }}>{s}</li>
        ))}
      </ol>
    </div>
  );
}

function ConnectForm({
  clientId,
  type,
  label,
  placeholder,
  existing,
  extraFields,
}: {
  clientId: string;
  type: string;
  label: string;
  placeholder: string;
  existing?: { account_id?: string; account_label?: string; metadata?: Record<string, string> } | null;
  extraFields?: Array<{ name: string; label: string; placeholder: string; sensitive?: boolean }>;
}) {
  return (
    <form action={saveIntegration} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <input type="hidden" name="client_id" value={clientId} />
      <input type="hidden" name="type" value={type} />
      <div>
        <label style={labelStyle}>{label}</label>
        <input
          name="account_id"
          defaultValue={existing?.account_id ?? ""}
          placeholder={placeholder}
          style={inputStyle}
        />
      </div>
      {extraFields?.map((field) => (
        <div key={field.name}>
          <label style={labelStyle}>{field.label}</label>
          <input
            name={`metadata_${field.name}`}
            defaultValue={existing?.metadata?.[field.name] ?? ""}
            placeholder={field.placeholder}
            type={field.sensitive ? "password" : "text"}
            style={inputStyle}
            autoComplete="off"
          />
        </div>
      ))}
      <div>
        <label style={labelStyle}>Nickname (optional)</label>
        <input
          name="account_label"
          defaultValue={existing?.account_label ?? ""}
          placeholder="e.g. Main account"
          style={inputStyle}
        />
      </div>
      <div>
        <button type="submit" style={{
          background: T.accent, color: "#fff", border: "none", borderRadius: 8,
          padding: "0.7rem 1.5rem", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", fontFamily: "inherit",
        }}>
          {existing?.account_id ? "Update Connection" : "Save & Mark Connected"}
        </button>
      </div>
    </form>
  );
}

const STEPS = [
  { type: "google_ads", label: "Google Ads" },
  { type: "meta_ads", label: "Meta Ads" },
  { type: "gohighlevel", label: "GoHighLevel" },
  { type: "virtual_closer", label: "Virtual Closer" },
  { type: "google_analytics", label: "GA4" },
];
