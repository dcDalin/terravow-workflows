import { createStep } from "@mastra/core/workflows";
import { z } from "zod";
import {
  generateAdCreativesInputSchema,
  customizedPromptSchema,
  creativeOutputSchema,
} from "../../schemas/ad-creatives-types";

/**
 * Step 5: Generate ad creative images (PLACEHOLDER)
 * TODO: Implement actual image generation when ready
 */
export const generateImagesStep = createStep({
  id: "generate-images",
  description: "Generate ad creative images (placeholder)",
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
    analysis: z.any(), // productAnalysisSchema - using any to avoid circular dependency
    customizedPrompts: z.array(customizedPromptSchema),
  }),
  outputSchema: z.object({
    originalInput: generateAdCreativesInputSchema,
    creatives: z.array(creativeOutputSchema),
  }),
  execute: async ({ inputData }) => {
    console.log("🎨 Generating images (placeholder)...");

    const { originalInput, customizedPrompts } = inputData;

    // PLACEHOLDER: Return mock creatives
    // In the future, this will call an actual image generation tool/service
    const creatives: z.infer<typeof creativeOutputSchema>[] = customizedPrompts.map(
      (prompt) => {
        const timestamp = new Date().toISOString();
        const sanitizedTitle = originalInput.productTitle
          .replace(/[^a-zA-Z0-9-_]/g, "-")
          .toLowerCase();

        return {
          templateId: prompt.templateId,
          templateName: prompt.templateName,
          variationNumber: prompt.variationNumber,
          localPath: `/placeholder/${sanitizedTitle}/${prompt.templateName}-${prompt.variationNumber}.png`,
          prompt: prompt.prompt,
          aspectRatio: prompt.aspectRatio,
          generatedAt: timestamp,
          generationTime: 0,
          metadata: {
            productTitle: originalInput.productTitle,
            modelUsed: "placeholder-model",
            templateCategory: "placeholder",
          },
        };
      },
    );

    console.log(`✅ [PLACEHOLDER] Created ${creatives.length} mock creatives`);
    console.log(
      "   Note: This is placeholder data. Real image generation will be implemented later.",
    );

    return {
      originalInput: inputData.originalInput,
      creatives,
    };
  },
});
