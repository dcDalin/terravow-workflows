import { createStep } from "@mastra/core/workflows";
import { z } from "zod";
import {
  generateAdCreativesInputSchema,
  productAnalysisSchema,
  generationTaskSchema,
  customizedPromptSchema,
  processedImageRefSchema,
} from "../../../schemas/ad-creatives-types";
import { getCreativeForPrompt } from "../../../utils/prompt-creative-mapping";
import { BRAND } from "../../../brand/atlasair";
import { resolveProduct } from "../../../brand/products";
import { visualIdentityBlock } from "../../../brand/prompt-blocks";

/**
 * Step 4: Customize template prompts with product details
 */
export const customizePromptsStep = createStep({
  id: "customize-prompts",
  description: "Customize template prompts with product details",
  inputSchema: z.object({
    originalInput: generateAdCreativesInputSchema,
    logo: processedImageRefSchema,
    productImages: z.array(processedImageRefSchema),
    analysis: productAnalysisSchema,
    tasks: z.array(generationTaskSchema),
  }),
  outputSchema: z.object({
    originalInput: generateAdCreativesInputSchema,
    logo: processedImageRefSchema,
    productImages: z.array(processedImageRefSchema),
    analysis: productAnalysisSchema,
    customizedPrompts: z.array(customizedPromptSchema),
  }),
  execute: async ({ inputData }) => {
    console.log("✍️  Customizing prompts...");

    const { originalInput, analysis, tasks } = inputData;
    const product = resolveProduct(originalInput);
    const customizedPrompts: z.infer<typeof customizedPromptSchema>[] = [];

    for (const task of tasks) {
      const templateInfo = getCreativeForPrompt(task.templateId);
      if (!templateInfo) {
        console.warn(`Template ${task.templateId} not found, skipping`);
        continue;
      }

      let customizedPrompt = templateInfo.prompt.promptText;

      // Replace placeholders with what the run supplies: product details, brand
      // colours, and Judge.me data when given. Anything still in brackets is
      // filled by the image model from context (see the rules appended below).
      const productName = product.title;
      const headline = analysis.keyMessages[0] || productName;
      const subheadline = analysis.keyMessages[1] || BRAND.tagline;
      const keyMessage3 = analysis.keyMessages[2] || headline;
      const features = analysis.keyFeatures.length
        ? analysis.keyFeatures
        : product.features;
      const [
        feature1 = "",
        feature2 = "",
        feature3 = "",
        feature4 = "",
        feature5 = "",
      ] = features;
      const ctaText = originalInput.ctaText || "SHOP NOW";

      // Judge.me data, when supplied, fills the rating and review slots.
      // Undefined values are skipped, leaving the slot for the image model.
      const proof = originalInput.socialProof;
      const ratingText =
        proof?.ratingValue !== undefined && proof?.reviewCount !== undefined
          ? `${proof.ratingValue} stars from ${proof.reviewCount} Judge.me reviews`
          : proof?.ratingValue !== undefined
            ? `${proof.ratingValue} stars on Judge.me`
            : proof?.reviewCount !== undefined
              ? `${proof.reviewCount} Judge.me reviews`
              : undefined;
      const reviewCountText =
        proof?.reviewCount !== undefined
          ? String(proof.reviewCount)
          : undefined;
      const firstQuote = proof?.quotes?.[0];
      const quoteText = firstQuote?.text;
      const quoteName = firstQuote?.name;
      const quoteCredential = firstQuote?.verified
        ? "Verified purchase"
        : undefined;

      // Join non-empty features only, so a short feature list doesn't leave
      // dangling separators on the rendered creative.
      const joinFeatures = (...items: string[]) =>
        items.filter(Boolean).join(" · ");
      // An icon-and-label slot shows one product feature.
      const featureIcon = (feature: string) =>
        feature ? `a simple line icon labelled "${feature}"` : undefined;

      // Brand palette, with optional per-run overrides.
      const primaryColor =
        originalInput.brandColors?.primary ?? BRAND.palette.primary;
      const accentColor =
        originalInput.brandColors?.accent ?? BRAND.palette.accent;

      // An array value fills repeated occurrences of the same placeholder in
      // order (e.g. three comparison rows), and "" once the array runs out.
      // An undefined value leaves the placeholder for the image model to fill.
      const replacements: Record<string, string | string[] | undefined> = {
        // Product references
        "[YOUR PRODUCT]": productName,
        "[PRODUCT]": productName,
        "[BRAND]": productName,
        "[YOUR BRAND]": productName,

        // Headlines
        "[YOUR HEADLINE, under 10 words]": headline,
        "[YOUR HEADLINE]": headline,
        "[SHORT HEADLINE]": headline,
        "[HEADLINE]": headline,
        "[HOOK HEADLINE]": headline,
        "[ENDORSEMENT HEADLINE]": headline,
        "[SUPERLATIVE CLAIM]": headline,
        "[PROVOCATIVE HEADLINE]": headline,
        "[BENEFIT STATEMENT]": headline,
        "[VALUE PROP]": subheadline,

        // Subheadlines and descriptions
        "[YOUR SUBHEAD, one sentence]": subheadline,
        "[SUBHEADLINE]": subheadline,
        "[OFFER DETAILS]": subheadline,

        // Review and quote slots take the Judge.me review when one is supplied.
        "[FULL QUOTE 2-3 sentences]": quoteText,
        "[FULL QUOTE]": quoteText,
        "[2-3 SENTENCE REVIEW]": quoteText,
        "[SHORT QUOTE]": quoteText,
        "[SHORT REVIEW QUOTE]": quoteText,
        "[PULL-QUOTE]": quoteText,
        "[HEADLINE QUOTE]": quoteText,
        "[DISCLAIMER]": BRAND.safetyDisclaimer,

        // Feature slots carry the product's own features.
        "[WHY THIS PRODUCT]": feature1,
        "[ICON 1 + LABEL]": featureIcon(feature1),
        "[ICON 2 + LABEL]": featureIcon(feature2),
        "[ICON 3 + LABEL]": featureIcon(feature3),

        // Never a person in distress: the "problem" is shown as the calm moment
        // the product is kept ready for.
        "[PROBLEM VISUAL]":
          "an ordinary, calm moment at home: a family meal at the kitchen table, nobody in distress",

        // CTA
        "[CTA]": ctaText,

        // Benefits / features
        "[BENEFIT 1]": feature1,
        "[BENEFIT 2]": feature2,
        "[BENEFIT 3]": feature3,
        "[BENEFIT 4]": feature4,
        "[BENEFIT 5]": feature5,
        "[BENEFIT 1-3]": joinFeatures(feature1, feature2, feature3),
        "[BENEFIT 1-4]": joinFeatures(feature1, feature2, feature3, feature4),
        "[BENEFIT 1-5]": joinFeatures(
          feature1,
          feature2,
          feature3,
          feature4,
          feature5,
        ),
        "[CALLOUT 1-4]": joinFeatures(feature1, feature2, feature3, feature4),
        "[VALUE ADDS]": joinFeatures(feature1, feature2, feature3),
        "[STRENGTH 1-4]": joinFeatures(feature1, feature2, feature3, feature4),
        "[STRENGTH 1-5]": joinFeatures(
          feature1,
          feature2,
          feature3,
          feature4,
          feature5,
        ),

        // Comparison rows lead with the product's own features.
        "[YOUR ADVANTAGE]": [feature1, feature2, feature3],
        // Before/after shows preparation, never a person in distress.
        "[BEFORE LABEL]": "Before",
        "[AFTER LABEL]": "After",
        "[BEFORE STATE]": "an empty drawer: nothing to hand, no plan",
        "[AFTER STATE]": `${product.shortName} in the drawer, ready to use`,
        "[HANDWRITTEN CTA]": subheadline,

        // Social proof from Judge.me, when supplied.
        "[SOCIAL PROOF]": ratingText,
        "[REVIEW COUNT]": reviewCountText,
        "[REVIEW TITLE]": quoteText ? headline : undefined,
        "[ATTRIBUTION]": quoteName ? `— ${quoteName}` : undefined,
        "[CREDENTIAL]": quoteCredential,
        "[VERIFIED BADGE TEXT]": quoteCredential,
        "[VERIFIED REVIEWER / VERIFIED BUYER]": quoteCredential,
        "[NAME]": quoteName,
        "[FIRST NAME + LAST INITIAL]": quoteName,
        "[STAR RATING]": ratingText,
        "[X]":
          proof?.ratingValue !== undefined
            ? String(proof.ratingValue)
            : undefined,
        "[REVIEWER NAME]": quoteName,
        "[VERIFIED ICON]": firstQuote?.verified ? "blue checkmark" : undefined,

        // Brand colours — resolved from the AtlasAir palette, with per-run
        // overrides. Previously these fell through to the image model, which
        // meant every batch invented its own approximation of the brand.
        "[BRAND COLOR]": primaryColor,
        "[PRIMARY BRAND COLOR]": primaryColor,
        "[BRAND COLOUR]": primaryColor,
        "[ACCENT COLOR]": accentColor,
        "[LOGO COLOR]": BRAND.palette.foreground,
        "[CONTRAST COLOR]": BRAND.palette.background,
        "[CONTRAST TEXT]": BRAND.palette.background,

        // Website
        "[WEBSITE]": originalInput.brandWebsite || BRAND.website,

        // Strip pure layout/environment instructions (AI uses reference images for these)
        "[DETAILS]": "",
        "[BACKGROUND]": "",
        "[SURFACE]": "",
        "[SETTING]": "",
      };

      // Apply replacements. Each key matches its exact form, [KEYWORD], and the
      // same keyword followed by an example or a description:
      // [KEYWORD — e.g. …], [KEYWORD — the most…], [KEYWORD, 3-5 sentences],
      // [KEYWORD like …]. A replacer function keeps "$" in values literal.
      for (const [placeholder, value] of Object.entries(replacements)) {
        if (value === undefined) continue;
        const keyword = placeholder
          .slice(1, -1) // strip [ and ]
          .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        let occurrence = 0;
        customizedPrompt = customizedPrompt.replace(
          new RegExp(
            `\\[${keyword}(?:\\s*—[^\\]]*|\\s*,[^\\]]*|\\s+like\\b[^\\]]*)?\\]`,
            "g",
          ),
          () => (Array.isArray(value) ? (value[occurrence++] ?? "") : value),
        );
      }

      // Brand visual system — palette, type and shape, so every batch renders as
      // the same brand rather than the model's guess at it.
      customizedPrompt += `\n\n${visualIdentityBlock(originalInput.brandColors)}`;

      // Instructions about square brackets, the placeholders left for the
      // model, and the safety rules.
      customizedPrompt += `\n\n⚠️ ABSOLUTE RULES — MUST FOLLOW:
• NEVER render any text in [SQUARE BRACKETS] literally in the image. Square brackets are ALWAYS instructions, never content.
• EVERY remaining [PLACEHOLDER] must be replaced with real, contextually appropriate content for this product, derived from the product info and reference images, or omitted if not applicable.
• If a [PLACEHOLDER] has no clear replacement value, write a realistic, brand-appropriate substitute. The "e.g." examples come from other product categories: write the equivalent for this product, never the example itself.
• Examples of correct behaviour:
  - [VERIFIED BADGE TEXT] → "Verified Purchase"
  - [NAME] → a realistic customer first name and last initial, like "Sarah K."
  - [STAT 1 — e.g. 20g] → a stat relevant to this product, not the example
  - [BRAND COLOR] → use the brand's actual colour from the reference images
• SAFETY — this is a child-safety product: ${BRAND.safetyDisclaimer} Render this as small print somewhere legible on the creative. Never depict a child in visible distress or a staged emergency. Never imply a guaranteed medical outcome.
• ZERO square brackets should be visible anywhere in the final image. If you see a bracket in your output, you have made an error.`;

      // Add variation modifier for non-first variations
      if (task.variationNumber > 1) {
        customizedPrompt += `\n\nVariation ${task.variationNumber}: Apply slight creative differences while maintaining the core concept (e.g., different angle, color palette variation, or layout adjustment).`;
      }

      customizedPrompts.push({
        templateId: task.templateId,
        templateName: task.templateName,
        variationNumber: task.variationNumber,
        prompt: customizedPrompt,
        aspectRatio: task.aspectRatio,
      });
    }

    if (customizedPrompts.length === 0) {
      throw new Error("Failed to customize any prompts");
    }

    console.log(`✅ Customized ${customizedPrompts.length} prompts`);

    return {
      originalInput: inputData.originalInput,
      logo: inputData.logo,
      productImages: inputData.productImages,
      analysis: inputData.analysis,
      customizedPrompts,
    };
  },
});
