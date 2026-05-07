import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Furnace | AI Lead Generation Operating System",
  description:
    "An AI-powered lead acquisition engine for insurance agencies and service businesses. We launch campaigns, qualify leads, and feed revenue data back into the platforms.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body
        style={{
          margin: 0,
          padding: 0,
          fontFamily: 'var(--font-inter), "Inter", system-ui, sans-serif',
          minHeight: "100vh",
          background: "#0d0d0d",
          color: "#fff",
        }}
      >
        <style>{`
          *, *::before, *::after { box-sizing: border-box; }
          body { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
          input, button, select, textarea { font-family: inherit; }
          a { color: inherit; }
        `}</style>
        {children}
      </body>
    </html>
  );
}
