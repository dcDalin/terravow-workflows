import { createStep } from "@mastra/core/workflows";
import { z } from "zod";
import {
  generateAdCreativesInputSchema,
  productAnalysisSchema,
  generationTaskSchema,
  customizedPromptSchema,
} from "../../schemas/ad-creatives-types";
import { getCreativeForPrompt } from "../../utils/prompt-creative-mapping";

/**
 * Step 4: Customize template prompts with product details
 */
export const customizePromptsStep = createStep({
  id: "customize-prompts",
  description: "Customize template prompts with product details",
  inputSchema: z.object({
    originalInput: generateAdCreativesInputSchema,
    logo: z.object({
      data: z.string(),
      mimeType: z.string(),
      originalSource: z.string(),
      filename: z.string(),
    }),
    productImages: z.array(
      z.object({
        data: z.string(),
        mimeType: z.string(),
        originalSource: z.string(),
        filename: z.string(),
      }),
    ),
    analysis: productAnalysisSchema,
    tasks: z.array(generationTaskSchema),
  }),
  outputSchema: z.object({
    originalInput: generateAdCreativesInputSchema,
    logo: z.object({
      data: z.string(),
      mimeType: z.string(),
      originalSource: z.string(),
      filename: z.string(),
    }),
    productImages: z.array(
      z.object({
        data: z.string(),
        mimeType: z.string(),
        originalSource: z.string(),
        filename: z.string(),
      }),
    ),
    analysis: productAnalysisSchema,
    customizedPrompts: z.array(customizedPromptSchema),
  }),
  execute: async ({ inputData }) => {
    console.log("✍️  Customizing prompts...");

    const { originalInput, analysis, tasks } = inputData;
    const customizedPrompts: z.infer<typeof customizedPromptSchema>[] = [];

    for (const task of tasks) {
      const templateInfo = getCreativeForPrompt(task.templateId);
      if (!templateInfo) {
        console.warn(`Template ${task.templateId} not found, skipping`);
        continue;
      }

      let customizedPrompt = templateInfo.prompt.promptText;

      // Replace placeholders with actual product details
      const productName = originalInput.productTitle;
      const headline = analysis.keyMessages[0] || productName;
      const subheadline = analysis.keyMessages[1] || "Transform your experience";
      const keyMessage3 = analysis.keyMessages[2] || headline;
      const feature1 = analysis.keyFeatures[0] || "Premium quality";
      const feature2 = analysis.keyFeatures[1] || "Proven results";
      const feature3 = analysis.keyFeatures[2] || "Customer satisfaction";
      const feature4 = analysis.keyFeatures[3] || "Trusted by thousands";
      const feature5 = analysis.keyFeatures[4] || "Money-back guarantee";
      const ctaText = originalInput.ctaText || "SHOP NOW";
      const reviewCount = originalInput.reviewCount || "10,000+";
      const socialProof = `Over ${reviewCount} Satisfied Customers`;

      const replacements: Record<string, string> = {
        // Product references
        "[YOUR PRODUCT]": productName,
        "[PRODUCT]": productName,
        "[BRAND]": productName,
        "[YOUR BRAND]": productName,

        // Headlines
        "[YOUR HEADLINE, under 10 words]": headline,
        "[YOUR HEADLINE]": headline,
        "[SHORT HEADLINE]": headline,
        "[SHORT QUOTE]": headline,
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
        "[FULL QUOTE 2-3 sentences]": `${feature1}. ${feature2}. ${subheadline}`,
        "[2-3 SENTENCE REVIEW]": `${feature1}. ${feature2}. ${subheadline}`,
        "[PRESS QUOTE]": keyMessage3,

        // Offers and promotions
        "[YOUR OFFER]": "LIMITED TIME OFFER",
        "[YOUR OFFER like YOUR FIRST MONTH FREE]": "LIMITED TIME OFFER",

        // CTA
        "[CTA]": ctaText,

        // Benefits / features
        "[BENEFIT 1]": feature1,
        "[BENEFIT 2]": feature2,
        "[BENEFIT 3]": feature3,
        "[BENEFIT 4]": feature4,
        "[BENEFIT 5]": feature5,
        "[BENEFIT 1-3]": `${feature1} · ${feature2} · ${feature3}`,
        "[BENEFIT 1-4]": `${feature1} · ${feature2} · ${feature3} · ${feature4}`,
        "[BENEFIT 1-5]": `${feature1} · ${feature2} · ${feature3} · ${feature4} · ${feature5}`,
        "[CALLOUT 1-4]": `${feature1} · ${feature2} · ${feature3} · ${feature4}`,
        "[VALUE ADDS]": `${feature1} · ${feature2} · ${feature3}`,
        "[STRENGTH 1-4]": `${feature1} · ${feature2} · ${feature3} · ${feature4}`,
        "[STRENGTH 1-5]": `${feature1} · ${feature2} · ${feature3} · ${feature4} · ${feature5}`,

        // Competitor section (generic safe defaults)
        "[COMPETITOR CATEGORY]": "Traditional alternatives",
        "[WEAKNESS 1-4]": "Ineffective · Overpriced · Artificial ingredients · No guarantee",
        "[WEAKNESS 1-5]": "Ineffective · Overpriced · Artificial ingredients · No guarantee · Poor support",

        // Social proof
        "[SOCIAL PROOF]": socialProof,
        "[REVIEW COUNT]": reviewCount,
        "[REVIEW TITLE]": headline,
        "[ATTRIBUTION]": "— Verified Customer",
        "[CREDENTIAL]": "Verified Buyer",
        "[VERIFIED BADGE TEXT]": "Verified Reviewer",
        "[TIMEFRAME]": "30 days",

        // Website
        "[WEBSITE]": originalInput.brandWebsite || "",

        // Strip pure layout/environment instructions (AI uses reference images for these)
        "[DETAILS]": "",
        "[BACKGROUND]": "",
        "[SURFACE]": "",
        "[SETTING]": "",
      };

      // Apply replacements with two-pass strategy:
      // Pass 1 — exact match: [KEYWORD]
      // Pass 2 — extended match: [KEYWORD — e.g. anything] (handles format added by prompt rewrite)
      for (const [placeholder, value] of Object.entries(replacements)) {
        // Pass 1: exact
        customizedPrompt = customizedPrompt.replace(
          new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
          value,
        );
        // Pass 2: same keyword with trailing " — e.g. ..." or " like ..."
        const keyword = placeholder.slice(1, -1); // strip [ and ]
        const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        customizedPrompt = customizedPrompt.replace(
          new RegExp(`\\[${escapedKeyword}\\s*(?:—\\s*e\\.g\\.|like)[^\\]]*\\]`, "g"),
          value,
        );
      }

      // Add critical instructions about square brackets
      customizedPrompt += `\n\n⚠️ ABSOLUTE RULES — MUST FOLLOW:
• NEVER render any text in [SQUARE BRACKETS] literally in the image. Square brackets are ALWAYS instructions, never content.
• EVERY remaining [PLACEHOLDER] in this prompt must be replaced with real, contextually appropriate content derived from the product info and reference images — or omitted entirely if not applicable.
• If a [PLACEHOLDER] has no clear replacement value, invent a realistic, brand-appropriate substitute. Do NOT leave it blank or render the brackets.
• VERIFIED examples of correct behavior:
  - [VERIFIED BADGE TEXT] → render as "Verified Reviewer" or "Verified Purchase"
  - [WEBSITE] → render as the brand's actual website URL or omit the element
  - [NAME] → render as a realistic customer first name like "Sarah K."
  - [STAT 1 like 20g] → render as a real stat relevant to this product
  - [BRAND COLOR] → use the brand's actual color from the reference images
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
