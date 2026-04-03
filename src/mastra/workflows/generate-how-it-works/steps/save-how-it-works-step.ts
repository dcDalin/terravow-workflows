import { createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { resolve } from "path";
import {
  generateHowItWorksInputSchema,
  stepImageOutputSchema,
  howItWorksOutputSchema,
} from "../../../schemas/how-it-works-types";
import { uploadToSupabaseTool } from "../../../tools/upload-to-supabase";
import { writeFileTool } from "../../../tools/write-file";

/**
 * Final step: Write manifest for the generated how-it-works illustrations
 * Images are already saved during generation; this step packages the results
 */
export const saveHowItWorksStep = createStep({
  id: "save-how-it-works",
  description: "Generate and save manifest for how-it-works illustrations",
  inputSchema: z.object({
    originalInput: generateHowItWorksInputSchema,
    images: z.array(stepImageOutputSchema),
    storageDestination: z.enum(["supabase", "local"]).default("supabase"),
  }),
  outputSchema: howItWorksOutputSchema,
  execute: async ({ inputData, requestContext, mastra }) => {
    console.log("📋 Saving manifest...");

    const { originalInput, images, storageDestination } = inputData;

    if (images.length === 0) {
      return {
        success: true,
        totalImagesGenerated: 0,
        images: [],
        outputDirectory: "",
        manifestPath: "",
        summary: "No images generated",
      };
    }

    const manifestContent = JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        productTitle: originalInput.productTitle,
        productDescription: originalInput.productDescription,
        totalImages: images.length,
        images: images.map((img) => ({
          stepNumber: img.stepNumber,
          stepLabel: img.stepLabel,
          title: img.title,
          description: img.description,
          fileName: img.localPath.split("/").pop(),
          fileUrl: img.localPath,
          generatedAt: img.generatedAt,
          generationTime: img.generationTime,
          metadata: img.metadata,
        })),
        input: originalInput,
      },
      null,
      2,
    );

    if (storageDestination === "local") {
      const firstPath = images[0].localPath;
      const outputDir = firstPath.substring(0, firstPath.lastIndexOf("/"));
      const manifestPath = resolve(outputDir, "manifest.json");

      const writeResult = await writeFileTool.execute!(
        {
          filePath: manifestPath,
          content: manifestContent,
          encoding: "utf8",
          createDirectories: false,
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
        throw new Error(`Failed to write manifest locally: ${msg}`);
      }

      console.log(`📋 Saved manifest: ${manifestPath}`);

      const summary = `Successfully generated ${images.length} how-it-works illustrations for "${originalInput.productTitle}". Files saved locally to ${outputDir}`;
      console.log(`✅ ${summary}`);

      return {
        success: true,
        totalImagesGenerated: images.length,
        images,
        outputDirectory: outputDir,
        manifestPath,
        summary,
      };
    } else {
      // Extract folder path from first image's Supabase URL
      const firstImageUrl = images[0].localPath;
      const urlParts = firstImageUrl.split("/TerraVow/");
      const folderPath =
        urlParts.length > 1
          ? urlParts[1].split("/").slice(0, -1).join("/")
          : "";
      const manifestStoragePath = `${folderPath}/manifest.json`;

      const uploadResult = await uploadToSupabaseTool.execute!(
        {
          filePath: manifestStoragePath,
          content: manifestContent,
          contentType: "application/json",
          isBase64: false,
        },
        { requestContext, mastra },
      );

      if (!uploadResult || !("success" in uploadResult)) {
        throw new Error("Invalid result from upload tool");
      }

      if (!uploadResult.success || !uploadResult.publicUrl) {
        throw new Error(
          `Failed to upload manifest: ${uploadResult.error || "Unknown error"}`,
        );
      }

      console.log(`📋 Uploaded manifest: ${uploadResult.publicUrl}`);

      const summary = `Successfully generated ${images.length} how-it-works illustrations for "${originalInput.productTitle}". Files saved to Supabase Storage bucket TerraVow/${folderPath}`;
      console.log(`✅ ${summary}`);

      return {
        success: true,
        totalImagesGenerated: images.length,
        images,
        outputDirectory: `https://supabase.co/storage/TerraVow/${folderPath}`,
        manifestPath: uploadResult.publicUrl,
        summary,
      };
    }
  },
});
