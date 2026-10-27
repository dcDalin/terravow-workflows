import { createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { resolve } from "path";
import {
  howItWorksStepSchema,
  stepImageOutputSchema,
} from "../../../schemas/how-it-works-types";
import {
  generateImageGeminiTool,
  imageExtensionForMimeType,
} from "../../../tools/generate-image-gemini";
import { uploadToSupabaseTool } from "../../../tools/upload-to-supabase";
import { writeFileTool } from "../../../tools/write-file";
import { BRAND } from "../../../brand/atlasair";
import { visualIdentityBlock } from "../../../brand/prompt-blocks";

/**
 * Step 2 (foreach): Generate and save a single how-it-works illustration
 * Each item is self-contained — designed for parallel execution via .foreach()
 */
export const generateHowItWorksImageStep = createStep({
  id: "generate-how-it-works-image",
  description:
    "Generate and save a single how-it-works instructional illustration using Gemini",
  inputSchema: howItWorksStepSchema.extend({
    productTitle: z.string(),
    aspectRatio: z.enum(["1:1", "9:16", "4:5", "3:4", "4:3"]).default("1:1"),
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

    const prompt = `Create a clear, calm instructional illustration for a step in the "How It Works" sequence for "${productTitle}", a home emergency-preparedness product from ${BRAND.name}.

THIS IMAGE IS AN INSTRUCTION FIRST AND AN ADVERT SECOND. Someone may look at it while frightened, or recall it months later under pressure. Clarity beats drama at every decision.

MAIN VISUAL: ${visualTheme}
  - Either a clean flat medical illustration (uncluttered, clearly labelled shapes, readable at a glance) or a realistic calm domestic scene with gentle natural light
  - Accurate and literal. Show the actual action being described, not a metaphor for it
  - No background text or watermarks

${visualIdentityBlock()}

HARD PROHIBITIONS — these produce an unusable image:
  - NO dark cinematic biotech aesthetic, glowing cells, mitochondria, DNA, molecules, particle systems or bioluminescence. This is not a supplement advert.
  - NO child, infant or adult depicted in visible distress, panic or medical crisis. Show calm, competent, prepared action only.
  - NO blood, no injury detail, no frightening imagery.
  - Render ONLY the text specified below. No other text in the frame.

TEXT OVERLAYS — crisp, clean sans-serif typography, high contrast, immediately legible:

TOP: "${stepLabel}"
  - Small, wide-tracked uppercase, muted grey
  - Centered with generous top padding

CENTER-TOP: "${title}"
  - Large, bold, dark headline — clear and plain, not stylised
  - This is the action the person takes

CENTER: [the instructional visual described above]
  - The clearest element in the frame; a viewer should understand the action without reading

BOTTOM: "${description}"
  - Clean, readable dark body text, slightly smaller
  - Centered with bottom padding

OVERALL STYLE: The visual language of good safety instructions — calm, uncluttered, trustworthy, well-designed. Think a well-made first aid manual or airline safety card, not a pharmaceutical commercial. Every element should help someone act correctly under stress.`;

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

    // Gemini returns raw base64; the format comes from its reported MIME type
    const contentType = result.mimeType || "image/png";
    const fileExtension = imageExtensionForMimeType(contentType);

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

      if (!writeResult || !("success" in writeResult) || !writeResult.success) {
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
