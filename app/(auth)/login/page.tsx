import { login } from "@/app/actions/auth";

const T = {
  accent: "#F4511E",
  charcoal1: "#2A1A0E",
  charcoal2: "#111008",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(135deg, ${T.charcoal1} 0%, ${T.charcoal2} 100%)`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1.5rem",
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div style={{
            fontSize: "0.72rem",
            fontWeight: 800,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: T.accent,
            marginBottom: "0.5rem",
          }}>
            Furnace
          </div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 900, color: "#fff", margin: 0 }}>
            Admin Login
          </h1>
        </div>

        {error && (
          <div style={{ background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: 8, padding: "0.75rem 1rem", marginBottom: "1rem", color: "#fca5a5", fontSize: "0.88rem" }}>
            Invalid email or password.
          </div>
        )}

        <form action={login} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "rgba(255,255,255,0.6)", marginBottom: "0.4rem", letterSpacing: "0.06em" }}>
              EMAIL
            </label>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 8,
                padding: "0.7rem 1rem",
                color: "#fff",
                fontSize: "0.95rem",
                fontFamily: "inherit",
                outline: "none",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "rgba(255,255,255,0.6)", marginBottom: "0.4rem", letterSpacing: "0.06em" }}>
              PASSWORD
            </label>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 8,
                padding: "0.7rem 1rem",
                color: "#fff",
                fontSize: "0.95rem",
                fontFamily: "inherit",
                outline: "none",
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              background: T.accent,
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "0.75rem",
              fontWeight: 700,
              fontSize: "0.95rem",
              cursor: "pointer",
              fontFamily: "inherit",
              marginTop: "0.5rem",
            }}
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
