import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const T = { accent: "#F4511E", muted: "rgba(255,255,255,0.45)" };

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  new:          { label: "New",           color: "#6b7280" },
  contacted:    { label: "Contacted",     color: "#3b82f6" },
  qualified:    { label: "Qualified",     color: "#8b5cf6" },
  booked:       { label: "Booked",        color: "#f59e0b" },
  closed_won:   { label: "Closed Won",    color: "#16a34a" },
  closed_lost:  { label: "Closed Lost",   color: "#dc2626" },
  unqualified:  { label: "Unqualified",   color: "#6b7280" },
};

const SOURCE_LABEL: Record<string, string> = {
  google_ads: "Google",
  meta_ads: "Meta",
  organic: "Organic",
  referral: "Referral",
  other: "Other",
};

const COLUMNS = ["new", "contacted", "qualified", "booked", "closed_won"];

export default async function AdminLeadsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: leads }, { data: clients }] = await Promise.all([
    supabase
      .from("leads")
      .select("*, clients(business_name)")
      .order("created_at", { ascending: false }),
    supabase.from("clients").select("id, business_name").order("business_name"),
  ]);

  const byStatus = Object.fromEntries(
    COLUMNS.map((s) => [s, leads?.filter((l) => l.status === s) ?? []])
  );

  const totalLeads = leads?.length ?? 0;
  const qualified = leads?.filter((l) => ["qualified", "booked", "closed_won"].includes(l.status)).length ?? 0;
  const booked = leads?.filter((l) => l.status === "booked").length ?? 0;

  return (
    <div style={{ padding: "2rem 2.5rem", minWidth: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 900, color: "#fff", margin: 0 }}>Lead Pipeline</h1>
        <div style={{ display: "flex", gap: "1.5rem" }}>
          {[
            { label: "Total Leads", value: totalLeads },
            { label: "Qualified", value: qualified },
            { label: "Booked", value: booked },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: "right" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#fff", lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: "0.72rem", color: T.muted }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Kanban */}
      <div style={{ display: "flex", gap: "1rem", overflowX: "auto", paddingBottom: "1rem" }}>
        {COLUMNS.map((status) => {
          const cfg = STATUS_CONFIG[status];
          const columnLeads = byStatus[status];
          return (
            <div key={status} style={{ minWidth: 240, flex: "0 0 240px" }}>
              {/* Column header */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "0.75rem",
                padding: "0 0.25rem",
              }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.color, flexShrink: 0 }} />
                <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#fff", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  {cfg.label}
                </span>
                <span style={{ fontSize: "0.72rem", color: T.muted, marginLeft: "auto" }}>
                  {columnLeads.length}
                </span>
              </div>

              {/* Cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {columnLeads.length === 0 && (
                  <div style={{
                    padding: "1.5rem 1rem",
                    textAlign: "center",
                    fontSize: "0.78rem",
                    color: "rgba(255,255,255,0.15)",
                    border: "1px dashed rgba(255,255,255,0.08)",
                    borderRadius: 10,
                  }}>
                    Empty
                  </div>
                )}
                {columnLeads.map((lead) => (
                  <div key={lead.id} style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 10,
                    padding: "0.85rem 1rem",
                  }}>
                    <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#fff", marginBottom: "0.3rem" }}>
                      {lead.full_name ?? "Unknown"}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: T.muted, marginBottom: "0.5rem" }}>
                      {(lead.clients as { business_name: string } | null)?.business_name ?? "—"}
                    </div>
                    <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                      {lead.source && (
                        <span style={{
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color: T.accent,
                          background: `${T.accent}15`,
                          border: `1px solid ${T.accent}30`,
                          borderRadius: 4,
                          padding: "2px 6px",
                        }}>
                          {SOURCE_LABEL[lead.source] ?? lead.source}
                        </span>
                      )}
                      <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.25)" }}>
                        {new Date(lead.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                    {lead.email && (
                      <div style={{ fontSize: "0.72rem", color: T.muted, marginTop: "0.4rem", wordBreak: "break-all" }}>
                        {lead.email}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
