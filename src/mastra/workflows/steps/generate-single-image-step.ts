import { createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { creativeOutputSchema } from "../../schemas/ad-creatives-types";
import { generateImageGeminiTool } from "../../tools/generate-image-gemini";

/**
 * Step: Generate a single image
 * This step is designed to be used with .foreach() for parallel generation
 * Each input item must contain all data needed to generate one image
 */
export const generateSingleImageStep = createStep({
  id: "generate-single-image",
  description: "Generate a single ad creative image using Gemini",
  inputSchema: z.object({
    templateId: z.number(),
    templateName: z.string(),
    variationNumber: z.number(),
    prompt: z.string(),
    aspectRatio: z.string(),
    productTitle: z.string(),
    imageSize: z.enum(["512", "1K", "2K", "4K"]),
    referenceImages: z.array(
      z.object({
        data: z.string(),
        mimeType: z.string(),
      })
    ),
  }),
  outputSchema: creativeOutputSchema,
  execute: async ({ inputData, requestContext, mastra }) => {
    const {
      templateId,
      templateName,
      variationNumber,
      prompt,
      aspectRatio,
      productTitle,
      imageSize,
      referenceImages,
    } = inputData;

    console.log(
      `🎨 Generating image for ${templateName} variation ${variationNumber}...`
    );

    try {
      const result = await generateImageGeminiTool.execute!(
        {
          prompt,
          referenceImages,
          aspectRatio: aspectRatio as any,
          imageSize,
        },
        { requestContext, mastra }
      );

      // Type guard to ensure valid result
      if (!result || !("imageData" in result)) {
        throw new Error("Invalid result from image generation tool");
      }

      const timestamp = new Date().toISOString();
      const sanitizedTitle = productTitle
        .replace(/[^a-zA-Z0-9-_]/g, "-")
        .toLowerCase();

      return {
        templateId,
        templateName,
        variationNumber,
        imageData: result.imageData,
        localPath: `./output/${sanitizedTitle}/${templateName}-${variationNumber}.png`,
        prompt,
        aspectRatio,
        generatedAt: timestamp,
        generationTime: result.generationTime,
        metadata: {
          productTitle,
          modelUsed: result.modelUsed,
          templateCategory: "generated",
        },
      };
    } catch (error) {
      console.error(
        `❌ Failed to generate image for template ${templateId}:`,
        error instanceof Error ? error.message : error
      );
      throw error;
    }
  },
});
