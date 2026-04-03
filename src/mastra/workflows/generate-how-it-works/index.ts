import { createWorkflow } from "@mastra/core/workflows";
import { resolve } from "path";
import {
  generateHowItWorksInputSchema,
  howItWorksOutputSchema,
} from "../../schemas/how-it-works-types";
import { generateHowItWorksStepsStep } from "./steps/generate-how-it-works-steps-step";
import { generateHowItWorksImageStep } from "./steps/generate-how-it-works-image-step";
import { saveHowItWorksStep } from "./steps/save-how-it-works-step";

const generateHowItWorksWorkflow = createWorkflow({
  id: "generate-how-it-works",
  description: `
    🔬 How It Works Illustration Generator

    Generates a series of scientific-style infographic images that explain how a product works —
    similar to pharmaceutical ads showing cells, organs, molecules, and biological processes.

    📋 QUICK START:

    {
      "productTitle": "CellRevive Serum",
      "productDescription": "A clinically-backed anti-aging serum that penetrates deep into the skin's cellular layers...",
      "stepCount": 4,
      "storageDestination": "supabase"
    }

    🎯 HOW IT WORKS:
    1. AI reads your product info and generates step content (title, description, visual theme per step)
    2. Each step is rendered as a dark, cinematic scientific illustration with text overlaid
    3. Images are saved locally or uploaded to Supabase Storage

    🖼️ IMAGE STYLE:
    • Dark navy / midnight teal backgrounds
    • Photorealistic CGI biological visuals (cells, molecules, DNA, organs)
    • Clean sans-serif text: step label (top), title (center), description (bottom)
    • Premium pharmaceutical / nutraceutical ad aesthetic

    📝 WORKFLOW STEPS:
    1. Generate Steps — AI produces step labels, titles, descriptions, and visual themes
    2. Generate Images — Each step is rendered in parallel (concurrency: 3)
    3. Save — Manifest written to local disk or Supabase Storage
  `,
  inputSchema: generateHowItWorksInputSchema,
  outputSchema: howItWorksOutputSchema,
  retryConfig: {
    attempts: 3,
    delay: 2000,
  },
})
  // Step 1: Generate step content via AI
  .then(generateHowItWorksStepsStep)

  // Map: Enrich each step with storage/generation config for foreach
  .map(async ({ inputData }) => {
    const { originalInput, steps } = inputData;

    console.log(
      `🎨 Preparing ${steps.length} image(s) for parallel generation...`,
    );

    const sanitizedTitle = originalInput.productTitle
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .toLowerCase();

    const outputDirectory =
      originalInput.outputDirectory ||
      resolve("/Users/dc_dalin/Desktop/TerraVowAssets", sanitizedTitle, String(Date.now()));

    console.log(`📁 Output directory: ${outputDirectory}`);

    return steps.map((step) => ({
      ...step,
      productTitle: originalInput.productTitle,
      aspectRatio: originalInput.aspectRatio ?? "1:1",
      imageSize: (originalInput.imageSize ?? "2K") as "512" | "1K" | "2K" | "4K",
      outputDirectory,
      storageDestination: (originalInput.storageDestination ??
        "supabase") as "supabase" | "local",
    }));
  })

  // ForEach: Generate images in parallel (concurrency: 3)
  .foreach(generateHowItWorksImageStep, { concurrency: 3 })

  // Map: Package results with originalInput for the save step
  .map(async ({ inputData, getStepResult }) => {
    const images = inputData;
    const stepsOutput = getStepResult(generateHowItWorksStepsStep);

    console.log(`✅ Generated ${images.length} illustration(s) successfully`);

    return {
      originalInput: stepsOutput.originalInput,
      images,
      storageDestination: (stepsOutput.originalInput.storageDestination ??
        "supabase") as "supabase" | "local",
    };
  })

  // Final step: Save manifest
  .then(saveHowItWorksStep);

generateHowItWorksWorkflow.commit();

export { generateHowItWorksWorkflow };
