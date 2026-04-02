import { createWorkflow } from "@mastra/core/workflows";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import {
  generateAdCreativesInputSchema,
  workflowOutputSchema,
} from "../schemas/ad-creatives-types";
import { processAssetsStep } from "./steps/process-assets-step";
import { analyzeProductStep } from "./steps/analyze-product-step";
import { prepareGenerationTasksStep } from "./steps/prepare-generation-tasks-step";
import { customizePromptsStep } from "./steps/customize-prompts-step";
import { verifyGeminiKeyStep } from "./steps/verify-gemini-key-step";
import { generateSingleImageStep } from "./steps/generate-single-image-step";
import { saveCreativesStep } from "./steps/save-creatives-step";

const generateAdCreativesWorkflow = createWorkflow({
  id: "generate-ad-creatives",
  description: `
    🎨 Ad Creative Generator Workflow

    Generates professional ad creatives from product information using AI-powered template selection and image generation.

    📋 QUICK START:

    Minimal config:
    {
      "productTitle": "Your Product",
      "productDescription": "Detailed multi-paragraph product description highlighting key features, benefits, and unique selling points. You can include multiple paragraphs to provide comprehensive information about your product.",
      "logo": "https://example.com/logo.png",
      "productImages": ["https://example.com/product1.jpg", "https://example.com/product2.jpg"],
      "templateSelectionMode": "ai",
      "creativesPerTemplate": 1
    }

    🎯 TEMPLATE MODES:
    • "ai": AI picks best templates (set aiSelectTemplateCount)
    • "manual": You choose (set templateIds: [1, 11, 21])

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

    console.log(`🎨 Preparing ${customizedPrompts.length} image(s) for parallel generation and upload to Supabase...`);

    // Determine storage folder path for Supabase
    const sanitizedTitle = originalInput.productTitle
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .toLowerCase();
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const outputDirectory =
      originalInput.outputDirectory ||
      resolve(__dirname, "../public/output", sanitizedTitle, String(Date.now()));
    console.log(`📁 Storage folder: ${outputDirectory}`);

    // Prepare reference images (logo + product images)
    const referenceImages = [logo, ...productImages].map(img => ({
      data: img.data,
      mimeType: img.mimeType,
    }));

    // Determine image size from model setting
    const imageSize = originalInput.imageGenerationModel?.includes('4K') ? '4K' : '2K';

    // Return array of enriched items (each self-contained for generation and saving)
    return customizedPrompts.map(prompt => ({
      templateId: prompt.templateId,
      templateName: prompt.templateName,
      variationNumber: prompt.variationNumber,
      prompt: prompt.prompt,
      aspectRatio: prompt.aspectRatio,
      productTitle: originalInput.productTitle,
      imageSize: imageSize as any,
      outputDirectory,
      storageDestination: (originalInput.storageDestination ?? "supabase") as "supabase" | "local",
      referenceImages,
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
      storageDestination: (verifyStepOutput.originalInput.storageDestination ?? "supabase") as "supabase" | "local",
    };
  })
  .then(saveCreativesStep);

generateAdCreativesWorkflow.commit();

export { generateAdCreativesWorkflow };
