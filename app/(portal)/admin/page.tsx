import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const T = { accent: "#F4511E", muted: "rgba(255,255,255,0.45)" };

const STATUS_COLORS: Record<string, string> = {
  onboarding: "#F4511E",
  active: "#16a34a",
  paused: "#ca8a04",
  churned: "#6b7280",
};

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  const total = clients?.length ?? 0;
  const active = clients?.filter((c) => c.status === "active").length ?? 0;
  const onboarding = clients?.filter((c) => c.status === "onboarding").length ?? 0;

  return (
    <div style={{ padding: "2rem 2.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 900, color: "#fff", margin: 0 }}>Clients</h1>
        <a href="/admin/clients/new" style={{
          background: T.accent,
          color: "#fff",
          borderRadius: 8,
          padding: "0.55rem 1.2rem",
          fontWeight: 700,
          fontSize: "0.88rem",
          textDecoration: "none",
        }}>
          + New Client
        </a>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: "Total Clients", value: total },
          { label: "Active", value: active },
          { label: "Onboarding", value: onboarding },
        ].map((s) => (
          <div key={s.label} style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12,
            padding: "1.25rem 1.5rem",
          }}>
            <div style={{ fontSize: "2rem", fontWeight: 900, color: "#fff", lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: "0.82rem", color: T.muted, marginTop: "0.3rem" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Client table */}
      <div style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12,
        overflow: "hidden",
      }}>
        {!clients?.length ? (
          <div style={{ padding: "3rem", textAlign: "center", color: T.muted, fontSize: "0.92rem" }}>
            No clients yet. <a href="/admin/clients/new" style={{ color: T.accent }}>Add your first client →</a>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                {["Business", "Contact", "Vertical", "Budget/mo", "Status", ""].map((h) => (
                  <th key={h} style={{ padding: "0.9rem 1.25rem", textAlign: "left", fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: T.muted }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients.map((c, i) => (
                <tr key={c.id} style={{ borderBottom: i < clients.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                  <td style={{ padding: "1rem 1.25rem", color: "#fff", fontWeight: 700, fontSize: "0.92rem" }}>{c.business_name}</td>
                  <td style={{ padding: "1rem 1.25rem", color: T.muted, fontSize: "0.88rem" }}>{c.contact_email}</td>
                  <td style={{ padding: "1rem 1.25rem", color: T.muted, fontSize: "0.88rem" }}>{c.vertical ?? "—"}</td>
                  <td style={{ padding: "1rem 1.25rem", color: T.muted, fontSize: "0.88rem" }}>
                    {c.monthly_budget ? `$${c.monthly_budget.toLocaleString()}` : "—"}
                  </td>
                  <td style={{ padding: "1rem 1.25rem" }}>
                    <span style={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: STATUS_COLORS[c.status] ?? T.muted,
                      background: `${STATUS_COLORS[c.status]}18`,
                      border: `1px solid ${STATUS_COLORS[c.status]}40`,
                      borderRadius: 6,
                      padding: "3px 8px",
                    }}>
                      {c.status}
                    </span>
                  </td>
                  <td style={{ padding: "1rem 1.25rem" }}>
                    <a href={`/admin/clients/${c.id}`} style={{ color: T.accent, fontSize: "0.82rem", fontWeight: 700, textDecoration: "none" }}>
                      View →
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
