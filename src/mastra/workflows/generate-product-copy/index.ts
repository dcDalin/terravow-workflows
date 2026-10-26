import { createWorkflow } from "@mastra/core/workflows";
import { resolve } from "path";
import {
  generateProductCopyInputSchema,
  productCopyOutputSchema,
} from "../../schemas/product-copy-types";
import { generateProductCopyStep } from "./steps/generate-product-copy-step";
import { saveProductCopyStep } from "./steps/save-product-copy-step";
import { BRAND } from "../../brand/atlasair";

const generateProductCopyWorkflow = createWorkflow({
  id: "generate-product-copy",
  description: `
    ✍️  Product Copy Generator

    Generates an AtlasAir product title and Shopify-ready rich text description. The copy
    sells preparedness for a 30-second window, not fear: how the product works, what the
    design does under pressure, who in the household can use it, and an honest closing
    section about what it is not.

    📋 QUICK START:

    {
      "productKey": "atlasair-2"
    }

    Product keys: "atlasair-2" · "atlasair-plus" · "first-aid-kit" · "cpr-course"
    (or pass productTitle + productDescription for anything not in the catalogue)

    ⚖️ FIXED RULES:
    • "How it works" begins with calling emergency services
    • A mandatory closing section states this is an airway-clearance aid, not a substitute
      for professional medical care
    • The guarantee section carries store policy and product facts ONLY — no invented
      customer counts, ratings, statistics, certifications or returns windows. Put your real
      returns policy in productDescription if you want it reflected there

    📝 OUTPUT:
    - generatedTitle: Rewritten headline (paste into Shopify product title or page hero)
    - generatedDescription: Rich text body (paste directly into Shopify admin rich text editor)
    - Saved as product-copy.txt at:
      <assetRoot>/<product-title>/<timestamp>/product-copy.txt
      where assetRoot is ASSET_OUTPUT_ROOT or ~/Desktop/AtlasAirAssets
      (override per-run with the optional "outputDirectory" field)
  `,
  inputSchema: generateProductCopyInputSchema,
  outputSchema: productCopyOutputSchema,
  // Retry each step twice (3 attempts total) so a transient OpenAI hiccup or a
  // one-off malformed JSON response doesn't fail the whole run.
  retryConfig: {
    attempts: 2,
    delay: 2000,
  },
})
  // Step 1: Generate title + rich text description via AI agent
  .then(generateProductCopyStep)

  // Map: Resolve output directory, defaulting to <assetRoot>/<title>/<timestamp>
  .map(async ({ inputData }) => {
    const {
      originalInput,
      productTitle,
      generatedTitle,
      generatedDescription,
      guaranteeTitle,
      guaranteeDescription,
    } = inputData;

    const sanitizedTitle = productTitle
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .toLowerCase();

    const outputDirectory =
      originalInput.outputDirectory ||
      resolve(BRAND.assetRoot, sanitizedTitle, String(Date.now()));

    console.log(`📁 Output directory: ${outputDirectory}`);

    return {
      productTitle,
      generatedTitle,
      generatedDescription,
      guaranteeTitle,
      guaranteeDescription,
      outputDirectory,
    };
  })

  // Step 2: Save copy to .txt file
  .then(saveProductCopyStep);

generateProductCopyWorkflow.commit();

export { generateProductCopyWorkflow };
