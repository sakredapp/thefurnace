"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const T = { accent: "#F4511E", muted: "rgba(255,255,255,0.45)" };

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
  padding: "0.65rem 0.9rem",
  color: "#fff",
  fontSize: "0.88rem",
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
};

export default function GenerateCopyButton({
  clients,
}: {
  clients: { id: string; business_name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [platform, setPlatform] = useState<"google_ads" | "meta_ads">("google_ads");
  const [count, setCount] = useState(3);
  const [notes, setNotes] = useState("");

  async function handleGenerate() {
    if (!clientId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: clientId, platform, count, performance_notes: notes || undefined }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }
      setDone(true);
      setTimeout(() => {
        setOpen(false);
        setDone(false);
        setLoading(false);
        router.refresh();
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          background: T.accent, color: "#fff", border: "none", borderRadius: 8,
          padding: "0.55rem 1.2rem", fontWeight: 700, fontSize: "0.88rem",
          cursor: "pointer", fontFamily: "inherit",
        }}
      >
        Generate Copy
      </button>

      {open && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 100, padding: "1.5rem",
        }}>
          <div style={{
            background: "#1a0d06", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 16, padding: "2rem", width: "100%", maxWidth: 480,
            display: "flex", flexDirection: "column", gap: "1.25rem",
          }}>
            <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 900, color: "#fff" }}>
              Generate AI Ad Copy
            </h2>

            <div>
              <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: T.muted, marginBottom: "0.4rem" }}>
                Client
              </label>
              <select value={clientId} onChange={(e) => setClientId(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.business_name}</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: T.muted, marginBottom: "0.4rem" }}>
                Platform
              </label>
              <select value={platform} onChange={(e) => setPlatform(e.target.value as "google_ads" | "meta_ads")} style={{ ...inputStyle, cursor: "pointer" }}>
                <option value="google_ads">Google Ads</option>
                <option value="meta_ads">Meta Ads</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: T.muted, marginBottom: "0.4rem" }}>
                Variants to generate
              </label>
              <select value={count} onChange={(e) => setCount(Number(e.target.value))} style={{ ...inputStyle, cursor: "pointer" }}>
                <option value={3}>3</option>
                <option value={5}>5</option>
                <option value={7}>7</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: T.muted, marginBottom: "0.4rem" }}>
                Performance notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. CTR is low on current ads, cost per lead too high, leads converting well at booked stage..."
                rows={3}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>

            {error && (
              <div style={{ background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: 8, padding: "0.65rem 0.9rem", color: "#f87171", fontSize: "0.83rem" }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button
                onClick={() => setOpen(false)}
                style={{ background: "none", border: "1px solid rgba(255,255,255,0.12)", color: T.muted, borderRadius: 8, padding: "0.6rem 1.2rem", fontWeight: 600, fontSize: "0.88rem", cursor: "pointer", fontFamily: "inherit" }}
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={loading || !clientId}
                style={{
                  background: done ? "#16a34a" : loading ? "rgba(244,81,30,0.5)" : T.accent,
                  color: "#fff", border: "none", borderRadius: 8,
                  padding: "0.6rem 1.4rem", fontWeight: 700, fontSize: "0.88rem",
                  cursor: loading ? "wait" : "pointer", fontFamily: "inherit",
                  transition: "background 0.2s",
                }}
              >
                {done ? "Done!" : loading ? "Generating..." : "Generate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
