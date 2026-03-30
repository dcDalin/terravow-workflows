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
      const feature1 = analysis.keyFeatures[0] || "Premium quality";
      const feature2 = analysis.keyFeatures[1] || "Proven results";
      const feature3 = analysis.keyFeatures[2] || "Customer satisfaction";

      const replacements: Record<string, string> = {
        // Product references
        "[YOUR PRODUCT]": productName,
        "[PRODUCT]": productName,
        "[BRAND]": productName,
        "[YOUR BRAND]": productName,

        // Headlines
        "[YOUR HEADLINE, under 10 words]": headline,
        "[SHORT HEADLINE]": headline,
        "[YOUR HEADLINE]": headline,
        "[SHORT QUOTE]": headline,
        "[HEADLINE]": headline,

        // Subheadlines and descriptions
        "[YOUR SUBHEAD, one sentence]": subheadline,
        "[SUBHEADLINE]": subheadline,

        // Offers and promotions
        "[YOUR OFFER like YOUR FIRST MONTH FREE]": "LIMITED TIME OFFER",
        "[OFFER DETAILS]": subheadline,

        // Benefits/Features (use key features from analysis)
        "[BENEFIT 1]": feature1,
        "[BENEFIT 2]": feature2,
        "[BENEFIT 3]": feature3,
        "[BENEFIT 1-3]": `${feature1}, ${feature2}, ${feature3}`,
        "[BENEFIT 1-4]": `${feature1}, ${feature2}, ${feature3}`,
        "[BENEFIT 1-5]": `${feature1}, ${feature2}, ${feature3}`,

        // Website (use generic for now - AI should infer from context)
        "[WEBSITE]": "www.example.com",

        // Remove common instruction placeholders that AI should interpret
        "[DETAILS]": "",
        "[BACKGROUND]": "",
        "[SURFACE]": "",
        "[SETTING]": "",
      };

      // Apply replacements
      for (const [placeholder, value] of Object.entries(replacements)) {
        customizedPrompt = customizedPrompt.replace(
          new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
          value,
        );
      }

      // Add critical instructions about square brackets
      customizedPrompt += `\n\n⚠️ CRITICAL INSTRUCTIONS:
• All text in [SQUARE BRACKETS] are INSTRUCTIONS for what to create - DO NOT render them literally in the image
• Replace bracketed placeholders with appropriate actual content based on the product information and reference images
• Example: [VERIFIED BADGE TEXT] means "create verified badge text like 'Verified Reviewer'" - NOT literally "[VERIFIED BADGE TEXT]"
• Example: [WEBSITE] means "show a website URL" - NOT literally "[WEBSITE]"
• Example: [- Sarah J., Verified Buyer] means "create a customer name and attribution" - NOT literally "[- Sarah J., Verified Buyer]"
• Make all text in the image look professional and realistic - NO square brackets should appear in the final image`;

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
