import { generateText, Output } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { z } from "zod";

const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const FAST_MODEL  = anthropic("claude-haiku-4-5-20251001");
const SMART_MODEL = anthropic("claude-sonnet-4-6");

// ─── Copy generation ─────────────────────────────────────────────────────────

const CopyVariantsSchema = z.object({
  variants: z.array(
    z.object({
      headline: z.string(),
      body: z.string(),
      cta: z.string(),
      angle: z.string(),
      hypothesis: z.string().describe("What specific signal or gap this variant is testing"),
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
  // Auto-injected performance context
  recentMetrics?: {
    spend: number;
    leads: number;
    cpl: number;
    ctr: number;
    bookingRate: number;
    topCampaign?: string;
    weakestCampaign?: string;
  };
  // Claude's learned signals for this client
  activeSignals?: Array<{ signal_type: string; signal: string; confidence: string }>;
}): Promise<CopyVariants> {
  const platformNote =
    input.platform === "google_ads"
      ? "Google Search Ads (headline max 30 chars, description max 90 chars)"
      : "Meta Feed Ads (headline max 40 chars, body max 125 chars)";

  const metricsContext = input.recentMetrics
    ? `\nLast 30 days performance:
- Spend: $${input.recentMetrics.spend.toFixed(2)}
- Leads: ${input.recentMetrics.leads}
- CPL: $${input.recentMetrics.cpl.toFixed(2)}
- CTR: ${input.recentMetrics.ctr.toFixed(2)}%
- Booking rate: ${(input.recentMetrics.bookingRate * 100).toFixed(1)}%${input.recentMetrics.topCampaign ? `\n- Best campaign: ${input.recentMetrics.topCampaign}` : ""}${input.recentMetrics.weakestCampaign ? `\n- Weakest campaign: ${input.recentMetrics.weakestCampaign}` : ""}`
    : "";

  const signalsContext = input.activeSignals?.length
    ? `\nLearned patterns for this client:\n${input.activeSignals
        .map((s) => `- [${s.confidence.toUpperCase()} confidence / ${s.signal_type}] ${s.signal}`)
        .join("\n")}`
    : "";

  const { output } = await generateText({
    model: SMART_MODEL,
    output: Output.object({ schema: CopyVariantsSchema }),
    prompt: `You are an expert direct-response ad copywriter for ${platformNote}.

Business: ${input.businessName}
Vertical: ${input.vertical}
Offer: ${input.offerDescription}
Geography: ${input.targetGeography}
${metricsContext}
${signalsContext}
${input.performanceNotes ? `\nAdditional context from account manager: ${input.performanceNotes}` : ""}
${input.existingCopy?.length ? `\nExisting copy already running (do NOT repeat these angles):\n${input.existingCopy.join("\n")}` : ""}

Generate ${input.count ?? 3} distinct ad copy variants. Rules:
1. Each variant must test a different hypothesis — angle, framing, emotional trigger, or offer presentation
2. If performance data is provided, use it: if CPL is high, test price anchoring; if CTR is low, test stronger curiosity hooks; if booking rate is low, address the objection in copy
3. Apply learned signals with high confidence directly; test medium-confidence signals as hypotheses
4. No fluff. Every word earns its place.
5. Each variant's hypothesis field must explain exactly what you're testing and why, referencing the data`,
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

// ─── Signal detection — the marketer brain that learns ───────────────────────

const SignalsSchema = z.object({
  signals: z.array(
    z.object({
      signal_type: z.enum(["copy_angle", "audience_timing", "offer_framing", "creative_format", "funnel_gap", "momentum"]),
      signal: z.string().describe("Specific, actionable insight — not generic advice"),
      confidence: z.enum(["high", "medium", "low"]),
      evidence: z.string().describe("The exact data points that support this signal"),
    })
  ),
  supersede_signals: z.array(z.string()).describe("IDs of previous signals that are now invalidated by new data"),
  summary: z.string().describe("2-3 sentence plain-English summary of what changed this period"),
});

export type DetectedSignals = z.infer<typeof SignalsSchema>;

export async function detectClientSignals(input: {
  businessName: string;
  vertical: string;
  currentPeriod: string;
  metrics: {
    byPlatform: Array<{ platform: string; spend: number; leads: number; cpl: number; ctr: number; bookingRate: number }>;
    byCampaign: Array<{ name: string; platform: string; spend: number; leads: number; cpl: number; ctr: number }>;
    leadFunnel: Record<string, number>;
    totalLeads: number;
    totalBooked: number;
    totalClosed: number;
  };
  trendVsPrevious?: {
    cplChange: number;       // % change: positive = worse, negative = better
    ctrChange: number;       // % change: positive = better
    bookingRateChange: number;
    leadsChange: number;
  };
  activeCreatives: Array<{ headline: string; body: string; angle: string; platform: string }>;
  existingSignals: Array<{ id: string; signal_type: string; signal: string; confidence: string; detected_from_period: string }>;
}): Promise<DetectedSignals> {
  const { output } = await generateText({
    model: SMART_MODEL,
    output: Output.object({ schema: SignalsSchema }),
    prompt: `You are the pattern-recognition layer of an autonomous AI marketing system for ${input.businessName} (${input.vertical}).

Your job is to detect real, actionable signals from performance data — things a sharp performance marketer would notice after studying the numbers for 20 minutes. Not generic "CTR is low, test new copy." Specific: "The insurance vertical in Florida shows 3x higher qualification rates on Tuesday/Wednesday vs weekend. Shift budget."

Current period: ${input.currentPeriod}

Performance by platform:
${JSON.stringify(input.metrics.byPlatform, null, 2)}

Performance by campaign:
${JSON.stringify(input.metrics.byCampaign, null, 2)}

Lead funnel breakdown:
${JSON.stringify(input.metrics.leadFunnel, null, 2)}
Total leads: ${input.metrics.totalLeads} → Booked: ${input.metrics.totalBooked} → Closed: ${input.metrics.totalClosed}

${input.trendVsPrevious ? `Trends vs previous period:
- CPL change: ${input.trendVsPrevious.cplChange > 0 ? "+" : ""}${input.trendVsPrevious.cplChange.toFixed(1)}% (${input.trendVsPrevious.cplChange > 0 ? "worse" : "better"})
- CTR change: ${input.trendVsPrevious.ctrChange > 0 ? "+" : ""}${input.trendVsPrevious.ctrChange.toFixed(1)}%
- Booking rate change: ${input.trendVsPrevious.bookingRateChange > 0 ? "+" : ""}${input.trendVsPrevious.bookingRateChange.toFixed(1)}%
- Leads change: ${input.trendVsPrevious.leadsChange > 0 ? "+" : ""}${input.trendVsPrevious.leadsChange.toFixed(1)}%` : ""}

Currently running copy angles:
${input.activeCreatives.map((c) => `[${c.platform}] ${c.angle}: "${c.headline}"`).join("\n")}

Previously detected signals (do not repeat unless reinforced by new data):
${input.existingSignals.map((s) => `[${s.id}] [${s.signal_type}/${s.confidence}] ${s.signal} (detected: ${s.detected_from_period})`).join("\n") || "None yet"}

Output:
- New signals with enough data support (avoid signals with <3 data points of evidence)
- Supersede old signals if new data contradicts them
- Be specific: name campaigns, angles, platforms, lead stages by name
- Momentum signals: flag anything moving >15% in either direction`,
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
