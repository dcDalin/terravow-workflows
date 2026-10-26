import { createStep } from "@mastra/core/workflows";
import { z } from "zod";
import {
  generateRemixInputSchema,
  sourceAnalysisSchema,
  remixTaskSchema,
  type ElementPlan,
} from "../../../schemas/remix-creative-types";
import { resolveProduct } from "../../../brand/products";
import { BRAND } from "../../../brand/atlasair";
import { visualIdentityBlock } from "../../../brand/prompt-blocks";
import {
  decideElement,
  REMIX_SCOPE,
  type ElementClassification,
} from "../../../brand/remix-policy";

/**
 * Step 2: Turn each source analysis into an AtlasAir remix prompt.
 *
 * No LLM here on purpose. The vision agent said what is in the source; this step
 * decides what happens to it, using the policy table in brand/remix-policy.ts.
 * Keeping the decision deterministic means the honesty rules produce the same
 * result on every run and are auditable in the manifest afterwards.
 */
export const planRemixTasksStep = createStep({
  id: "plan-remix-tasks",
  description:
    "Apply AtlasAir remix policy to each source analysis and build the remix prompts",
  inputSchema: z.object({
    originalInput: generateRemixInputSchema,
    analyses: z.array(sourceAnalysisSchema),
  }),
  outputSchema: z.object({
    originalInput: generateRemixInputSchema,
    tasks: z.array(remixTaskSchema),
  }),
  execute: async ({ inputData }) => {
    console.log("📐 Planning remixes...");

    const { originalInput, analyses } = inputData;
    const product = resolveProduct(originalInput);

    const proof = originalInput.socialProof;
    const hasRealProof = Boolean(
      proof &&
      (proof.ratingValue !== undefined ||
        proof.reviewCount !== undefined ||
        proof.quotes?.length),
    );

    // No defaults. The remix reproduces what the source has; it does not add a
    // CTA or a website that weren't there. These are only set if the caller
    // explicitly asked to override them.
    const ctaOverride = originalInput.ctaText;
    const websiteOverride = originalInput.brandWebsite;

    // No AtlasAir product photography supplied means the products are the same
    // physical item: keep the source product and rebrand it in place.
    const hasProductImages = Boolean(originalInput.productImages?.length);
    console.log(
      hasProductImages
        ? "   Mode: replace source product with AtlasAir product photography"
        : "   Mode: keep source product, swap its branding to AtlasAir (no product images supplied)",
    );

    // Real Judge.me figures, used only where a social-proof slot already exists
    // in the source layout.
    const ratingText =
      proof?.ratingValue !== undefined && proof?.reviewCount !== undefined
        ? `${proof.ratingValue} stars from ${proof.reviewCount} Judge.me reviews`
        : proof?.ratingValue !== undefined
          ? `${proof.ratingValue} stars on Judge.me`
          : proof?.reviewCount !== undefined
            ? `${proof.reviewCount} Judge.me reviews`
            : "";
    const firstQuote = proof?.quotes?.[0];

    const tasks: z.infer<typeof remixTaskSchema>[] = [];

    analyses.forEach((analysis, sourceIndex) => {
      // Rotate through AtlasAir's own features so repeated claim slots in the
      // source get different real facts rather than the same one repeated.
      let claimCursor = 0;
      const nextClaim = (): string => {
        if (!product.features.length) return product.shortName;
        const feature = product.features[claimCursor % product.features.length];
        claimCursor++;
        return feature;
      };

      const elementPlan: ElementPlan[] = analysis.textElements.map((el) => {
        const classification = el.classification as ElementClassification;
        let { action, reason } = decideElement(classification, {
          hasRealProof,
        });

        let replacement: string | undefined;
        if (action === "replace") {
          switch (classification) {
            case "brand-mark":
              replacement = product.title;
              break;
            case "product-claim":
              replacement = nextClaim();
              break;
            case "social-proof":
              replacement = firstQuote
                ? `"${firstQuote.text}"${firstQuote.name ? ` — ${firstQuote.name}` : ""}${firstQuote.verified ? " (verified purchase)" : ""}`
                : ratingText;
              break;
            case "cta":
              // A CTA is generic action wording, not a brand mark. Keep the
              // source's own text as-is unless the caller explicitly overrides
              // it — the remix doesn't impose "SHOP NOW" on an ad that said
              // something else, or on one that had no CTA at all.
              if (ctaOverride) {
                replacement = ctaOverride;
                reason =
                  "Call to action replaced with the CTA supplied for this run.";
              } else {
                action = "keep";
                reason =
                  "Call to action kept as it appears in the source (generic action wording).";
              }
              break;
            default:
              replacement = undefined;
          }
        }

        return {
          sourceText: el.text,
          role: el.role,
          classification,
          action,
          reason,
          replacement,
        };
      });

      const dropped = elementPlan.filter((e) => e.action === "drop");
      if (dropped.length) {
        console.log(
          `   Source ${sourceIndex + 1}: dropped ${dropped.length} element(s) — ${dropped
            .map((d) => `"${d.sourceText.slice(0, 40)}" (${d.classification})`)
            .join(", ")}`,
        );
      }

      const aspectRatio =
        originalInput.aspectRatio ?? analysis.detectedAspectRatio;

      const prompt = buildRemixPrompt({
        analysis,
        elementPlan,
        product,
        aspectRatio,
        websiteOverride,
        layoutFidelity: originalInput.layoutFidelity ?? "close",
        brandColors: originalInput.brandColors,
        sourceBrandName: originalInput.sourceBrandName,
        hasProductImages,
      });

      const variations = originalInput.variationsPerSource ?? 1;
      for (let v = 1; v <= variations; v++) {
        tasks.push({
          sourceUrl: analysis.sourceUrl,
          sourceIndex,
          variationNumber: v,
          prompt:
            v > 1
              ? `${prompt}\n\nVARIATION ${v}: Keep the same content, branding and brand rules — including every rule about which marks appear on the product. Vary only the composition within those constraints: the crop, the lighting, and the arrangement of secondary elements within their zones.${
                  hasProductImages
                    ? ""
                    : " The product itself remains the same device with the same AtlasAir markings."
                }`
              : prompt,
          aspectRatio,
          adArchetype: analysis.adArchetype,
          elementPlan,
        });
      }
    });

    if (tasks.length === 0) {
      throw new Error("No remix tasks were created");
    }

    console.log(`✅ Planned ${tasks.length} remix(es)`);

    return { originalInput, tasks };
  },
});

/**
 * Assemble the image prompt.
 *
 * The instruction given to the image model is "rebuild this layout with these
 * assets", never "edit this image". The source is a reference image the model
 * looks at for structure; every pixel of output is generated from AtlasAir's own
 * logo and product photography.
 */
function buildRemixPrompt(args: {
  analysis: z.infer<typeof sourceAnalysisSchema>;
  elementPlan: ElementPlan[];
  product: ReturnType<typeof resolveProduct>;
  aspectRatio: string;
  websiteOverride?: string;
  layoutFidelity: "close" | "loose";
  brandColors?: { primary?: string; secondary?: string; accent?: string };
  sourceBrandName?: string;
  hasProductImages: boolean;
}): string {
  const {
    analysis,
    elementPlan,
    product,
    aspectRatio,
    websiteOverride,
    layoutFidelity,
    brandColors,
    sourceBrandName,
    hasProductImages,
  } = args;

  const sourceLabel = sourceBrandName
    ? `"${sourceBrandName}"`
    : "the source brand";

  const keeps = elementPlan.filter((e) => e.action === "keep");
  const replacements = elementPlan.filter((e) => e.action === "replace");
  const drops = elementPlan.filter((e) => e.action === "drop");

  const fidelityLine =
    layoutFidelity === "close"
      ? "Follow the reference layout closely — same zones, same relative sizes, same reading order."
      : "Keep only the ad archetype and general arrangement. Rebuild the layout in AtlasAir's own style, with more white space and a calmer composition.";

  // Two modes, driven by whether AtlasAir product photography was supplied.
  //
  // "rebrand" (no product images): the products are physically the same item, so
  // the source product's form and pose are kept and only the branding carried ON
  // it is swapped. This is the common case for this catalogue.
  //
  // "replace": AtlasAir's own product photography stands in for theirs.
  const productSection = hasProductImages
    ? `PRODUCT — REPLACE:
The source places its product like this: ${analysis.productDepiction}
Put the AtlasAir product in that same position, at that same scale and crop, rendered from AtlasAir's own product images. It must read as the AtlasAir product — matching its real shape, colour and proportions from that reference photography. Never redraw or approximate ${sourceLabel}'s product.`
    : `PRODUCT — KEEP THE PRODUCT, CHANGE ITS BRANDING:
This is the SAME physical product as the one in the layout reference. Do not substitute a different device, and do not restyle, redesign or "improve" it.

Reproduce the product exactly as the reference shows it: ${analysis.productDepiction}
Same form, same proportions, same parts, same materials and colour, same angle, same crop, same lighting and shadow. It should be recognisable as that identical device.

THE ONE THING THAT CHANGES IS THE BRANDING ON IT.
Marks currently on the product: ${analysis.productBranding}
Every one of those marks is removed and replaced with the AtlasAir logo from reference image 2:
  • Where ${sourceLabel}'s symbol (for example an arrow) is moulded, embossed or printed on the device, render the AtlasAir logo in that exact spot instead — same size, same position, following the same surface curvature, lighting and material finish so it reads as genuinely part of the product rather than pasted on.
  • Where their wordmark or brand name appears on the device, case, label or packaging, render the AtlasAir logo or the AtlasAir name instead.
  • The arrow is NOT kept, NOT recoloured, NOT restyled, NOT mirrored, and NOT merged with our logo. It is gone, and our logo occupies its place.
  • Leave no trace of the original mark: no ghosting, no embossed outline of the old shape, no partial letters at the edge of a crop, and nothing legible in reflections or blurred background copies of the product.
Everything else about the product stays exactly as it is.`;

  const logoSection = `LOGO IN THE LAYOUT:
The source logo sits here: ${analysis.logoPlacement}
Place the AtlasAir logo from reference image 2 in that position and at a comparable size. Reproduce the AtlasAir logo faithfully from that reference — do not restyle it, recolour it, add a symbol to it, or replace it with an arrow, cross, heart or any other invented mark. If the source logo is an arrow or other symbol, that symbol disappears entirely; it is not adapted, mirrored or reinterpreted.`;

  const referenceList = hasProductImages
    ? `1. Layout reference — the source ad. Use it for composition ONLY.
2. AtlasAir logo — this is the ONLY logo that may appear in the output, in the layout and on the product.
3+. AtlasAir product photography — the ONLY product that may appear in the output.`
    : `1. Layout AND product reference — the source ad. Use it for composition, and for the product's form, angle and lighting. Do NOT take any branding from it.
2. AtlasAir logo — this is the ONLY logo that may appear in the output, in the layout and on the product itself.`;

  const taskFraming = hasProductImages
    ? `You are rebuilding a composition, not editing a picture. Reproduce the STRUCTURE of the reference layout, and generate every visual element fresh from the AtlasAir reference images that follow it. Do not copy, trace or collage artwork from the reference image. Do not reproduce ${sourceLabel}'s logo, wordmark, colours, typefaces or product in any form, at any size, anywhere in the output — including reflections, packaging and background detail.`
    : `You are rendering a new image that reproduces the reference's composition and its product, rebranded for ${BRAND.name}. The product is the same physical item, so its form and pose are preserved — but every ${sourceLabel} mark, on the product and in the layout, is replaced with the AtlasAir logo. Do not reproduce ${sourceLabel}'s wordmark, logo symbol, brand colours or typefaces anywhere in the output, at any size, including in reflections, on packaging and in background detail. Render this as fresh photography of the product rather than a pasted-in copy of the reference image.`;

  return `
Create an ad creative for ${BRAND.name}, using the FIRST reference image as shown below.

⚠️ WHAT THIS TASK IS
${taskFraming}

REFERENCE IMAGES, IN ORDER:
${referenceList}

═══════════════════════════════
LAYOUT TO REBUILD
═══════════════════════════════
Ad format: ${analysis.adArchetype}
Composition: ${analysis.layout}
Reading order: ${analysis.visualHierarchy}
Type treatment: ${analysis.typographyStyle}
${fidelityLine}

${productSection}

${logoSection}

═══════════════════════════════
TEXT CONTENT
═══════════════════════════════
${
  keeps.length
    ? `KEEP these exactly as they appear — generic wording that belongs to the format, not to a brand (e.g. structural labels, and the call to action if the source has one):
${keeps.map((e) => `  • "${e.sourceText}" — ${e.role}`).join("\n")}`
    : "No generic text to keep."
}

${
  replacements.length
    ? `REPLACE these — render the AtlasAir content, never the source wording:
${replacements
  .map(
    (e) =>
      `  • ${e.role} — render: ${e.replacement ? `"${e.replacement}"` : "AtlasAir equivalent content"}`,
  )
  .join("\n")}`
    : "Nothing to replace."
}

${
  drops.length
    ? `OMIT ENTIRELY — these elements from the source must NOT appear in any form, reworded or otherwise. Remove them and rebalance the composition into the space they leave:
${drops.map((e) => `  • ${e.role} (${e.classification}) — ${e.reason}`).join("\n")}`
    : "Nothing to omit."
}

Product facts available ONLY for a text slot that already exists in the source layout (use these to fill a product-claim slot, invent nothing; do not add a slot that isn't there):
${product.features.map((f) => `  • ${f}`).join("\n") || `  • ${product.shortName}`}
${
  websiteOverride
    ? `\nWebsite — the source shows a web address, so render "${websiteOverride}" in its place, at the same size and position. If the source shows no web address, do not add one.`
    : "\nDo not add a website, a URL, or a call-to-action button that the source does not already contain. This is a remix, not a new ad — add nothing that wasn't there."
}

═══════════════════════════════
ABSOLUTE CONTENT RULES
═══════════════════════════════
• Render ONLY the text specified above. Do NOT invent any additional text.
• Add NO extras that the source does not have: no call-to-action button, no website or URL, no badges, no tagline, no strapline. If the source has none of these, neither does the remix.
• DO NOT render, under any circumstances, even if the reference image contains them:
  - statistics of any kind — lives saved, success rates, percentages, units sold, "trusted by N families"
  - star ratings, review counts, testimonials, customer names, quoted customers
  - certification marks, FDA/CE symbols, medical endorsements, "clinically proven", "doctor recommended", awards, press logos
  - countdowns, stock counters, "limited time", discount bursts or any urgency device
  - any comparison against another brand
• If a slot has no approved content, omit the element and rebalance the layout. An emptier, cleaner ad is the correct result. Never fill a gap with an invented substitute.
• SAFETY: ${BRAND.safetyDisclaimer} Render this as legible small print. Never depict a child in distress or a staged emergency. Never imply a guaranteed medical outcome — the product "helps dislodge a blockage".
• ZERO square brackets or placeholder text in the output.

═══════════════════════════════
FINAL CHECK BEFORE YOU OUTPUT
═══════════════════════════════
Scan the whole frame for any surviving ${sourceLabel} mark and remove it: on the device body, the grip, the mask, the case, any packaging or insert, in small print, in reflections, and in any blurred or partially cropped copy of the product. The only logo anywhere in the output is the AtlasAir logo from reference image 2.${
    hasProductImages
      ? ""
      : `
The product's shape must be unchanged from the reference — only its markings differ. If you find yourself redesigning the device, stop and reproduce the reference form instead.`
  }

${visualIdentityBlock(brandColors)}

The source palette was ${analysis.sourceColorScheme} — ignore it completely for layout, type and graphic elements; the output uses the AtlasAir palette above.${
    hasProductImages
      ? ""
      : " The PRODUCT itself keeps its own real material colours from the reference — recolouring the physical device to match the palette would misrepresent it."
  }

Aspect ratio: ${aspectRatio}.

WHAT THIS REMIX TAKES FROM THE REFERENCE: ${REMIX_SCOPE.takes.join("; ")}.
WHAT IT NEVER TAKES: ${REMIX_SCOPE.neverTakes.join("; ")}.
`.trim();
}
