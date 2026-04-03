import { createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { generateAdCreativesInputSchema, processedImageRefSchema } from "../../../schemas/ad-creatives-types";
import { processImageInputTool } from "../../../tools/process-image-input";

/**
 * Step 1: Process and validate input assets
 */
export const processAssetsStep = createStep({
  id: "process-assets",
  description: "Process logo and product images from various input formats",
  inputSchema: generateAdCreativesInputSchema,
  outputSchema: z.object({
    originalInput: generateAdCreativesInputSchema,
    logo: processedImageRefSchema,
    productImages: z.array(processedImageRefSchema),
    processingTime: z.number(),
  }),
  execute: async ({ inputData, requestContext, mastra }) => {
    const startTime = Date.now();
    console.log("📁 Processing assets...");

    // Process logo with error handling
    const logoResult = await processImageInputTool.execute!(
      { input: inputData.logo },
      { requestContext, mastra },
    );

    // Type guard to ensure we got a valid result
    if (!logoResult || !('data' in logoResult)) {
      throw new Error("Failed to process logo: Invalid result from tool");
    }

    console.log("✅ Logo processed");

    // Process product images in parallel with error handling
    const imagePromises = inputData.productImages.map(async (img, index) => {
      const result = await processImageInputTool.execute!(
        { input: img },
        { requestContext, mastra },
      );

      // Type guard to ensure we got a valid result
      if (!result || !('data' in result)) {
        console.error(`❌ Failed to process product image ${index + 1}: Invalid result from tool`);
        throw new Error(`Failed to process product image ${index + 1}`);
      }

      console.log(
        `✅ Product image ${index + 1}/${inputData.productImages.length} processed`,
      );
      return result;
    });

    const imageResults = await Promise.allSettled(imagePromises);

    // Extract successful results
    const productImagesResults = imageResults
      .filter(
        (
          result,
        ): result is PromiseFulfilledResult<{
          data: string;
          mimeType: string;
          originalSource: string;
          filename: string;
        }> => result.status === "fulfilled",
      )
      .map((result) => result.value);

    const failedImages = imageResults.filter(
      (result) => result.status === "rejected",
    ).length;

    if (productImagesResults.length === 0) {
      throw new Error("Failed to process any product images");
    }

    if (failedImages > 0) {
      console.warn(
        `⚠️  ${failedImages} product image(s) failed to process, continuing with ${productImagesResults.length}`,
      );
    }

    const processingTime = Date.now() - startTime;

    console.log(
      `✅ All assets processed in ${processingTime}ms (${productImagesResults.length + 1} images)`,
    );

    // Strip base64 data — only forward URLs. base64 is re-fetched in generateSingleImageStep
    // right before calling Gemini, keeping workflow snapshots lean.
    return {
      originalInput: inputData,
      logo: { mimeType: logoResult.mimeType, originalSource: logoResult.originalSource, filename: logoResult.filename },
      productImages: productImagesResults.map(img => ({ mimeType: img.mimeType, originalSource: img.originalSource, filename: img.filename })),
      processingTime,
    };
  },
});
