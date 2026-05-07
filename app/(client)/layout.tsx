import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { logout } from "@/app/actions/auth";

const T = {
  accent: "#F4511E",
  bg: "#0f0a07",
  sidebar: "#1A0D06",
};

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: client } = await supabase
    .from("clients")
    .select("id, business_name, status")
    .eq("user_id", user.id)
    .single();

  if (!client) redirect("/admin");

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: T.bg }}>
      <aside style={{
        width: 220,
        flexShrink: 0,
        background: T.sidebar,
        borderRight: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        flexDirection: "column",
        padding: "1.5rem 0",
      }}>
        <div style={{ padding: "0 1.25rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: T.accent }}>
            Furnace
          </div>
          <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#fff", marginTop: "0.3rem", lineHeight: 1.2 }}>
            {client.business_name}
          </div>
        </div>

        <nav style={{ flex: 1, padding: "1rem 0.75rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <a href="/dashboard" style={navLink}>Dashboard</a>
          <a href="/onboarding" style={navLink}>Onboarding</a>
        </nav>

        <div style={{ padding: "1rem 1.25rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <form action={logout}>
            <button type="submit" style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.35)",
              fontSize: "0.82rem",
              cursor: "pointer",
              fontFamily: "inherit",
              padding: 0,
            }}>
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      <main style={{ flex: 1, overflow: "auto" }}>
        {children}
      </main>
    </div>
  );
}

const navLink: React.CSSProperties = {
  display: "block",
  padding: "0.5rem 0.75rem",
  borderRadius: 6,
  color: "rgba(255,255,255,0.65)",
  textDecoration: "none",
  fontSize: "0.88rem",
  fontWeight: 500,
};
