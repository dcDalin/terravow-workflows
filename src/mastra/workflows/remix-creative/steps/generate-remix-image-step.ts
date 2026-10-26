import { createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { resolve } from "path";
import {
  elementPlanSchema,
  remixAspectRatioSchema,
  remixOutputSchema,
} from "../../../schemas/remix-creative-types";
import {
  generateImageGeminiTool,
  imageExtensionForMimeType,
} from "../../../tools/generate-image-gemini";
import { uploadToSupabaseTool } from "../../../tools/upload-to-supabase";
import { writeFileTool } from "../../../tools/write-file";

/**
 * Step 3 (foreach): Generate and save one remix.
 *
 * Self-contained for parallel execution. Reference images are fetched here from
 * URLs rather than carried through workflow state, matching the approach in
 * generate-single-image-step — base64 in step output bloats LibSQL snapshots.
 *
 * Reference order matters and is relied on by the prompt: the layout reference
 * comes first, then the AtlasAir logo, then AtlasAir product photography.
 */
export const generateRemixImageStep = createStep({
  id: "generate-remix-image",
  description:
    "Generate and save a single remixed AtlasAir creative using Gemini",
  inputSchema: z.object({
    sourceUrl: z.string(),
    sourceIndex: z.number(),
    variationNumber: z.number(),
    prompt: z.string(),
    aspectRatio: remixAspectRatioSchema,
    adArchetype: z.string(),
    elementPlan: z.array(elementPlanSchema),
    productTitle: z.string(),
    imageSize: z.enum(["512", "1K", "2K", "4K"]),
    outputDirectory: z.string(),
    storageDestination: z.enum(["supabase", "local"]).default("supabase"),
    /** [layout reference, AtlasAir logo, ...AtlasAir product images] */
    referenceImageUrls: z.array(z.string()),
  }),
  outputSchema: remixOutputSchema,
  execute: async ({ inputData, requestContext, mastra }) => {
    const {
      sourceUrl,
      sourceIndex,
      variationNumber,
      prompt,
      aspectRatio,
      adArchetype,
      elementPlan,
      productTitle,
      imageSize,
      outputDirectory,
      storageDestination,
      referenceImageUrls,
    } = inputData;

    console.log(
      `🎨 Remixing source ${sourceIndex + 1} (${adArchetype}) variation ${variationNumber}...`,
    );

    // Browser-like headers — many CDNs reject plain server-side fetches.
    const referenceImages = await Promise.all(
      referenceImageUrls.map(async (url) => {
        const resp = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; AtlasAir/1.0)",
            Accept: "image/webp,image/png,image/jpeg,image/*,*/*;q=0.8",
          },
        });
        if (!resp.ok) {
          throw new Error(
            `Failed to fetch reference image (${resp.status}): ${url}`,
          );
        }
        const buffer = await resp.arrayBuffer();
        const mimeType = resp.headers.get("content-type") || "image/png";
        return { data: Buffer.from(buffer).toString("base64"), mimeType };
      }),
    );

    try {
      const result = await generateImageGeminiTool.execute!(
        {
          prompt,
          referenceImages,
          aspectRatio: aspectRatio as any,
          imageSize,
        },
        { requestContext, mastra },
      );

      if (!result || !("imageData" in result)) {
        throw new Error("Invalid result from image generation tool");
      }

      const timestamp = new Date().toISOString();

      // Gemini returns raw base64; the format comes from its reported MIME type
      const contentType = result.mimeType || "image/png";
      const fileExtension = imageExtensionForMimeType(contentType);

      const sanitizedProduct = productTitle
        .replace(/[^a-zA-Z0-9-_]/g, "-")
        .toLowerCase();
      const fileName = `${sanitizedProduct}-remix-${sourceIndex + 1}-v${variationNumber}.${fileExtension}`;

      let savedPath: string;

      if (storageDestination === "local") {
        const absolutePath = resolve(outputDirectory, fileName);
        const writeResult = await writeFileTool.execute!(
          {
            filePath: absolutePath,
            content: result.imageData,
            encoding: "base64",
            createDirectories: true,
          },
          { requestContext, mastra },
        );

        if (
          !writeResult ||
          !("success" in writeResult) ||
          !writeResult.success
        ) {
          const msg =
            writeResult && "message" in writeResult
              ? writeResult.message
              : "Unknown error";
          throw new Error(`Failed to save file locally: ${msg}`);
        }

        console.log(`  ✓ Saved locally: ${absolutePath}`);
        savedPath = absolutePath;
      } else {
        const folderPath = outputDirectory.split("/").slice(-2).join("/");
        const storagePath = `${folderPath}/${fileName}`;

        const uploadResult = await uploadToSupabaseTool.execute!(
          {
            filePath: storagePath,
            content: result.imageData,
            contentType,
            isBase64: true,
          },
          { requestContext, mastra },
        );

        if (!uploadResult || !("success" in uploadResult)) {
          throw new Error("Invalid result from upload tool");
        }

        if (!uploadResult.success || !uploadResult.publicUrl) {
          throw new Error(
            `Failed to upload to Supabase: ${uploadResult.error || "Unknown error"}`,
          );
        }

        console.log(`  ✓ Uploaded: ${fileName} -> ${uploadResult.publicUrl}`);
        savedPath = uploadResult.publicUrl;
      }

      return {
        sourceUrl,
        sourceIndex,
        variationNumber,
        adArchetype,
        localPath: savedPath,
        prompt,
        aspectRatio,
        generatedAt: timestamp,
        generationTime: result.generationTime,
        elementPlan,
        metadata: {
          productTitle,
          modelUsed: result.modelUsed,
        },
      };
    } catch (error) {
      console.error(
        `❌ Failed to generate remix for source ${sourceIndex + 1}:`,
        error instanceof Error ? error.message : error,
      );
      throw error;
    }
  },
});
