import { createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { creativeOutputSchema } from "../../schemas/ad-creatives-types";
import { generateImageGeminiTool } from "../../tools/generate-image-gemini";
import { uploadToSupabaseTool } from "../../tools/upload-to-supabase";

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
      let contentType = "image/png";
      const mimeMatch = result.imageData.match(/^data:image\/(\w+);base64,/);
      if (mimeMatch) {
        fileExtension = mimeMatch[1];
        contentType = `image/${fileExtension}`;
      }

      // Generate filename and Supabase storage path
      const fileName = `${templateName.replace(/[^a-zA-Z0-9-_]/g, "-")}-v${variationNumber}.${fileExtension}`;
      // Extract the folder name from outputDirectory (e.g., "product-name/timestamp")
      const folderPath = outputDirectory.split('/').slice(-2).join('/');
      const storagePath = `${folderPath}/${fileName}`;

      // Upload to Supabase Storage
      const uploadResult = await uploadToSupabaseTool.execute!(
        {
          filePath: storagePath,
          content: result.imageData,
          contentType,
          isBase64: true,
        },
        { requestContext, mastra }
      );

      // Type guard for upload result
      if (!uploadResult || !("success" in uploadResult)) {
        throw new Error("Invalid result from upload tool");
      }

      if (!uploadResult.success || !uploadResult.publicUrl) {
        throw new Error(
          `Failed to upload to Supabase: ${uploadResult.error || "Unknown error"}`
        );
      }

      console.log(`  ✓ Uploaded: ${fileName} -> ${uploadResult.publicUrl}`);

      // Return creative with Supabase URL
      return {
        templateId,
        templateName,
        variationNumber,
        localPath: uploadResult.publicUrl, // Use publicUrl as localPath for backwards compatibility
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
        `❌ Failed to generate/upload image for template ${templateId}:`,
        error instanceof Error ? error.message : error
      );
      throw error;
    }
  },
});
