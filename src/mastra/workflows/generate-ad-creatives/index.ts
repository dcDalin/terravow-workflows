import { createWorkflow } from "@mastra/core/workflows";
import { resolve } from "path";
import {
  generateAdCreativesInputSchema,
  workflowOutputSchema,
} from "../../schemas/ad-creatives-types";
import { processAssetsStep } from "./steps/process-assets-step";
import { analyzeProductStep } from "./steps/analyze-product-step";
import { prepareGenerationTasksStep } from "./steps/prepare-generation-tasks-step";
import { customizePromptsStep } from "./steps/customize-prompts-step";
import { verifyGeminiKeyStep } from "./steps/verify-gemini-key-step";
import { generateSingleImageStep } from "./steps/generate-single-image-step";
import { saveCreativesStep } from "./steps/save-creatives-step";
import { BRAND } from "../../brand/atlasair";
import { resolveProduct } from "../../brand/products";

const generateAdCreativesWorkflow = createWorkflow({
  id: "generate-ad-creatives",
  description: `
    🎨 Ad Creative Generator Workflow

    Generates AtlasAir ad creatives from product information using AI-powered template selection and image generation.

    📋 QUICK START:

    Minimal config — a catalogue product fills in its own title and description:
    {
      "productKey": "atlasair-2",
      "logo": "https://cdn.example.com/atlasair-logo.png",
      "productImages": ["https://cdn.example.com/atlasair-2-hero.jpg"],
      "templateSelectionMode": "ai",
      "creativesPerTemplate": 1
    }

    Product keys: "atlasair-2" · "atlasair-plus" · "first-aid-kit" · "cpr-course"
    (or pass productTitle + productDescription for anything not in the catalogue)

    🎯 TEMPLATE MODES:
    • "ai": AI picks best templates (set aiSelectTemplateCount)
    • "manual": You choose (set templateIds: [1, 27, 28])

    ⚖️ FIXED RULES:
    • Every creative carries the airway-clearance-aid disclaimer as small print
    • Pass "socialProof" to use real Judge.me figures and reviews in rating and review slots

    📸 IMAGE REQUIREMENTS:
    • All images must be publicly accessible URLs
    • Supported formats: PNG, JPG, WEBP, GIF, SVG
    • Logo: Single URL to your brand logo
    • Product Images: 1-10 URLs to product photos

    📝 WORKFLOW STEPS:
    1. Process Assets - Fetch and convert images from URLs
    2. Analyze Product - AI analyzes product and recommends templates
    3. Prepare Tasks - Select templates and create generation task list
    4. Customize Prompts - Replace placeholders with product details
    5. Verify Gemini Key - Check API key is valid before generation
    6. Generate Images - Create ad creatives using Gemini and upload to Supabase Storage (parallel with concurrency)
    7. Save Creatives - Upload manifest to Supabase Storage and return results
  `,
  inputSchema: generateAdCreativesInputSchema,
  outputSchema: workflowOutputSchema,
  retryConfig: {
    attempts: 5,
    delay: 2000,
  },
})
  .then(processAssetsStep)
  .then(analyzeProductStep)
  .then(prepareGenerationTasksStep)
  .then(customizePromptsStep)
  .then(verifyGeminiKeyStep)
  // Map: Prepare data for parallel generation
  .map(async ({ inputData }) => {
    const { originalInput, logo, productImages, customizedPrompts } = inputData;

    console.log(
      `🎨 Preparing ${customizedPrompts.length} image(s) for parallel generation and upload to Supabase...`,
    );

    // Determine storage folder path for Supabase
    const product = resolveProduct(originalInput);
    const sanitizedTitle = product.title
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .toLowerCase();
    const outputDirectory =
      originalInput.outputDirectory ||
      resolve(BRAND.assetRoot, sanitizedTitle, String(Date.now()));
    console.log(`📁 Storage folder: ${outputDirectory}`);

    // Pass only URLs — each generateSingleImageStep re-fetches them fresh.
    // This keeps foreach snapshot items lean (no base64 duplication per task).
    const referenceImageUrls = [logo, ...productImages].map(
      (img) => img.originalSource,
    );

    // Determine image size from model setting
    const imageSize = originalInput.imageGenerationModel?.includes("4K")
      ? "4K"
      : "2K";

    // Return array of enriched items (each self-contained for generation and saving)
    return customizedPrompts.map((prompt) => ({
      templateId: prompt.templateId,
      templateName: prompt.templateName,
      variationNumber: prompt.variationNumber,
      prompt: prompt.prompt,
      aspectRatio: prompt.aspectRatio,
      productTitle: product.title,
      imageSize: imageSize as any,
      outputDirectory,
      storageDestination: (originalInput.storageDestination ?? "supabase") as
        | "supabase"
        | "local",
      referenceImageUrls,
    }));
  })
  // ForEach: Generate images in parallel (concurrency: 3)
  .foreach(generateSingleImageStep, { concurrency: 3 })
  // Map: Package results with originalInput
  .map(async ({ inputData, getStepResult }) => {
    // inputData is array of creatives from .foreach()
    const creatives = inputData;

    // Get originalInput from the verification step
    const verifyStepOutput = getStepResult(verifyGeminiKeyStep);

    console.log(`✅ Generated ${creatives.length} creative(s) successfully`);

    return {
      originalInput: verifyStepOutput.originalInput,
      creatives,
      storageDestination: (verifyStepOutput.originalInput.storageDestination ??
        "supabase") as "supabase" | "local",
    };
  })
  .then(saveCreativesStep);

generateAdCreativesWorkflow.commit();

export { generateAdCreativesWorkflow };
