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

    const prompt = `Create a high-converting, premium scientific infographic illustration for a health/wellness product advertisement. This image must make viewers feel hopeful, curious, and compelled to learn more about "${productTitle}".

BACKGROUND VISUAL: ${visualTheme}. Deep navy, midnight teal, or dark indigo palette. Photorealistic CGI biological visualization — rich detail, bioluminescent glow, subtle particle systems, cinematic depth of field. The biological scene should look alive and active, conveying transformation and renewal happening right now. No background text or watermarks.

PERSUASIVE DESIGN PRINCIPLES:
- The biological imagery must feel aspirational — viewers should think "this is what's happening inside me when I use this product"
- Use warm golden or amber accent lighting on key biological elements to suggest vitality, energy, and positive change
- The overall mood should be: scientific credibility + emotional hope + premium quality
- Composition should draw the eye from the step label → title → biology → description in a natural flow

TEXT OVERLAYS — crisp, clean sans-serif typography:

TOP: "${stepLabel}"
  - Small, wide-tracked uppercase, soft white or light teal, semi-transparent
  - Centered with generous top padding

CENTER-TOP: "${title}"
  - Large, bold, commanding white headline — the hero of the image
  - Slight warm glow or subtle gradient to make it pop
  - Should feel like a benefit promise, not just a label

CENTER: [the biological visualization — this is the emotional core of the image]
  - The most visually striking element; should feel cinematic and awe-inspiring

BOTTOM: "${description}"
  - Clean, readable white body text, slightly smaller
  - Centered with bottom padding
  - Reinforces the benefit shown in the biology above

OVERALL STYLE: Think premium supplement or biotech brand — the visual language of brands like AG1, Viome, or Thorne. Dark, cinematic, scientific credibility with emotional warmth. Every element should say "this product works and it's worth it." All text clearly legible with subtle drop shadow or glow.`;

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
