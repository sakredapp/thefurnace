import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Furnace Leads",
  description: "How Furnace Leads collects, uses, and protects your personal information.",
};

export default function PrivacyPolicy() {
  const updated = "May 6, 2026";
  const email = "hello@furnaceleads.com";
  const company = "Furnace Leads";
  const site = "furnaceleads.com";

  return (
    <main>
      <div className="wrap">
        <div className="prose-page">

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <div style={{
              fontSize: "0.72rem",
              fontWeight: 800,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#F4511E",
              marginBottom: "0.75rem",
            }}>
              Legal
            </div>
            <h1 style={{
              fontSize: "clamp(1.8rem, 4vw, 2.4rem)",
              fontWeight: 900,
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
              color: "#0f0f0f",
              margin: "0 0 0.75rem",
            }}>
              Privacy Policy
            </h1>
            <p style={{ fontSize: "0.88rem", color: "#525252", margin: 0 }}>
              Last updated: {updated}
            </p>
          </div>

          <p>
            This Privacy Policy describes how {company} (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) collects, uses, and shares information about you when you use our website ({site}), purchase our services, or interact with us in any way. By accessing or using our services, you agree to this policy.
          </p>

          <hr />

          <h2>1. Information We Collect</h2>

          <h3>Information You Provide Directly</h3>
          <ul>
            <li><strong>Contact information</strong> — name, email address, phone number, company name, and job title when you submit a form, book a consultation, or contact us.</li>
            <li><strong>Account information</strong> — credentials and preferences if you create an account on our platform.</li>
            <li><strong>Communications</strong> — messages, emails, and notes you send to us.</li>
          </ul>

          <h3>Payment Information</h3>
          <p>
            We use <strong>Stripe, Inc.</strong> to process all payments. When you purchase a service or subscription, your payment card details (card number, expiration date, CVV) are entered directly into Stripe&apos;s secure interface and transmitted to Stripe. We do not store, transmit, or have access to your full payment card information. We receive only a tokenized reference and limited summary data (last four digits, card brand, expiration month/year) from Stripe for billing and record-keeping purposes.
          </p>
          <p>
            <strong>Stripe&apos;s independent data collection:</strong> Stripe may independently collect personal information about you — including device identifiers, IP address, browser type, and behavioral data — via cookies and similar technologies when you interact with payment interfaces on our site. Stripe uses this data to operate and improve its services, including for fraud detection, loss prevention, authentication, and analytics. This collection is governed solely by the <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">Stripe Privacy Policy</a>. Stripe is certified as a PCI DSS Level 1 Service Provider.
          </p>
          <p>
            By using our services, you acknowledge that we have obtained, on Stripe&apos;s behalf, all necessary rights and consents required for Stripe to lawfully collect, use, and process your personal information as described in the Stripe Privacy Policy.
          </p>

          <h3>Information Collected Automatically</h3>
          <ul>
            <li><strong>Log data</strong> — IP address, browser type and version, operating system, referring URLs, pages visited, and timestamps.</li>
            <li><strong>Device information</strong> — device type, screen resolution, and hardware model.</li>
            <li><strong>Cookies and similar technologies</strong> — session cookies for authentication, analytics cookies to understand site usage, and preference cookies. See Section 7 for details.</li>
          </ul>

          <h3>Information From Third Parties</h3>
          <ul>
            <li>CRM platforms you authorize us to connect to (e.g., HubSpot, Salesforce, GoHighLevel) — we access only data necessary to deliver leads to your account.</li>
            <li>Lead data we compile from licensed marketing data sources, used to fulfill our lead generation services.</li>
          </ul>

          <hr />

          <h2>2. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide, operate, and improve our lead generation and marketing services.</li>
            <li>Process payments and manage billing through Stripe.</li>
            <li>Send transactional communications — order confirmations, invoices, lead delivery notifications.</li>
            <li>Respond to your inquiries and provide customer support.</li>
            <li>Send marketing communications about our services, where you have consented or where we have a legitimate interest (you may opt out at any time).</li>
            <li>Detect, investigate, and prevent fraudulent transactions and other illegal activity.</li>
            <li>Comply with our legal obligations.</li>
            <li>Analyze usage trends and improve site performance and user experience.</li>
          </ul>

          <hr />

          <h2>3. How We Share Your Information</h2>
          <p>We do not sell your personal information. We share information only in these circumstances:</p>
          <ul>
            <li><strong>Stripe</strong> — to process payments and comply with financial regulations. Stripe may share data with financial partners as described in their privacy policy.</li>
            <li><strong>Service providers</strong> — hosting, analytics, email delivery, and CRM vendors who process data on our behalf under data processing agreements.</li>
            <li><strong>Legal requirements</strong> — if required by law, court order, or government authority, or to protect the rights, safety, or property of {company} or others.</li>
            <li><strong>Business transfers</strong> — in connection with a merger, acquisition, or sale of assets, subject to the successor honoring this privacy policy.</li>
          </ul>

          <hr />

          <h2>4. Legal Bases for Processing (GDPR)</h2>
          <p>If you are located in the European Economic Area, United Kingdom, or Switzerland, we process your personal data under the following legal bases:</p>
          <ul>
            <li><strong>Contract</strong> — processing necessary to provide the services you have purchased.</li>
            <li><strong>Legitimate interests</strong> — fraud prevention, site security, and service improvement.</li>
            <li><strong>Consent</strong> — marketing emails and non-essential cookies, which you may withdraw at any time.</li>
            <li><strong>Legal obligation</strong> — compliance with applicable laws and financial regulations.</li>
          </ul>

          <hr />

          <h2>5. Data Retention</h2>
          <p>
            We retain your personal information for as long as necessary to fulfill the purposes described in this policy, unless a longer retention period is required by law. Specifically:
          </p>
          <ul>
            <li><strong>Account and customer data</strong> — retained for the duration of our business relationship plus 7 years, to satisfy tax and accounting obligations.</li>
            <li><strong>Payment records</strong> — retained as required by Stripe and applicable financial regulations (typically 7 years).</li>
            <li><strong>Marketing contact data</strong> — retained until you opt out or request deletion, or 3 years of inactivity.</li>
            <li><strong>Log data</strong> — typically 90 days.</li>
          </ul>

          <hr />

          <h2>6. Your Rights</h2>
          <p>Depending on your jurisdiction, you may have the right to:</p>
          <ul>
            <li><strong>Access</strong> the personal information we hold about you.</li>
            <li><strong>Correct</strong> inaccurate or incomplete information.</li>
            <li><strong>Delete</strong> your personal information (subject to legal retention requirements).</li>
            <li><strong>Restrict or object</strong> to certain processing activities.</li>
            <li><strong>Data portability</strong> — receive your data in a structured, machine-readable format.</li>
            <li><strong>Withdraw consent</strong> at any time where processing is based on consent.</li>
            <li><strong>Opt out of sale or sharing</strong> of your personal information (California residents — CCPA).</li>
          </ul>
          <p>
            To exercise any of these rights, contact us at <a href={`mailto:${email}`}>{email}</a>. We will respond within 30 days. We may need to verify your identity before fulfilling a request.
          </p>

          <hr />

          <h2>7. Cookies</h2>
          <p>We use the following categories of cookies:</p>
          <ul>
            <li><strong>Strictly necessary</strong> — required for the site to function (e.g., session authentication). These cannot be disabled.</li>
            <li><strong>Stripe payment cookies</strong> — Stripe sets cookies including <code>__stripe_mid</code> and <code>__stripe_sid</code> independently on pages where payment functionality is present. These are strictly necessary for fraud detection and secure payment processing and cannot be disabled without removing payment functionality. They are governed by the <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">Stripe Privacy Policy</a>.</li>
            <li><strong>Analytics</strong> — help us understand how visitors use the site (e.g., page views, traffic sources). You may opt out via your browser settings or a cookie consent tool.</li>
            <li><strong>Marketing</strong> — used to track conversions from ad campaigns. Only set with your consent.</li>
          </ul>
          <p>You can manage cookie preferences in your browser settings at any time. Disabling certain cookies may affect site functionality.</p>

          <hr />

          <h2>8. Data Security</h2>
          <p>
            We implement industry-standard technical and organizational measures to protect your personal information, including TLS encryption in transit, access controls, and regular security reviews. However, no method of transmission over the internet is 100% secure. In the event of a data breach affecting your rights, we will notify you as required by applicable law.
          </p>

          <hr />

          <h2>9. International Transfers</h2>
          <p>
            Your information may be transferred to and processed in countries other than your own, including the United States. Where required, we rely on Standard Contractual Clauses approved by the European Commission or other appropriate safeguards to protect your data during international transfers.
          </p>

          <hr />

          <h2>10. Children&apos;s Privacy</h2>
          <p>
            Our services are intended for business professionals and are not directed to individuals under 18. We do not knowingly collect personal information from minors. If we become aware that we have done so, we will delete it promptly.
          </p>

          <hr />

          <h2>11. Links to Third-Party Sites</h2>
          <p>
            Our site may link to third-party websites. We are not responsible for the privacy practices of those sites and encourage you to review their privacy policies before providing any personal information.
          </p>

          <hr />

          <h2>12. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy periodically. When we make material changes, we will update the &quot;Last updated&quot; date above and, where appropriate, notify you by email or a prominent notice on our site. Your continued use of our services after changes are posted constitutes your acceptance of the updated policy.
          </p>

          <hr />

          <h2>13. Contact Us</h2>
          <p>
            If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
          </p>
          <ul>
            <li><strong>Email:</strong> <a href={`mailto:${email}`}>{email}</a></li>
            <li><strong>Business:</strong> {company}</li>
          </ul>

        </div>
      </div>

      <footer style={{
        borderTop: "1px solid rgba(0,0,0,0.09)",
        padding: "2rem 1.5rem",
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "1rem",
        background: "#faf9f7",
      }}>
        <div style={{ fontSize: "0.88rem", color: "#525252" }}>
          © {new Date().getFullYear()} Furnace Leads. All rights reserved.
        </div>
        <nav style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
          <a href="/" className="footer-link" style={{ fontSize: "0.88rem" }}>Home</a>
          <a href="/privacy" className="footer-link" style={{ fontSize: "0.88rem" }}>Privacy Policy</a>
          <a href="/terms" className="footer-link" style={{ fontSize: "0.88rem" }}>Terms of Service</a>
          <a href={`mailto:${email}`} className="footer-link" style={{ fontSize: "0.88rem" }}>{email}</a>
        </nav>
      </footer>
    </main>
  );
}
