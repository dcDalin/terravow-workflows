import { createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { resolve } from "path";
import { creativeOutputSchema } from "../../../schemas/ad-creatives-types";
import { generateImageGeminiTool } from "../../../tools/generate-image-gemini";
import { uploadToSupabaseTool } from "../../../tools/upload-to-supabase";
import { writeFileTool } from "../../../tools/write-file";

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
    storageDestination: z.enum(["supabase", "local"]).default("supabase"),
    // URLs only — base64 is fetched fresh here to keep workflow snapshots lean
    referenceImageUrls: z.array(z.string()),
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
      storageDestination,
      referenceImageUrls,
    } = inputData;

    // Fetch reference images fresh — not stored in workflow state to keep snapshots lean.
    // Browser-like headers are required since many hosts block plain server-side fetches.
    const referenceImages = await Promise.all(
      referenceImageUrls.map(async (url) => {
        const resp = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; TerraVow/1.0)",
            "Accept": "image/webp,image/png,image/jpeg,image/*,*/*;q=0.8",
          },
        });
        if (!resp.ok) throw new Error(`Failed to fetch reference image (${resp.status}): ${url}`);
        const buffer = await resp.arrayBuffer();
        const mimeType = resp.headers.get("content-type") || "image/png";
        return { data: Buffer.from(buffer).toString("base64"), mimeType };
      })
    );

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

      // Generate filename
      const sanitizedProduct = productTitle.replace(/[^a-zA-Z0-9-_]/g, "-").toLowerCase();
      const sanitizedTemplate = templateName.replace(/[^a-zA-Z0-9-_]/g, "-");
      const fileName = `${sanitizedProduct}-${sanitizedTemplate}-v${variationNumber}.${fileExtension}`;

      let savedPath: string;

      if (storageDestination === "local") {
        // Save to local filesystem
        const absolutePath = resolve(outputDirectory, fileName);
        const writeResult = await writeFileTool.execute!(
          {
            filePath: absolutePath,
            content: result.imageData,
            encoding: "base64",
            createDirectories: true,
          },
          { requestContext, mastra }
        );

        if (!writeResult || !("success" in writeResult) || !writeResult.success) {
          const msg = writeResult && "message" in writeResult ? writeResult.message : "Unknown error";
          throw new Error(`Failed to save file locally: ${msg}`);
        }

        console.log(`  ✓ Saved locally: ${absolutePath}`);
        savedPath = absolutePath;
      } else {
        // Upload to Supabase Storage
        // Extract the folder name from outputDirectory (e.g., "product-name/timestamp")
        const folderPath = outputDirectory.split('/').slice(-2).join('/');
        const storagePath = `${folderPath}/${fileName}`;

        const uploadResult = await uploadToSupabaseTool.execute!(
          {
            filePath: storagePath,
            content: result.imageData,
            contentType,
            isBase64: true,
          },
          { requestContext, mastra }
        );

        if (!uploadResult || !("success" in uploadResult)) {
          throw new Error("Invalid result from upload tool");
        }

        if (!uploadResult.success || !uploadResult.publicUrl) {
          throw new Error(
            `Failed to upload to Supabase: ${uploadResult.error || "Unknown error"}`
          );
        }

        console.log(`  ✓ Uploaded: ${fileName} -> ${uploadResult.publicUrl}`);
        savedPath = uploadResult.publicUrl;
      }

      return {
        templateId,
        templateName,
        variationNumber,
        localPath: savedPath,
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
