import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Furnace Leads",
  description: "Terms governing your use of Furnace Leads services, including payment, cancellation, and refund policies.",
};

export default function TermsOfService() {
  const updated = "May 6, 2026";
  const email = "hello@furnaceleads.com";
  const company = "Furnace Leads";

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
              Terms of Service
            </h1>
            <p style={{ fontSize: "0.88rem", color: "#525252", margin: 0 }}>
              Last updated: {updated}
            </p>
          </div>

          <p>
            These Terms of Service (&quot;Terms&quot;) constitute a legally binding agreement between you (&quot;Client,&quot; &quot;you,&quot; or &quot;your&quot;) and {company} (&quot;Company,&quot; &quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) governing your access to and use of our lead generation services, website, and related products. By placing an order, creating an account, or using any of our services, you agree to be bound by these Terms.
          </p>
          <p>
            If you do not agree to these Terms, do not use our services.
          </p>

          <hr />

          <h2>1. Services</h2>
          <p>
            {company} provides B2B lead generation, marketing support, CRM integration assistance, funnel optimization, and business growth consulting services (&quot;Services&quot;) to insurance agencies, sales organizations, and service-based businesses.
          </p>
          <p>
            The specific scope, volume, pricing, and delivery schedule for your Services are defined in your order confirmation, service agreement, or campaign brief. In the event of a conflict between these Terms and a separate written agreement, the written agreement controls.
          </p>
          <p>
            <strong>Agreement required before purchase.</strong> You must affirmatively agree to these Terms of Service — including the refund, cancellation, and billing policies in Sections 3–5 — before completing any purchase. By checking the agreement checkbox at checkout and submitting payment, you confirm that you have read, understood, and agreed to these Terms. Purchases cannot be completed without this affirmative acknowledgment. This record of consent may be used as evidence in the event of a payment dispute or chargeback.
          </p>

          <hr />

          <h2>2. Account Registration</h2>
          <p>
            To access certain Services, you may be required to create an account. You agree to:
          </p>
          <ul>
            <li>Provide accurate, current, and complete information during registration.</li>
            <li>Maintain the security of your login credentials and not share them with third parties.</li>
            <li>Notify us immediately at <a href={`mailto:${email}`}>{email}</a> if you suspect unauthorized access to your account.</li>
            <li>Be responsible for all activity that occurs under your account.</li>
          </ul>
          <p>
            We reserve the right to suspend or terminate accounts that provide false information or violate these Terms.
          </p>

          <hr />

          <h2>3. Payment Terms</h2>

          <h3>3.1 Payment Processing</h3>
          <p>
            All payments are processed securely by <strong>Stripe, Inc.</strong>, our third-party payment processor. By providing payment information, you authorize {company} to charge your payment method for all applicable fees via Stripe. Your payment information is governed by Stripe&apos;s <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a> and <a href="https://stripe.com/legal/consumer" target="_blank" rel="noopener noreferrer">Terms of Service</a>. We do not store your full card details.
          </p>

          <h3>3.2 Pay-Per-Lead Orders</h3>
          <ul>
            <li>Payment is due in full at the time of order placement unless otherwise agreed in writing.</li>
            <li>Minimum order is 25 leads. We reserve the right to change minimums with 14 days&apos; notice.</li>
            <li>Prices are stated in U.S. dollars and are exclusive of applicable taxes unless otherwise noted.</li>
          </ul>

          <h3>3.3 Managed Lead Program (Subscription)</h3>
          <ul>
            <li>Subscriptions are billed monthly or on the cycle stated in your order confirmation.</li>
            <li>Your subscription renews automatically at the end of each billing period unless you cancel in accordance with Section 5.</li>
            <li>We will notify you of any price changes at least 30 days before they take effect. Continued use of the Service after a price change constitutes your acceptance of the new price.</li>
            <li>All subscription fees are charged in advance via Stripe.</li>
          </ul>

          <h3>3.4 Failed Payments</h3>
          <p>
            If a payment fails, we will attempt to retry the charge. If payment is not received within 7 days of the due date, we reserve the right to suspend or terminate your Services. You remain liable for all unpaid amounts. We may charge a late fee of 1.5% per month on overdue balances, up to the maximum permitted by law.
          </p>

          <h3>3.5 Taxes</h3>
          <p>
            You are responsible for all applicable taxes, duties, and levies. If we are required to collect sales tax, it will be added to your invoice. If you are tax-exempt, you must provide valid documentation prior to purchase.
          </p>

          <hr />

          <h2>4. Refund Policy</h2>

          <h3>4.1 Pay-Per-Lead Purchases</h3>
          <p>
            Due to the nature of lead generation services, all pay-per-lead purchases are <strong>non-refundable</strong> once leads have been delivered. If you believe a delivered lead does not meet the agreed qualification criteria (e.g., invalid contact information, outside target geography), you must submit a dispute within <strong>5 business days</strong> of delivery. Approved disputes will result in a lead credit applied to your next order, not a monetary refund.
          </p>
          <p>
            To submit a lead dispute, email <a href={`mailto:${email}`}>{email}</a> with your order number and a description of the issue.
          </p>

          <h3>4.2 Managed Lead Program Subscriptions</h3>
          <ul>
            <li><strong>No refunds</strong> are issued for partial billing periods.</li>
            <li>If you cancel before your next renewal date, you retain access to the Service through the end of the paid period.</li>
            <li>We do not offer prorated refunds for unused time.</li>
          </ul>

          <h3>4.3 Consulting and Setup Fees</h3>
          <p>
            Fees for consulting, onboarding, CRM integration setup, and other one-time services are non-refundable once work has commenced. If work has not yet begun, you may request a cancellation within 48 hours of payment for a full refund.
          </p>

          <h3>4.4 Exceptional Circumstances</h3>
          <p>
            We may, at our sole discretion, offer credits or refunds in exceptional circumstances (e.g., documented technical failure on our part). All refund requests must be submitted to <a href={`mailto:${email}`}>{email}</a> within 30 days of the charge.
          </p>

          <h3>4.5 Chargebacks and Disputes</h3>
          <p>
            Before initiating a chargeback or payment dispute with your card issuer or bank, you agree to contact us at <a href={`mailto:${email}`}>{email}</a> to resolve the issue directly. Your affirmative agreement to these Terms at the time of purchase — including this refund policy — is recorded and may be submitted as evidence to the payment network in the event of a dispute. Initiating a chargeback without first contacting us may result in suspension of your account and recovery of any amounts improperly reversed.
          </p>

          <hr />

          <h2>5. Cancellation</h2>

          <h3>5.1 Cancellation by You</h3>
          <p>
            You may cancel a subscription at any time by contacting us at <a href={`mailto:${email}`}>{email}</a> or through your account dashboard (if available). Cancellations must be submitted at least <strong>5 business days before your next renewal date</strong> to prevent that period&apos;s charge. We will confirm your cancellation by email.
          </p>

          <h3>5.2 Cancellation by Us</h3>
          <p>
            We reserve the right to suspend or terminate your access to Services at any time, with or without notice, for reasons including but not limited to:
          </p>
          <ul>
            <li>Violation of these Terms or any applicable law.</li>
            <li>Non-payment of fees.</li>
            <li>Fraudulent, abusive, or harmful conduct.</li>
            <li>Requests from law enforcement or government authorities.</li>
          </ul>
          <p>
            In the event of termination for cause, no refunds will be issued. In the event of termination without cause, we will provide a prorated refund of unused prepaid fees.
          </p>

          <hr />

          <h2>6. Acceptable Use</h2>
          <p>You agree not to use our Services to:</p>
          <ul>
            <li>Violate any applicable federal, state, local, or international law or regulation, including the CAN-SPAM Act, TCPA, GDPR, or CCPA.</li>
            <li>Harass, abuse, or harm any individual.</li>
            <li>Transmit unsolicited bulk communications (spam).</li>
            <li>Engage in deceptive, misleading, or fraudulent sales practices.</li>
            <li>Resell, sublicense, or redistribute leads to third parties without our prior written consent.</li>
            <li>Reverse-engineer, scrape, or extract data from our platform by automated means.</li>
            <li>Use leads for any purpose other than lawful, direct outreach to the individuals identified.</li>
          </ul>
          <p>
            You are solely responsible for your use of leads delivered by us, including compliance with all applicable telemarketing, email marketing, and data privacy laws.
          </p>

          <hr />

          <h2>7. Intellectual Property</h2>
          <p>
            All content, software, data compilations, and materials on our website and platform are the property of {company} or our licensors and are protected by copyright, trademark, and other intellectual property laws. You may not copy, reproduce, distribute, or create derivative works without our prior written consent.
          </p>
          <p>
            Lead data delivered to you is licensed for your internal business use only. You retain no ownership interest in the underlying data compilation.
          </p>

          <hr />

          <h2>8. Confidentiality</h2>
          <p>
            Each party agrees to keep confidential any non-public information disclosed by the other party in connection with the Services, including pricing, campaign strategies, and customer data. This obligation survives termination of the agreement for a period of 3 years.
          </p>

          <hr />

          <h2>9. Disclaimers</h2>
          <p>
            THE SERVICES ARE PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT. WE DO NOT GUARANTEE SPECIFIC LEAD VOLUMES, CONVERSION RATES, OR REVENUE OUTCOMES FROM USE OF OUR SERVICES.
          </p>
          <p>
            We make commercially reasonable efforts to deliver accurate, verified leads but cannot guarantee that all delivered leads will result in sales or that contact information will remain current after delivery.
          </p>

          <hr />

          <h2>10. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, {company.toUpperCase()}&apos;S TOTAL LIABILITY TO YOU FOR ANY CLAIM ARISING OUT OF OR RELATING TO THESE TERMS OR THE SERVICES SHALL NOT EXCEED THE TOTAL FEES PAID BY YOU IN THE 3 MONTHS PRECEDING THE CLAIM.
          </p>
          <p>
            IN NO EVENT SHALL WE BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, GOODWILL, OR BUSINESS OPPORTUNITY, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
          </p>

          <hr />

          <h2>11. Indemnification</h2>
          <p>
            You agree to indemnify, defend, and hold harmless {company} and its officers, directors, employees, and agents from any claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys&apos; fees) arising out of or relating to: (a) your use of the Services; (b) your violation of these Terms; (c) your violation of any law or the rights of any third party; or (d) your use of leads in a manner that violates applicable law.
          </p>

          <hr />

          <h2>12. Dispute Resolution</h2>

          <h3>12.1 Informal Resolution</h3>
          <p>
            Before initiating formal proceedings, you agree to contact us at <a href={`mailto:${email}`}>{email}</a> and attempt to resolve the dispute informally. We will respond within 10 business days.
          </p>

          <h3>12.2 Binding Arbitration</h3>
          <p>
            If informal resolution fails, any dispute, claim, or controversy arising out of or relating to these Terms or the Services shall be resolved by binding individual arbitration under the American Arbitration Association (&quot;AAA&quot;) Commercial Arbitration Rules. The arbitration shall be conducted in English. The arbitrator&apos;s decision shall be final and binding and may be entered as a judgment in any court of competent jurisdiction.
          </p>

          <h3>12.3 Class Action Waiver</h3>
          <p>
            YOU AND {company.toUpperCase()} AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER ONLY IN AN INDIVIDUAL CAPACITY AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS OR REPRESENTATIVE PROCEEDING.
          </p>

          <hr />

          <h2>13. Governing Law</h2>
          <p>
            These Terms are governed by the laws of the State of Delaware, United States, without regard to its conflict of law provisions. Subject to the arbitration clause above, you consent to the exclusive jurisdiction of courts located in Delaware for any dispute not subject to arbitration.
          </p>

          <hr />

          <h2>14. Changes to These Terms</h2>
          <p>
            We may update these Terms from time to time. When we make material changes, we will update the &quot;Last updated&quot; date and notify you by email or a prominent notice on our site at least 14 days before changes take effect. Your continued use of the Services after the effective date constitutes acceptance of the revised Terms. If you do not agree, you must cancel before the effective date.
          </p>

          <hr />

          <h2>15. Miscellaneous</h2>
          <ul>
            <li><strong>Entire Agreement:</strong> These Terms, together with any executed service agreement or order form, constitute the entire agreement between you and {company} with respect to the Services.</li>
            <li><strong>Severability:</strong> If any provision of these Terms is found to be unenforceable, the remaining provisions will remain in full force.</li>
            <li><strong>Waiver:</strong> Our failure to enforce any right or provision shall not constitute a waiver of that right.</li>
            <li><strong>Assignment:</strong> You may not assign these Terms or any of your rights hereunder without our prior written consent. We may assign these Terms in connection with a merger, acquisition, or sale of assets.</li>
            <li><strong>Force Majeure:</strong> We are not liable for delays or failure to perform caused by events beyond our reasonable control, including natural disasters, government actions, or internet outages.</li>
          </ul>

          <hr />

          <h2>16. Contact Us</h2>
          <p>
            Questions about these Terms should be directed to:
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
