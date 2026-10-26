import { createWorkflow } from "@mastra/core/workflows";
import { resolve } from "path";
import {
  generateRemixInputSchema,
  remixWorkflowOutputSchema,
} from "../../schemas/remix-creative-types";
import { analyzeSourceCreativesStep } from "./steps/analyze-source-creatives-step";
import { planRemixTasksStep } from "./steps/plan-remix-tasks-step";
import { generateRemixImageStep } from "./steps/generate-remix-image-step";
import { saveRemixesStep } from "./steps/save-remixes-step";
import { BRAND } from "../../brand/atlasair";
import { resolveProduct } from "../../brand/products";

const remixCreativeWorkflow = createWorkflow({
  id: "remix-creative",
  description: `
    ♻️  Creative Remix

    Takes an existing ad creative from another brand and rebuilds its LAYOUT as an AtlasAir
    creative — AtlasAir logo, AtlasAir product photography, AtlasAir palette and copy.

    📋 QUICK START — same physical product, rebrand it in place:

    {
      "sourceImages": ["https://cdn.example.com/lifeaid-ad.jpg"],
      "sourceBrandName": "LifeAid",
      "productKey": "atlasair-2",
      "logo": "https://cdn.example.com/atlasair-logo.png",
      "variationsPerSource": 2
    }

    🔀 TWO MODES, chosen by whether you pass "productImages":

    OMITTED (the usual case) — REBRAND. The products are the same physical item, so the
    source product is kept exactly: same form, angle, lighting and materials. Only the
    branding ON it changes. Their arrow — moulded on the device, printed on the case,
    wherever it appears — is replaced by the AtlasAir logo in that same spot, following the
    surface curvature and lighting so it reads as part of the product. The arrow is never
    recoloured, restyled, mirrored or merged with our mark, and no ghost of it is left behind.

    SUPPLIED — REPLACE. Use when the AtlasAir product actually looks different. Their product
    is swapped for yours, rendered from your photography.

    🎯 WHAT IT TAKES FROM THE SOURCE:
    • Composition and layout — what sits where, at what relative size
    • The ad format/archetype, reading order and visual hierarchy
    • Aspect ratio (override with "aspectRatio", or loosen with layoutFidelity: "loose")
    • In rebrand mode, the product's physical form and pose — because it is the same product

    🚫 WHAT IT NEVER TAKES:
    • Their logo or wordmark, anywhere — in the layout, on the device, on the case, in small
      print, or in reflections
    • Their headline or body copy, brand colours or typefaces
    • Their statistics, reviews, testimonials, certification badges or urgency devices

    ⚖️ THE POLICY PASS — the reason this is a workflow and not one prompt:
    Competitor ads in this category are dense with lives-saved counters, testimonials and
    medical badges. A naive "swap the logo" remix inherits all of it. So a vision agent
    transcribes and classifies every text element, then CODE decides what happens to each one
    (src/mastra/brand/remix-policy.ts) — statistics, badges, urgency and competitor
    comparisons are always dropped; social proof only survives if you supply real Judge.me
    data, and even then it is replaced with AtlasAir's own figures, never carried over.
    Every dropped element is listed in "droppedElements" and in the manifest, with a reason.

    📝 WORKFLOW STEPS:
    1. Analyze Sources — vision agent reads each source's layout, text and structure
    2. Plan Remixes — policy applied deterministically; remix prompts built
    3. Generate Remixes — each rendered in parallel (concurrency: 3)
    4. Save — images plus a manifest recording exactly what was stripped
  `,
  inputSchema: generateRemixInputSchema,
  outputSchema: remixWorkflowOutputSchema,
  retryConfig: {
    attempts: 3,
    delay: 2000,
  },
})
  // Step 1: Vision analysis of each source creative
  .then(analyzeSourceCreativesStep)

  // Step 2: Apply remix policy and build prompts (deterministic, no LLM)
  .then(planRemixTasksStep)

  // Map: Enrich each task with storage/generation config for foreach
  .map(async ({ inputData }) => {
    const { originalInput, tasks } = inputData;

    console.log(
      `🎨 Preparing ${tasks.length} remix(es) for parallel generation...`,
    );

    const product = resolveProduct(originalInput);
    const sanitizedTitle = product.title
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .toLowerCase();

    const outputDirectory =
      originalInput.outputDirectory ||
      resolve(BRAND.assetRoot, `${sanitizedTitle}-remix`, String(Date.now()));

    console.log(`📁 Output directory: ${outputDirectory}`);

    return tasks.map((task) => ({
      ...task,
      productTitle: product.title,
      imageSize: (originalInput.imageSize ?? "2K") as
        | "512"
        | "1K"
        | "2K"
        | "4K",
      outputDirectory,
      storageDestination: (originalInput.storageDestination ?? "supabase") as
        | "supabase"
        | "local",
      // Order is load-bearing — the prompt refers to these by position:
      // [0] layout (and, with no product images, product) reference
      // [1] AtlasAir logo
      // [2+] AtlasAir product photos, when supplied
      referenceImageUrls: [
        task.sourceUrl,
        originalInput.logo,
        ...(originalInput.productImages ?? []),
      ],
    }));
  })

  // Step 3: Generate remixes in parallel (concurrency: 3)
  .foreach(generateRemixImageStep, { concurrency: 3 })

  // Map: Package results with originalInput for the save step
  .map(async ({ inputData, getStepResult }) => {
    const remixes = inputData;
    const planOutput = getStepResult(planRemixTasksStep);

    console.log(`✅ Generated ${remixes.length} remix(es) successfully`);

    return {
      originalInput: planOutput.originalInput,
      remixes,
      storageDestination: (planOutput.originalInput.storageDestination ??
        "supabase") as "supabase" | "local",
    };
  })

  // Step 4: Save manifest
  .then(saveRemixesStep);

remixCreativeWorkflow.commit();

export { remixCreativeWorkflow };
