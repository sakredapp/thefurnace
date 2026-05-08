import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import GenerateCopyButton from "./GenerateCopyButton";
import { publishCreative, rejectCreative } from "@/app/actions/creatives";

const T = { accent: "#F4511E", muted: "rgba(255,255,255,0.45)" };

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  draft:            { color: "#6b7280", label: "Draft" },
  pending_approval: { color: "#f59e0b", label: "Pending" },
  approved:         { color: "#3b82f6", label: "Approved" },
  active:           { color: "#16a34a", label: "Live" },
  paused:           { color: "#ca8a04", label: "Paused" },
  rejected:         { color: "#dc2626", label: "Rejected" },
};

export default async function CreativesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: creatives }, { data: clients }] = await Promise.all([
    supabase
      .from("creatives")
      .select("*, clients(business_name)")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("clients").select("id, business_name").order("business_name"),
  ]);

  const aiGenCount = creatives?.filter((c) => c.ai_generated).length ?? 0;
  const liveCount = creatives?.filter((c) => c.status === "active").length ?? 0;
  const pendingCount = creatives?.filter((c) => c.status === "pending_approval").length ?? 0;

  return (
    <div style={{ padding: "2rem 2.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 900, color: "#fff", margin: 0 }}>Creatives</h1>
        <GenerateCopyButton clients={clients ?? []} />
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: "Total Assets", value: creatives?.length ?? 0 },
          { label: "AI Generated", value: aiGenCount },
          { label: "Live", value: liveCount },
        ].map((s) => (
          <div key={s.label} style={{
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12, padding: "1.25rem 1.5rem",
          }}>
            <div style={{ fontSize: "2rem", fontWeight: 900, color: "#fff", lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: "0.78rem", color: T.muted, marginTop: "0.3rem" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Creatives grid */}
      {!creatives?.length ? (
        <div style={{ textAlign: "center", padding: "4rem 2rem", color: T.muted }}>
          No creatives yet. Click "Generate Copy" to create your first AI-generated ad variants.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1rem" }}>
          {creatives.map((c) => {
            const cfg = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.draft;
            return (
              <div key={c.id} style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                padding: "1.25rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: T.muted }}>
                      {c.platform === "google_ads" ? "Google" : c.platform === "meta_ads" ? "Meta" : c.platform} · {c.type}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: T.muted, marginTop: "0.15rem" }}>
                      {(c.clients as { business_name: string } | null)?.business_name}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    {c.ai_generated && (
                      <span style={{ fontSize: "0.6rem", fontWeight: 700, color: T.accent, background: `${T.accent}15`, border: `1px solid ${T.accent}30`, borderRadius: 4, padding: "2px 5px" }}>
                        AI
                      </span>
                    )}
                    <span style={{
                      fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                      color: cfg.color, background: `${cfg.color}15`, border: `1px solid ${cfg.color}30`,
                      borderRadius: 4, padding: "2px 6px",
                    }}>
                      {cfg.label}
                    </span>
                  </div>
                </div>

                {/* Generated image */}
                {c.image_url && (
                  <div style={{ borderRadius: 8, overflow: "hidden", background: "rgba(0,0,0,0.3)", aspectRatio: c.platform === "meta_ads" ? "1/1" : "16/9", position: "relative" }}>
                    <img
                      src={c.image_url}
                      alt={c.headline ?? "Ad creative"}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                  </div>
                )}

                {/* Copy */}
                {c.headline && (
                  <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#fff", lineHeight: 1.3 }}>
                    {c.headline}
                  </div>
                )}
                {c.body && (
                  <div style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.6 }}>
                    {c.body}
                  </div>
                )}
                {c.cta && (
                  <div style={{ fontSize: "0.78rem", fontWeight: 700, color: T.accent }}>
                    CTA: {c.cta}
                  </div>
                )}

                {/* AI notes */}
                {c.ai_notes && (
                  <div style={{
                    fontSize: "0.72rem", color: T.muted, background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.05)", borderRadius: 6, padding: "0.5rem 0.75rem", lineHeight: 1.5,
                  }}>
                    {c.ai_notes}
                  </div>
                )}

                {/* Publish status */}
                {c.publish_status && c.publish_status !== "published" && (
                  <div style={{
                    fontSize: "0.72rem", padding: "0.4rem 0.75rem", borderRadius: 6,
                    background: c.publish_status === "failed" ? "rgba(220,38,38,0.1)" : "rgba(245,158,11,0.1)",
                    border: `1px solid ${c.publish_status === "failed" ? "rgba(220,38,38,0.3)" : "rgba(245,158,11,0.3)"}`,
                    color: c.publish_status === "failed" ? "#fca5a5" : "#fcd34d",
                    lineHeight: 1.4,
                  }}>
                    {c.publish_status === "publishing" ? "Publishing to platform…" : null}
                    {c.publish_status === "failed" ? `Publish failed: ${c.publish_error ?? "unknown error"}` : null}
                  </div>
                )}
                {c.platform_ad_id && (
                  <div style={{ fontSize: "0.68rem", color: T.muted }}>
                    Ad ID: {c.platform_ad_id}
                  </div>
                )}

                {/* Actions */}
                <CreativeActions creativeId={c.id} currentStatus={c.status} publishStatus={c.publish_status} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CreativeActions({
  creativeId,
  currentStatus,
  publishStatus,
}: {
  creativeId: string;
  currentStatus: string;
  publishStatus?: string | null;
}) {
  if (currentStatus === "active" && publishStatus === "published") return null;

  const publishAction = publishCreative.bind(null, creativeId);
  const rejectAction = rejectCreative.bind(null, creativeId);

  return (
    <div style={{ display: "flex", gap: "0.5rem", marginTop: "auto", flexWrap: "wrap" }}>
      {currentStatus === "draft" && (
        <form action={async () => {
          "use server";
          const { createClient: cc } = await import("@/lib/supabase/server");
          const supabase = await cc();
          await supabase.from("creatives").update({ status: "approved" }).eq("id", creativeId);
        }}>
          <button type="submit" style={{
            background: "rgba(59,130,246,0.12)", color: "#93c5fd",
            border: "1px solid rgba(59,130,246,0.3)", borderRadius: 6,
            padding: "0.35rem 0.8rem", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          }}>
            Approve
          </button>
        </form>
      )}
      {currentStatus === "approved" && publishStatus !== "publishing" && (
        <form action={publishAction}>
          <button type="submit" style={{
            background: "rgba(244,81,30,0.15)", color: "#fb923c",
            border: "1px solid rgba(244,81,30,0.4)", borderRadius: 6,
            padding: "0.35rem 0.8rem", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          }}>
            Publish to Platform
          </button>
        </form>
      )}
      {(currentStatus === "draft" || currentStatus === "approved") && (
        <form action={rejectAction}>
          <button type="submit" style={{
            background: "rgba(220,38,38,0.08)", color: "#fca5a5",
            border: "1px solid rgba(220,38,38,0.2)", borderRadius: 6,
            padding: "0.35rem 0.8rem", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          }}>
            Reject
          </button>
        </form>
      )}
    </div>
  );
}
