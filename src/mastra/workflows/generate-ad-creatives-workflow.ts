import { createWorkflow } from "@mastra/core/workflows";
import {
  generateAdCreativesInputSchema,
  workflowOutputSchema,
} from "../schemas/ad-creatives-types";
import { processAssetsStep } from "./steps/process-assets-step";
import { analyzeProductStep } from "./steps/analyze-product-step";
import { prepareGenerationTasksStep } from "./steps/prepare-generation-tasks-step";
import { customizePromptsStep } from "./steps/customize-prompts-step";
import { generateImagesStep } from "./steps/generate-images-step";
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
    5. Generate Images - Create ad creatives (placeholder for now)
    6. Save Creatives - Save results and generate manifest (placeholder for now)
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
  .then(generateImagesStep)
  .then(saveCreativesStep);

generateAdCreativesWorkflow.commit();

export { generateAdCreativesWorkflow };
