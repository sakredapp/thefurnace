import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateCopyVariants } from "@/lib/ai";
import { generateAdImage } from "@/lib/image-gen";
import { buildAdCreative } from "@/lib/placid";

const db = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { client_id, platform, count, performance_notes } = body as {
    client_id: string;
    platform: "google_ads" | "meta_ads";
    count?: number;
    performance_notes?: string;
  };

  if (!client_id || !platform) {
    return NextResponse.json({ error: "client_id and platform required" }, { status: 400 });
  }

  const { data: client } = await db()
    .from("clients")
    .select("business_name, vertical, offer_description, target_geography")
    .eq("id", client_id)
    .single();

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  // Fetch existing approved copy to differentiate from
  const { data: existingCreatives } = await db()
    .from("creatives")
    .select("headline, body")
    .eq("client_id", client_id)
    .eq("platform", platform)
    .in("status", ["approved", "active"])
    .limit(5);

  const existingCopy = existingCreatives?.map((c) =>
    [c.headline, c.body].filter(Boolean).join(" — ")
  );

  // Log the run start
  const { data: run } = await db()
    .from("ai_runs")
    .insert({
      client_id,
      run_type: "copy_gen",
      status: "running",
      input_summary: `${platform} copy gen for ${client.business_name}`,
    })
    .select()
    .single();

  try {
    const result = await generateCopyVariants({
      businessName: client.business_name,
      vertical: client.vertical ?? "other",
      offerDescription: client.offer_description ?? "",
      targetGeography: client.target_geography ?? "National",
      platform,
      count: count ?? 3,
      existingCopy: existingCopy ?? [],
      performanceNotes: performance_notes,
    });

    // Generate one image per variant in parallel (non-blocking — images attach after response)
    const imagePromises = result.variants.map((v) =>
      generateAdImage({
        vertical: client.vertical ?? "other",
        platform,
        offerDescription: client.offer_description ?? "",
        angle: v.angle,
      })
    );

    // Insert copy rows immediately — image_url filled in after generation
    const creativeRows = result.variants.map((v) => ({
      client_id,
      type: "copy",
      platform,
      headline: v.headline,
      body: v.body,
      cta: v.cta,
      status: "draft",
      ai_generated: true,
      ai_notes: `Angle: ${v.angle}. Reasoning: ${result.reasoning}`,
    }));

    const { data: creatives } = await db()
      .from("creatives")
      .insert(creativeRows)
      .select();

    // After response: generate images → composite with Placid → attach URLs
    after(async () => {
      const backgroundUrls = await Promise.all(imagePromises);

      if (creatives) {
        await Promise.allSettled(
          creatives.map(async (c, i) => {
            const bgUrl = backgroundUrls[i] ?? null;

            // Try Placid compositing first (copy + background → polished ad)
            const placidUrl = await buildAdCreative({
              platform,
              headline: c.headline ?? "",
              body: c.body ?? "",
              cta: c.cta ?? "",
              backgroundImageUrl: bgUrl,
            });

            // Use Placid output if available, otherwise fall back to raw fal.ai background
            const finalUrl = placidUrl ?? bgUrl;
            if (finalUrl) {
              await db().from("creatives").update({ image_url: finalUrl }).eq("id", c.id);
            }
          })
        );
      }

      await db()
        .from("ai_runs")
        .update({ status: "completed", output: result, completed_at: new Date().toISOString() })
        .eq("id", run?.id);
    });

    return NextResponse.json({ variants: result.variants, creatives });
  } catch (err) {
    await db()
      .from("ai_runs")
      .update({ status: "failed", error: String(err) })
      .eq("id", run?.id);

    return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
  }
}
