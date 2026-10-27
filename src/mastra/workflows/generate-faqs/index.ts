import { createWorkflow } from "@mastra/core/workflows";
import { resolve } from "path";
import {
  generateFaqsInputSchema,
  faqsOutputSchema,
} from "../../schemas/faqs-types";
import { generateFaqsStep } from "./steps/generate-faqs-step";
import { saveFaqsStep } from "./steps/save-faqs-step";
import { BRAND } from "../../brand/atlasair";

const generateFaqsWorkflow = createWorkflow({
  id: "generate-faqs",
  description: `
    ❓ Product FAQ Generator

    Generates product-specific FAQs for the AtlasAir storefront. Buyers of choking-rescue
    gear ask safety questions, so the answers are accurate first and reassuring second —
    reassurance comes from being straight with them, not from adjectives.

    📋 QUICK START:

    {
      "productKey": "atlasair-2",
      "faqCount": 8
    }

    Product keys: "atlasair-2" · "atlasair-plus" · "first-aid-kit" · "cpr-course"
    (or pass productTitle + productDescription for anything not in the catalogue)

    ⚖️ FIXED RULES:
    • One FAQ always states that this is an airway-clearance aid, not a substitute for
      professional medical care, and that emergency services come first
    • The digital course gets access/lifetime/certificate questions and no shipping questions

    📝 OUTPUT:
    An array of { question, answer } objects saved as a .txt file at:
    <assetRoot>/<product-title>/<timestamp>/faqs.txt
    where assetRoot is ASSET_OUTPUT_ROOT or ~/Desktop/AtlasAirAssets
    (override per-run with the optional "outputDirectory" field)
  `,
  inputSchema: generateFaqsInputSchema,
  outputSchema: faqsOutputSchema,
  // Retry each step twice (3 attempts total) so a transient OpenAI hiccup or a
  // one-off malformed JSON response doesn't fail the whole run.
  retryConfig: {
    attempts: 2,
    delay: 2000,
  },
})
  // Step 1: Generate FAQs via AI agent
  .then(generateFaqsStep)

  // Map: Attach output directory, defaulting to <assetRoot>/<title>/<timestamp>
  .map(async ({ inputData }) => {
    const { originalInput, productTitle, faqs, totalFaqs } = inputData;

    const sanitizedTitle = productTitle
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .toLowerCase();

    const outputDirectory =
      originalInput.outputDirectory ||
      resolve(BRAND.assetRoot, sanitizedTitle, String(Date.now()));

    console.log(`📁 Output directory: ${outputDirectory}`);

    return { productTitle, faqs, totalFaqs, outputDirectory };
  })

  // Step 2: Save FAQs to .txt file
  .then(saveFaqsStep);

generateFaqsWorkflow.commit();

export { generateFaqsWorkflow };
