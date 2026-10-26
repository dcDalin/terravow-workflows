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

      // Replace placeholders with actual product details.
      //
      // Every fallback here is a factual product statement or an empty string.
      // Nothing invents a number, a rating, a customer count or a deadline —
      // an unfilled placeholder resolves to "" and the element is dropped from
      // the layout. See brand/atlasair.ts HONESTY_RULES.
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

      // Social proof is rendered only from real Judge.me data. No data, no element.
      const proof = originalInput.socialProof;
      const ratingText =
        proof?.ratingValue !== undefined && proof?.reviewCount !== undefined
          ? `${proof.ratingValue} stars from ${proof.reviewCount} Judge.me reviews`
          : proof?.ratingValue !== undefined
            ? `${proof.ratingValue} stars on Judge.me`
            : proof?.reviewCount !== undefined
              ? `${proof.reviewCount} Judge.me reviews`
              : "";
      const reviewCountText =
        proof?.reviewCount !== undefined ? String(proof.reviewCount) : "";
      const firstQuote = proof?.quotes?.[0];
      const quoteText = firstQuote?.text ?? "";
      const quoteName = firstQuote?.name ?? "";
      const quoteCredential = firstQuote?.verified ? "Verified purchase" : "";

      // Join non-empty features only, so a short feature list doesn't leave
      // dangling separators on the rendered creative.
      const joinFeatures = (...items: string[]) =>
        items.filter(Boolean).join(" · ");
      // An icon-and-label slot shows one real feature, or nothing at all.
      const featureIcon = (feature: string) =>
        feature ? `a simple line icon labelled "${feature}"` : "";

      // Brand palette, with optional per-run overrides.
      const primaryColor =
        originalInput.brandColors?.primary ?? BRAND.palette.primary;
      const accentColor =
        originalInput.brandColors?.accent ?? BRAND.palette.accent;

      // An array value fills repeated occurrences of the same placeholder in
      // order (e.g. three comparison rows), and "" once the array runs out.
      const replacements: Record<string, string | string[]> = {
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

        // Review and quote slots take VERBATIM Judge.me text or nothing at all.
        // They must never be filled with the brand's own marketing copy dressed
        // up as a customer's words.
        "[FULL QUOTE 2-3 sentences]": quoteText,
        "[FULL QUOTE]": quoteText,
        "[2-3 SENTENCE REVIEW]": quoteText,
        "[SHORT QUOTE]": quoteText,
        "[SHORT REVIEW QUOTE]": quoteText,
        "[PULL-QUOTE]": quoteText,
        "[HEADLINE QUOTE]": quoteText,
        "[PERSONAL RESULT]": quoteText,
        // The hook-quote layout splits one testimonial over three lines. The
        // verbatim quote goes in the dominant line; nothing is written around it.
        "[BAIT PHRASE]": quoteText,
        "[SETUP LINE]": "",
        "[REVEAL]": "",
        // A press quote AtlasAir has not received cannot be manufactured from a
        // brand message. No real press quote input exists, so this is always empty.
        "[PRESS QUOTE]": "",
        // Endorsements and guarantee seals AtlasAir has not earned or stated.
        "[TRUST BADGE]": "",
        "[BRAND ENDORSEMENT]": "",
        "[DISCLAIMER]": BRAND.safetyDisclaimer,

        // Offers and promotions — AtlasAir runs no manufactured urgency, so these
        // are stripped rather than filled with "LIMITED TIME OFFER".
        "[YOUR OFFER]": "",
        "[YOUR OFFER like YOUR FIRST MONTH FREE]": "",
        "[PROMO TEXT]": "",
        // No price is supplied on the run, so none is rendered.
        "[PRICE POINT]": "",

        // Statistic slots carry the product's own features instead of numbers.
        // AtlasAir publishes no customer counts, success rates or nutrition-style
        // figures, so the paired labels are dropped.
        "[STAT 1]": feature1,
        "[STAT 2]": feature2,
        "[STAT 3]": feature3,
        "[STAT 4]": feature4,
        "[LABEL]": "",
        "[EDUCATIONAL HOOK]": headline,
        "[WHY THIS PRODUCT]": feature1,
        "[ICON 1 + LABEL]": featureIcon(feature1),
        "[ICON 2 + LABEL]": featureIcon(feature2),
        "[ICON 3 + LABEL]": featureIcon(feature3),

        // Every product is a single variant, so colourway and variant slots
        // are stripped rather than inventing versions that don't exist.
        "[PRODUCT VARIANTS]": "",
        "[COLOR-CODED VARIANT]": "",
        "[COLOR 1]": "",
        "[COLOR 2]": "",
        "[COLOR 3]": "",

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

        // Comparison section. The honest comparison for this category is against
        // being unprepared — never against a named competitor's product, and never
        // with invented faults attributed to one.
        "[COMPETITOR CATEGORY]": "Being unprepared",
        "[WEAKNESS 1-4]":
          "Nothing in the house · Half-remembered training · Waiting on help · No plan",
        "[WEAKNESS 1-5]":
          "Nothing in the house · Half-remembered training · Waiting on help · No plan · Hoping it never happens",
        "[COMPETITOR PRODUCT]": "an empty kitchen drawer (being unprepared)",
        "[YOUR ADVANTAGE]": [feature1, feature2, feature3],
        "[COMPETITOR WEAKNESS]": [
          "Nothing in the house",
          "Half-remembered training",
          "Waiting on help",
        ],
        // Before/after shows preparation, never a result on a person's body.
        "[BEFORE LABEL]": "Before",
        "[AFTER LABEL]": "After",
        "[BEFORE STATE]": "an empty drawer: nothing to hand, no plan",
        "[AFTER STATE]": `${product.shortName} in the drawer, ready to use`,
        "[BEFORE DATE]": "",
        "[AFTER DATE]": "",
        "[HANDWRITTEN CTA]": subheadline,

        // Social proof — real Judge.me data only. Empty when none was supplied,
        // which strips the element from the layout entirely.
        "[SOCIAL PROOF]": ratingText,
        "[REVIEW COUNT]": reviewCountText,
        "[REVIEW TITLE]": quoteText ? headline : "",
        "[ATTRIBUTION]": quoteName ? `— ${quoteName}` : "",
        "[CREDENTIAL]": quoteCredential,
        "[VERIFIED BADGE TEXT]": quoteCredential,
        "[VERIFIED REVIEWER / VERIFIED BUYER]": quoteCredential,
        "[NAME]": quoteName,
        "[FIRST NAME + LAST INITIAL]": quoteName,
        "[STAR RATING]": ratingText,
        "[X]":
          proof?.ratingValue !== undefined ? String(proof.ratingValue) : "",
        "[REVIEWER NAME]": quoteName,
        "[VERIFIED ICON]": firstQuote?.verified ? "blue checkmark" : "",
        // Review UI details that would be invented: reviewer location, helpful
        // votes, highlighted phrases, social handles and post metrics.
        "[FLAG EMOJI]": "",
        "[FLAG EMOJI matching target market]": "",
        "[HELPFULNESS]": "",
        "[HELPFULNESS COUNT]": "",
        "[HIGHLIGHTED PHRASE 1]": "",
        "[HIGHLIGHTED PHRASE 2]": "",
        "[@HANDLE]": "",
        "[POST DETAILS]": "",
        "[TIMEFRAME]": "",

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

      // Add critical instructions about square brackets and brand honesty rules.
      //
      // The previous version of this block told the model to "invent a realistic,
      // brand-appropriate substitute" for any unfilled placeholder, with a fake
      // customer name as a worked example. For a child-safety product that is
      // exactly the failure mode the brand exists to avoid, so the instruction is
      // now inverted: omit, never invent.
      customizedPrompt += `\n\n⚠️ ABSOLUTE RULES — MUST FOLLOW:
• NEVER render any text in [SQUARE BRACKETS] literally in the image. Square brackets are ALWAYS instructions, never content.
• If a [PLACEHOLDER] was left empty or has no value, OMIT THAT ELEMENT ENTIRELY and rebalance the composition around it. Do NOT invent a substitute and do NOT render the brackets.
• DO NOT INVENT, under any circumstances:
  - star ratings, review counts, customer counts or "as seen in" logos
  - customer names, faces, testimonials, quotes or comment threads
  - certifications, medical endorsements, clinical claims, FDA references or awards
  - discounts, countdowns, stock levels, "limited time" or any other urgency device
  - statistics of any kind, including survival rates or response times
  An asset with fewer elements is CORRECT. An asset with invented elements is a failure.
• Correct behaviour:
  - empty [VERIFIED BADGE TEXT] → omit the badge completely
  - empty [SOCIAL PROOF] / [REVIEW COUNT] → omit the rating row and stars completely
  - empty [NAME] / [ATTRIBUTION] → omit the attribution line completely
  - empty quote → omit the entire quote block and use the space for the product
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
