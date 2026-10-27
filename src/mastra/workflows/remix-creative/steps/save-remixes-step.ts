import { createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { resolve } from "path";
import {
  generateRemixInputSchema,
  remixOutputSchema,
  remixWorkflowOutputSchema,
} from "../../../schemas/remix-creative-types";
import { uploadToSupabaseTool } from "../../../tools/upload-to-supabase";
import { writeFileTool } from "../../../tools/write-file";
import { STORAGE_BUCKET } from "../../../utils/supabase";
import { resolveProduct } from "../../../brand/products";
import { REMIX_SCOPE } from "../../../brand/remix-policy";

/**
 * Step 4: Write the manifest.
 *
 * The manifest records the full element plan per remix: how every text element
 * of the source was kept or rewritten, and why.
 */
export const saveRemixesStep = createStep({
  id: "save-remixes",
  description: "Write the remix manifest locally or to Supabase Storage",
  inputSchema: z.object({
    originalInput: generateRemixInputSchema,
    remixes: z.array(remixOutputSchema),
    storageDestination: z.enum(["supabase", "local"]).default("supabase"),
  }),
  outputSchema: remixWorkflowOutputSchema,
  execute: async ({ inputData, requestContext, mastra }) => {
    const { originalInput, remixes, storageDestination } = inputData;
    const product = resolveProduct(originalInput);

    if (remixes.length === 0) {
      return {
        success: true,
        totalRemixesGenerated: 0,
        remixes: [],
        outputDirectory: "",
        manifestPath: "",
        summary: "No remixes generated",
      };
    }

    const manifestContent = JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        productTitle: product.title,
        sourceBrand: originalInput.sourceBrandName ?? null,
        sourceImages: originalInput.sourceImages,
        remixScope: REMIX_SCOPE,
        totalRemixes: remixes.length,
        remixes: remixes.map((r) => ({
          sourceUrl: r.sourceUrl,
          sourceIndex: r.sourceIndex,
          variationNumber: r.variationNumber,
          adArchetype: r.adArchetype,
          fileName: r.localPath.split("/").pop(),
          fileUrl: r.localPath,
          aspectRatio: r.aspectRatio,
          generatedAt: r.generatedAt,
          generationTime: r.generationTime,
          elementPlan: r.elementPlan,
          metadata: r.metadata,
        })),
        input: originalInput,
      },
      null,
      2,
    );

    const sourceCount = new Set(remixes.map((r) => r.sourceIndex)).size;
    let outputDirectory: string;
    let manifestPath: string;

    if (storageDestination === "local") {
      const firstPath = remixes[0].localPath;
      outputDirectory = firstPath.substring(0, firstPath.lastIndexOf("/"));
      manifestPath = resolve(outputDirectory, "manifest.json");

      const writeResult = await writeFileTool.execute!(
        {
          filePath: manifestPath,
          content: manifestContent,
          encoding: "utf8",
          createDirectories: false,
        },
        { requestContext, mastra },
      );

      if (!writeResult || !("success" in writeResult) || !writeResult.success) {
        const msg =
          writeResult && "message" in writeResult
            ? writeResult.message
            : "Unknown error";
        throw new Error(`Failed to write manifest locally: ${msg}`);
      }

      console.log(`📋 Saved manifest: ${manifestPath}`);
    } else {
      // Derive the storage folder from the first uploaded remix's public URL
      const firstUrl = remixes[0].localPath;
      const urlParts = firstUrl.split(`/${STORAGE_BUCKET}/`);
      const folderPath =
        urlParts.length > 1
          ? urlParts[1].split("/").slice(0, -1).join("/")
          : "remixes";

      const storagePath = `${folderPath}/manifest.json`;
      const uploadResult = await uploadToSupabaseTool.execute!(
        {
          filePath: storagePath,
          content: manifestContent,
          contentType: "application/json",
          isBase64: false,
        },
        { requestContext, mastra },
      );

      if (
        !uploadResult ||
        !("success" in uploadResult) ||
        !uploadResult.success
      ) {
        const msg =
          uploadResult && "error" in uploadResult
            ? uploadResult.error
            : "Unknown error";
        throw new Error(`Failed to upload manifest: ${msg}`);
      }

      manifestPath = uploadResult.publicUrl ?? storagePath;
      outputDirectory = `https://supabase.co/storage/${STORAGE_BUCKET}/${folderPath}`;
      console.log(`📋 Uploaded manifest: ${manifestPath}`);
    }

    const summary = `Generated ${remixes.length} AtlasAir remix(es) from ${sourceCount} source creative(s) for "${product.title}". Files saved to ${outputDirectory}`;

    console.log(`✅ ${summary}`);

    return {
      success: true,
      totalRemixesGenerated: remixes.length,
      remixes,
      outputDirectory,
      manifestPath,
      summary,
    };
  },
});
