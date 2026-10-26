import { createWorkflow } from "@mastra/core/workflows";
import { resolve } from "path";
import {
  generateHowItWorksInputSchema,
  howItWorksOutputSchema,
} from "../../schemas/how-it-works-types";
import { generateHowItWorksStepsStep } from "./steps/generate-how-it-works-steps-step";
import { generateHowItWorksImageStep } from "./steps/generate-how-it-works-image-step";
import { saveHowItWorksStep } from "./steps/save-how-it-works-step";
import { BRAND } from "../../brand/atlasair";
import { resolveProduct } from "../../brand/products";

const generateHowItWorksWorkflow = createWorkflow({
  id: "generate-how-it-works",
  description: `
    🩺 How It Works Illustration Generator

    Generates the step-by-step illustration series that explains how an AtlasAir product is
    used. These double as instructions — someone may recall them under pressure — so they are
    calm, literal and clearly legible rather than dramatic.

    📋 QUICK START:

    {
      "productKey": "atlasair-2",
      "stepCount": 4,
      "storageDestination": "supabase"
    }

    Product keys: "atlasair-2" · "atlasair-plus" · "first-aid-kit" · "cpr-course"
    (or pass productTitle + productDescription for anything not in the catalogue)

    🎯 HOW IT WORKS:
    1. AI reads your product info and generates step content (title, description, visual theme per step)
    2. Each step is rendered as a calm instructional illustration with text overlaid
    3. Images are saved locally or uploaded to Supabase Storage

    ⚖️ FIXED RULES:
    • Step 1 is ALWAYS "Call Emergency Services" — never reordered or softened
    • Copy says "helps dislodge a blockage", never "removes the object"
    • No invented statistics, countdowns or success rates

    🖼️ IMAGE STYLE:
    • Light, calm palette — soft neutrals and gentle domestic light
    • Flat medical illustration of the airway and mask placement, or a calm household scene
    • Clean sans-serif text: step label (top), title (center), description (bottom)
    • The visual language of a well-made first aid manual, not a pharmaceutical ad
    • Never a child in distress, never dark biotech CGI

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

    const product = resolveProduct(originalInput);
    const sanitizedTitle = product.title
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .toLowerCase();

    const outputDirectory =
      originalInput.outputDirectory ||
      resolve(BRAND.assetRoot, sanitizedTitle, String(Date.now()));

    console.log(`📁 Output directory: ${outputDirectory}`);

    return steps.map((step) => ({
      ...step,
      productTitle: product.title,
      aspectRatio: originalInput.aspectRatio ?? "1:1",
      imageSize: (originalInput.imageSize ?? "2K") as
        | "512"
        | "1K"
        | "2K"
        | "4K",
      outputDirectory,
      storageDestination: (originalInput.storageDestination ?? "supabase") as
        | "supabase"
        | "local",
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
