import { createStep } from "@mastra/core/workflows";
import { z } from "zod";
import {
  generateAdCreativesInputSchema,
  creativeOutputSchema,
  workflowOutputSchema,
} from "../../schemas/ad-creatives-types";
import { uploadToSupabaseTool } from "../../tools/upload-to-supabase";

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
  }),
  outputSchema: workflowOutputSchema,
  execute: async ({ inputData, requestContext, mastra }) => {
    console.log("📋 Generating manifest...");

    const { originalInput, creatives } = inputData;

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

    // Extract folder path from first creative's URL
    // URL format: https://.../storage/v1/object/public/TerraVow/product-name/timestamp/file.png
    const firstCreativeUrl = creatives[0].localPath;
    const urlParts = firstCreativeUrl.split('/TerraVow/');
    const folderPath = urlParts.length > 1 ? urlParts[1].split('/').slice(0, -1).join('/') : '';

    // Generate manifest
    const manifestStoragePath = `${folderPath}/manifest.json`;
    const manifest = {
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
        fileUrl: c.localPath, // Now a Supabase URL
        aspectRatio: c.aspectRatio,
        prompt: c.prompt,
        generatedAt: c.generatedAt,
        generationTime: c.generationTime,
        metadata: c.metadata,
      })),
      input: originalInput,
    };

    // Upload manifest to Supabase
    const uploadResult = await uploadToSupabaseTool.execute!(
      {
        filePath: manifestStoragePath,
        content: JSON.stringify(manifest, null, 2),
        contentType: "application/json",
        isBase64: false,
      },
      { requestContext, mastra }
    );

    // Type guard for upload result
    if (!uploadResult || !("success" in uploadResult)) {
      throw new Error("Invalid result from upload tool");
    }

    if (!uploadResult.success || !uploadResult.publicUrl) {
      throw new Error(
        `Failed to upload manifest: ${uploadResult.error || "Unknown error"}`
      );
    }

    console.log(`📋 Uploaded manifest: ${uploadResult.publicUrl}`);

    // Generate summary
    const templateCount = new Set(creatives.map((c) => c.templateId)).size;
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
  },
});
