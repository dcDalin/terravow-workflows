import { createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { resolve } from "path";
import {
  howItWorksStepSchema,
  stepImageOutputSchema,
} from "../../../schemas/how-it-works-types";
import { generateImageGeminiTool } from "../../../tools/generate-image-gemini";
import { uploadToSupabaseTool } from "../../../tools/upload-to-supabase";
import { writeFileTool } from "../../../tools/write-file";

/**
 * Step 2 (foreach): Generate and save a single how-it-works illustration
 * Each item is self-contained — designed for parallel execution via .foreach()
 */
export const generateHowItWorksImageStep = createStep({
  id: "generate-how-it-works-image",
  description:
    "Generate and save a single how-it-works scientific illustration using Gemini",
  inputSchema: howItWorksStepSchema.extend({
    productTitle: z.string(),
    aspectRatio: z
      .enum(["1:1", "9:16", "4:5", "3:4", "4:3"])
      .default("1:1"),
    imageSize: z.enum(["512", "1K", "2K", "4K"]).default("2K"),
    outputDirectory: z.string(),
    storageDestination: z.enum(["supabase", "local"]).default("supabase"),
  }),
  outputSchema: stepImageOutputSchema,
  execute: async ({ inputData, requestContext, mastra }) => {
    const {
      stepNumber,
      stepLabel,
      title,
      description,
      visualTheme,
      productTitle,
      aspectRatio,
      imageSize,
      outputDirectory,
      storageDestination,
    } = inputData;

    console.log(`🎨 Generating image for ${stepLabel}: "${title}"...`);

    const prompt = `Create a premium scientific infographic illustration in the style of a high-end pharmaceutical or nutraceutical advertisement.

BACKGROUND VISUAL: ${visualTheme}. Use a deep navy, midnight teal, or dark indigo color palette. Highly detailed photorealistic CGI biological visualization with bioluminescent glow effects, subtle particle systems, and cinematic depth of field. No background text or watermarks.

TEXT OVERLAYS — place these directly on the image in clean sans-serif typography:

TOP: "${stepLabel}"
  - Small, wide-tracked uppercase letters
  - Light teal or soft white color, semi-transparent
  - Centered near the top, with breathing room

MIDDLE: "${title}"
  - Large, bold, prominent white headline
  - The most visually dominant text element
  - Centered vertically

BOTTOM: "${description}"
  - Smaller white body text, elegant and readable
  - Centered near the bottom with padding

OVERALL STYLE: Premium health brand aesthetic — dark, cinematic, scientific. Think Apple product visuals but biological. Clean negative space, no clutter. All text must be clearly legible with subtle text shadow or glow for contrast.`;

    const result = await generateImageGeminiTool.execute!(
      {
        prompt,
        aspectRatio: aspectRatio as any,
        imageSize,
      },
      { requestContext, mastra },
    );

    if (!result || !("imageData" in result)) {
      throw new Error("Invalid result from image generation tool");
    }

    const timestamp = new Date().toISOString();

    let fileExtension = "png";
    let contentType = "image/png";
    const mimeMatch = result.imageData.match(/^data:image\/(\w+);base64,/);
    if (mimeMatch) {
      fileExtension = mimeMatch[1];
      contentType = `image/${fileExtension}`;
    }

    const sanitizedProduct = productTitle
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .toLowerCase();
    const fileName = `${sanitizedProduct}-step-${stepNumber}.${fileExtension}`;

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
      stepNumber,
      stepLabel,
      title,
      description,
      localPath: savedPath,
      generatedAt: timestamp,
      generationTime: result.generationTime,
      metadata: {
        productTitle,
        modelUsed: result.modelUsed,
        visualTheme,
      },
    };
  },
});
