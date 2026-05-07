export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        body { background-color: #1A0800; }

        .site-shell {
          width: min(1296px, calc(100vw - 2rem));
          margin: 1rem auto;
          background: #FFF8F3;
          border: 1.5px solid #1A0800;
          border-radius: 20px;
          overflow: hidden;
        }

        .wrap {
          width: min(1186px, 100%);
          padding: 9.5rem 0.45rem 2.25rem;
          margin: 0 auto;
        }

        .landing-band-cream {
          margin-top: 120px;
          padding: 48px 8px;
          background: #FFF8F3;
          color: #0f0f0f;
        }

        .landing-band-dark {
          margin-top: 120px;
          padding: 120px 40px;
          background: linear-gradient(135deg, #2A1A0E 0%, #111008 100%);
          color: #fff;
          border-radius: 18px;
          box-shadow: 0 20px 48px rgba(26,8,0,0.32);
        }

        @media (max-width: 768px) {
          .landing-band-cream,
          .landing-band-dark { margin-top: 40px; }
          .landing-band-dark { padding: 60px 20px; }
          .wrap { padding-top: 4rem; }
        }

        .feature-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 1.4rem;
        }
        @media (max-width: 720px) {
          .feature-grid { grid-template-columns: 1fr; }
        }

        .benefits-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 1.4rem;
        }
        @media (max-width: 900px) {
          .benefits-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 560px) {
          .benefits-grid { grid-template-columns: 1fr; }
        }

        .card-hover { transition: box-shadow 160ms ease; }
        .card-hover:hover { box-shadow: 0 8px 32px rgba(244,81,30,0.18); }

        .btn-primary {
          background: #F4511E;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 0.65rem 1.5rem;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
          font-family: inherit;
          transition: background 0.15s, box-shadow 0.15s;
        }
        .btn-primary:hover { background: #C73A0A; }

        .btn-secondary {
          background: transparent;
          color: #1A0800;
          border: 1.5px solid #1A0800;
          border-radius: 8px;
          padding: 0.65rem 1.5rem;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
          font-family: inherit;
          transition: background 0.15s, color 0.15s;
        }
        .btn-secondary:hover { background: #1A0800; color: #fff; }

        .btn-secondary-light {
          background: transparent;
          color: #fff;
          border: 1.5px solid rgba(255,255,255,0.6);
          border-radius: 8px;
          padding: 0.65rem 1.5rem;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
          font-family: inherit;
          transition: background 0.15s, color 0.15s;
        }
        .btn-secondary-light:hover { background: #fff; color: #1A0800; }

        details > summary { cursor: pointer; list-style: none; }
        details > summary::-webkit-details-marker { display: none; }
        details[open] .chevron { transform: rotate(180deg); }
        .chevron { transition: transform 160ms ease; display: inline-block; }

        .footer-link { color: #6B3820; text-decoration: none; }
        .footer-link:hover { color: #1A0800; }

        .prose-page { max-width: 760px; margin: 0 auto; }
        .prose-page h2 { font-size: 1.25rem; font-weight: 800; margin: 2rem 0 0.5rem; color: #0f0f0f; }
        .prose-page h3 { font-size: 1rem; font-weight: 700; margin: 1.25rem 0 0.4rem; color: #2b2b2b; }
        .prose-page p, .prose-page li { font-size: 0.95rem; line-height: 1.75; color: #2b2b2b; }
        .prose-page ul { padding-left: 1.25rem; margin: 0.5rem 0; }
        .prose-page a { color: #F4511E; text-decoration: underline; }
        .prose-page hr { border: none; border-top: 1px solid rgba(26,8,0,0.12); margin: 2rem 0; }
      `}</style>
      <div className="site-shell">{children}</div>
    </>
  );
}
