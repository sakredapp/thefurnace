import { generateText, Output } from "ai";
import { z } from "zod";

// Routes through Vercel AI Gateway — uses OIDC (VERCEL_OIDC_TOKEN) or AI_GATEWAY_API_KEY
const FAST_MODEL = "anthropic/claude-haiku-4.5";
const SMART_MODEL = "anthropic/claude-sonnet-4.6";

// ─── Copy generation ─────────────────────────────────────────────────────────

const CopyVariantsSchema = z.object({
  variants: z.array(
    z.object({
      headline: z.string(),
      body: z.string(),
      cta: z.string(),
      angle: z.string(),
    })
  ),
  reasoning: z.string(),
});

export type CopyVariants = z.infer<typeof CopyVariantsSchema>;

export async function generateCopyVariants(input: {
  businessName: string;
  vertical: string;
  offerDescription: string;
  targetGeography: string;
  platform: "google_ads" | "meta_ads";
  count?: number;
  existingCopy?: string[];
  performanceNotes?: string;
}): Promise<CopyVariants> {
  const platformNote =
    input.platform === "google_ads"
      ? "Google Search Ads (headline max 30 chars, description max 90 chars, text only)"
      : "Meta Feed Ads (headline max 40 chars, body max 125 chars)";

  const { output } = await generateText({
    model: SMART_MODEL,
    output: Output.object({ schema: CopyVariantsSchema }),
    prompt: `You are an expert direct-response ad copywriter for ${platformNote}.

Business: ${input.businessName}
Vertical: ${input.vertical}
Offer: ${input.offerDescription}
Geography: ${input.targetGeography}
${input.performanceNotes ? `\nPerformance context: ${input.performanceNotes}` : ""}
${input.existingCopy?.length ? `\nExisting copy to differentiate from:\n${input.existingCopy.join("\n")}` : ""}

Generate ${input.count ?? 3} distinct ad copy variants. Each must use a different emotional angle (e.g. urgency, social proof, fear of missing out, curiosity, direct offer). Focus on qualified lead generation. No fluff. Be specific and concrete.`,
  });

  return output!;
}

// ─── Campaign analysis ────────────────────────────────────────────────────────

const CampaignAnalysisSchema = z.object({
  summary: z.string(),
  wins: z.array(z.string()),
  problems: z.array(z.string()),
  recommendations: z.array(
    z.object({
      priority: z.enum(["high", "medium", "low"]),
      action: z.string(),
      rationale: z.string(),
    })
  ),
  copyAnglesToTest: z.array(z.string()),
  estimatedImpact: z.string(),
});

export type CampaignAnalysis = z.infer<typeof CampaignAnalysisSchema>;

export async function analyzeCampaignPerformance(input: {
  businessName: string;
  vertical: string;
  offerDescription: string;
  campaigns: {
    platform: string;
    impressions: number;
    clicks: number;
    leads: number;
    qualifiedLeads: number;
    spend: number;
  }[];
  leadQualityNotes?: string;
}): Promise<CampaignAnalysis> {
  const enriched = input.campaigns.map((c) => ({
    ...c,
    ctr: c.impressions > 0 ? ((c.clicks / c.impressions) * 100).toFixed(2) + "%" : "N/A",
    cvr: c.clicks > 0 ? ((c.leads / c.clicks) * 100).toFixed(2) + "%" : "N/A",
    cpl: c.leads > 0 ? "$" + (c.spend / c.leads).toFixed(2) : "N/A",
    cpql: c.qualifiedLeads > 0 ? "$" + (c.spend / c.qualifiedLeads).toFixed(2) : "N/A",
    qualRate: c.leads > 0 ? ((c.qualifiedLeads / c.leads) * 100).toFixed(1) + "%" : "N/A",
  }));

  const { output } = await generateText({
    model: SMART_MODEL,
    output: Output.object({ schema: CampaignAnalysisSchema }),
    prompt: `You are a brutally honest paid media analyst and AI marketing strategist.

Business: ${input.businessName}
Vertical: ${input.vertical}
Offer: ${input.offerDescription}
${input.leadQualityNotes ? `Lead quality notes: ${input.leadQualityNotes}` : ""}

Campaign performance:
${JSON.stringify(enriched, null, 2)}

Identify what is actually wrong — copy, audience, offer, landing page, follow-up speed. Prioritize recommendations by revenue impact. Suggest specific copy angles to test next. Be direct.`,
  });

  return output!;
}

// ─── Weekly report ────────────────────────────────────────────────────────────

const WeeklyReportSchema = z.object({
  headline: z.string(),
  highlights: z.array(z.string()),
  concerns: z.array(z.string()),
  nextWeekPlan: z.array(z.string()),
  clientSummary: z.string().describe("2-3 sentence plain English summary for the client"),
});

export type WeeklyReport = z.infer<typeof WeeklyReportSchema>;

export async function generateWeeklyReport(input: {
  businessName: string;
  period: string;
  metrics: Record<string, number | string>;
  leadStatusBreakdown: Record<string, number>;
}): Promise<WeeklyReport> {
  const { output } = await generateText({
    model: FAST_MODEL,
    output: Output.object({ schema: WeeklyReportSchema }),
    prompt: `Generate a weekly performance report for ${input.businessName} (${input.period}).

Metrics: ${JSON.stringify(input.metrics, null, 2)}
Lead pipeline: ${JSON.stringify(input.leadStatusBreakdown, null, 2)}

Write a clear report. The clientSummary should be plain English — no jargon, just results and what's next.`,
  });

  return output!;
}

export { FAST_MODEL, SMART_MODEL };
