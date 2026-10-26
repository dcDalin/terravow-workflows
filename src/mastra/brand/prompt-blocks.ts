import { BRAND, HONESTY_RULES, VOICE_RULES } from "./atlasair";
import type { ResolvedProduct } from "./products";

/**
 * Reusable prompt fragments. Every agent and every hardcoded step prompt builds
 * from these so the brand, the safety rules and the honesty policy read
 * identically no matter which workflow produced the asset.
 */

export function brandBlock(): string {
  return `
BRAND — ${BRAND.name}
${BRAND.tagline}
Category: ${BRAND.category}.
Positioning: ${BRAND.positioning}

THE FOUR PILLARS — draw from these, do not invent new ones:
${BRAND.pillars.map((p) => `- ${p}`).join("\n")}

VOICE:
${VOICE_RULES.map((r) => `- ${r}`).join("\n")}
`.trim();
}

export function safetyBlock(): string {
  return `
SAFETY — non-negotiable, applies to every sentence you write:
- ${BRAND.emergencyFirstRule}
- ${BRAND.safetyDisclaimer}
- These are airway-clearance aids. Never describe them as a cure, a guarantee, or a replacement for trained help.
- Use "helps dislodge a blockage", never "clears the blockage", "removes the object" or "saves your child".
- Never instruct the reader to delay calling emergency services for any reason.
- Do not give medical advice beyond what the product documentation supports.
`.trim();
}

export function honestyBlock(): string {
  return `
HONESTY — ${BRAND.name} competes on being trustworthy. These are hard rules, not preferences:
${HONESTY_RULES.map((r) => `- ${r}`).join("\n")}

Social proof: ${BRAND.socialProofPolicy.rule}
Trust elements: ${BRAND.trustStrip}
`.trim();
}

/**
 * The visual system, for prompts that render images. Accepts optional per-run
 * colour overrides from the workflow input; anything not overridden uses the
 * brand palette.
 */
export function visualIdentityBlock(overrides?: {
  primary?: string;
  secondary?: string;
  accent?: string;
}): string {
  const p = BRAND.palette;
  const primary = overrides?.primary ?? p.primary;
  const accent = overrides?.accent ?? p.accent;
  const secondary = overrides?.secondary ?? p.secondary;

  return `
VISUAL IDENTITY — ${BRAND.name}. Match these exactly; do not invent brand colours.
- Primary blue ${primary} — main brand colour, primary buttons and key accents
- Accent ${accent} — reserved for a SINGLE call-to-action per image. Never use it twice in one composition.
- Secondary ${secondary} surfaces with a navy ${p.foreground} border
- Background: warm paper ${p.background}. Not pure white, not grey.
- Foreground text: navy ink ${p.foreground}. Muted text ${p.mutedText}, muted surfaces ${p.mutedSurface}.
- Success ${p.success}
- Soft pastel fills where a scene needs colour blocking: sky ${p.pastels.sky}, mint ${p.pastels.mint}, blush ${p.pastels.blush}, lavender ${p.pastels.lavender}, sun ${p.pastels.sun}

TYPOGRAPHY:
- Display and headlines: ${BRAND.typography.display} (serif) — or a close serif equivalent
- Body, labels and UI: ${BRAND.typography.body} (geometric sans) — or a close sans equivalent
- ${BRAND.typography.script} (handwritten script) sparingly, for a single human annotation at most. Never for body copy or safety text.

SHAPE AND DEPTH:
- Corner radius ${BRAND.shape.radius}px on cards and containers; buttons are fully pill-shaped
- Shadows are ${BRAND.shape.shadow} — soft navy-tinted, never a black or grey drop shadow
- Overall feel: warm, calm, well-made. Reassuring rather than clinical, clear rather than dramatic.
`.trim();
}

export function productBlock(product: ResolvedProduct): string {
  const lines = [
    `PRODUCT: ${product.title}`,
    `Short name (use this naturally in copy): ${product.shortName}`,
    `Type: ${product.type}${product.ships ? "" : " — DIGITAL ONLY, nothing ships"}`,
  ];

  if (product.ageRange) lines.push(`Covers: ${product.ageRange}`);

  lines.push("", "DESCRIPTION:", product.description);

  if (product.features.length) {
    lines.push("", "FEATURES:", ...product.features.map((f) => `- ${f}`));
  }

  if (product.whatsIncluded.length) {
    lines.push(
      "",
      "WHAT'S INCLUDED:",
      ...product.whatsIncluded.map((i) => `- ${i}`),
    );
  }

  if (!product.ships) {
    lines.push(
      "",
      "This product is delivered digitally. Do not mention shipping, delivery times, packaging or a physical case.",
    );
  }

  return lines.join("\n");
}

/** Brand + safety + honesty, in the order every agent should carry them. */
export function agentPreamble(): string {
  return [brandBlock(), safetyBlock(), honestyBlock()].join("\n\n");
}
