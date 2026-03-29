import { createTool } from "@mastra/core/tools";
import { z } from "zod";

/**
 * Tool to process image URLs
 * Fetches images from publicly accessible URLs and converts to base64
 */

export const processImageInputTool = createTool({
  id: "process-image-input",
  description: "Fetch and process image from publicly accessible URL",
  inputSchema: z.object({
    input: z.string().url().describe("Publicly accessible image URL"),
  }),
  outputSchema: z.object({
    data: z.string().describe("Base64 encoded image data"),
    mimeType: z.string(),
    originalSource: z.string(),
    filename: z.string(),
  }),
  execute: async ({ input }) => {
    // Fetch image from URL
    const response = await fetch(input);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch image from URL: ${input} - ${response.statusText}`,
      );
    }

    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const mimeType = response.headers.get("content-type") || "image/png";

    // Extract filename from URL
    const filename = input.split("/").pop()?.split("?")[0] || "image";

    return {
      data: base64,
      mimeType,
      originalSource: input,
      filename,
    };
  },
});
