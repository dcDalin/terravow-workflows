import { createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { writeFile } from "fs/promises";
import { join, dirname } from "path";
import {
  generateAdCreativesInputSchema,
  creativeOutputSchema,
  workflowOutputSchema,
} from "../../schemas/ad-creatives-types";

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
  execute: async ({ inputData }) => {
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

    // Get output directory from first creative's path
    const outputDir = dirname(creatives[0].localPath);

    // Generate manifest
    const manifestPath = join(outputDir, "manifest.json");
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
        filePath: c.localPath,
        aspectRatio: c.aspectRatio,
        prompt: c.prompt,
        generatedAt: c.generatedAt,
        generationTime: c.generationTime,
        metadata: c.metadata,
      })),
      input: originalInput,
    };

    await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`📋 Created manifest: ${manifestPath}`);

    // Generate summary
    const templateCount = new Set(creatives.map((c) => c.templateId)).size;
    const summary = `Successfully generated ${creatives.length} ad creatives for "${originalInput.productTitle}" across ${templateCount} templates. Files saved to: ${outputDir}`;

    console.log(`✅ ${summary}`);

    return {
      success: true,
      totalCreativesGenerated: creatives.length,
      creatives,
      outputDirectory: outputDir,
      manifestPath,
      summary,
    };
  },
});
