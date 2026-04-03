import { createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { resolve } from "path";
import {
  generateAdCreativesInputSchema,
  creativeOutputSchema,
  workflowOutputSchema,
} from "../../../schemas/ad-creatives-types";
import { uploadToSupabaseTool } from "../../../tools/upload-to-supabase";
import { writeFileTool } from "../../../tools/write-file";

/**
 * Step 6: Generate manifest for saved creatives
 * Files are already saved during generation, this step just creates the manifest
 */
export const saveCreativesStep = createStep({
  id: "save-creatives",
  description: "Generate manifest for saved creatives",
  inputSchema: z.object({
    originalInput: generateAdCreativesInputSchema,
    creatives: z.array(creativeOutputSchema),
    storageDestination: z.enum(["supabase", "local"]).default("supabase"),
  }),
  outputSchema: workflowOutputSchema,
  execute: async ({ inputData, requestContext, mastra }) => {
    console.log("📋 Generating manifest...");

    const { originalInput, creatives, storageDestination } = inputData;

    if (creatives.length === 0) {
      return {
        success: true,
        totalCreativesGenerated: 0,
        creatives: [],
        outputDirectory: "",
        manifestPath: "",
        summary: "No creatives generated",
      };
    }

    const manifestContent = JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        productTitle: originalInput.productTitle,
        productDescription: originalInput.productDescription,
        totalCreatives: creatives.length,
        templates: Array.from(new Set(creatives.map((c) => c.templateId))),
        creatives: creatives.map((c) => ({
          templateId: c.templateId,
          templateName: c.templateName,
          variationNumber: c.variationNumber,
          fileName: c.localPath.split('/').pop(),
          fileUrl: c.localPath,
          aspectRatio: c.aspectRatio,
          prompt: c.prompt,
          generatedAt: c.generatedAt,
          generationTime: c.generationTime,
          metadata: c.metadata,
        })),
        input: originalInput,
      },
      null,
      2
    );

    const templateCount = new Set(creatives.map((c) => c.templateId)).size;

    if (storageDestination === "local") {
      // Derive output directory from the first creative's local path
      const firstPath = creatives[0].localPath;
      const outputDir = firstPath.substring(0, firstPath.lastIndexOf('/'));
      const manifestPath = resolve(outputDir, "manifest.json");

      const writeResult = await writeFileTool.execute!(
        {
          filePath: manifestPath,
          content: manifestContent,
          encoding: "utf8",
          createDirectories: false,
        },
        { requestContext, mastra }
      );

      if (!writeResult || !("success" in writeResult) || !writeResult.success) {
        const msg = writeResult && "message" in writeResult ? writeResult.message : "Unknown error";
        throw new Error(`Failed to write manifest locally: ${msg}`);
      }

      console.log(`📋 Saved manifest: ${manifestPath}`);

      const summary = `Successfully generated ${creatives.length} ad creatives for "${originalInput.productTitle}" across ${templateCount} templates. Files saved locally to ${outputDir}`;
      console.log(`✅ ${summary}`);

      return {
        success: true,
        totalCreativesGenerated: creatives.length,
        creatives,
        outputDirectory: outputDir,
        manifestPath,
        summary,
      };
    } else {
      // Upload manifest to Supabase
      // Extract folder path from first creative's Supabase URL
      // URL format: https://.../storage/v1/object/public/TerraVow/product-name/timestamp/file.png
      const firstCreativeUrl = creatives[0].localPath;
      const urlParts = firstCreativeUrl.split('/TerraVow/');
      const folderPath = urlParts.length > 1 ? urlParts[1].split('/').slice(0, -1).join('/') : '';
      const manifestStoragePath = `${folderPath}/manifest.json`;

      const uploadResult = await uploadToSupabaseTool.execute!(
        {
          filePath: manifestStoragePath,
          content: manifestContent,
          contentType: "application/json",
          isBase64: false,
        },
        { requestContext, mastra }
      );

      if (!uploadResult || !("success" in uploadResult)) {
        throw new Error("Invalid result from upload tool");
      }

      if (!uploadResult.success || !uploadResult.publicUrl) {
        throw new Error(
          `Failed to upload manifest: ${uploadResult.error || "Unknown error"}`
        );
      }

      console.log(`📋 Uploaded manifest: ${uploadResult.publicUrl}`);

      const summary = `Successfully generated ${creatives.length} ad creatives for "${originalInput.productTitle}" across ${templateCount} templates. Files saved to Supabase Storage bucket TerraVow/${folderPath}`;
      console.log(`✅ ${summary}`);

      return {
        success: true,
        totalCreativesGenerated: creatives.length,
        creatives,
        outputDirectory: `https://supabase.co/storage/TerraVow/${folderPath}`,
        manifestPath: uploadResult.publicUrl,
        summary,
      };
    }
  },
});
