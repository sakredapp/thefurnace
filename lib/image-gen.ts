import { fal } from "@fal-ai/client";

fal.config({ credentials: process.env.FAL_KEY });

const VERTICAL_SCENE: Record<string, string> = {
  insurance:       "professional family at home reviewing documents with an advisor, warm and trustworthy atmosphere",
  elective_health: "confident person post-treatment, bright medical spa environment, clean modern aesthetic",
  legal:           "confident attorney in modern office, professional and authoritative setting",
  real_estate:     "stunning home exterior with manicured lawn, golden hour lighting",
  home_services:   "skilled technician working professionally in a clean modern home",
  other:           "professional business meeting, modern office, confident handshake",
};

const PLATFORM_STYLE: Record<string, string> = {
  meta_ads:   "square 1:1 composition optimized for social media feed, eye-catching, vibrant but professional",
  google_ads: "wide landscape 16:9 composition, clean minimal background, subject centered",
};

export async function generateAdImage(input: {
  vertical: string;
  platform: "meta_ads" | "google_ads";
  offerDescription: string;
  angle: string;
}): Promise<string | null> {
  if (!process.env.FAL_KEY) return null;

  const scene = VERTICAL_SCENE[input.vertical] ?? VERTICAL_SCENE.other;
  const style = PLATFORM_STYLE[input.platform] ?? PLATFORM_STYLE.meta_ads;
  const imageSize = input.platform === "meta_ads" ? "square_hd" : "landscape_16_9";

  const prompt = [
    `Commercial advertising photography:`,
    scene,
    `Mood: ${input.angle}`,
    style,
    `Shot on Sony A7 IV, 35mm lens, professional lighting.`,
    `No text, no logos, no watermarks. Photorealistic, high resolution.`,
    `Clean composition with space for text overlay.`,
  ].join(" ");

  try {
    const result = await fal.subscribe("fal-ai/flux-pro/v1.1", {
      input: {
        prompt,
        image_size: imageSize,
        num_inference_steps: 25,
        guidance_scale: 3.5,
        num_images: 1,
        safety_tolerance: "2",
      },
    });

    const images = (result.data as { images?: { url: string }[] })?.images;
    return images?.[0]?.url ?? null;
  } catch (err) {
    console.error("[fal] image generation failed:", err);
    return null;
  }
}
