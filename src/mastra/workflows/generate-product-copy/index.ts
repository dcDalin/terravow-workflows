import { createWorkflow } from "@mastra/core/workflows";
import { resolve } from "path";
import { generateProductCopyInputSchema, productCopyOutputSchema } from "../../schemas/product-copy-types";
import { generateProductCopyStep } from "./steps/generate-product-copy-step";
import { saveProductCopyStep } from "./steps/save-product-copy-step";

const generateProductCopyWorkflow = createWorkflow({
  id: "generate-product-copy",
  description: `
    ✍️  Product Copy Generator

    Generates a story-driven product title and Shopify-ready rich text description
    from a product title and description. Modelled on top-converting competitor copy:
    named benefit systems, deep problem-aware writing, results timeline, and an
    emotionally resonant headline that speaks to identity — not just features.

    📋 QUICK START:

    {
      "productTitle": "MagRestore 8-Form Complex",
      "productDescription": "A blend of 8 magnesium forms designed for exhausted women 35+..."
    }

    📝 OUTPUT:
    - generatedTitle: Rewritten headline (paste into Shopify product title or page hero)
    - generatedDescription: Rich text body (paste directly into Shopify admin rich text editor)
    - Saved as product-copy.txt at:
      ~/Desktop/TerraVowAssets/<product-title>/<timestamp>/product-copy.txt
      (override with optional "outputDirectory" field)
  `,
  inputSchema: generateProductCopyInputSchema,
  outputSchema: productCopyOutputSchema,
})
  // Step 1: Generate title + rich text description via AI agent
  .then(generateProductCopyStep)

  // Map: Resolve output directory, defaulting to TerraVowAssets/<title>/<timestamp>
  .map(async ({ inputData }) => {
    const { originalInput, productTitle, generatedTitle, generatedDescription, guaranteeTitle, guaranteeDescription } = inputData;

    const sanitizedTitle = productTitle
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .toLowerCase();

    const outputDirectory =
      originalInput.outputDirectory ||
      resolve("/Users/dc_dalin/Desktop/TerraVowAssets", sanitizedTitle, String(Date.now()));

    console.log(`📁 Output directory: ${outputDirectory}`);

    return { productTitle, generatedTitle, generatedDescription, guaranteeTitle, guaranteeDescription, outputDirectory };
  })

  // Step 2: Save copy to .txt file
  .then(saveProductCopyStep);

generateProductCopyWorkflow.commit();

export { generateProductCopyWorkflow };
