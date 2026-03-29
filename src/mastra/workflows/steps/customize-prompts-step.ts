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
      const replacements: Record<string, string> = {
        "[YOUR PRODUCT]": originalInput.productTitle,
        "[PRODUCT]": originalInput.productTitle,
        "[BRAND]": originalInput.productTitle,
        "[YOUR BRAND]": originalInput.productTitle,
        "[YOUR HEADLINE, under 10 words]":
          analysis.keyMessages[0] || originalInput.productTitle,
        "[SHORT HEADLINE]":
          analysis.keyMessages[0] || originalInput.productTitle,
        "[YOUR OFFER like YOUR FIRST MONTH FREE]": "LIMITED TIME OFFER",
        "[OFFER DETAILS]": analysis.keyMessages[1] || "Special offer available now",
        "[YOUR HEADLINE]": analysis.keyMessages[0] || originalInput.productTitle,
        "[SHORT QUOTE]": analysis.keyMessages[0] || originalInput.productTitle,
      };

      // Apply replacements
      for (const [placeholder, value] of Object.entries(replacements)) {
        customizedPrompt = customizedPrompt.replace(
          new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
          value,
        );
      }

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
