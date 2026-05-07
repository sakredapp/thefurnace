import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { inviteClient } from "@/app/actions/integrations";

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

export default async function InviteClientPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; invited?: string }>;
}) {
  const { id } = await params;
  const { error, invited } = await searchParams;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: client } = await supabase
    .from("clients")
    .select("id, business_name, contact_name, contact_email, user_id")
    .eq("id", id)
    .single();

  if (!client) notFound();

  const alreadyInvited = !!client.user_id;

  return (
    <div style={{ padding: "2rem 2.5rem", maxWidth: 520 }}>
      <a href={`/admin/clients/${id}`} style={{ fontSize: "0.82rem", color: T.muted, textDecoration: "none" }}>
        ← Back to {client.business_name}
      </a>

      <h1 style={{ fontSize: "1.4rem", fontWeight: 900, color: "#fff", margin: "1rem 0 0.4rem" }}>
        Invite Client to Portal
      </h1>
      <p style={{ margin: "0 0 2rem", fontSize: "0.88rem", color: T.muted }}>
        Sends a magic link. They'll land on their dashboard and onboarding checklist.
      </p>

      {invited === "1" && (
        <div style={{ background: "rgba(22,163,74,0.1)", border: "1px solid rgba(22,163,74,0.25)", borderRadius: 10, padding: "0.9rem 1.25rem", marginBottom: "1.5rem", color: "#86efac", fontSize: "0.88rem", fontWeight: 600 }}>
          Invite sent to {client.contact_email}
        </div>
      )}

      {error === "1" && (
        <div style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.25)", borderRadius: 10, padding: "0.9rem 1.25rem", marginBottom: "1.5rem", color: "#fca5a5", fontSize: "0.88rem" }}>
          Failed to send invite. The email may already have an account.
        </div>
      )}

      {alreadyInvited && (
        <div style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 10, padding: "0.9rem 1.25rem", marginBottom: "1.5rem", color: "#93c5fd", fontSize: "0.88rem" }}>
          This client already has a portal login. You can re-send the invite to the same email.
        </div>
      )}

      <div style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 12,
        padding: "1.5rem",
      }}>
        <div style={{ marginBottom: "1.25rem" }}>
          <div style={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: T.muted, marginBottom: "0.3rem" }}>Client</div>
          <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#fff" }}>{client.contact_name ?? client.business_name}</div>
        </div>

        <form action={inviteClient} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <input type="hidden" name="client_id" value={id} />
          <div>
            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: T.muted, marginBottom: "0.4rem" }}>
              Email to invite
            </label>
            <input
              name="email"
              type="email"
              required
              defaultValue={client.contact_email ?? ""}
              style={inputStyle}
            />
          </div>
          <button type="submit" style={{
            background: T.accent, color: "#fff", border: "none", borderRadius: 8,
            padding: "0.75rem", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", fontFamily: "inherit",
          }}>
            Send Portal Invite
          </button>
        </form>
      </div>
    </div>
  );
}
