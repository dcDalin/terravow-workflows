import { createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { productCopyOutputSchema } from "../../../schemas/product-copy-types";
import { writeFileTool } from "../../../tools/write-file";

export const saveProductCopyStep = createStep({
  id: "save-product-copy",
  description: "Write generated product copy to a .txt file",
  inputSchema: z.object({
    productTitle: z.string(),
    generatedTitle: z.string(),
    generatedDescription: z.string(),
    guaranteeTitle: z.string(),
    guaranteeDescription: z.string(),
    outputDirectory: z.string().describe("Directory to write the .txt file"),
  }),
  outputSchema: productCopyOutputSchema,
  execute: async ({ inputData, requestContext, mastra }) => {
    const {
      productTitle,
      generatedTitle,
      generatedDescription,
      guaranteeTitle,
      guaranteeDescription,
      outputDirectory,
    } = inputData;

    const lines: string[] = [
      `Product Copy — ${productTitle}`,
      `Generated: ${new Date().toISOString()}`,
      "",
      "=== SECTION 1: PRODUCT COPY ===",
      "",
      "TITLE:",
      generatedTitle,
      "",
      "DESCRIPTION (Shopify Rich Text):",
      generatedDescription,
      "",
      "=== SECTION 2: GUARANTEE / SOCIAL PROOF ===",
      "",
      "TITLE:",
      guaranteeTitle,
      "",
      "DESCRIPTION (Shopify Rich Text):",
      guaranteeDescription,
    ];

    const content = lines.join("\n");
    const filePath = `${outputDirectory}/product-copy.txt`;

    console.log(`💾 Saving product copy to ${filePath}...`);

    const result = await writeFileTool.execute!(
      { filePath, content, encoding: "utf8", createDirectories: true },
      { requestContext, mastra },
    );

    if (!result || !result.success) {
      throw new Error(`Failed to write product copy file: ${result?.message ?? "Unknown error"}`);
    }

    console.log(`✅ Saved ${result.bytesWritten} bytes to ${filePath}`);

    return { productTitle, generatedTitle, generatedDescription, guaranteeTitle, guaranteeDescription, filePath };
  },
});
