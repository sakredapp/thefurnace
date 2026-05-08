import { logout } from "@/app/actions/auth";

const T = {
  accent: "#F4511E",
  charcoal1: "#2A1A0E",
  charcoal2: "#111008",
  sidebar: "#1A0D06",
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0f0a07" }}>
      {/* Sidebar */}
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
          <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.35)", marginTop: "0.2rem" }}>
            Admin Portal
          </div>
        </div>

        <nav style={{ flex: 1, padding: "1rem 0.75rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <a href="/admin" style={navLink}>Dashboard</a>
          <a href="/admin/leads" style={navLink}>Pipeline</a>
          <a href="/admin/creatives" style={navLink}>Creatives</a>
          <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "0.5rem 0.75rem" }} />
          <a href="/admin/clients/new" style={navLink}>+ New Client</a>
          <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "0.5rem 0.75rem" }} />
          <a href="/admin/stack" style={navLink}>Tech Stack</a>
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

      {/* Main content */}
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
