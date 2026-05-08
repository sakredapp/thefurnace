import { Resend } from "resend";
import type { WeeklyReport, CampaignAnalysis } from "@/lib/ai";

const FROM = "Furnace <reports@furnaceleads.com>";

// Lazy-initialize so the module loads safely at build time without the key
const getResend = () => {
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY not set");
  return new Resend(process.env.RESEND_API_KEY);
};

export async function sendWeeklyReport(input: {
  to: string;
  businessName: string;
  period: string;
  metrics: Record<string, number | string>;
  report: WeeklyReport;
  analysis: CampaignAnalysis | null;
}): Promise<void> {
  const { to, businessName, period, metrics, report, analysis } = input;

  const highlightRows = report.highlights
    .map((h) => `<tr><td style="padding:6px 0;border-bottom:1px solid #2a1a10;color:#e8d5c4;font-size:14px;">✓ ${h}</td></tr>`)
    .join("");

  const concernRows = report.concerns.length > 0
    ? report.concerns
        .map((c) => `<tr><td style="padding:6px 0;border-bottom:1px solid #2a1a10;color:#e8d5c4;font-size:14px;">⚠ ${c}</td></tr>`)
        .join("")
    : `<tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">No major concerns this week.</td></tr>`;

  const planRows = report.nextWeekPlan
    .map((p, i) => `<tr><td style="padding:6px 0;border-bottom:1px solid #2a1a10;color:#e8d5c4;font-size:14px;">${i + 1}. ${p}</td></tr>`)
    .join("");

  const topRecs = analysis?.recommendations
    .filter((r) => r.priority === "high")
    .slice(0, 3) ?? [];

  const recsHtml = topRecs.length > 0
    ? `<div style="margin-top:28px;">
        <h3 style="margin:0 0 12px;font-size:13px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:#F4511E;">Strategic Recommendations</h3>
        ${topRecs.map((r) => `
          <div style="background:#1a0d06;border:1px solid rgba(244,81,30,0.2);border-radius:8px;padding:14px;margin-bottom:10px;">
            <div style="font-size:13px;font-weight:700;color:#fff;margin-bottom:4px;">${r.action}</div>
            <div style="font-size:12px;color:#9ca3af;">${r.rationale}</div>
          </div>`).join("")}
      </div>`
    : "";

  const metricsHtml = Object.entries(metrics)
    .map(([k, v]) => `
      <td style="text-align:center;padding:0 16px;">
        <div style="font-size:22px;font-weight:900;color:#F4511E;">${v}</div>
        <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#6b7280;margin-top:2px;">${k.replace(/_/g, " ")}</div>
      </td>`)
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0d0603;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">

    <!-- Header -->
    <div style="margin-bottom:28px;">
      <div style="font-size:11px;font-weight:800;letter-spacing:0.15em;text-transform:uppercase;color:#F4511E;margin-bottom:6px;">The Furnace</div>
      <h1 style="margin:0;font-size:26px;font-weight:900;color:#fff;line-height:1.2;">${report.headline}</h1>
      <div style="margin-top:8px;font-size:13px;color:#6b7280;">${businessName} &middot; ${period}</div>
    </div>

    <!-- Summary -->
    <div style="background:#1a0d06;border-left:3px solid #F4511E;border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:28px;">
      <p style="margin:0;font-size:15px;line-height:1.6;color:#e8d5c4;">${report.clientSummary}</p>
    </div>

    <!-- Metrics -->
    <div style="background:#1a0d06;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:24px;margin-bottom:28px;">
      <h3 style="margin:0 0 18px;font-size:13px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:#9ca3af;">This Week's Numbers</h3>
      <table style="width:100%;border-collapse:collapse;"><tr>${metricsHtml}</tr></table>
    </div>

    <!-- Highlights -->
    <div style="margin-bottom:28px;">
      <h3 style="margin:0 0 12px;font-size:13px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:#9ca3af;">What Went Well</h3>
      <table style="width:100%;border-collapse:collapse;">${highlightRows}</table>
    </div>

    <!-- Concerns -->
    <div style="margin-bottom:28px;">
      <h3 style="margin:0 0 12px;font-size:13px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:#9ca3af;">Watch List</h3>
      <table style="width:100%;border-collapse:collapse;">${concernRows}</table>
    </div>

    <!-- Next week -->
    <div style="margin-bottom:28px;">
      <h3 style="margin:0 0 12px;font-size:13px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:#9ca3af;">Next Week's Focus</h3>
      <table style="width:100%;border-collapse:collapse;">${planRows}</table>
    </div>

    ${recsHtml}

    <!-- Footer -->
    <div style="margin-top:40px;padding-top:20px;border-top:1px solid #1a0d06;text-align:center;">
      <div style="font-size:11px;color:#4b5563;">Powered by The Furnace AI Marketing OS</div>
      <div style="font-size:11px;color:#4b5563;margin-top:4px;">Questions? Reply to this email or contact your account manager.</div>
    </div>

  </div>
</body>
</html>`;

  await getResend().emails.send({
    from: FROM,
    to,
    subject: `[${businessName}] Weekly Report: ${report.headline}`,
    html,
  });
}
