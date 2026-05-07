import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { markStepComplete } from "@/app/actions/clients";

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

  const [{ data: client }, { data: steps }] = await Promise.all([
    supabase.from("clients").select("*").eq("id", id).single(),
    supabase
      .from("onboarding_steps")
      .select("*")
      .eq("client_id", id)
      .order("step_order", { ascending: true }),
  ]);

  if (!client) notFound();

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

      {/* Onboarding steps */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1rem",
          }}
        >
          <div
            style={{
              fontSize: "0.68rem",
              fontWeight: 800,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: T.accent,
            }}
          >
            Onboarding
          </div>
          <div style={{ fontSize: "0.8rem", color: T.muted }}>
            {completedCount} / {totalCount} complete
          </div>
        </div>

        {/* Progress bar */}
        <div
          style={{
            height: 4,
            background: "rgba(255,255,255,0.08)",
            borderRadius: 4,
            marginBottom: "1.25rem",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progressPct}%`,
              background: progressPct === 100 ? "#16a34a" : T.accent,
              borderRadius: 4,
              transition: "width 0.3s ease",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          {steps?.map((step, i) => (
            <div
              key={step.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                padding: "0.9rem 1.25rem",
                background: step.completed
                  ? "rgba(22,163,74,0.06)"
                  : "rgba(255,255,255,0.03)",
                border: `1px solid ${
                  step.completed
                    ? "rgba(22,163,74,0.2)"
                    : "rgba(255,255,255,0.07)"
                }`,
                borderRadius: 10,
              }}
            >
              {/* Step number / check */}
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  background: step.completed
                    ? "#16a34a"
                    : "rgba(255,255,255,0.06)",
                  border: step.completed
                    ? "none"
                    : "1px solid rgba(255,255,255,0.12)",
                  color: step.completed ? "#fff" : T.muted,
                }}
              >
                {step.completed ? "✓" : i + 1}
              </div>

              {/* Label + completed date */}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: 700,
                    color: step.completed ? "rgba(255,255,255,0.5)" : "#fff",
                    textDecoration: step.completed ? "line-through" : "none",
                  }}
                >
                  {step.step_label}
                </div>
                {step.completed && step.completed_at && (
                  <div style={{ fontSize: "0.72rem", color: T.muted, marginTop: "0.15rem" }}>
                    Completed{" "}
                    {new Date(step.completed_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                )}
              </div>

              {/* Mark complete button */}
              {!step.completed && (
                <form action={markStepComplete.bind(null, step.id, client.id)}>
                  <button
                    type="submit"
                    style={{
                      background: "none",
                      border: `1px solid ${T.accent}`,
                      color: T.accent,
                      borderRadius: 6,
                      padding: "0.35rem 0.85rem",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      letterSpacing: "0.04em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Mark Done
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
