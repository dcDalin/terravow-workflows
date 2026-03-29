import { createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { creativeOutputSchema } from "../../schemas/ad-creatives-types";
import { generateImageGeminiTool } from "../../tools/generate-image-gemini";

/**
 * Step: Generate and save a single image
 * This step is designed to be used with .foreach() for parallel generation
 * Each input item must contain all data needed to generate and save one image
 * Files are saved immediately after generation to reduce memory usage
 */
export const generateSingleImageStep = createStep({
  id: "generate-single-image",
  description: "Generate and save a single ad creative image using Gemini",
  inputSchema: z.object({
    templateId: z.number(),
    templateName: z.string(),
    variationNumber: z.number(),
    prompt: z.string(),
    aspectRatio: z.string(),
    productTitle: z.string(),
    imageSize: z.enum(["512", "1K", "2K", "4K"]),
    outputDirectory: z.string(),
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
      outputDirectory,
      referenceImages,
    } = inputData;

    console.log(
      `🎨 Generating image for ${templateName} variation ${variationNumber}...`
    );

    try {
      // Generate the image
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

      // Extract file extension from mime type or default to png
      let fileExtension = "png";
      const mimeMatch = result.imageData.match(/^data:image\/(\w+);base64,/);
      if (mimeMatch) {
        fileExtension = mimeMatch[1];
      }

      // Generate filename and path
      const fileName = `${templateName.replace(/[^a-zA-Z0-9-_]/g, "-")}-v${variationNumber}.${fileExtension}`;
      const filePath = join(outputDirectory, fileName);

      // Ensure output directory exists
      await mkdir(outputDirectory, { recursive: true });

      // Save the image immediately
      const base64Data = result.imageData.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      await writeFile(filePath, buffer);

      console.log(`  ✓ Saved: ${fileName}`);

      // Return creative without imageData to save memory
      return {
        templateId,
        templateName,
        variationNumber,
        localPath: filePath,
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
        `❌ Failed to generate/save image for template ${templateId}:`,
        error instanceof Error ? error.message : error
      );
      throw error;
    }
  },
});
