import { createWorkflow } from "@mastra/core/workflows";
import { resolve } from "path";
import { generateFaqsInputSchema, faqsOutputSchema } from "../../schemas/faqs-types";
import { generateFaqsStep } from "./steps/generate-faqs-step";
import { saveFaqsStep } from "./steps/save-faqs-step";

const generateFaqsWorkflow = createWorkflow({
  id: "generate-faqs",
  description: `
    ❓ Product FAQ Generator

    Generates product-specific FAQs from a product title and description using OpenAI.
    Questions and answers reference the product by name and are written to build trust
    and handle buyer objections — ready to drop into a product page or marketing site.

    📋 QUICK START:

    {
      "productTitle": "CellRevive Serum",
      "productDescription": "A clinically-backed anti-aging serum...",
      "faqCount": 8
    }

    📝 OUTPUT:
    An array of { question, answer } objects saved as a .txt file at:
    ~/Desktop/TerraVowAssets/<product-title>/<timestamp>/faqs.txt
    (override with optional "outputDirectory" field)
  `,
  inputSchema: generateFaqsInputSchema,
  outputSchema: faqsOutputSchema,
})
  // Step 1: Generate FAQs via AI agent
  .then(generateFaqsStep)

  // Map: Attach output directory, defaulting to TerraVowAssets/<title>/<timestamp>
  .map(async ({ inputData }) => {
    const { originalInput, productTitle, faqs, totalFaqs } = inputData;

    const sanitizedTitle = productTitle
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .toLowerCase();

    const outputDirectory =
      originalInput.outputDirectory ||
      resolve("/Users/dc_dalin/Desktop/TerraVowAssets", sanitizedTitle, String(Date.now()));

    console.log(`📁 Output directory: ${outputDirectory}`);

    return { productTitle, faqs, totalFaqs, outputDirectory };
  })

  // Step 2: Save FAQs to .txt file
  .then(saveFaqsStep);

generateFaqsWorkflow.commit();

export { generateFaqsWorkflow };
